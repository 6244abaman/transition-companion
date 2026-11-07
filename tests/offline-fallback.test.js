const {JSDOM}=require('jsdom');
const fs=require('fs'), assert=require('assert');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function boot(file,fetchImpl){
 const html=fs.readFileSync(require('path').join(__dirname,'..',file),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,
  beforeParse(w){w.fetch=fetchImpl(w);w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
   w.HTMLElement.prototype.scrollIntoView=()=>{};
   const st=w.setTimeout.bind(w); w.setTimeout=(f,ms,...a)=>st(f,ms>=3000?5:ms,...a);}});
 return dom.window;
}
const ok=text=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:JSON.stringify({reply:text})}]})});
const texts=w=>[...w.document.querySelectorAll('#thread > *')].map(e=>e.textContent.trim().replace(/\s+/g,' '));
async function send(w,t,wait=300){w.document.getElementById('input').value=t;w.document.getElementById('btnSend').click();await sleep(wait);}
(async()=>{
 for(const file of ['index.html','indexH.html']) for(const lang of ['en','he']){
  const tag=file+' '+lang;
  // A. server down: every topic walks distinct steps, then a closing, never the same text twice in a row
  let w=boot(file,()=>()=>Promise.reject(new Error('down'))); await sleep(300);
  const topics=[...w.document.querySelectorAll('#topicButtons button')].map(b=>b.dataset.topic).filter(t=>t!=='skills');
  for(const t of topics){
   w.eval("S.lang='"+lang+"'; paintTopicPanel()");
   w.document.querySelector('#topicButtons button[data-topic="'+t+'"]').click(); await sleep(60);
   const replies=[];
   for(let i=0;i<4;i++){const n=texts(w).length; await send(w,'answer '+i,250); replies.push(texts(w).slice(n).filter(x=>!/^answer /.test(x)).pop());}
   const steps=replies.slice(0,3);
   assert.strictEqual(new Set(steps).size,3,tag+' '+t+' steps repeat');
   assert(steps.every(x=>x&&x.includes('?')),tag+' '+t+' step without a question');
   assert(replies[3]&&!steps.includes(replies[3]),tag+' '+t+' no closing');
  }
  // B. fails once, then recovers
  let calls=0;
  w=boot(file,()=>()=>{calls++;return calls<=2?Promise.reject(new Error('cold')):Promise.resolve(ok('LIVE ANSWER'));}); await sleep(300);
  w.eval("S.lang='"+lang+"'; paintTopicPanel()");
  w.document.querySelector('#topicButtons button[data-topic="career"]').click(); await sleep(60);
  await send(w,'first',400); let t=texts(w);
  assert(!t.some(x=>x.includes('LIVE ANSWER')),tag+' B1');          // both attempts failed -> fallback
  await send(w,'second',400); t=texts(w);
  assert(t.some(x=>x.includes('LIVE ANSWER')),tag+' B2 did not reconnect');
  assert(w.eval('S.practice')===false,tag+' B2 still practice');
  // C. slow server: first request hangs until aborted, retry answers
  let n=0;
  w=boot(file,w2=>(u,o)=>{n++;if(n===1)return new Promise((_,rej)=>o.signal.addEventListener('abort',()=>rej(new Error('abort'))));return Promise.resolve(ok('WOKE UP'));});
  await sleep(300); w.eval('CONFIG.API_TIMEOUT_MS=80');
  w.eval("S.lang='"+lang+"'; paintTopicPanel()");
  w.document.querySelector('#topicButtons button[data-topic="study"]').click(); await sleep(60);
  await send(w,'hello',600);
  assert(texts(w).some(x=>x.includes('WOKE UP')),tag+' C retry failed');
  // D. HTTP 400 is not retried
  n=0; w=boot(file,()=>()=>{n++;return Promise.resolve({ok:false,status:400,json:async()=>({})});}); await sleep(300);
  w.eval("S.lang='"+lang+"'; paintTopicPanel()");
  w.document.querySelector('#topicButtons button[data-topic="money"]').click(); await sleep(60);
  await send(w,'x',400); assert.strictEqual(n,1,tag+' D retried a 400');
  console.log('PASS',tag,'(10 topics, reconnect, slow-wake, no retry on 400)');
 }
 process.exit(0);
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
