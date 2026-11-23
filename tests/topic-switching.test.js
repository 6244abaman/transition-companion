'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
function boot(file,saved){
 const requests=[],errors=[];
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{
  url:'https://app.test/'+file+'?practice=1',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
   require('./browser-env').prepare(w);
   if(saved)w.localStorage.setItem(file==='indexH.html'?'gtc_H_state':'gtc_v2_state',saved);
   w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
   w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
   w.eval(fs.readFileSync(path.join(root,'ai-consent.js'),'utf8'));
   w.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({content:[{type:'text',text:JSON.stringify({reply:'Test provider reply',phase:'open'})}]})};};
  }
 });
 const w=dom.window,d=w.document;
 if(!saved&&file==='index.html')d.getElementById('btnLang').click();
 const topic=id=>d.querySelector('[data-topic="'+id+'"]').click();
 async function send(text,history=false){
  const pending=w.eval('sendUser('+JSON.stringify(text)+')');
  const consent=d.getElementById('ai-approve');
  if(consent)consent.click();
  await pending;
  return requests.at(-1);
 }
 return {dom,w,d,requests,errors,topic,send};
}
for(const file of ['index.html','indexH.html']){
 const he=file==='indexH.html';
 test(file+': Money → Travel → CV buttons replace pending questions and reference guides',async()=>{
  const app=boot(file);const {dom,w,d,topic,send,errors}=app;
  try{
   w.eval('S.profile.strengths=[{id:17,evidence:"Coordinated a training task"}]');
   topic('money');await send(he?'ההכנסה שלי היא 7000 בחודש':'My income is 7000 a month');
   const transcript=w.eval('S.messages.length');
   topic('travel');const travel=await send(he?'יפן באביב הבא':'Japan next spring',true);
   assert.equal(w.eval('S.activeTopic'),'travel');
   assert.match(travel.system,/SELECTED TOPIC: travel/);
   assert.equal(travel.messages[0].role,'user');
   assert.ok(JSON.stringify(travel.messages).includes('7000'),'active consent includes earlier user context');
   assert.ok(!travel.messages.some(m=>m.role==='assistant'&&/main money issue|הנושא הכלכלי העיקרי/.test(m.content)),'old money questions are not active history');
   assert.ok(!travel.system.includes('CV GUIDE —'));
   assert.ok(w.eval('S.messages.length')>transcript,'saved transcript is retained');
   topic('cv');const cv=await send(he?'מתאם מחסן':'Warehouse coordinator',true);
   assert.match(cv.system,/SELECTED TOPIC: cv/);assert.ok(cv.system.includes('CV GUIDE —'),'CV guide selected even when answer has no CV keyword');
   assert.ok(!cv.messages.some(m=>m.role==='assistant'&&/Where would you like to go|לאן תרצה לנסוע/.test(m.content)),'old travel questions are not active history');
   assert.equal(d.querySelector('[data-topic="cv"]').getAttribute('aria-pressed'),'true');
   assert.equal(w.eval('S.profile.strengths.length'),1);
   topic('travel');const back=await send(he?'שלושה שבועות':'Three weeks',true);
   assert.ok(!back.system.includes('CV GUIDE —'),'CV guidance stops on switch back');
   assert.ok(!back.system.includes('DOCUMENT MODE —'));
   assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
 });
 test(file+': typed requests switch topic, persist on reload, and keep follow-ups in topic',async()=>{
  const {dom,w,d,topic,send,errors}=boot(file);let restored;
  try{
   topic('money');
   await send(he?'עכשיו אני רוצה לתכנן טיול':'Now I want to plan a trip');
   assert.equal(w.eval('S.activeTopic'),'travel');
   await send(he?'יש לי כסף לטיול':'I have money saved for travel');
   assert.equal(w.eval('S.activeTopic'),'travel','incidental money mention stays in travel');
   const cv=await send(he?'עזור לי לכתוב קורות חיים':'Help me write a CV',true);
   assert.match(cv.system,/SELECTED TOPIC: cv/);assert.ok(cv.system.includes('CV GUIDE —'));
   assert.ok(cv.messages.slice(0,-1).every(m=>m.content.startsWith('Earlier user message')),'old messages are background, not pending requests');
   restored=boot(file,w.localStorage.getItem(w.eval('KEY')));
   assert.equal(restored.w.eval('S.activeTopic'),'cv');
   assert.equal(restored.d.documentElement.dir,he?'rtl':'ltr');
   const next=await restored.send(he?'לתפקיד תיאום':'For a coordinator position',true);
   assert.ok(next.messages.filter(m=>m.content.includes('money saved')).every(m=>m.content.startsWith('Earlier user message')));
   assert.ok(next.system.includes('CV GUIDE —'));
   await send(he?'עכשיו נסיעות':'Now travel');
   assert.equal(w.eval('S.activeTopic'),'travel');
   assert.deepEqual(errors,[]);
  }finally{dom.window.close();if(restored)restored.dom.window.close();}
 });
 test(file+': offline practice follows the typed topic and drops old skill questions',async()=>{
  const {dom,w,d,topic}=boot(file);
  try{
   topic('skills');w.eval('applyReply({reply:"Skill question",candidates:[{id:17}]});S.practice=true;');
   await w.eval('sendUser('+JSON.stringify(he?'עכשיו כסף':'Now money')+')');
   assert.equal(w.eval('S.activeTopic'),'money');
   assert.ok(!w.eval('buildReference().labels.join(" ")').includes('evidence questions'));
   await w.eval('sendUser('+JSON.stringify(he?'עכשיו נסיעות':'Now travel')+')');
   assert.equal(w.eval('S.activeTopic'),'travel');
   assert.match(d.querySelector('.turn.them:last-of-type .body').textContent,he?/לאן תרצה לנסוע/:/Where would you like to go/);
   await w.eval('sendUser('+JSON.stringify(he?'קורות חיים':'CV')+')');
   assert.equal(w.eval('S.activeTopic'),'cv');
   assert.match(d.querySelector('.turn.them:last-of-type .body').textContent,he?/לאיזה סוג עבודה/:/What kind of job/);
  }finally{dom.window.close();}
 });
}

for (const file of ['index.html','indexH.html']) {
 test(file+': every section hides money discussion and restores its own history', async()=>{
  const {dom,w,d,topic,send}=boot(file);let restored;
  try {
   topic('money');await send('MONEY_ONLY_INCOME_7000');
   w.eval('pushMsg("assistant", "MONEY_ONLY_BUDGET_PLAN")');
   const savedCount=w.eval('S.messages.length');
   const ids=w.eval('TRANSITION_TOPICS.map(t=>t[0])');
   for(const id of ids.filter(id=>id!=='money')) {
    topic(id);
    assert.ok(!d.getElementById('thread').textContent.includes('MONEY_ONLY_'),id+' excludes money discussion');
   }
   topic('money');
   assert.match(d.getElementById('thread').textContent,/MONEY_ONLY_INCOME_7000/);
   assert.match(d.getElementById('thread').textContent,/MONEY_ONLY_BUDGET_PLAN/);
   await send(file==='indexH.html'?'עכשיו נסיעות':'Now travel');
   assert.ok(!d.getElementById('thread').textContent.includes('MONEY_ONLY_'),'typed switch filters immediately');
   restored=boot(file,w.localStorage.getItem(w.eval('KEY')));
   restored.w.eval('enterChat()');
   assert.ok(!restored.d.getElementById('thread').textContent.includes('MONEY_ONLY_'),'reload preserves separation');
   restored.topic('money');
   assert.match(restored.d.getElementById('thread').textContent,/MONEY_ONLY_BUDGET_PLAN/);
   assert.ok(w.eval('S.messages.length')>=savedCount,'saved history remains intact');
  } finally {dom.window.close();if(restored)restored.dom.window.close();}
 });
}
