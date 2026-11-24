/* Reversible Momentum Companion home. Soldier data never leaves the browser here. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const header = document.querySelector('header.bar');
  if (!header || !$('welcome') || !$('chat') || !$('composer')) return;
  const say = (en, he) => S.lang === 'he' ? he : en;
  const make = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const journeyUrl = tab => './my-journey.html?lang=' + (S.lang === 'he' ? 'he' : 'en') + '#' + tab;
  const more = make('details', undefined, 'companion-more');
  more.id = 'companionMore';
  const summary = make('summary');
  summary.id = 'companionMoreTitle';
  const menuItems = make('div', undefined, 'companion-more-items');
  ['btnAI', 'btnVoice', 'btnVoiceSettings', 'btnProfile', 'btnHelp'].forEach(id => {
    const control = $(id);
    if (!control) return;
    control.type = 'button';
    menuItems.append(control); // Preserve the existing event listeners and AI/voice consent.
    control.addEventListener('click', () => { more.open = false; });
  });
  more.append(summary, menuItems);
  const homeButton = make('button', undefined, 'chip companion-home-button');
  homeButton.id = 'companionHomeButton';
  homeButton.type = 'button';
  const journey = make('a', undefined, 'chip companion-journey-link');
  journey.id = 'companionJourneyLink';
  header.append(homeButton, journey, more);
  header.querySelectorAll('button').forEach(button => { button.type = 'button'; });
  const drawerHome = make('button', undefined, 'chip companion-drawer-home');
  drawerHome.id = 'companionDrawerHome';
  drawerHome.type = 'button';
  const drawerHeader = document.querySelector('#drawer .dhead');
  if (drawerHeader) drawerHeader.insertBefore(drawerHome, $('btnClose'));

  // This is not onboarding. Moving home does not reset S.started, the message
  // draft, profile, savedChats, Journey, consent or any other user information.
  const hub = make('main', undefined, 'screen companion-hub');
  hub.id = 'companionHomeHub';
  hub.hidden = true;
  hub.innerHTML = [
    '<div class="hub-inner">',
    '<p class="hub-kicker" id="hubKicker"></p>',
    '<h1 id="hubHeading"></h1><p class="hub-lede" id="hubLede"></p>',
    '<div class="hub-resume"><div><strong id="hubResumeTitle"></strong><p id="hubResumeInfo"></p></div>',
    '<button type="button" id="hubResume" class="hub-primary"></button></div>',
    '<h2 id="hubPathsHeading"></h2><div class="hub-paths">',
    '<button type="button" data-path="benefit" class="hub-path"><span aria-hidden="true">✓</span><span data-path-label="benefit"></span></button>',
    '<a data-path="resume" class="hub-path"><span aria-hidden="true">▤</span><span data-path-label="resume"></span></a>',
    '<button type="button" data-path="history" class="hub-path"><span aria-hidden="true">↺</span><span data-path-label="history"></span></button>',
    '<a data-path="education" class="hub-path"><span aria-hidden="true">▦</span><span data-path-label="education"></span></a>',
    '<a data-path="action" class="hub-path"><span aria-hidden="true">☑</span><span data-path-label="action"></span></a>',
    '</div><p id="hubSourceNotice" class="hub-note"></p>',
    '<details id="hubTester" class="hub-tester"><summary id="hubTesterSummary"></summary>',
    '<p id="hubTesterIntro"></p><div id="hubTestTasks"></div>',
    '<label for="hubStuck" id="hubStuckLabel"></label><textarea id="hubStuck" rows="2" maxlength="1500"></textarea>',
    '<label for="hubValue" id="hubValueLabel"></label><textarea id="hubValue" rows="2" maxlength="1500"></textarea>',
    '<button type="button" id="hubDownloadTest"></button><p id="hubPrivacyNote" class="hub-note"></p>',
    '</details></div>'
  ].join('');
  $('welcome').before(hub);

  const tasks = [
    ['Find an official benefit', 'מציאת הטבה ממקור רשמי'],
    ['Prepare a resume', 'הכנת קורות חיים'],
    ['Resume an earlier conversation', 'חזרה לשיחה קודמת'],
    ['Compare education choices', 'השוואת מסלולי לימוד'],
    ['Save a follow-up action', 'שמירת פעולת המשך']
  ];
  for (const [index, labels] of tasks.entries()) {
    const label = make('label', undefined, 'hub-test-task');
    const checkbox = make('input');checkbox.type = 'checkbox';checkbox.dataset.testTask = index;
    const span = make('span');span.dataset.en = labels[0];span.dataset.he = labels[1];
    label.append(checkbox, span);$('hubTestTasks').append(label);
  }
  const labels = {
    hubKicker: ['YOUR NEXT CHAPTER · MOMENTUM', 'הפרק הבא שלך · מומנטום'],
    hubHeading: ['Momentum Companion', 'המלווה של מומנטום'],
    hubLede: ['Reliable information, practical next steps and a place to return to. Your choices stay yours.', 'מידע אמין, צעדים מעשיים ומקום לחזור אליו. ההחלטות נשארות בידיים שלכם.'],
    hubResumeTitle: ['Continue where you left off', 'ממשיכים מאיפה שהפסקנו'],
    hubPathsHeading: ['What would you like to do?', 'מה תרצו לעשות?'],
    hubSourceNotice: ['Verify benefits against dated official sources. Your plans remain on this device unless you choose to share.', 'יש לאמת הטבות מול מקורות רשמיים מתוארכים. התוכניות נשארות במכשיר אלא אם בחרתם לשתף.'],
    hubTesterSummary: ['Help test these five tasks (optional)', 'עזרו לבדוק חמש משימות (לא חובה)'],
    hubTesterIntro: ['Try each task and mark it when you finish. Record where you became confused and what helped. Nothing is sent automatically.', 'נסו כל משימה וסמנו כשהצלחתם. כתבו איפה התבלבלתם ומה עזר. דבר לא נשלח אוטומטית.'],
    hubStuckLabel: ['Where did you get stuck?', 'איפה נתקלתם בקושי?'],
    hubValueLabel: ['What was most useful?', 'מה היה הכי מועיל?'],
    hubDownloadTest: ['Download feedback to share', 'הורדת משוב לשליחה'],
    hubPrivacyNote: ['Do not include names, contact details, military-sensitive or medical information. You decide whether to share the downloaded report.', 'נא לא לכלול שמות, פרטי קשר, מידע צבאי רגיש או מידע רפואי. אתם מחליטים אם לשתף את המשוב שהורדתם.']
  };
  function refresh() {
    for (const [id, pair] of Object.entries(labels)) $(id).textContent = say(...pair);
    homeButton.textContent = say('Home', 'בית');
    homeButton.title = say('Return home without losing the conversation', 'חזרה לבית בלי למחוק את השיחה');
    drawerHome.textContent = say('Home', 'בית');
    summary.textContent = say('More', 'עוד');
    journey.textContent = say('My Journey', 'המסע שלי');
    journey.href = journeyUrl('overview');
    $('hubResume').textContent = say(S.started ? 'Continue conversation' : 'Start a conversation', S.started ? 'המשך השיחה' : 'התחלת שיחה');
    const count = (S.savedChats || []).length + ((S.messages || []).length ? 1 : 0);
    let steps = [], completed = 0;
    try {
      const profile = window.MomentumJourney && window.MomentumJourney.read();
      steps = profile && Array.isArray(profile.actions) ? profile.actions : [];
      completed = steps.filter(a => a.status === 'done').length;
    } catch (_) { /* This UI also works with browser storage blocked. */ }
    $('hubResumeInfo').textContent = say(
      count + ' saved conversation(s) · ' + completed + '/' + steps.length + ' follow-up steps completed',
      count + ' שיחות שמורות · ' + completed + ' מתוך ' + steps.length + ' צעדים הושלמו'
    );
    const pathNames = {
      benefit: ['Find a benefit or right', 'חיפוש הטבה או זכות'],
      resume: ['Prepare or download a resume', 'הכנה או הורדה של קורות חיים'],
      history: ['Resume an earlier conversation', 'חזרה לשיחה קודמת'],
      education: ['Compare study and training choices', 'השוואת מסלולי לימוד והכשרה'],
      action: ['Save a follow-up action', 'שמירת משימת המשך']
    };
    for (const [path, pair] of Object.entries(pathNames)) hub.querySelector('[data-path-label="' + path + '"]').textContent = say(...pair);
    for (const [path, tab] of [['resume','cvs'],['education','education'],['action','actions']])
      hub.querySelector('[data-path="' + path + '"]').href = journeyUrl(tab);
    hub.querySelectorAll('[data-test-task]').forEach(input => {
      input.nextElementSibling.textContent = say(...tasks[Number(input.dataset.testTask)]);
    });
  }
  function openChat() {
    hub.hidden = true;
    if (!S.started) {S.started = true;save();} // Optional onboarding can still be accessed normally.
    enterChat();
    if (!S.messages.length) openConversation();
    $('input').focus({preventScroll:true});
  }
  function showHome() {
    if ((typeof sendingUserMessage !== 'undefined' && sendingUserMessage) || $('thinking')) {
      $('hint').textContent = say('Finish the current answer before going home.', 'יש להמתין לסיום התשובה לפני החזרה לבית.');
      return false;
    }
    if (typeof stopSpeaking === 'function') stopSpeaking();
    if (typeof closeDrawer === 'function') closeDrawer();
    if ($('chatHistory')) $('chatHistory').open = false;
    if ($('topicPanel')) $('topicPanel').open = false;
    more.open = false;
    $('welcome').hidden = true;
    $('chat').hidden = true;
    $('composer').hidden = true;
    hub.hidden = false;
    refresh();
    $('hubHeading').tabIndex = -1;
    $('hubHeading').focus({preventScroll:true});
    return true;
  }
  homeButton.addEventListener('click', showHome);
  drawerHome.addEventListener('click', showHome);
  $('hubResume').addEventListener('click', openChat);
  hub.querySelector('[data-path="benefit"]').addEventListener('click', () => {
    const topic = TRANSITION_TOPICS.find(t => t[0] === 'updates');
    if (topic) { hub.hidden = true; prepareTopic(topic); }
  });
  hub.querySelector('[data-path="history"]').addEventListener('click', () => {
    openChat();
    const panel = $('chatHistory');
    if (panel) { panel.open = true; panel.querySelector('summary').focus({preventScroll:true}); }
  });
  $('hubDownloadTest').addEventListener('click', () => {
    const rows = [...hub.querySelectorAll('[data-test-task]')].map(input => {
      const pair = tasks[Number(input.dataset.testTask)];
      return (input.checked ? '[x] ' : '[ ] ') + pair[0] + ' / ' + pair[1];
    });
    const report = [
      'Momentum Companion — voluntary usability feedback', new Date().toISOString().slice(0,10),
      'Tasks completed (self-reported):', ...rows,
      '', 'Where I got stuck:', $('hubStuck').value.trim(),
      '', 'Most useful:', $('hubValue').value.trim(),
      '', 'No chat, profile or account information was automatically included.'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([report], {type:'text/plain;charset=utf-8'}));
    const link = make('a');link.href = url;link.download = 'momentum-companion-feedback.txt';
    link.click();setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && more.open) { more.open = false;summary.focus(); }
  });
  const language = $('btnLang');
  if (language) language.addEventListener('click', () => setTimeout(refresh, 0));
  if (location.hash === '#home') {
    showHome();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  }
  window.CompanionHome = {show:showHome, continueChat:openChat};
  refresh();
})();