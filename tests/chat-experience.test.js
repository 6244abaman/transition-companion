'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function boot(file,desktop=false,saved){
 const spoken=[];
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://app.test/'+file,runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  require('./browser-env').prepare(w);
  w.matchMedia=()=>({matches:desktop,addEventListener(){}});
  w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  w.speechSynthesis={speaking:false,getVoices:()=>[{lang:'he-IL',voiceURI:'he',name:'Hebrew'},{lang:'en-US',voiceURI:'en',name:'English'}],cancel(){this.speaking=false;},speak(u){spoken.push(u);this.speaking=true;}};
  if(saved)w.localStorage.setItem(file==='indexH.html'?'gtc_H_state':'gtc_v2_state',saved);
 }});
 dom.window.eval(fs.readFileSync('chat-history.js','utf8'));
 return {dom,w:dom.window,d:dom.window.document,spoken};
}
for(const file of ['index.html','indexH.html']){
 test(file+': Listen plays once; replies, modes and reload with old preference stay silent',async()=>{
  const a=boot(file);let restored;
  try{
   a.w.eval('S.started=true; enterChat(); pushMsg("assistant","First answer")');
   assert.equal(a.spoken.length,0);
   a.d.querySelector('#btnVoice').click();assert.equal(a.spoken.length,1);
   a.d.querySelector('#btnVoice').click();assert.equal(a.w.speechSynthesis.speaking,false);
   a.d.querySelector('[data-mode="both"]').click();
   a.w.eval('pushMsg("assistant","Second answer")');assert.equal(a.spoken.length,1);
   if(file === 'index.html') a.d.querySelector('#btnLang').click();assert.equal(a.spoken.length,1);
   a.w.eval('S.speak=true;save()');
   restored=boot(file,false,a.w.localStorage.getItem(a.w.eval('KEY')));
   restored.w.eval('pushMsg("assistant","After reload")');assert.equal(restored.spoken.length,0);
   restored.d.querySelector('#btnVoice').click();assert.equal(restored.spoken.length,1);
   assert.equal(restored.spoken[0].text,'After reload');
  }finally{await new Promise(resolve=>setTimeout(resolve,30));a.dom.window.close();restored?.dom.window.close();}
 });
 test(file+': desktop history is collapsible and new/resumed chats retain messages across reload',async()=>{
  const a=boot(file,true);let restored;
  try{
   assert.equal(a.d.querySelector('#chatHistory').open,false);
   a.d.querySelector('#chatHistory').open=true;
   a.w.eval('S.started=true; enterChat(); pushMsg("user","My original question");pushMsg("assistant","My original answer")');
   assert.match(a.d.querySelector('.chat-item').textContent,/My original question/);
   a.d.querySelector('.new-chat').click();
   assert.equal(a.w.eval('S.savedChats.length'),1);
   a.d.querySelector('.chat-item[aria-current="false"]').click();
   assert.match(a.d.querySelector('#thread').textContent,/My original answer/);
   assert.equal(a.d.querySelector('#chatHistory').open,false,'selection closes drawer on desktop too');
   restored=boot(file,true,a.w.localStorage.getItem(a.w.eval('KEY')));
   assert.equal(restored.d.querySelector('#chatHistory').open,false,'drawer remains collapsed after reload');
   restored.d.querySelector('#chatHistory').open=true;
   assert.match(restored.d.querySelector('.chat-item').textContent,/My original question/);
  }finally{await new Promise(resolve=>setTimeout(resolve,30));a.dom.window.close();restored?.dom.window.close();}
 });
 test(file+': mobile chats close on Escape and selection',async()=>{
  const a=boot(file);
  try{
   const panel=a.d.querySelector('#chatHistory');
   assert.equal(panel.open,false);panel.open=true;
   a.d.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(panel.open,false);
   panel.open=true;a.d.querySelector('.new-chat').click();assert.equal(panel.open,false);
  }finally{await new Promise(resolve=>setTimeout(resolve,30));a.dom.window.close();}
 });
 test(file+': first and long replies scroll after layout to the beginning of the new message',async()=>{
  const a=boot(file);
  try{
   a.w.eval('S.started=true;enterChat()');
   const screen=a.d.querySelector('#chat');
   screen.getBoundingClientRect=()=>({top:150});
   a.w.eval('pushMsg("assistant","First answer")');
   a.d.querySelector('#thread').lastElementChild.getBoundingClientRect=()=>({top:450-screen.scrollTop,height:1200});
   assert.equal(screen.scrollTop,0,'does not measure before layout');
   await new Promise(resolve=>setTimeout(resolve,30));
   assert.equal(screen.scrollTop,288,'aligns the reply beginning inside the chat viewport');
   a.w.eval('pushMsg("assistant","Later answer")');
   a.d.querySelector('#thread').lastElementChild.getBoundingClientRect=()=>({top:788-screen.scrollTop,height:1200});
   await new Promise(resolve=>setTimeout(resolve,30));
   assert.equal(screen.scrollTop,626,'later reply remains discoverable');
  }finally{a.dom.window.close();}
 });

}
