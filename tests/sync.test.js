'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {createService}=require('../server/sync-server');
let server,url;
before(async()=>{server=createService({origins:['https://allowed.example'],rateLimit:1000,enrollmentCode:'invite-for-tests'});await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise(r=>server.close(r));});
function device(){const data=new Map();const c={window:null,crypto:webcrypto,TextEncoder,TextDecoder,URL,AbortController,setTimeout,clearTimeout,Date,console,fetch,
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
 localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
 c.window=c;vm.createContext(c);for(const file of ['journey-store.js','journey-backup.js','journey-sync.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);return c;}
const token='a'.repeat(64),password='a separate long password';
test('two devices round-trip encrypted data; consent is revoked; server never sees plaintext',async()=>{
 const a=device(),b=device();a.MomentumJourney.upsert('goals',{title:'PRIVATE college goal'});a.MomentumJourney.updatePrivacy({shareWithAI:true});
 a.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');await a.MomentumJourneySync.upload();
 const stored=await (await fetch(url+'/v1/vault',{headers:{Authorization:'Bearer '+token}})).text();assert.ok(!stored.includes('PRIVATE'));assert.ok(!stored.includes('college'));
 b.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');const p=await b.MomentumJourneySync.preview();assert.equal(b.MomentumJourney.read().goals.length,0);
 b.MomentumJourneySync.apply(p,'replace');assert.equal(b.MomentumJourney.read().goals[0].title,'PRIVATE college goal');assert.equal(b.MomentumJourney.read().privacy.shareWithAI,false);
 assert.ok(![...b.localStorage.getItem('momentum-sync-endpoint')].join('').includes(token));
});
test('stale device cannot overwrite a newer revision; wrong password preserves local data',async()=>{
 const a=device(),b=device();a.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');b.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');
 const p=await a.MomentumJourneySync.preview();a.MomentumJourneySync.apply(p,'replace');await a.MomentumJourneySync.upload();
 await assert.rejects(b.MomentumJourneySync.upload(),e=>e.status===409);
 b.MomentumJourneySync.lock();b.MomentumJourneySync.unlock(url,token,'the wrong password');
 await assert.rejects(b.MomentumJourneySync.preview());assert.equal(b.MomentumJourney.read().goals.length,0);
});
test('preview cannot overwrite edits made during review; lock requires unlock',async()=>{
 const a=device();a.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');const p=await a.MomentumJourneySync.preview();
 a.MomentumJourney.upsert('goals',{title:'New local work'});assert.throws(()=>a.MomentumJourneySync.apply(p,'replace'),/changed/);
 a.MomentumJourneySync.lock();await assert.rejects(a.MomentumJourneySync.upload(),/Unlock/);
});
test('deletion leaves a tombstone and prevents resurrection by stale devices',async()=>{
 const a=device(),b=device();a.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');const p=await a.MomentumJourneySync.preview();a.MomentumJourneySync.apply(p,'replace');
 b.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');const q=await b.MomentumJourneySync.preview();b.MomentumJourneySync.apply(q,'replace');
 await a.MomentumJourneySync.erase();assert.equal((await a.MomentumJourneySync.preview()).deleted,true);
 await assert.rejects(b.MomentumJourneySync.upload(),e=>e.status===409);
});
test('auth, origin, plaintext, preconditions and cross-vault isolation enforced',async()=>{
 assert.equal((await fetch(url+'/v1/vault')).status,401);
 assert.equal((await fetch(url+'/v1/vault',{headers:{Origin:'https://evil.example',Authorization:'Bearer '+token}})).status,403);
 assert.equal((await fetch(url+'/v1/vault',{headers:{Authorization:'Bearer '+'b'.repeat(64)}})).status,404);
 assert.equal((await fetch(url+'/v1/vault',{method:'PUT',headers:{Authorization:'Bearer '+'b'.repeat(64),'If-Match':'"0"','Content-Type':'application/json','X-Enrollment-Code':'invite-for-tests'},body:JSON.stringify({goals:['plain personal information']})})).status,400);
 assert.equal((await fetch(url+'/v1/vault',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','X-Enrollment-Code':'invite-for-tests'},body:'{}'})).status,409);
});
test('concurrent creations cannot both succeed',async()=>{
 const a=device();const envelope=await a.MomentumJourneyBackup.encrypt(a.MomentumJourney.read(),password);
 const put=()=>fetch(url+'/v1/vault',{method:'PUT',headers:{Authorization:'Bearer '+'c'.repeat(64),'If-Match':'"0"','Content-Type':'application/json','X-Enrollment-Code':'invite-for-tests'},body:JSON.stringify(envelope)});
 const result=await Promise.all([put(),put()]);assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);
});
test('sync refuses insecure or credential-bearing endpoints',()=>{
 const a=device();for(const endpoint of ['http://example.com','https://a:secret@example.com','https://example.com/?token=secret'])assert.throws(()=>a.MomentumJourneySync.unlock(endpoint,token,password));
});
test('automatic sync transfers local edits, pulls remote changes and stops on conflict',async()=>{
 const a=device(),b=device(),token='d'.repeat(64);a.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');b.MomentumJourneySync.unlock(url,token,password,'invite-for-tests');
 await assert.rejects(a.MomentumJourneySync.tick(),/initial|reviewed|Save/);
 a.MomentumJourney.upsert('actions',{id:'shared',title:'Initial action'});await a.MomentumJourneySync.upload();
 b.MomentumJourneySync.apply(await b.MomentumJourneySync.preview(),'replace');
 a.MomentumJourney.upsert('actions',{id:'shared',title:'Updated action'});await a.MomentumJourneySync.tick();
 const result=await b.MomentumJourneySync.tick();assert.equal(result.downloaded,true);assert.equal(b.MomentumJourney.read().actions[0].title,'Updated action');
 a.MomentumJourney.upsert('goals',{title:'A edit'});b.MomentumJourney.upsert('goals',{title:'B edit'});await a.MomentumJourneySync.tick();
 await assert.rejects(b.MomentumJourneySync.tick(),e=>e.status===409);assert.equal(b.MomentumJourney.read().goals[0].title,'B edit');
});

test('new vault creation requires an invitation',async()=>{
 const a=device();a.MomentumJourneySync.unlock(url,'e'.repeat(64),password);
 await assert.rejects(a.MomentumJourneySync.upload(),e=>e.status===403);
});
test('encrypted profile survives a service restart on persistent storage',async()=>{
 const os=require('node:os'),fsp=require('node:fs/promises');
 const directory=await fsp.mkdtemp(path.join(os.tmpdir(),'momentum-sync-test-'));
 const database=path.join(directory,'vault.sqlite');let running;
 const start=async()=>{running=createService({database,enrollmentCode:'test-invitation'});await new Promise(r=>running.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+running.address().port;};
 try{
  let address=await start();const a=device(),token='f'.repeat(64);a.MomentumJourney.upsert('goals',{title:'Durable private goal'});
  a.MomentumJourneySync.unlock(address,token,password,'test-invitation');await a.MomentumJourneySync.upload();
  await new Promise(r=>running.close(r));running=null;address=await start();
  const b=device();b.MomentumJourneySync.unlock(address,token,password);const p=await b.MomentumJourneySync.preview();assert.equal(p.profile.goals[0].title,'Durable private goal');
 }finally{if(running)await new Promise(r=>running.close(r));await fsp.rm(directory,{recursive:true,force:true});}
});
