(function(root){
  'use strict';
  const data=root.MomentumSkillSource, Store=root.MomentumJourney;
  if(!data||!Store)return;
  const rolesHe=['לחימה ישירה','שריון / תותחנים / הגנה אווירית','הנדסה קרבית / תמיכה טכנית בשטח','תצפית / איסוף מודיעין','רפואה קרבית / חילוץ','מבצעים / חדר בקרה','מודיעין / מחקר','סייבר / תוכנה / נתונים','תחזוקה טכנית','לוגיסטיקה / אספקה / תובלה','הדרכה','משאבי אנוש / פרט / רווחה','שירות וקישור','מנהלה / משפט / כספים / תקשורת','פיקוד (תחום אחריות חוצה תפקידים)'];
  function suggestions(role,rank){return data.skills.filter(x=>x.id!==63).map(skill=>({skill,priority:(data.opportunities[skill.id][role]||0)+(data.rankOverlays[skill.id][rank]||0)})).sort((a,b)=>b.priority-a.priority||a.skill.id-b.skill.id).slice(0,3).map(x=>x.skill);}
  root.MomentumLifeSkills={suggestions};
  function mount(){
    const he=document.documentElement.lang==='he',t=(en,hw)=>he?hw:en;
    let section=document.getElementById('life-skills-discovery');
    if(!section){section=document.createElement('div');section.id='life-skills-discovery';document.getElementById('view-skills').append(section);}
    const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
    section.replaceChildren();section.append(el('h3',t('Explore life skills from your service','בירור מיומנויות חיים מהשירות')),el('p',t('Your role suggests questions, not conclusions. Choose a broad role and responsibility level; no unit names or operational details are needed. Source entry #63 repeats Professionalism (#55) and is not counted twice.','התפקיד מציע שאלות, לא מסקנות. בחרו תחום תפקיד ורמת אחריות כלליים; אין צורך בשמות יחידות או בפרטים מבצעיים. במקור, סעיף 63 חוזר על מקצועיות (55) ואינו נספר פעמיים.')));
    function select(id,label,items){const wrap=el('div');wrap.className='field';const l=el('label',label);l.htmlFor=id;const s=el('select');s.id=id;items.forEach((v,i)=>{const o=el('option',v);o.value=i;s.append(o);});wrap.append(l,s);section.append(wrap);return s;}
    const role=select('life-role',t('Broad role family','תחום תפקיד כללי'),he?rolesHe:data.roles);
    const rank=select('life-rank',t('Responsibility through captain (suggestions only)','אחריות עד סרן (להצעות בלבד)'),he?['חייל/ת ללא אחריות פיקודית','מפקד/ת צוות / נגד/ת / מדריך/ה','קצין/ה זוטר/ה או מקצועי/ת','סרן / אחריות ברמת פלוגה או מקצועית בכירה']:data.ranks);
    const list=el('div');section.append(list);
    function choose(skill){
      const old=Store.read().lifeSkills.find(x=>x.id===skill.id);
      chosen=skill;title.textContent=he?skill.he:skill.original;
      prompt.textContent=t('Describe a non-sensitive situation: what was your responsibility, what did you do, what happened, how often, and how independently? Do not name other people or disclose operations.','תארו מצב ללא מידע רגיש: מה הייתה האחריות שלכם, מה עשיתם, מה קרה, באיזו תדירות ובאיזו עצמאות? אל תציינו שמות של אחרים או פרטים מבצעיים.');
      example.value=old?old.evidence:'';confirmBox.checked=false;editor.hidden=false;
    }
    function renderSuggestions(){list.replaceChildren();for(const skill of suggestions(Number(role.value),Number(rank.value))){const b=el('button',t('Explore: ','לבדיקה: ')+(he?skill.he:skill.original));b.type='button';b.onclick=()=>choose(skill);list.append(b);}}
    role.onchange=rank.onchange=renderSuggestions;renderSuggestions();
    const all=el('details');all.append(el('summary',t('Choose another skill from the source list','בחירת מיומנות אחרת מרשימת המקור')));const picker=el('select');picker.setAttribute('aria-label',t('Life skill','מיומנות חיים'));for(const skill of data.skills.filter(x=>x.id!==63)){const o=el('option',skill.id+'. '+(he?skill.he:skill.original));o.value=skill.id;picker.append(o);}const pick=el('button',t('Explore this skill','בדיקת המיומנות'));pick.type='button';pick.onclick=()=>choose(data.skills.find(x=>x.id===Number(picker.value)));all.append(picker,pick);section.append(all);
    let chosen=null;const editor=el('div');editor.className='record';editor.hidden=true;
    const title=el('h3'),prompt=el('p'),example=el('textarea');example.rows=5;example.maxLength=1500;example.style.width='100%';example.setAttribute('aria-label',t('My non-sensitive example','הדוגמה שלי ללא מידע רגיש'));
    const confirmBox=el('input');confirmBox.type='checkbox';const label=el('label');label.className='switch-row';label.append(confirmBox,el('span',t('This example is accurate, belongs to me, and contains no sensitive information. Save it in my profile.','הדוגמה נכונה, מתייחסת לניסיון שלי ואינה מכילה מידע רגיש. לשמור אותה בפרופיל שלי.')));
    const status=el('p');status.setAttribute('role','status');const save=el('button',t('Save my confirmed example','שמירת הדוגמה שאישרתי'));save.type='button';save.onclick=()=>{
      if(!chosen||!confirmBox.checked||!example.value.trim()){status.textContent=t('Add an example and confirm it first.','הוסיפו דוגמה ואשרו אותה תחילה.');return;}
      try{Store.saveLifeSkills([{id:chosen.id,en:chosen.original,he:chosen.he,evidence:example.value,confirmed:true}]);document.dispatchEvent(new Event('journey-updated'));status.textContent=t('Saved. You can use this example in a CV draft.','נשמר. ניתן להשתמש בדוגמה בטיוטת קורות חיים.');}catch(e){status.textContent=e.message;}
    };
    editor.append(title,prompt,example,label,save,status);section.append(editor);
  }
  if(document.getElementById('view-skills')){mount();new MutationObserver(mount).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
})(window);
