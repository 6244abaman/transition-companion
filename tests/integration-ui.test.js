'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..');
class LocalResources extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='app.test')return null;const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return null;return fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
async function boot(file,opts={}){
 const errors=[],requests=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://app.test/'+file,resources:new LocalResources(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,
 beforeParse(w){for (const [key,value] of Object.entries(opts.storage || {})) w.localStorage.setItem(key,value);
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.confirm=()=>true;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;
 w.fetch=async(url,options)=>{requests.push({url,options});if(opts.fetch)return opts.fetch(url,options);return {ok:true,json:async()=>({content:[{type:'text',text:JSON.stringify({reply:'A live test reply',phase:'open'})}]})};};
 }});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));return {dom,w:dom.window,d:dom.window.document,errors,requests};
}
const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Timed out waiting for UI');};
test('actual My Journey scripts load, edit records, save life skills, and switch Hebrew',async()=>{
 const {dom,w,d,errors}=await boot('my-journey.html');try{
 d.getElementById('quickGoal').click();d.getElementById('field-title').value='My study goal';d.getElementById('editForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(w.MomentumJourney.read().goals[0].title,'My study goal');
 d.querySelector('[data-tab="skills"]').click();d.querySelector('#life-skills-discovery button').click();
 const editor=d.querySelector('#life-skills-discovery .record');const save=editor.querySelector('button');save.click();assert.equal(w.MomentumJourney.read().lifeSkills.length,0);
 editor.querySelector('textarea').value='I planned a training schedule and adjusted it after feedback.';editor.querySelector('input').checked=true;save.click();
 assert.equal(w.MomentumJourney.read().lifeSkills.length,1);assert.ok(d.getElementById('skillsList').textContent.includes('training schedule'));
 d.querySelector('[data-tab="cvs"]').click();d.getElementById('makeCV').click();assert.ok(w.MomentumJourney.read().cvs[0].bullets[0].includes('training schedule'));
 d.getElementById('language').click();await until(()=>d.getElementById('sync-upload').textContent.includes('שמירת'));assert.equal(d.documentElement.dir,'rtl');
 assert.ok(d.getElementById('journey-rights').textContent.includes('פיקדון'));assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
 }finally{dom.window.close();}
});
for(const file of ['index.html','indexH.html'])test(file+': cancel sends nothing; approve enables persistent sharing; crisis works offline',async()=>{
 const {dom,w,d,errors,requests}=await boot(file);try{
 d.getElementById('btnStart').click();const p=w.eval('sendUser("Help me compare courses")');await until(()=>d.getElementById('ai-cancel'));d.getElementById('ai-cancel').click();await p;assert.equal(requests.length,0);assert.equal(w.eval('S.practice'),false);
 const q=w.eval('sendUser("What should I prepare next?")');await until(()=>d.getElementById('ai-approve'));
 assert.equal(requests.length,0);
 d.getElementById('ai-approve').click();await q;assert.equal(requests.length,1);assert.ok(JSON.parse(requests[0].options.body).messages.length>=1); await w.eval('sendUser("One more question")');assert.equal(requests.length,2);assert.equal(d.getElementById('ai-approve'),null);
 const count=requests.length;await w.eval('sendUser("I might hurt myself")');assert.equal(requests.length,count);assert.ok(d.getElementById('thread').textContent.match(/safe right now|בטוח כרגע/));
 assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
 }finally{dom.window.close();}
});
test('unavailable AI reports an error rather than inventing a personal answer',async()=>{
 let fail=true;const {dom,w,d}=await boot('index.html',{fetch:async()=>{
   if(fail)throw new Error('Unavailable');
   return {ok:true,json:async()=>({content:[]})};
 }});
 try{
  d.getElementById('btnStart').click();
  let p=w.eval('sendUser("Hello")');
  await until(()=>d.getElementById('ai-approve'));
  d.getElementById('ai-approve').click();await p;
  assert.equal(w.eval('S.practice'),false);
  assert.match(d.getElementById('thread').textContent,/AI service is not responding|שירות ה-AI אינו מחובר/);
  const retry=[...d.querySelectorAll('button')].find(x=>/Retry my question|לנסות שוב עם השאלה/.test(x.textContent));
  assert.ok(retry);
  retry.click();
  assert.equal(d.getElementById('input').value,'Hello');
  fail=false; // Even an empty 200 response must not masquerade as a real answer.
  await w.eval('sendUser("Try again")');
  assert.equal(w.eval('S.practice'),false);
  assert.match(d.getElementById('thread').textContent,/AI service is not responding|שירות ה-AI אינו מחובר/);
 }finally{dom.window.close();}
});
test('malformed model metadata cannot create unevidenced skills or break the conversation',async()=>{
 const {dom,w,d}=await boot('index.html');try{
 d.getElementById('btnStart').click();
 w.eval('applyReply({reply:"Safe reply",confirmed:[{id:17,evidence:""},{id:999,evidence:"invented"}],proposals:"bad shape",phase:"unknown",costs:{bad:true}})');
 assert.equal(w.eval('S.profile.strengths.length'),0);assert.ok(d.getElementById('thread').textContent.includes('Safe reply'));
 }finally{dom.window.close();}
});

for (const [file,key] of [['index.html','gtc_v2_state'],['indexH.html','gtc_H_state']]) {
  test(file + ' reopens legacy history and keeps later conversations separate', async () => {
    const legacy = {started:true, lang:file === 'index.html' ? 'en':'he', phase:'open',
      profile:{strengths:[],costs:[],open:[],directions:[]}, messages:[{role:'user',text:'Earlier question'}]};
    const {dom,w,d,requests,errors} = await boot(file,{storage:{[key]:JSON.stringify(legacy)}});
    try {
      const panel = d.querySelector('#chatHistory');
      panel.open = true;
      await until(() => panel.textContent.includes('Earlier question'));
      assert.ok(panel.querySelector('a').href.includes(file === 'index.html' ? 'indexH.html':'index.html'));
      panel.querySelector('.new-chat').click();
      assert.equal(w.eval('S.savedChats[0].messages[0].text'),'Earlier question');
      w.eval('pushMsg("user","Second question")');
      panel.open = true;
      await until(() => panel.textContent.includes('Second question'));
      [...panel.querySelectorAll('button')].find(b => b.textContent.includes('Earlier question')).click();
      assert.ok(d.querySelector('#thread').textContent.includes('Earlier question'));
      assert.ok(!d.querySelector('#thread').textContent.includes('Second question'));
      const saved = JSON.parse(w.localStorage.getItem(key));
      assert.deepEqual(saved.messages,legacy.messages);
      assert.equal(saved.savedChats[0].messages.at(-1).text,'Second question');
      assert.equal(requests.length,0);
      assert.deepEqual(errors,[]);
    } finally { dom.window.close(); }
  });
}

test('chat file restore is additive, repeatable and excludes unrelated profile fields', () => {
  const history = require('../chat-history');
  const state = {messages:[{role:'user',text:'Original'}],profile:{private:'private marker'}};
  const backup = history.backup(state);
  assert.ok(!JSON.stringify(backup).includes('private marker'));
  const target = {messages:[{role:'user',text:'Keep me'}]};
  const restored = history.restore(target,backup);
  assert.deepEqual(restored.messages,target.messages);
  assert.deepEqual(restored.savedChats[0].messages,state.messages);
  assert.deepEqual(history.restore(restored,backup),restored);
  assert.throws(() => history.restore(target,{...backup,chats:[...backup.chats,[{role:'user'}]]}));
  assert.equal(target.savedChats,undefined);
});

for (const [file,key] of [['index.html','gtc_v2_state'],['indexH.html','gtc_H_state']]) {
 test(file+': shortened intake and one selected interest produce exactly one topic prompt',async()=>{
  const {dom,w,d,errors,requests}=await boot(file);
  try {
   if(file==='index.html')d.getElementById('btnLang').click();
   d.getElementById('btnStart').click();
   assert.deepEqual([...d.querySelectorAll('#background input,#background select')].map(n=>n.id),['bg-contact','bg-service','bg-role','bg-reserve','bg-reserve-role']);
   d.getElementById('bg-contact').value='tester@example.invalid';
   d.getElementById('bg-service').value='General training unit';
   d.getElementById('bg-role').value='commander';
   const reserve=d.getElementById('bg-reserve'), reserveRole=d.getElementById('bg-reserve-role');
   assert.equal(d.getElementById('reserveRoleField').hidden,true);
   assert.equal(reserveRole.disabled,true);
   reserve.click();
   assert.equal(d.getElementById('reserveRoleField').hidden,false);
   assert.equal(reserveRole.disabled,false);
   assert.deepEqual([...reserveRole.options].map(o=>o.value),[...d.getElementById('bg-role').options].map(o=>o.value));
   reserveRole.value='officer';
   reserve.click();
   assert.equal(d.getElementById('reserveRoleField').hidden,true);
   assert.equal(reserveRole.disabled,true);
   reserve.click();
   d.getElementById('nextSetup').click();
   d.querySelector('.interestGrid input[value="study"]').checked=true;
   d.getElementById('finishSetup').click();d.getElementById('finishSetup').click();
   assert.equal(w.eval('S.profile.background.contact'),'tester@example.invalid');
   assert.equal(w.eval('S.profile.background.service'),'General training unit');
   assert.equal(w.eval('S.profile.background.role'),'commander');assert.equal(w.eval('S.profile.background.reserve'),true);
   assert.equal(w.eval('S.profile.background.reserveRole'),'officer');
   assert.equal(w.eval('S.activeTopic'),'study');
   assert.equal(d.querySelectorAll('#thread .turn').length,1);
   for(let i=0;i<3;i++)d.querySelector('[data-topic="study"]').click();
   assert.equal(d.querySelectorAll('#thread .turn').length,1);
   assert.equal(w.eval('S.messages.length'),1);
   assert.equal(requests.length,0,'contact and onboarding do not send a request');
   assert.ok(!w.eval('systemPrompt(buildReference())').includes('tester@example.invalid'),'contact excluded from AI instructions');
   assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  }finally{dom.window.close();}
 });
 test(file+': reselecting topics resumes answers and preserves their AI context',async()=>{
  const {dom,w,d,requests,errors}=await boot(file);
  try {
   const topic=id=>d.querySelector('[data-topic="'+id+'"]').click();
   topic('study');w.eval('pushMsg("user","STUDY_PERSONAL_QUESTION");pushMsg("assistant","STUDY_PERSONAL_REPLY")');
   topic('travel');w.eval('pushMsg("user","TRAVEL_PERSONAL_QUESTION");pushMsg("assistant","TRAVEL_PERSONAL_REPLY")');
   const count=w.eval('S.messages.length');
   for(let i=0;i<3;i++){topic('study');topic('travel');}topic('study');
   assert.equal(w.eval('S.messages.length'),count);
   assert.match(d.querySelector('#thread').textContent,/STUDY_PERSONAL_REPLY/);
   assert.ok(!d.querySelector('#thread').textContent.includes('TRAVEL_PERSONAL_REPLY'));
   const pending=w.eval('sendUser("Please continue with my study plan")');
   await until(()=>d.getElementById('ai-approve'));d.getElementById('ai-approve').click();await pending;
   const payload=JSON.parse(requests[0].options.body);
   assert.ok(payload.messages.some(m=>m.content==='STUDY_PERSONAL_REPLY'));
   assert.ok(!payload.messages.some(m=>m.content==='TRAVEL_PERSONAL_REPLY'));
   assert.ok(payload.messages.some(m=>m.content.includes('TRAVEL_PERSONAL_QUESTION')),'earlier user facts retained');
   assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  }finally{dom.window.close();}
 });
 test(file+': saved duplicate topic introductions are hidden without deleting user history',async()=>{
  const intro={role:'assistant',kind:'topic',topic:'study',text:'Repeated study introduction'};
  const saved={started:true,lang:file==='index.html'?'en':'he',activeTopic:'study',phase:'open',profile:{strengths:[],costs:[],open:[],directions:[]},messages:[intro,intro,intro,{role:'user',text:'My real question'},{role:'assistant',text:'My useful answer'}]};
  const {dom,w,d}=await boot(file,{storage:{[key]:JSON.stringify(saved)}});
  try {
   assert.equal(d.querySelectorAll('#thread .turn').length,3);
   assert.match(d.querySelector('#thread').textContent,/My real question/);
   assert.match(d.querySelector('#thread').textContent,/My useful answer/);
   assert.equal(w.eval('S.messages.length'),5,'original transcript retained');
   d.querySelector('[data-topic="study"]').click();assert.equal(w.eval('S.messages.length'),5);
  }finally{dom.window.close();}
 });
 test(file+': Skip allows entry without contact details',async()=>{
  const {dom,w,d}=await boot(file);
  try{d.getElementById('btnStart').click();d.getElementById('skipBackground').click();d.getElementById('ownQuestion').click();assert.equal(d.getElementById('chat').hidden,false);assert.equal(w.eval('S.profile.background.contact'),undefined);}finally{dom.window.close();}
 });
}
