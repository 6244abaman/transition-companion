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
    $('wEyebrow').textContent = local('Back to the Future','בחזרה לעתיד');
    $('wTitle').textContent = local('Welcome to Momentum','ברוכים הבאים למומנטום');
    $('wLede').textContent = local('Thank you for your service. This companion is here to answer your questions and help you find your next step. You can type or speak.', 'תודה על השירות שלך. המלווה כאן כדי לענות על שאלות ולעזור לך למצוא את הצעד הבא. אפשר לכתוב או לדבר.');
    $('btnStart').textContent = local('Start','התחלה');
    const n = $('setupProgress').value;
    $('stepCount').textContent = local('Step '+n+' of 2','שלב '+n+' מתוך 2');
  }
  window.paintOnboarding = paint;
  $('btnStart').onclick = () => step(1);
  $('nextSetup').onclick = () => {
    background = Object.fromEntries(fields.map(key => [key, $('bg-'+key).value.trim()]));
    background.reserve = $('bg-reserve').checked;
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
  paint();
})();
