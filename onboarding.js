/* Local onboarding for both companion editions. */
(() => {
  const local = (en, he) => S.lang === 'he' ? he : en;
  const boxes = [...document.querySelectorAll('.interestGrid input')];
  const fields = ['contact', 'service', 'role'];
  let finished = false;
  let background = {};
  function step(number) {
    $('intro').hidden = number !== 0;
    $('setup').hidden = number === 0;
    $('background').hidden = number !== 1;
    $('interests').hidden = number !== 2;
    $('setupProgress').value = number || 1;
    paint();
    if (number) $(number === 1 ? 'background' : 'interests').querySelector('h2').focus();
    $('welcome').scrollTop = 0;
  }
  function paint() {
    for (const item of document.querySelectorAll('[data-en][data-he]')) {
      item.textContent = item.dataset[S.lang];
    }
    $('wEyebrow').textContent = local('MOMENTUM · YOUR NEXT CHAPTER','מומנטום · הפרק הבא שלך');
    $('wTitle').textContent = local('Your next chapter starts with a conversation.','הפרק הבא שלך מתחיל בשיחה.');
    $('wLede').textContent = local('Thank you for your service. Whether you have a clear plan or are still exploring, we can talk, discover your strengths and find the next step that fits you.', 'תודה על השירות שלך. בין שיש לך תוכנית ברורה ובין שאתה עדיין בודק כיוונים, נוכל לשוחח, לגלות חוזקות ולמצוא יחד את הצעד הבא שמתאים לך.');
    $('btnStart').textContent = local('Start — let’s talk','נתחיל — בואו נדבר');
    const n = $('setupProgress').value;
    $('stepCount').textContent = local('Step '+n+' of 2','שלב '+n+' מתוך 2');
  }

  const toolDefs=[
    ["strength","✦","Discover my strengths","לגלות את החוזקות שלי","./adaptive-skills.html","Short personalized assessment","הערכה אישית קצרה"],
    ["journey","◎","My Journey","המסע שלי","./my-journey.html","Goals, plans and confirmed skills","יעדים, תוכניות ומיומנויות מאושרות"],
    ["cv","▤","CV builder","בניית קורות חיים","./my-journey.html#cvs","Draft and edit with real examples","טיוטה ועריכה על סמך דוגמאות"],
    ["study","◈","Studies and next steps","לימודים והמשך הדרך","./my-journey.html#education","Keep study ideas and dates","לשמור כיווני לימוד ומועדים"],
    ["benefit","₪","Rights and opportunities","זכויות והזדמנויות","./index.html?section=updates","Dated information, check official sources","מידע עם תאריך וקישורים רשמיים"],
    ["career","◉","Explore work and interviews","עבודה וראיונות",null,"Discuss paths and practice questions","לשוחח על כיוונים ולתרגל שאלות"]
  ];
  const extras=document.createElement('section');
  extras.id='combined-tools';
  extras.className='combined-tools';
  extras.innerHTML='<div class="combined-head"><button type="button" id="toggleCombinedTools" aria-expanded="false" aria-controls="combinedToolGrid"></button><p id="toolsDisclosure"></p></div><div id="combinedToolGrid" class="combined-grid" hidden></div>';
  $('btnStart').after(extras);
  function paintExtras(){
    $('toggleCombinedTools').textContent=local('Explore tools','לגלות את הכלים');
    $('toolsDisclosure').textContent=local('Optional. Start a conversation, or choose a tool when you need one.','אפשר לבחור כלי או להתחיל בשיחה. אין צורך למלא שאלון.');
    const grid=$('combinedToolGrid');grid.replaceChildren();
    toolDefs.forEach(item=>{
      const node=item[4]?document.createElement('a'):document.createElement('button');
      node.className='combined-tool';
      if(item[4]) {
        node.href=item[4].replace('index.html', S.lang==='he'?'indexH.html':'index.html');
        if(node.href.includes('my-journey.html')||node.href.includes('adaptive-skills.html'))
          node.href+=(node.href.includes('?')?'&':'?')+'lang='+S.lang;
      } else {
        node.type='button';
        node.onclick=()=>{ $('btnStart').click(); };
      }
      const icon=document.createElement('strong');icon.textContent=item[1];icon.setAttribute('aria-hidden','true');
      const title=document.createElement('b');title.textContent=local(item[2],item[3]);
      const desc=document.createElement('small');desc.textContent=local(item[5],item[6]);
      node.append(icon,title,desc);grid.append(node);
    });
  }
  $('toggleCombinedTools').onclick=()=>{
    const grid=$('combinedToolGrid');grid.hidden=!grid.hidden;
    $('toggleCombinedTools').setAttribute('aria-expanded',String(!grid.hidden));
  };
  const originalPaint=paint;
  window.paintOnboarding=()=>{originalPaint();paintExtras();};

  $('btnStart').onclick = () => step(1);
  $('bg-reserve').onchange = () => {
    const enabled = $('bg-reserve').checked;
    $('reserveRoleField').hidden = !enabled;
    $('bg-reserve-role').disabled = !enabled;
  };
  $('nextSetup').onclick = () => {
    background = Object.fromEntries(fields.map(key => [key, $('bg-'+key).value.trim()]));
    background.reserve = $('bg-reserve').checked;
    background.reserveRole = background.reserve ? $('bg-reserve-role').value : '';
    step(2);
  };
  $('skipBackground').onclick = () => { background = {}; step(2); };
  $('backSetup').onclick = () => step(1);
  function finish(direct) {
    if (finished) return;
    finished = true;
    const chosen = direct ? [] : boxes.filter(box => box.checked);
    S.profile.background = {...(S.profile.background || {}), ...background};
    S.profile.interests = chosen.map(box => box.value);
    S.started = true;
    const selectedTopic = chosen.length === 1 && TRANSITION_TOPICS.find(topic => topic[0] === chosen[0].value);
    if (selectedTopic) {
      prepareTopic(selectedTopic);
      save();
      return;
    }
    S.activeTopic = null;
    enterChat();
    const labels = chosen.filter(box => box.value !== 'unsure').map(box => box.nextElementSibling.textContent);
    let reply = local('How are you doing today? What would help most right now?', 'מה שלומך היום? במה הכי יעזור לך שנתחיל?');
    if (direct) reply = local('What would you like to ask?', 'מה השאלה שלך?');
    else if (labels.length === 1) reply = local('What would you like to explore about '+labels[0].toLowerCase()+'?', 'מה מעניין אותך לבדוק בנושא '+labels[0]+'?');
    else if (labels.length > 1) reply = local('You picked '+labels.join(', ')+'. Which would you like to start with?', 'בחרת '+labels.join(', ')+'. במה נתחיל?');
    pushMsg('assistant',reply,{kind:'setup',topic:S.activeTopic});
    save();
    paintTopicPanel();
    $('input').focus();
  }
  $('finishSetup').onclick = () => finish(false);
  $('ownQuestion').onclick = () => finish(true);
  window.paintOnboarding();
})();
