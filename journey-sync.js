/* Optional ciphertext-only continuity. Secrets live in memory until locked.
   A connection code authorizes storage access; a separate password decrypts it. */
(function(root){
  'use strict';
  const Store=root.MomentumJourney, Backup=root.MomentumJourneyBackup;
  let session=null, busy=false;
  const CONFIG_KEY='momentum-sync-endpoint';
  const clone=v=>JSON.parse(JSON.stringify(v));
  function endpoint(value) {
    const u=new URL(value);
    if(u.protocol!=='https:' && !(u.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw new Error('HTTPS is required');
    if(u.username||u.password||u.search||u.hash)throw new Error('Use a service URL without credentials, query or fragment');
    return u.href.replace(/\/$/,'');
  }
  function code(){return Array.from(root.crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
  function unlock(url,token,password,enrollmentCode='') {
    if(!/^[a-f0-9]{64}$/.test(token)||typeof password!=='string'||password.length<10)throw new Error('Use a valid connection code and password of at least 10 characters');
    const address=endpoint(url);
    // Endpoint is public configuration. Never persist passwords or tokens.
    root.localStorage.setItem(CONFIG_KEY,address);
    session={url:address,token,password,enrollmentCode,revision:0,base:null,lastUsed:Date.now()};
  }
  function lock(){if(session && session.controller)session.controller.abort();session=null;}
  function ready(){if(session && Date.now()-session.lastUsed>10*60*1000)lock();return !!session;}
  function config(){return root.localStorage.getItem(CONFIG_KEY)||'';}
  function snapshot(){const p=clone(Store.read());p.privacy.shareWithAI=false;return p;}
  function fingerprint(p){const x=clone(p);delete x.updatedAt;delete x.createdAt;delete x.privacy;return JSON.stringify(x);}
  async function request(s,method,envelope) {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),20000);
    s.controller=controller;
    try {
      const res=await root.fetch(s.url+'/v1/vault',{method,cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal,
        headers:{Authorization:'Bearer '+s.token,...(method==='PUT'&&s.revision===0&&s.enrollmentCode?{'X-Enrollment-Code':s.enrollmentCode}:{}),...(method!=='GET'?{'If-Match':'"'+s.revision+'"'}:{}),...(envelope?{'Content-Type':'application/json'}:{})},
        ...(envelope?{body:JSON.stringify(envelope)}:{})});
      const data=await res.json();
      if(!res.ok){const err=new Error(data.error||'Sync service unavailable');err.status=res.status;throw err;}
      return data;
    } finally{clearTimeout(timer);if(s.controller===controller)delete s.controller;}
  }
  async function run(fn){
    if(!session)throw new Error('Unlock synchronization first');
    if(Date.now()-session.lastUsed>10*60*1000){lock();throw new Error('Synchronization locked after inactivity');}
    if(busy)throw new Error('Synchronization already running');
    busy=true;const s=session;s.lastUsed=Date.now();
    try{return await fn(s);}finally{busy=false;}
  }
  async function upload(){return run(async s=>{
    const p=snapshot(), envelope=await Backup.encrypt(p,s.password);
    if(session!==s)throw new Error('Synchronization was locked');
    const result=await request(s,'PUT',envelope);
    if(session===s){s.revision=result.revision;s.base=fingerprint(p);s.enrollmentCode="";}
    return result;
  });}
  // Download is a preview only. Applying requires a separate, explicit user action.
  async function preview(){return run(async s=>{
    const result=await request(s,'GET');
    if(session!==s)throw new Error('Synchronization was locked');
    if(!result.envelope){s.revision=result.revision;return {deleted:true,revision:result.revision};}
    const profile=Store.normalize(await Backup.decrypt(result.envelope,s.password));
    if(session!==s)throw new Error('Synchronization was locked');
    return {profile,revision:result.revision,updatedAt:result.updatedAt,localAtPreview:fingerprint(Store.read())};
  });}
  function apply(preview,mode){
    if(!session||!preview.profile)throw new Error('Download and preview a profile first');
    if(fingerprint(Store.read())!==preview.localAtPreview)throw new Error('Local profile changed while previewing. Download and review again.');
    Store.importData(preview.profile,mode); Store.updatePrivacy({shareWithAI:false});
    session.revision=preview.revision;session.base=fingerprint(preview.profile);session.lastUsed=Date.now();
    return Store.read();
  }
  async function erase(){return run(async s=>{const r=await request(s,'DELETE');if(session===s){s.revision=r.revision;s.base=null;}return r;});}
  async function tick(){
    if(!session || busy)return;
    if(!session.base)throw new Error('Save or apply a reviewed download before enabling automatic sync');
    const local=fingerprint(Store.read());
    if(local!==session.base)return upload();
    const revision=session.revision;
    const downloaded=await preview();
    if(downloaded.deleted)throw new Error('The online copy was deleted. Automatic sync has stopped; your local profile is kept.');
    if(downloaded.revision!==revision){apply(downloaded,'replace');return {downloaded:true};}
  }
  root.MomentumJourneySync={code,unlock,lock,ready,config,upload,preview,apply,erase,endpoint,tick};
})(window);
