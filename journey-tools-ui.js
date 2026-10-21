/* Shared Journey tools. All personal values are rendered as text, never HTML. */
(function(root){
  'use strict';
  const Store=root.MomentumJourney, Sync=root.MomentumJourneySync, Reminders=root.MomentumJourneyReminders;
  const $=id=>document.getElementById(id);
  let remote=null, auto=false;
  const copy={en:{sync:'Connect my devices',help:'Optional encrypted storage: the service receives only a password-protected copy of My Journey (goals, skills, CVs, education and actions). Conversations and documents are excluded. The private connection code and separate encryption password are required on each device; neither can be recovered by Momentum. Keep them somewhere safe. This does not encrypt the local browser profile.',url:'Sync service address',token:'Private connection code',invitation:'Momentum invitation (only for the first online save)',password:'Encryption password (10+ characters)',generate:'Create a new connection code',unlock:'Unlock for this session',lock:'Lock',upload:'Save encrypted profile online',preview:'Download and review',apply:'Apply reviewed profile',mode:'How to apply the download',replace:'Replace My Journey with this download',merge:'Merge records (download wins for matching IDs)',erase:'Delete online copy',offline:'Sync is locked. Offline planning remains available.',unlocked:'Unlocked for this session. Locking clears the connection code and password from memory.',saved:'Encrypted profile saved online.',downloaded:'Downloaded for review; nothing local has changed. Review the saved data below before applying.',confirm:'Apply this downloaded profile? AI sharing will be turned off. Export a backup first if you need to preserve your current copy.',deleted:'Online copy deleted. Other devices may still have local copies.',deleteConfirm:'Delete the encrypted online copy? Local information on your devices is kept.',locked:'Synchronization locked.',review:'Profile to review',empty:'The online copy was deleted. Your local profile is unchanged.',auto:'Automatically sync My Journey while this page is open and unlocked (requires an initial save or reviewed download)',reminders:'Reminders',reminderHelp:'Get a private reminder while My Journey is open. For reminders when the app is closed, download the calendar file and import it into your calendar app. Your calendar provider may receive the exported information.',enable:'Enable browser reminders',disable:'Turn browser reminders off',calendar:'Download calendar reminders',personal:'Include action titles and notes in calendar export (off by default)',calendarConfirm:'Download reminders for your pending dated actions? Import the file into your calendar to activate them. Reimporting may create duplicates in some calendars.',due:'Actions due or overdue: ',enabled:'Browser reminders enabled. They run while My Journey is open.',disabled:'Browser reminders turned off.',error:'Could not complete this step: ',noDates:'Add a due date to an action first.',codeNotice:'New private connection code created. Copy it to a safe place before locking; Momentum cannot recover it.',audit:'External AI request history (metadata only)',notConfigured:'Enter the address of your Momentum sync service.'},he:{sync:'חיבור בין המכשירים שלי',help:'שמירה מוצפנת לבחירתכם: השירות מקבל רק עותק מוגן בסיסמה של המסע שלי (מטרות, מיומנויות, קורות חיים, לימודים וצעדים). שיחות ומסמכים אינם נכללים. בכל מכשיר נדרשים קוד החיבור הפרטי וסיסמת הצפנה נפרדת; מומנטום אינה יכולה לשחזר אותם. שמרו אותם במקום בטוח. המידע המקומי בדפדפן אינו מוצפן.',url:'כתובת שירות הסנכרון',token:'קוד חיבור פרטי',invitation:'הזמנה ממומנטום (לשמירה הראשונה ברשת בלבד)',password:'סיסמת הצפנה (10 תווים לפחות)',generate:'יצירת קוד חיבור חדש',unlock:'פתיחה להפעלה הנוכחית',lock:'נעילה',upload:'שמירת פרופיל מוצפן ברשת',preview:'הורדה ובדיקה',apply:'החלת הפרופיל שנבדק',mode:'איך להחיל את ההורדה',replace:'החלפת המסע שלי בעותק שהורד',merge:'מיזוג רשומות (בהתנגשות, העותק שהורד קובע)',erase:'מחיקת העותק ברשת',offline:'הסנכרון נעול. אפשר להמשיך לתכנן ללא רשת.',unlocked:'פתוח להפעלה הנוכחית. נעילה מוחקת את קוד החיבור והסיסמה מזיכרון ההפעלה.',saved:'הפרופיל המוצפן נשמר ברשת.',downloaded:'העותק הורד לבדיקה בלבד; המידע המקומי לא השתנה. בדקו את המידע למטה לפני החלתו.',confirm:'להחיל את הפרופיל שהורד? שיתוף עם AI יכובה. הורידו גיבוי תחילה אם ברצונכם לשמור את העותק המקומי.',deleted:'העותק ברשת נמחק. ייתכן שבמכשירים אחרים נשמרו עותקים מקומיים.',deleteConfirm:'למחוק את העותק המוצפן ברשת? המידע המקומי במכשירים נשאר.',locked:'הסנכרון ננעל.',review:'הפרופיל לבדיקה',empty:'העותק ברשת נמחק. הפרופיל המקומי לא השתנה.',auto:'לסנכרן את המסע שלי אוטומטית כשהעמוד פתוח ולא נעול (נדרשת שמירה ראשונית או הורדה שנבדקה)',reminders:'תזכורות',reminderHelp:'קבלו תזכורת פרטית כשהמסע שלי פתוח. לתזכורות כשהיישום סגור, הורידו את קובץ היומן וייבאו אותו ליישום היומן שלכם. ספק היומן עשוי לקבל את המידע המיוצא.',enable:'הפעלת תזכורות בדפדפן',disable:'כיבוי תזכורות בדפדפן',calendar:'הורדת תזכורות ליומן',personal:'לכלול כותרות צעדים והערות בייצוא ליומן (כבוי כברירת מחדל)',calendarConfirm:'להוריד תזכורות לצעדים עם תאריך יעד? יש לייבא את הקובץ ליומן כדי להפעיל אותן. ייבוא חוזר עשוי ליצור כפילויות ביומנים מסוימים.',due:'צעדים שמועד היעד שלהם הגיע או עבר: ',enabled:'התזכורות בדפדפן הופעלו. הן פועלות כשהמסע שלי פתוח.',disabled:'התזכורות בדפדפן כובו.',error:'לא ניתן להשלים את הפעולה: ',noDates:'הוסיפו תחילה תאריך יעד לצעד.',codeNotice:'נוצר קוד חיבור פרטי חדש. העתיקו אותו למקום בטוח לפני הנעילה; מומנטום אינה יכולה לשחזר אותו.',audit:'היסטוריית בקשות AI חיצוניות (נתוני פעולה בלבד)',notConfigured:'הזינו את כתובת שירות הסנכרון של מומנטום.'}};
  const lang=()=>document.documentElement.lang==='he'?'he':'en';
  const t=()=>copy[lang()];
  function el(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
  function msg(text,error){const n=$('tools-status');n.textContent=text;n.setAttribute('role',error?'alert':'status');}
  function field(id,label,type,value){const wrap=el('div');wrap.className='field';const l=el('label',label);l.htmlFor=id;const i=el('input');i.id=id;i.type=type;i.autocomplete='off';i.spellcheck=false;if(value)i.value=value;wrap.append(l,i);return wrap;}
  function button(id,label,fn){const b=el('button',label);b.type='button';b.id=id;b.onclick=()=>act(fn);return b;}
  async function act(fn){try{await fn();}catch(e){msg(t().error+(e.message||e),true);}update();}
  function update(){
    for(const id of ['sync-upload','sync-preview','sync-delete','sync-lock'])if($(id))$(id).disabled=!Sync.ready();
    if($('sync-apply'))$('sync-apply').disabled=!remote;
    if($('sync-unlock'))$('sync-unlock').disabled=Sync.ready();
    if($('reminder-count'))$('reminder-count').textContent=t().due+Reminders.due(Store.read()).length;
  }
  function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function mount(){
    let rootNode=$('journey-tools');if(!rootNode){rootNode=el('div');rootNode.id='journey-tools';$('view-privacy').append(rootNode);}
    // Language changes lock secrets rather than preserving them in hidden form fields.
    Sync.lock();remote=null;auto=false;rootNode.replaceChildren();
    const r=el('section');r.className='record';r.append(el('h3',t().reminders),el('p',t().reminderHelp));
    const count=el('p');count.id='reminder-count';r.append(count);
    const personal=el('input');personal.id='calendar-personal';personal.type='checkbox';
    const label=el('label');label.className='switch-row';label.append(personal,el('span',t().personal));r.append(label);
    r.append(button('reminder-enable',t().enable,async()=>{await Reminders.enable();await Reminders.check(Store.read(),lang());msg(t().enabled);}),button('reminder-disable',t().disable,()=>{Reminders.disable();msg(t().disabled);}),button('reminder-calendar',t().calendar,()=>{
      if(!Store.read().actions.some(a=>a.status!=='done'&&Reminders.day(a.dueDate)))return msg(t().noDates,true);
      if(confirm(t().calendarConfirm))download(Reminders.calendar(Store.read(),{privateTitles:!personal.checked}),'my-journey-reminders.ics','text/calendar;charset=utf-8');
    }));rootNode.append(r);
    const s=el('section');s.className='record';s.append(el('h3',t().sync),el('p',t().help));
    s.append(field('sync-url',t().url,'url',Sync.config()),field('sync-token',t().token,'password'),field('sync-password',t().password,'password'),field('sync-invitation',t().invitation,'password'));
    s.append(button('sync-generate',t().generate,()=>{$('sync-token').type='text';$('sync-token').value=Sync.code();msg(t().codeNotice);}));
    s.append(button('sync-unlock',t().unlock,()=>{
      if(!$('sync-url').value)throw new Error(t().notConfigured);
      Sync.unlock($('sync-url').value,$('sync-token').value.trim(),$('sync-password').value,$('sync-invitation').value);
      $('sync-token').value='';$('sync-token').type='password';$('sync-password').value='';$('sync-invitation').value='';remote=null;msg(t().unlocked);
    }),button('sync-lock',t().lock,()=>{Sync.lock();auto=false;$('sync-auto').checked=false;remote=null;$('sync-review').textContent='';msg(t().locked);}),button('sync-upload',t().upload,async()=>{await Sync.upload();remote=null;$('sync-review').textContent='';msg(t().saved);}),button('sync-preview',t().preview,async()=>{
      remote=null;const result=await Sync.preview();
      if(result.deleted)return msg(t().empty);
      remote=result;$('sync-review').textContent=JSON.stringify(remote.profile,null,2);msg(t().downloaded);
    }));
    const details=el('details');details.append(el('summary',t().review));const pre=el('pre');pre.id='sync-review';pre.style='white-space:pre-wrap;overflow-wrap:anywhere;max-height:350px;overflow:auto';details.append(pre);s.append(details);
    const method=el('select');method.id='sync-mode';method.setAttribute('aria-label',t().mode);for(const [v,k] of [['merge','merge'],['replace','replace']]){const o=el('option',t()[k]);o.value=v;method.append(o);}s.append(method);
    s.append(button('sync-apply',t().apply,()=>{if(remote&&confirm(t().confirm)){Sync.apply(remote,method.value);remote=null;$('sync-review').textContent='';document.dispatchEvent(new Event('journey-updated'));msg(t().saved);}}),button('sync-delete',t().erase,async()=>{if(confirm(t().deleteConfirm)){await Sync.erase();remote=null;$('sync-review').textContent='';msg(t().deleted);}}));
    const autoLabel=el('label');autoLabel.className='switch-row';const autoBox=el('input');autoBox.type='checkbox';autoBox.id='sync-auto';autoBox.onchange=()=>{auto=autoBox.checked;};autoLabel.append(autoBox,el('span',t().auto));s.append(autoLabel);
    rootNode.append(s);
    const audit=el('details');audit.append(el('summary',t().audit));
    try{const items=JSON.parse(root.localStorage.getItem('momentum-ai-disclosures-v1')||'[]');for(const item of items.slice(-20).reverse())audit.append(el('p',item.at+' · '+item.event+' · '+item.destination));}catch{}
    rootNode.append(audit);const status=el('p',t().offline);status.id='tools-status';status.setAttribute('aria-live','polite');rootNode.append(status);update();
  }
  mount();
  new MutationObserver(mount).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  setInterval(()=>{update();Reminders.check(Store.read(),lang());},60000);
  setInterval(async()=>{
    if(!auto||!Sync.ready())return;
    try{const result=await Sync.tick();if(result){document.dispatchEvent(new Event('journey-updated'));msg(t().saved);}}
    catch(e){auto=false;$('sync-auto').checked=false;msg(t().error+e.message,true);}
    update();
  },15000);
  root.addEventListener('pagehide',()=>Sync.lock());
})(window);
