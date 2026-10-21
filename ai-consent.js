/* Per-request disclosure gate. No network calls occur inside the gate. */
(function(root){
  'use strict';
  let pending=false;
  function audit(event,destination,messageCount){
    try{const key='momentum-ai-disclosures-v1';const items=JSON.parse(root.localStorage.getItem(key)||'[]');
      items.push({at:new Date().toISOString(),event,destination,messageCount});root.localStorage.setItem(key,JSON.stringify(items.slice(-100)));
    }catch{/* A full browser store must not expose request contents or block cancel. */}
  }
  async function approve(payload,destination,lang){
    if(pending)throw new Error('A sharing request is already open');
    pending=true;const he=lang==='he';
    const draft=JSON.parse(JSON.stringify(payload));
    const history=draft.messages.slice();
    const last=history.filter(m=>m.role==='user').slice(-1);
    if(!last.length){pending=false;throw new Error('A question is required');}
    const dialog=document.createElement('dialog');dialog.dir=he?'rtl':'ltr';dialog.style='width:min(720px,94vw);max-height:90dvh;border:1px solid #aac4c7;border-radius:16px;padding:22px;color:#183d39;overflow:auto';
    const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
    const title=node('h2',he?'בדיקה לפני שיתוף עם AI':'Review before sharing with AI');title.id='ai-disclosure-title';dialog.setAttribute('aria-labelledby',title.id);
    dialog.append(title,node('p',he?'הבקשה תישלח לשירות AI חיצוני בכתובת:':'This request will be sent to the external AI service at:'),node('p',destination),node('p',he?'אל תכללו מידע מסווג, מידע מזהה על אחרים, סיסמאות או פרטים רפואיים שאינם נחוצים. ביטול לא שולח דבר.':'Remove classified details, identifying information about others, passwords and unnecessary health information. Cancel sends nothing.'));
    const label=node('label',''),box=document.createElement('input');box.type='checkbox';box.id='ai-include-history';
    label.append(box,document.createTextNode(he?' לצרף את השיחות האחרונות (כבוי כברירת מחדל)':' Include recent conversation messages (off by default)'));dialog.append(label);
    dialog.append(node('p',he?'הבקשה המלאה שתישלח (כולל הוראות המערכת). ניתן לערוך את השאלה לפני השליחה.':'Exact request to be sent, including system instructions. You can edit your question before sending.'));
    const question=document.createElement('textarea');question.value=last[0].content;question.setAttribute('aria-label',he?'השאלה לשיתוף':'Question to share');question.style='width:100%;min-height:90px';dialog.append(question);
    const preview=node('pre','');preview.style='white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;background:#eef4f4;padding:10px';preview.id='ai-outgoing-preview';dialog.append(preview);
    function update(){draft.messages=box.checked?history.map((m,i)=>i===history.length-1&&m.role==='user'?{...m,content:question.value}:m):[{role:'user',content:question.value}];preview.textContent=JSON.stringify(draft,null,2);}
    box.onchange=question.oninput=update;update();
    return new Promise(resolve=>{
      let settled=false;function finish(value){if(settled)return;settled=true;pending=false;dialog.close();dialog.remove();resolve(value);}
      const send=node('button',he?'אישור ושליחה':'Approve and send');send.id='ai-approve';send.type='button';send.onclick=()=>{if(!question.value.trim())return;update();audit("approved",destination,draft.messages.length);finish(draft);};
      const cancel=node('button',he?'ביטול — להשאיר במכשיר':'Cancel — keep on this device');cancel.id='ai-cancel';cancel.type='button';cancel.onclick=()=>finish(null);dialog.oncancel=event=>{event.preventDefault();finish(null);};
      dialog.append(send,cancel);document.body.append(dialog);dialog.showModal();question.focus();
    });
  }
  root.MomentumAIConsent={approve,audit};
})(window);
