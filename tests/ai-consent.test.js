const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('ai-consent.js','utf8');
function boot(saved){
 const dom=new JSDOM('<html lang="en"><body><div class="bar"></div><div id="thread"></div></body></html>',{url:'https://app.test',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.fetch=(url,options)=>{calls.push({url,options});return Promise.resolve({ok:true})};
 if(saved)w.localStorage.setItem('momentum-ai-consent-v2',saved);
 w.eval(source);return {dom,w,calls,api:w.MomentumAIConsent};
}
const payload={messages:[{role:'user',content:'one\ntwo\nthree'}]},url='https://provider.test/api';
async function grant(x,options={}){const p=x.api.request(payload,url,'en',{interactive:true,...options});x.w.document.getElementById('ai-approve').click();return p;}
test('no consent blocks background; cancel sends nothing; grant persists through reload',async()=>{
 const x=boot();try{
 await assert.rejects(x.api.request(payload,url),e=>e.canceled);assert.equal(x.calls.length,0);
 let p=x.api.request(payload,url,'en',{interactive:true});x.w.document.getElementById('ai-cancel').click();await assert.rejects(p);assert.equal(x.calls.length,0);
 await grant(x);await x.api.request(payload,url);assert.equal(x.calls.length,2);
 const y=boot(x.w.localStorage.getItem('momentum-ai-consent-v2'));try{await y.api.request(payload,url);assert.equal(y.calls.length,1);assert.equal(y.w.document.querySelector('dialog'),null);}finally{y.dom.window.close();}
 }finally{x.dom.window.close();}
});
test('100 distinct user sends, not lines, history, diagnostics or background calls; reminder never blocks',async()=>{
 const x=boot();try{
 await grant(x,{userMessageId:'1'});
 for(let i=2;i<=99;i++)await x.api.request(payload,url,'en',{userMessageId:String(i)});
 for(let i=0;i<5;i++)await x.api.request(payload,url);
 assert.equal(x.w.document.getElementById('ai-consent-reminder'),null);
 await x.api.request(payload,url,'en',{userMessageId:'100'});
 assert.ok(x.w.document.getElementById('ai-consent-reminder').textContent.includes('This conversation uses an external AI provider.'));
 assert.equal(x.w.document.querySelector('dialog'),null);
 await x.api.request(payload,url,'en',{userMessageId:'100'});assert.equal(x.api.read().count,100);
 x.w.document.querySelector('#ai-consent-reminder a').click();assert.ok(x.w.document.getElementById('ai-withdraw'));
 }finally{x.dom.window.close();}
});
test('withdrawal cancels in-flight work and blocks background until explicit re-consent',async()=>{
 const x=boot();try{
 await grant(x);let signal;
 x.w.fetch=(u,o)=>new Promise((resolve,reject)=>{signal=o.signal;signal.addEventListener('abort',()=>reject(new Error('aborted')))});
 const p=x.api.request(payload,url);await Promise.resolve();x.api.withdraw();await assert.rejects(p,e=>e.canceled&&e.sent);assert.equal(signal.aborted,true);
 await assert.rejects(x.api.request(payload,url),e=>e.canceled);
 assert.equal(x.api.read().status,'withdrawn');
 }finally{x.dom.window.close();}
});
test('withdrawal during consent wait and immediately after approval blocks queued dispatch',async()=>{
 const x=boot();try{
 let p=x.api.request(payload,url,'en',{interactive:true});x.api.withdraw();await assert.rejects(p);assert.equal(x.calls.length,0);
 p=x.api.request(payload,url,'en',{interactive:true});x.w.document.getElementById('ai-approve').click();x.api.withdraw();await assert.rejects(p);assert.equal(x.calls.length,0);
 }finally{x.dom.window.close();}
});
test('provider, endpoint and profile scope changes require consent again',async()=>{
 const x=boot();try{
 await grant(x);
 await assert.rejects(x.api.request(payload,url,'en',{provider:'Other provider'}));
 await assert.rejects(x.api.request(payload,url+'/new'));
 x.w.MomentumJourney={read:()=>({privacy:{shareWithAI:true,shareSkills:true}})};
 await assert.rejects(x.api.request(payload,url));assert.equal(x.calls.length,1);
 await grant(x);assert.equal(x.calls.length,2);
 }finally{x.dom.window.close();}
});
test('another tab withdrawing consent aborts active work and blocks future dispatch',async()=>{
 const x=boot();try{
 await grant(x);x.w.localStorage.setItem('momentum-ai-consent-v2',JSON.stringify({status:'withdrawn'}));x.w.dispatchEvent(new x.w.StorageEvent('storage',{key:'momentum-ai-consent-v2'}));
 await assert.rejects(x.api.request(payload,url));assert.equal(x.calls.length,1);
 }finally{x.dom.window.close();}
});
test('all shipped AI calls use the gate, including connection diagnostics',()=>{
 for(const file of ['index.html','indexH.html']){const s=fs.readFileSync(file,'utf8');assert.ok(!/fetch\(CONFIG.API_URL/.test(s));assert.equal((s.match(/MomentumAIConsent.request\(/g)||[]).length,2);}
});
