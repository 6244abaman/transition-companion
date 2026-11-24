'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole} = require('jsdom');
const {webcrypto} = require('node:crypto');
const root = path.join(__dirname,'..');
class Assets extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    if (u.hostname !== 'app.test') return null;
    const file = path.resolve(root,'.'+u.pathname);
    if (!file.startsWith(root+path.sep) || !fs.existsSync(file)) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}
async function start(file, storage={}, search='') {
  const errors=[], requests=[];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e));
  const dom = new JSDOM(fs.readFileSync(path.join(root,file),'utf8'), {
    url:'https://app.test/'+file+search,
    resources:new Assets(), runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(w) {
      for (const [k,v] of Object.entries(storage)) w.localStorage.setItem(k,JSON.stringify(v));
      w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
      w.confirm=()=>true;w.alert=()=>{};w.prompt=()=>null;
      w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
      w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
      Object.defineProperty(w,'crypto',{value:webcrypto});
      w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;
      w.fetch=async (...args) => {
        if (String(args[0]).includes('benefits-updates.json'))
          return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'benefits-updates.json'),'utf8'))};
        requests.push(args);
        throw Error('Unexpected external request from navigation');
      };
    }
  });
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Page did not load')),8000);
    dom.window.addEventListener('load',()=>{clearTimeout(timeout);resolve()},{once:true});
  });
  return {dom,w:dom.window,d:dom.window.document,errors,requests};
}
const state=lang=>({
  started:true,lang,mode:'type',phase:'open',messages:[
    {role:'user',text:'What next?'},
    {role:'assistant',text:'**Resume** the plan and follow through.'}
  ],
  savedChats:[{messages:[{role:'user',text:'Earlier career question'},{role:'assistant',text:'First answer'}],phase:'open'}],
  profile:{strengths:[],costs:[],open:[],directions:[]}
});
for (const [file,key,lang] of [['index.html','gtc_v2_state','en'],['indexH.html','gtc_H_state','he']]) {
  test(file+': Home, return, previous chats, benefits and private tasks are usable',async()=>{
    const {dom,w,d,errors,requests}=await start(file,{[key]:state(lang)});
    try {
      assert.ok(d.getElementById('companionHomeButton'),'Home always visible');
      assert.ok(d.getElementById('companionDrawerHome'),'Home in profile/settings');
      assert.equal(d.getElementById('chat').hidden,false,'Returning soldier starts in chat');
      d.getElementById('input').value='Unsent draft';
      const before=w.eval('S.messages.length');
      d.getElementById('companionHomeButton').click();
      assert.equal(d.getElementById('companionHomeHub').hidden,false);
      assert.equal(d.getElementById('chat').hidden,true);
      assert.equal(w.eval('S.messages.length'),before,'Home does not erase chat');
      assert.match(d.getElementById('hubResumeInfo').textContent,/2/);
      assert.ok(d.querySelector('[data-path="resume"]').getAttribute('href').endsWith('#cvs'));
      assert.ok(d.querySelector('[data-path="education"]').getAttribute('href').endsWith('#education'));
      assert.ok(d.querySelector('[data-path="action"]').getAttribute('href').endsWith('#actions'));
      d.getElementById('hubResume').click();
      assert.equal(d.getElementById('chat').hidden,false,'Continue returns to the chat');
      assert.equal(d.getElementById('input').value,'Unsent draft','Unsent draft preserved');
      assert.equal(w.eval('S.messages.length'),before);
      assert.equal(d.querySelector('#thread .turn.them .body strong')?.textContent,'Resume','Safe bold formatting works');
      d.getElementById('btnProfile').click();
      assert.ok(d.getElementById('drawer').classList.contains('on'));
      d.getElementById('companionDrawerHome').click();
      assert.equal(d.getElementById('companionHomeHub').hidden,false,'Home works even inside profile');
      assert.ok(!d.getElementById('drawer').classList.contains('on'));
      d.querySelector('[data-path="history"]').click();
      assert.equal(d.getElementById('chatHistory').open,true,'Previous chats drawer opens');
      const items=[...d.querySelectorAll('#chatHistory .chat-item')];
      assert.equal(items.length,2,'Both current and archived chats remain available');
      items[1].click();
      assert.ok(w.eval('S.messages.some(x => x.text === "Earlier career question")'),'Archived chat resumed');
      d.getElementById('companionHomeButton').click();
      d.querySelector('[data-path="benefit"]').click();
      assert.equal(w.eval('S.activeTopic'),'updates','Benefit takes soldier to dated updates');
      assert.equal(d.getElementById('chat').hidden,false);
      assert.equal(requests.length,0,'No AI requests on Home or navigation');
      assert.deepEqual(errors.map(e=>e.message),[],'No browser runtime errors');
    } finally { dom.window.close(); }
  });
}
test('My Journey allows comparing user-entered courses and saving a follow-up step',async()=>{
  const {dom,w,d,errors}=await start('my-journey.html',{},'?lang=he#education');
  try {
    assert.ok(d.getElementById('homeLink').getAttribute('href').endsWith('indexH.html#home'),
      'Expected Hebrew Home link; actual: '+d.getElementById('homeLink').getAttribute('href')+'; lang: '+d.documentElement.lang+'; errors: '+errors.map(e=>e.message).join(';'));
    w.MomentumJourney.upsert('education',{
      title:'QA course',institution:'Example College',field:'Testing',duration:'8 months',
      cost:'NIS 12,000',sourceUrl:'https://example.org/qa',checkedOn:'2026-11-24',status:'exploring'
    });
    w.MomentumJourney.upsert('education',{
      title:'Programming diploma',institution:'Example Institute',duration:'14 months',
      cost:'NIS 20,000',status:'preparing'
    });
    d.dispatchEvent(new w.Event('journey-updated'));
    const comparison=d.querySelector('#educationCompare');
    assert.ok(comparison.textContent.includes('QA course'));
    assert.ok(comparison.textContent.includes('Programming diploma'));
    assert.ok(comparison.textContent.includes('8 months'));
    assert.ok(comparison.textContent.includes('NIS 12,000'));
    assert.ok(comparison.textContent.includes('https://example.org/qa'));
    assert.equal(comparison.querySelectorAll('thead th').length,3);
    d.getElementById('addAction').click();
    d.getElementById('field-title').value='Submit my first application';
    d.getElementById('editForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    assert.equal(w.MomentumJourney.read().actions[0].title,'Submit my first application');
    assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  } finally {dom.window.close();}
});
test('Home deep-link does not require signing in or erase saved chat',async()=>{
  const {dom,w,d,errors}=await start('index.html',{gtc_v2_state:state('en')},'#home');
  try {
    assert.equal(d.getElementById('companionHomeHub').hidden,false);
    assert.equal(w.eval('S.savedChats.length'),1);
    d.getElementById('hubResume').click();
    assert.equal(d.getElementById('chat').hidden,false);
    assert.equal(errors.length,0);
  } finally {dom.window.close();}
});
