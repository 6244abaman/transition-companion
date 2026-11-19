/* Local reminders and explicit calendar export. No background monitoring. */
(function(root){
  'use strict';
  const KEY='momentum-reminder-settings-v1';
  function day(value) {
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const [y,m,d]=value.split('-').map(Number), dt=new Date(y,m-1,d);
    return dt.getFullYear()===y && dt.getMonth()===m-1 && dt.getDate()===d ? dt:null;
  }
  function today(now=new Date()){return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');}
  function due(profile,now=new Date()){return profile.actions.filter(x=>x.status!=='done' && day(x.dueDate) && x.dueDate<=today(now));}
  function settings(){try{const s=JSON.parse(root.localStorage.getItem(KEY)||'{}');return {enabled:s.enabled===true,notified:s.notified||''};}catch{return {enabled:false,notified:''};}}
  function disable(){root.localStorage.removeItem(KEY);}
  async function enable(){
    if(!root.Notification)throw new Error('Browser notifications are unavailable. Use a calendar reminder.');
    const permission=await root.Notification.requestPermission();
    if(permission!=='granted')throw new Error('Notifications were not enabled. Calendar reminders remain available.');
    root.localStorage.setItem(KEY,JSON.stringify({enabled:true,notified:''}));
  }
  async function check(profile,lang,now=new Date()){
    const s=settings(),tasks=due(profile,now), date=today(now);
    if(!s.enabled||!tasks.length||s.notified===date||!root.Notification||root.Notification.permission!=='granted')return tasks;
    const title=lang==='he'?'המסע שלי — תזכורת':'My Journey — reminder';
    // Lock screen never shows task titles, notes, goals or personal information.
    const options={body:lang==='he'?'יש צעדים שממתינים לבדיקה במסע שלי.':'You have next steps to review in My Journey.',tag:'momentum-journey-due'};
    try{
      if(root.navigator.serviceWorker){const registration=await root.navigator.serviceWorker.getRegistration();if(registration)await registration.showNotification(title,options);else new root.Notification(title,options);}
      else new root.Notification(title,options);
      root.localStorage.setItem(KEY,JSON.stringify({enabled:true,notified:date}));
    }catch{/* Denied/unsupported notifications must never break planning. */}
    return tasks;
  }
  function escape(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
  function fold(line){let out='',part='';for(const char of line){if(new TextEncoder().encode(part+char).length>73){out+=part+'\r\n ';part='';}part+=char;}return out+part;}
  function calendar(profile,{privateTitles=true,now=new Date()}={}){
    const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
    const rows=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Momentum//My Journey//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for(const x of profile.actions){
      const date=day(x.dueDate);if(x.status==='done'||!date)continue;
      const end=new Date(date);end.setDate(end.getDate()+1);
      rows.push('BEGIN:VEVENT','UID:'+escape(x.id)+'@momentum-journey','DTSTAMP:'+stamp,
        'DTSTART;VALUE=DATE:'+x.dueDate.replace(/-/g,''),'DTEND;VALUE=DATE:'+today(end).replace(/-/g,''),
        'SUMMARY:'+escape(privateTitles?'My Journey — review next step':x.title),
        'DESCRIPTION:'+escape(privateTitles?'Open My Journey to review your private action.':x.notes),
        'BEGIN:VALARM','TRIGGER:PT9H','ACTION:DISPLAY','DESCRIPTION:My Journey reminder','END:VALARM','END:VEVENT');
    }
    rows.push('END:VCALENDAR');return rows.map(fold).join('\r\n')+'\r\n';
  }
  root.MomentumJourneyReminders={day,today,due,settings,enable,disable,check,calendar};
})(window);
