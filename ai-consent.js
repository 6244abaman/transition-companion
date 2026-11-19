/* All provider-bound requests go through request(). Consent is device/browser local. */
(function(root){
  'use strict';
  const KEY='momentum-ai-consent-v2', VERSION='messages-context-v1';
  let memory=null, volatile=false, pending=null, generation=0;
  const active=new Set();
  const lang=()=>document.documentElement.lang==='he'?'he':'en';
  const copy=(en,he,l=lang())=>l==='he'?he:en;
  function read(){if(volatile)return memory;try{return JSON.parse(root.localStorage.getItem(KEY)||'null');}catch{return memory;}}
  function write(value){memory=value;try{root.localStorage.setItem(KEY,JSON.stringify(value));volatile=false;}catch{volatile=true;/* Session-only consent if storage is unavailable. */}}
  function scope(){
    const p=root.MomentumJourney?.read().privacy;
    return VERSION+':'+(p?.shareWithAI?Object.keys(p).filter(k=>k!=='shareWithAI'&&p[k]===true).sort().join(','):'no-profile');
  }
  function identity(destination,provider){return JSON.stringify([destination,provider,scope()]);}
  function valid(id){const s=read();return s?.status==='granted'&&s.identity===id;}
  function canceled(sent=false){const e=new Error('External AI sharing stopped');e.canceled=true;e.sent=sent;return e;}
  function node(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
  function dialog(title,l){
    const d=node('dialog');d.dir=l==='he'?'rtl':'ltr';d.style='width:min(640px,92vw);max-height:85dvh;overflow:auto;border:1px solid #aac4c7;border-radius:16px;padding:22px;color:#183d39';
    const h=node('h2',title);h.id='ai-consent-title';d.setAttribute('aria-labelledby',h.id);d.append(h);return d;
  }
  function stop(){generation++;for(const c of active)c.abort();active.clear();if(pending)pending.cancel();}
  function withdraw(){stop();write({status:'withdrawn',at:new Date().toISOString()});document.getElementById('ai-consent-reminder')?.remove();}
  root.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){memory=null;volatile=false;stop();}});
  async function ensure(destination,provider,l,interactive){
    const id=identity(destination,provider);if(valid(id))return id;
    if(!interactive||pending)throw canceled();
    const d=dialog(copy('External AI consent','הסכמה לשימוש ב-AI חיצוני',l),l);
    d.append(node('p',copy('Your messages and relevant context included in each request will be processed by an external AI provider: ','ההודעות שלך וההקשר הרלוונטי הכלול בכל בקשה יעובדו על ידי ספק AI חיצוני: ',l)+provider),node('p',destination),node('p',copy('Sharing includes recent conversation messages, relevant conversation state, system instructions and any Journey profile categories you enable. Automatic background AI requests use the same consent. No data is sent before you agree.','השיתוף כולל הודעות אחרונות, מצב השיחה הרלוונטי, הנחיות מערכת וקטגוריות פרופיל המסע שבחרת לשתף. אותה הסכמה חלה גם על בקשות AI אוטומטיות ברקע. לא יישלח מידע לפני הסכמתך.',l)),node('p',copy('Consent stays active in this browser until you withdraw it in Settings. We ask again if the provider or data-sharing scope changes.','ההסכמה נשמרת בדפדפן זה עד לביטולה בהגדרות. נבקש שוב אם הספק או היקף השיתוף ישתנו.',l)));
    return new Promise((resolve,reject)=>{
      const focus=document.activeElement;let settled=false;
      const finish=ok=>{if(settled)return;settled=true;pending=null;d.close();d.remove();focus?.focus();if(ok)resolve(id);else reject(canceled());};
      const agree=node('button',copy('Agree and continue','מסכים/ה ולהמשיך',l));agree.id='ai-approve';agree.type='button';agree.onclick=()=>{if(identity(destination,provider)!==id){finish(false);return;}write({status:'granted',identity:id,provider,destination,scope:scope(),count:0,lastMessageId:null,at:new Date().toISOString()});finish(true);};
      const cancel=node('button',copy('Cancel','ביטול',l));cancel.id='ai-cancel';cancel.type='button';cancel.onclick=()=>{write({status:'declined'});finish(false);};
      d.oncancel=e=>{e.preventDefault();cancel.click();};pending={cancel:()=>finish(false)};
      d.append(agree,cancel);document.body.append(d);d.showModal();cancel.focus();
    });
  }
  function settings(l=lang()){
    if(document.getElementById('ai-consent-settings'))return;
    const d=dialog(copy('Settings — external AI consent','הגדרות — הסכמה ל-AI חיצוני',l),l);d.id='ai-consent-settings';
    const status=node('p',read()?.status==='granted'?copy('Consent is active.','ההסכמה פעילה.',l):copy('Consent is not active.','ההסכמה אינה פעילה.',l));
    const explanation=node('p',copy('Withdrawing consent stops future sharing of messages and context, including background requests. It does not undo previous transfers.','ביטול ההסכמה מפסיק שיתוף עתידי של הודעות והקשר, כולל בקשות ברקע. הוא אינו מבטל העברות שכבר בוצעו.',l));
    const button=node('button',copy('Withdraw consent','ביטול הסכמה',l));button.id='ai-withdraw';button.type='button';button.onclick=()=>{withdraw();status.textContent=copy('Consent withdrawn. Future sharing has stopped.','ההסכמה בוטלה. השיתוף העתידי הופסק.',l);status.setAttribute('role','status');button.disabled=true;};
    const close=node('button',copy('Close','סגירה',l));close.type='button';const focus=document.activeElement;const finish=()=>{d.close();d.remove();focus?.focus();};close.onclick=finish;d.oncancel=e=>{e.preventDefault();finish();};
    d.append(status,explanation,button,close);document.body.append(d);d.showModal();button.focus();
  }
  function reminder(l){
    document.getElementById('ai-consent-reminder')?.remove();
    const n=node('aside');n.id='ai-consent-reminder';n.setAttribute('role','status');n.setAttribute('aria-live','polite');n.dir=l==='he'?'rtl':'ltr';n.style='padding:12px;margin:10px;border:1px solid #aac4c7;border-radius:10px';
    n.append(node('p',copy('This conversation uses an external AI provider. You can withdraw your consent and stop sharing at any time in Settings.','השיחה משתמשת בספק AI חיצוני. אפשר לבטל את ההסכמה ולהפסיק את השיתוף בכל עת בהגדרות.',l)));
    const link=node('a',copy('Manage consent','ניהול הסכמה',l));link.href='#ai-consent-settings';link.onclick=e=>{e.preventDefault();settings(l);};n.append(link);
    (document.getElementById('thread')||document.body).append(n);
  }
  async function request(payload,destination,l=lang(),options={}){
    const provider=options.provider||'Anthropic (Claude)';
    const start=generation;
    const id=await ensure(destination,provider,l,options.interactive===true);
    // Check again immediately before dispatch: withdrawal or scope changes while awaiting consent block it.
    if(start!==generation||!valid(id)||id!==identity(destination,provider))throw canceled();
    const controller=new AbortController();active.add(controller);let sent=false;
    const timer=setTimeout(()=>controller.abort(),25000);
    try{
      const result=root.fetch(destination,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});sent=true;
      if(options.userMessageId){const s=read();if(s.lastMessageId!==options.userMessageId){s.lastMessageId=options.userMessageId;s.count=(s.count||0)+1;write(s);if(s.count%100===0)reminder(l);}}
      const response=await result;
      if(start!==generation||!valid(id))throw canceled(true);
      return response;
    }catch(e){if(start!==generation||!valid(id))throw canceled(sent);throw e;}
    finally{clearTimeout(timer);active.delete(controller);}
  }
  function mount(){
    const bar=document.querySelector('.bar');if(!bar)return;
    const button=node('button');button.type='button';button.id='btnAIConsentSettings';button.className='chip';button.onclick=()=>settings();bar.append(button);
    const update=()=>{button.textContent=copy('Settings','הגדרות');};update();
    new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  root.MomentumAIConsent={request,withdraw,settings,read,scope};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
