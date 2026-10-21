'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..');
class LocalResources extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='app.test')return null;const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return null;return fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
async function boot(file,opts={}){
 const errors=[],requests=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://app.test/'+file,resources:new LocalResources(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,
 beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.confirm=()=>true;
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
for(const file of ['index.html','indexH.html'])test(file+': cancel sends nothing; approve shares exactly previewed request; crisis works offline',async()=>{
 const {dom,w,d,errors,requests}=await boot(file);try{
 d.getElementById('btnStart').click();const p=w.eval('sendUser("Help me compare courses")');await until(()=>d.getElementById('ai-cancel'));d.getElementById('ai-cancel').click();await p;assert.equal(requests.length,0);assert.equal(w.eval('S.practice'),false);
 const q=w.eval('sendUser("What should I prepare next?")');await until(()=>d.getElementById('ai-approve'));
 const displayed=JSON.parse(d.getElementById('ai-outgoing-preview').textContent);assert.equal(displayed.messages.length,1);
 d.getElementById('ai-approve').click();await q;assert.equal(requests.length,1);assert.deepEqual(JSON.parse(requests[0].options.body),displayed);
 const count=requests.length;await w.eval('sendUser("I might hurt myself")');assert.equal(requests.length,count);assert.ok(d.getElementById('thread').textContent.match(/safe right now|בטוח כרגע/));
 assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
 }finally{dom.window.close();}
});
test('unavailable AI can be retried and empty responses cannot masquerade as live answers',async()=>{
 let fail=true;const {dom,w,d}=await boot('index.html',{fetch:async()=>{if(fail)throw new Error('Unavailable');return {ok:true,json:async()=>({content:[]})};}});
 try{d.getElementById('btnStart').click();let p=w.eval('sendUser("Hello")');await until(()=>d.getElementById('ai-approve'));d.getElementById('ai-approve').click();await p;assert.equal(w.eval('S.practice'),true);
 const retry=[...d.querySelectorAll('button')].find(x=>/Retry live|ניסיון חיבור/.test(x.textContent));assert.ok(retry);retry.click();assert.equal(w.eval('S.practice'),false);fail=false;
 p=w.eval('sendUser("Try again")');await until(()=>d.getElementById('ai-approve'));d.getElementById('ai-approve').click();await p;assert.equal(w.eval('S.practice'),true);
 }finally{dom.window.close();}
});
test('malformed model metadata cannot create unevidenced skills or break the conversation',async()=>{
 const {dom,w,d}=await boot('index.html');try{
 d.getElementById('btnStart').click();
 w.eval('applyReply({reply:"Safe reply",confirmed:[{id:17,evidence:""},{id:999,evidence:"invented"}],proposals:"bad shape",phase:"unknown",costs:{bad:true}})');
 assert.equal(w.eval('S.profile.strengths.length'),0);assert.ok(d.getElementById('thread').textContent.includes('Safe reply'));
 }finally{dom.window.close();}
});
