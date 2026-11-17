'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'benefits-updates.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'benefits-updates.json'),'utf8'));
function boot(file='index.html',saved){
 const requests=[],errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://app.test/'+file,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  require('./browser-env').prepare(w);
  if(saved)w.localStorage.setItem('tc-public-benefits-v1',JSON.stringify(saved));
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.eval(fs.readFileSync(path.join(root,'ai-consent.js'),'utf8'));
  w.fetch=async(url,options)=>{requests.push({url,options});return options?.method==='POST'?{ok:true,json:async()=>({content:[{type:'text',text:JSON.stringify({reply:'Test answer',phase:'open'})}]})}:{ok:true,json:async()=>structuredClone(data)};};
  w.eval(code);
 }});
 if(file==='index.html')dom.window.document.getElementById('btnLang').click();
 return {dom,w:dom.window,d:dom.window.document,requests,errors};
}
test('edition validates bilingual sources, dates and offer status',()=>{
 const {dom,w}=boot();try{
  w.MomentumBenefits.valid(data);
  for(const item of data.items){assert.ok(Date.parse(item.checkedAt)<=Date.now());assert.ok(Date.parse(item.checkedAt)<=Date.parse(data.reviewedAt));}
  const invalid=structuredClone(data);invalid.items[0].actionUrl='javascript:alert(1)';assert.throws(()=>w.MomentumBenefits.valid(invalid));
  invalid.items[0].actionUrl=null;invalid.items[0].status='upcoming';assert.throws(()=>w.MomentumBenefits.valid(invalid));
  assert.equal(w.MomentumBenefits.state({status:'upcoming',eventAt:'2020-01-01T12:00:00Z'}),'ended');
  assert.equal(w.MomentumBenefits.state({status:'open',validUntil:'2020-01-01T12:00:00Z'}),'expired');
 }finally{dom.window.close();}
});
for(const file of ['index.html','indexH.html'])test(file+': browse, filter, ask with consent, and leave updates without leaking sections',async()=>{
 const {dom,w,d,requests,errors}=boot(file);try{
  d.querySelector('[data-topic="money"]').click();w.eval('pushMsg("assistant","MONEY_SECTION_SENTINEL")');
  d.querySelector('[data-topic="updates"]').click();await w.MomentumBenefits.refresh();
  const panel=d.getElementById('benefitsUpdates');assert.equal(panel.hidden,false);assert.equal(panel.dir,file==='indexH.html'?'rtl':'ltr');
  assert.equal(panel.querySelectorAll('article').length,data.items.length);
  assert.ok(!d.getElementById('thread').textContent.includes('MONEY_SECTION_SENTINEL'));
  assert.ok(requests.every(r=>r.options.method!=='POST'),'browsing sends no model request');
  assert.equal(requests[0].options.credentials,'omit');
  panel.querySelectorAll('.benefits-filters button')[2].click();
  assert.equal(panel.querySelectorAll('article').length,1);assert.equal(panel.querySelector('article').dataset.item,'behatsdaa-shows');
  panel.querySelector('.benefits-actions button').click();assert.ok(d.getElementById('input').value.includes('https://'));
  const pending=w.eval('sendUser(document.getElementById("input").value)');
  for(let i=0;i<20&&!d.getElementById('ai-approve');i++)await new Promise(r=>setTimeout(r,5));
  assert.ok(d.getElementById('ai-approve'),'sharing requires approval');
  assert.ok(!requests.some(r=>r.options.method==='POST'));
  d.getElementById('ai-approve').click();await pending;
  const sent=JSON.parse(requests.find(r=>r.options.method==='POST').options.body);
  assert.match(sent.system,/UPDATED INFORMATION AND BENEFITS/);
  assert.ok(sent.system.includes('hachvana.mod.gov.il'));
  d.querySelector('[data-topic="career"]').click();assert.equal(panel.hidden,true);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('offline/stale edition retains source dates and excludes stale claims from chat context',async()=>{
 const old=structuredClone(data);old.reviewedAt='2020-01-01T00:00:00Z';old.nextReviewDue='2020-01-04T00:00:00Z';old.items.forEach(i=>{i.checkedAt=old.reviewedAt;i.en.summary='STALE_CLAIM_DO_NOT_USE';});
 const {dom,w,d}=boot('index.html',old);try{
  w.fetch=async()=>{throw Error('offline');};
  d.querySelector('[data-topic="updates"]').click();await w.MomentumBenefits.refresh();
  assert.match(d.getElementById('benefitsUpdates').textContent,/Review overdue/);
  assert.match(d.getElementById('benefitsUpdates').textContent,/Could not download/);
  const context=w.MomentumBenefits.context('en');assert.ok(!context.includes('STALE_CLAIM_DO_NOT_USE'));assert.ok(context.includes('2020-01-01'));
  assert.equal(JSON.parse(w.localStorage.getItem('tc-public-benefits-v1')).reviewedAt,old.reviewedAt);
 }finally{dom.window.close();}
});
