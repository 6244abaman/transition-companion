/* Momentum Companion — home, navigation, onboarding, knowledge pages and personal tools.
 * Loaded after companion-home.js in index.html and indexH.html.
 * Everything here stays in this browser (localStorage key below). No network calls.
 * It reuses the existing app functions (S, save, pushMsg, prepareTopic, sendUser,
 * TRANSITION_TOPICS, MomentumJourney) and never changes the AI consent flow. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || !document.getElementById('companionHomeHub')) return;
  const $ = id => document.getElementById(id);
  const KB = window.MomentumKB || null;
  const Journey = () => window.MomentumJourney || null;
  const PKEY = 'momentum-companion-plus-v1';
  const VERSION = '2026.11.26-full-brief';
  const he = () => S.lang === 'he';
  const tr = (en, hb) => he() ? hb : en;
  const edition = () => (typeof KEY !== 'undefined' && KEY === 'gtc_H_state') ? 'he' : 'en';

  /* ---------------- preferences (local only) ---------------- */
  const DEFAULTS = {v: 1, name: '', onboarded: false, dischargeMonth: '', notDischarged: false, service: '', lone: false,
    reservist: false, monthsServed: '', pressing: '', hidden: [], theme: 'light', textSize: 'normal', reduceMotion: false,
    infoOnly: false, moods: [], days: [], backupRemindedAt: '', seenVersion: '', todayStep: null, chatMode: ''};
  function load() {
    try { const v = JSON.parse(localStorage.getItem(PKEY) || 'null'); return v && typeof v === 'object' ? {...DEFAULTS, ...v} : {...DEFAULTS}; }
    catch (_) { return {...DEFAULTS}; }
  }
  let P = load();
  function store() { try { localStorage.setItem(PKEY, JSON.stringify(P)); return true; } catch (_) { return false; } }
  const todayStr = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  /* ---------------- tiny DOM helper ---------------- */
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  }
  // append() that skips null/false pieces (optional sections)
  const put = (parent, ...kids) => { kids.flat().forEach(k => { if (k !== null && k !== undefined && k !== false) parent.append(k); }); return parent; };
  const btn = (text, onclick, cls) => h('button', {type: 'button', class: cls || 'plus-btn', onclick}, text);

  function toast(msg) {
    let t = $('plusToast');
    if (!t) { t = h('div', {id: 'plusToast', role: 'status', 'aria-live': 'polite'}); document.body.append(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- display preferences ---------------- */
  function applyDisplay() {
    const root = document.documentElement;
    // Light unless the soldier explicitly picks dark (following the phone's night mode mixed the palettes).
    const dark = P.theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.text = P.textSize;
    root.dataset.motion = P.reduceMotion ? 'reduce' : 'full';
    root.dataset.infoOnly = P.infoOnly ? 'true' : 'false';
  }

  /* ---------------- visits, streak, discharge timing ---------------- */
  function recordVisit() {
    const t = todayStr();
    const first = !P.days.includes(t);
    if (first) { P.days = [...P.days, t].slice(-120); store(); }
    return first;
  }
  function streak() {
    const set = new Set(P.days); let n = 0; const d = new Date();
    while (set.has(todayStr(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function monthsSinceDischarge() {
    if (!/^\d{4}-\d{2}$/.test(P.dischargeMonth || '')) return null;
    const [y, m] = P.dischargeMonth.split('-').map(Number), now = new Date();
    return Math.max(0, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m));
  }
  function timingMessage() {
    const G = KB && KB.GUIDES.timeSinceDischarge, m = monthsSinceDischarge();
    if (!G || m === null) return '';
    if (m < 1) return G.week; if (m < 3) return G.months1to3; if (m < 12) return G.months3to12; return G.overYear;
  }

  /* ---------------- journey helpers ---------------- */
  function journey() { try { return Journey() ? Journey().read() : null; } catch (_) { return null; } }
  function saveAction(title, notes, dueDate) {
    const J = Journey(); if (!J) { toast(tr('My Journey is unavailable in this browser.', 'המסע שלי אינו זמין בדפדפן הזה.')); return null; }
    try {
      const rec = J.upsert('actions', {title: String(title).slice(0, 160), notes: String(notes || '').slice(0, 3000), status: 'todo', dueDate: dueDate || ''});
      toast(tr('Saved to My Journey ✓', 'נשמר במסע שלך ✓'));
      return rec && rec.actions ? rec.actions[rec.actions.length - 1] : null;
    } catch (e) { toast(tr('Could not save: ', 'השמירה נכשלה: ') + e.message); return null; }
  }
  const journeyUrl = tab => './my-journey.html?lang=' + S.lang + '#' + tab;

  /* ---------------- encouragement ---------------- */
  const CHEERS_HE = ['כל הכבוד שחזרת היום.', 'זה בסדר לא לדעת עדיין.', 'צעד קטן הוא עדיין צעד.', 'אין לוח זמנים אחד נכון למעבר.', 'מותר לנוח גם בתוך תקופה של שינוי.', 'עצם זה שאתה בודק — זו כבר התקדמות.'];
  const CHEERS_EN = ['Good to see you back today.', "It's okay not to know yet.", 'A small step is still a step.', "There's no single right timeline for this transition.", "It's okay to rest in a time of change.", 'Checking things out is already progress.'];
  const cheer = () => { const list = he() ? CHEERS_HE : CHEERS_EN; return list[(new Date().getDate() + P.days.length) % list.length]; };

  /* ---------------- trust helpers: date + source, honest privacy line ---------------- */
  function asOfLabel(v) {
    const m = /^(\d{4})-(\d{2})/.exec(v || ''); if (!m) return v || '';
    try { return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(he() ? 'he-IL' : 'en-GB', {month: 'long', year: 'numeric'}); } catch (_) { return v; }
  }
  function sourceLine(src) {
    if (!src) return null;
    return h('p', {class: 'plus-source'}, tr('Last updated: ', 'עודכן: ') + asOfLabel(src.asOf) + (src.by ? ' · ' + tr('Source: ', 'מקור: ') + src.by : ''));
  }
  function privacyLine() {
    return h('p', {class: 'plus-privacy-line'}, icon('lock', 'plus-inline-ico'), ' ' + tr('Everything you write is saved only on this device. A message goes to the AI only after you approve.',
      'מה שאתה כותב נשאר אצלך בטלפון. ל-AI יוצא רק מה שאישרת.'));
  }
  const money = n => n === null || n === undefined ? '—' : (KB ? KB.fmtMoney(n) : String(n));
  const SERVICE_OPTIONS = () => [['combat', tr('Combat', 'לוחם/ת')], ['support', tr('Combat support', 'תומך/ת לחימה')], ['other', tr('Other / rear', 'אחר / עורפי')], ['national', tr('National-civilian service', 'שירות לאומי-אזרחי')], ['civ_mid', tr('Civilian track (intermediate)', 'מסלול אזרחי ביניים')], ['civ_split', tr('Civilian track (split)', 'מסלול אזרחי מפוצל')]];
  const serviceSelect = (id, value) => h('select', {id, 'aria-label': tr('Service type', 'סוג שירות')}, SERVICE_OPTIONS().map(([v, l]) => h('option', {value: v, selected: v === (value || 'combat') || undefined}, l)));
  const genderSelect = id => h('select', {id, 'aria-label': tr('Soldier', 'חייל / חיילת')}, [['', tr('Choose', 'לבחור')], ['m', tr('Male soldier', 'חייל')], ['f', tr('Female soldier', 'חיילת')]].map(([v, l]) => h('option', {value: v, selected: v === (P.gender || '') || undefined}, l)));
  function estimateNote(e) {
    if (!e) return null;
    const parts = [];
    if (e.trainingMonths) parts.push(tr(e.trainingMonths + ' training months are counted at the lower rate.', e.trainingMonths + ' חודשי הכשרה נספרים בתעריף הנמוך יותר.'));
    if (e.capped) parts.push(tr('Counted up to ' + e.countedMonths + ' months.', 'נספרים עד ' + e.countedMonths + ' חודשים.'));
    if (!P.gender) parts.push(tr('Choose male/female soldier for an exact cap (32/24 months) and tax points.', 'כדאי לבחור חייל/חיילת — זה משנה את התקרה (32/24 חודשים) ואת נקודות הזיכוי.'));
    return parts.length ? h('p', {class: 'plus-muted'}, parts.join(' ')) : null;
  }
  function estimateBlock(service, months) {
    const e = KB && KB.estimate(service, months, P.gender);
    if (!e || !e.grantRate) return null;
    const rows = [
      [tr('Discharge grant — per month of service', 'מענק שחרור — לכל חודש שירות'), money(e.grantRate)],
      e.depositRate ? [tr('Personal deposit — per month of service', 'פיקדון אישי — לכל חודש שירות'), money(e.depositRate)] : null,
      e.grant !== null ? [tr('Estimated grant for ' + months + ' months', 'מענק משוער ל-' + months + ' חודשים'), '≈ ' + money(e.grant)] : null,
      e.deposit !== null ? [tr('Estimated deposit for ' + months + ' months', 'פיקדון משוער ל-' + months + ' חודשים'), '≈ ' + money(e.deposit)] : null,
      e.points ? [tr('Tax credit points', 'נקודות זיכוי במס'), (e.points[0] === e.points[1] ? e.points[0] : e.points[0] + '–' + e.points[1]) + tr(' points ≈ ', ' נקודות ≈ ') + (e.taxMonthly[0] === e.taxMonthly[1] ? money(e.taxMonthly[0]) : money(e.taxMonthly[0]) + '–' + money(e.taxMonthly[1])) + tr(' a month', ' לחודש')]
        : [tr('Tax credit points', 'נקודות זיכוי במס'), tr('up to 2 points ≈ ', 'עד 2 נקודות ≈ ') + money(2 * e.pointValue) + tr(' a month', ' לחודש')]
    ].filter(Boolean);
    return h('div', {}, h('table', {class: 'plus-table'}, h('tbody', {}, rows.map(([a, b]) => h('tr', {}, h('th', {scope: 'row'}, a), h('td', {}, b))))),
      estimateNote(e),
      h('p', {class: 'plus-muted'}, tr('You may be entitled to this. It is an estimate, not a promise — check your personal area.', 'ייתכן שזה מגיע לך. זו הערכה בלבד ולא הבטחה — בדוק באזור האישי.')),
      sourceLine({asOf: e.asOf, by: e.source}));
  }
  function estimateCard() {
    if (!P.service) return h('div', {class: 'plus-card plus-soft'}, h('strong', {}, tr('How much might I get?', 'כמה אולי מגיע לי?')),
      h('p', {}, tr('Tell me your service type to see an estimate of the grant and tax points.', 'ספר לי מה סוג השירות שלך כדי לראות הערכה של המענק ונקודות הזיכוי.')),
      btn(tr('Tell me a bit about you', 'לספר לי קצת עליך'), () => showPage('onboarding'), 'plus-btn'));
    return h('div', {class: 'plus-card plus-estimate'}, h('h2', {}, tr('Your estimate', 'ההערכה שלך') + ' · ' + (KB.SERVICE_LABEL[P.service] || '')),
      estimateBlock(P.service, P.monthsServed), h('div', {class: 'plus-row'}, btn(tr('Calculator & details', 'מחשבון ופרטים'), () => showPage('money'), 'plus-link')));
  }
  function quickAnswers() {
    const faq = (KB && KB.data && KB.data.faq) || []; if (!faq.length) return null;
    return h('div', {class: 'plus-card'}, h('h2', {}, tr('Quick answers', 'תשובות מהירות')),
      ...faq.slice(0, 5).map(f => h('details', {class: 'plus-details'}, h('summary', {}, f.question), h('p', {}, f.answer))),
      btn(tr('All rights & questions', 'כל הזכויות והשאלות'), () => showPage('rights'), 'plus-link'));
  }
  function warningsBox() {
    const w = KB && KB.data && KB.data.important_warnings; if (!w || !w.length) return null;
    return h('div', {class: 'plus-warning', role: 'note'}, h('strong', {}, icon('warn', 'plus-inline-ico'), ' ' + tr('Important', 'חשוב לדעת')), h('ul', {class: 'plus-list'}, w.map(x => h('li', {}, x))));
  }
  function grantVsDeposit() {
    const t = KB && KB.data && KB.data.grant_vs_deposit; if (!t) return null;
    return h('div', {class: 'plus-card plus-soft'}, h('h2', {}, tr('Grant vs. deposit — the difference', 'מה ההבדל בין המענק לפיקדון?')), h('p', {}, t));
  }

  const PAGE_HEAD = {
    rights: {icon: 'wallet', title: ['What am I entitled to', 'מה מגיע לי']},
    practical: {icon: 'briefcase', title: ['Work / studies / money', 'עבודה / לימודים / כסף']},
    money: {icon: 'coins', title: ['Money', 'כסף']}, work: {icon: 'briefcase', title: ['Work & CV', 'עבודה וקורות חיים']},
    studies: {icon: 'compass', title: ['Studies', 'לימודים']}, travel: {icon: 'compass', title: ['Travel', 'טיולים ונסיעות']},
    family: {icon: 'talk', title: ['Relationships & family', 'מערכות יחסים ומשפחה']}, feel: {icon: 'talk', title: ['How I feel', 'איך אני מרגיש']},
    distress: {icon: 'heart', title: ['Human help', 'עזרה אנושית']}, help: {icon: 'person', title: ['Me', 'אישי']},
    onboarding: {icon: 'person', title: ['Getting to know you', 'היכרות קצרה']}, interview: {icon: 'briefcase', title: ['Job interview', 'ראיון עבודה']}
  };

  /* ================================================================
     PAGE SYSTEM — one screen for every module, with a consistent back button
     ================================================================ */
  const hub = $('companionHomeHub');
  const page = h('main', {class: 'screen plus-page', id: 'plusPage', hidden: true, tabindex: '-1'});
  hub.before(page);
  let pageStack = [];
  function hideScreens() {
    ['welcome', 'chat', 'composer'].forEach(id => { if ($(id)) $(id).hidden = true; });
    hub.hidden = true;
  }
  function showPage(id, push = true) {
    if (typeof sendingUserMessage !== 'undefined' && sendingUserMessage) { toast(tr('Please wait for the reply.', 'נא להמתין לסיום התשובה.')); return; }
    if (typeof stopSpeaking === 'function') stopSpeaking();
    const render = PAGES[id]; if (!render) return;
    const sameRefresh = !push && pageStack[pageStack.length - 1] === id && !page.hidden;
    const keepY = sameRefresh ? (document.scrollingElement || document.documentElement).scrollTop : 0;
    if (push && pageStack[pageStack.length - 1] !== id) pageStack.push(id);
    hideScreens();
    page.replaceChildren();
    const meta = PAGE_HEAD[id] || {};
    const head = h('div', {class: 'plus-head'},
      icon(meta.icon || 'compass', 'plus-head-ico'),
      h('h1', {class: 'plus-head-title'}, meta.title ? tr(meta.title[0], meta.title[1]) : ''),
      h('button', {type: 'button', class: 'plus-back', 'aria-label': tr('Back', 'חזרה'), onclick: goBack}, icon('back')));
    const body = render();
    if (FOLD_PAGES.includes(id)) foldSections(body, FOLD_TOPIC[id], id);
    page.append(head, h('div', {class: 'plus-inner'}, body, privacyLine()));
    page.hidden = false;
    page.dir = he() ? 'rtl' : 'ltr';
    page.scrollTop = 0; try { document.scrollingElement.scrollTop = keepY; } catch (_) {}
    if (!sameRefresh) page.focus({preventScroll: true});
    setNav(id === 'help' ? 'help' : 'home');
  }
  // Long information pages: every titled card becomes a tidy fold (icon + title, opens on tap).
  const FOLD_PAGES = ['work', 'studies', 'travel', 'family', 'interview'];
  const FOLD_ICONS = ['briefcase', 'award', 'file', 'listcheck', 'talk', 'users', 'book', 'info'];
  const FOLD_TOPIC = {work: 'work', studies: 'study', travel: 'transport', family: 'health', interview: 'work'};
  const FOLD_ILLU = {work: ['briefcase', 'checklist', 'signpost', 'pen', 'receipt', 'talk', 'users', 'compass'], studies: ['cap', 'book', 'pencil', 'signpost', 'award', 'calc', 'checklist'], travel: ['map', 'piggy', 'shield', 'checklist', 'phone', 'compass'], family: ['users', 'heart', 'talk', 'house', 'checklist'], interview: ['talk', 'pen', 'checklist', 'award', 'users']};
  function foldSections(root, topic, pageId) {
    const disc = root.querySelector(':scope > .plus-disclaimer'); if (disc) root.append(disc);
    [...root.querySelectorAll(':scope > section.plus-card, :scope > .plus-card')].forEach((sec, i) => {
      const t = sec.querySelector(':scope > h2, :scope > h3'); if (!t || sec.tagName === 'DETAILS') return;
      const d = h('details', {class: 'plus-card plus-right-fold'});
      for (const a of sec.attributes) if (a.name !== 'class') d.setAttribute(a.name, a.value);
      const sum = h('summary', {class: 'plus-right-sum'}, (FOLD_ILLU[pageId] ? illu(FOLD_ILLU[pageId][i % FOLD_ILLU[pageId].length], 44, 'plus-right-illu') : icon(FOLD_ICONS[i % FOLD_ICONS.length], 'plus-right-ico topic-' + (topic || 'tasks'))), h('span', {class: 'plus-right-head'}, h('strong', {}, t.textContent)), icon('chevron', 'plus-right-chev'));
      t.remove();
      const bodyBox = h('div', {class: 'plus-right-body'}); while (sec.firstChild) bodyBox.append(sec.firstChild);
      d.append(sum, bodyBox); sec.replaceWith(d);
    });
  }
  function hidePage() { page.hidden = true; pageStack = []; }
  function goBack() {
    pageStack.pop();
    let prev = pageStack.pop();
    while (prev === 'onboarding' && P.onboarded) prev = pageStack.pop();
    if (prev) showPage(prev); else goHome();
  }
  function goHome() {
    hidePage();
    if (window.CompanionHome) window.CompanionHome.show();
    renderHome(); setNav('home');
  }
  function goChat(mode) {
    if (P.infoOnly) { showPage('rights'); return; }
    hidePage();
    if (window.CompanionHome) window.CompanionHome.continueChat();
    setNav('chat');
    if (mode) startMode(mode); else maybeOfferModes();
  }
  function openTopic(id, question) {
    if (P.infoOnly) { toast(tr('Information-only mode is on. Turn it off in Help to chat.', 'מצב "מידע בלבד" פעיל. אפשר לכבות אותו בעזרה כדי לשוחח.')); return; }
    const topic = typeof TRANSITION_TOPICS !== 'undefined' && TRANSITION_TOPICS.find(t => t[0] === id);
    hidePage(); hub.hidden = true;
    if (topic && typeof prepareTopic === 'function') prepareTopic(topic);
    else if (window.CompanionHome) window.CompanionHome.continueChat();
    setNav('chat');
    if (question && $('input')) { $('input').value = question; $('input').focus(); }
  }

  /* ================================================================
     HOME — four large buttons with a short explanation each
     ================================================================ */
  const plusHome = h('section', {id: 'plusHome', class: 'plus-home', 'aria-labelledby': 'plusHomeTitle'});
  const inner = hub.querySelector('.hub-inner');
  const legacy = h('details', {class: 'plus-legacy', id: 'plusLegacy'}, h('summary', {id: 'plusLegacySummary'}));
  [...inner.children].forEach(c => legacy.append(c));
  // The original hub (duplicate shortcuts + tester form) was replaced by the new Home. Kept in the DOM
  // for existing links/tests, never shown (owner decision, 26 Nov 2026).
  legacy.hidden = true;
  inner.append(plusHome, legacy);

  /* Line icons (static markup, no user data). Stroke uses currentColor. */
  const SVG = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', // Lucide lock (ISC)
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>', // Lucide chevron-left (ISC)
    // Duotone "illustrated" icons (27 Nov 2026) — filled shapes in the topic colour, used inside soft circles.
    banknote: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="currentColor" opacity=".28"/><rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="6.2" cy="12" r="1" fill="currentColor"/><circle cx="17.8" cy="12" r="1" fill="currentColor"/></svg>',
    piggy: '<svg viewBox="0 0 24 24"><path d="M5 11.5C5 8 8.2 6 12 6c1.5 0 2.9.3 4 .9l2.4-1.4-.5 2.9c1 .9 1.6 2 1.8 3.1H21v3h-1.6c-.5 1.1-1.3 2-2.4 2.6V20h-2.6l-.6-1.4c-.6.1-1.2.2-1.8.2s-1.3-.1-1.9-.2L9.6 20H7v-2.6C5.8 16.3 5 14.4 5 11.5Z" fill="currentColor" opacity=".3"/><path d="M5 11.5C5 8 8.2 6 12 6c1.5 0 2.9.3 4 .9l2.4-1.4-.5 2.9c1 .9 1.6 2 1.8 3.1H21v3h-1.6c-.5 1.1-1.3 2-2.4 2.6V20h-2.6l-.6-1.4c-.6.1-1.2.2-1.8.2s-1.3-.1-1.9-.2L9.6 20H7v-2.6C5.8 16.3 5 14.4 5 11.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="15.5" cy="10.5" r="1" fill="currentColor"/><path d="M10 7.8h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 11.5H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    percent: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.5.9 2.5-2.2 1.6-.8 2.6-2.7-.1L12 21.2l-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.5-.9-2.5 2.2-1.6.8-2.6 2.7.1L12 2.8Z" fill="currentColor" opacity=".3"/><path d="M12 2.8l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.5.9 2.5-2.2 1.6-.8 2.6-2.7-.1L12 21.2l-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.5-.9-2.5 2.2-1.6.8-2.6 2.7.1L12 2.8Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 15l6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.3" cy="9.3" r="1.3" fill="currentColor"/><circle cx="14.7" cy="14.7" r="1.3" fill="currentColor"/></svg>',
    bus: '<svg viewBox="0 0 24 24"><rect x="4.5" y="3.5" width="15" height="15" rx="3" fill="currentColor" opacity=".3"/><rect x="4.5" y="3.5" width="15" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 11h15" stroke="currentColor" stroke-width="1.5"/><rect x="7" y="6" width="10" height="3" rx="1" fill="currentColor"/><circle cx="8" cy="15" r="1.2" fill="currentColor"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/><path d="M7 18.5V20.5M17 18.5V20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3Z" fill="currentColor" opacity=".3"/><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cap: '<svg viewBox="0 0 24 24"><path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9Z" fill="currentColor" opacity=".35"/><path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 11v4.2c0 1.7 2.5 3.3 5.5 3.3s5.5-1.6 5.5-3.3V11" fill="currentColor" opacity=".2"/><path d="M6.5 11v4.2c0 1.7 2.5 3.3 5.5 3.3s5.5-1.6 5.5-3.3V11M21 9.3v5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.3" fill="currentColor" opacity=".35"/><circle cx="9" cy="8.5" r="3.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" fill="currentColor" opacity=".25"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="16.5" cy="9.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M17 14.4c2.3.3 3.7 1.9 4 4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    building: '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="currentColor" opacity=".3"/><rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 7.5h2M13.5 7.5h2M8.5 11h2M13.5 11h2M8.5 14.5h2M13.5 14.5h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.5 20.5v-3h3v3" fill="currentColor"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M6 4h10.5l-2 4 2 4H6V4Z" fill="currentColor" opacity=".35"/><path d="M6 21V4h10.5l-2 4 2 4H6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    listcheck: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="currentColor" opacity=".25"/><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 9l1.5 1.5L11 8M7 14.5l1.5 1.5L11 13.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 9.5h3.5M13.5 15h3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M7.3 3.5l2.4 3.7-1.6 2.2c.9 2.2 2.4 3.7 4.6 4.6l2.2-1.6 3.7 2.4-1 3.2c-.3.9-1.2 1.5-2.2 1.4C9.3 18.8 5.2 14.7 4.6 8.6c-.1-1 .5-1.9 1.4-2.2l1.3-2.9Z" fill="currentColor" opacity=".35"/><path d="M7.3 3.5l2.4 3.7-1.6 2.2c.9 2.2 2.4 3.7 4.6 4.6l2.2-1.6 3.7 2.4-1 3.2c-.3.9-1.2 1.5-2.2 1.4C9.3 18.8 5.2 14.7 4.6 8.6c-.1-1 .5-1.9 1.4-2.2l1.3-2.9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6.5 3h7.5l4.5 4.5V21h-12V3Z" fill="currentColor" opacity=".28"/><path d="M6.5 3h7.5l4.5 4.5V21h-12V3Z M14 3v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12h6M9 15h6M9 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M3.5 5.5c3-1 5.8-.7 8.5 1v13c-2.7-1.7-5.5-2-8.5-1v-13Z" fill="currentColor" opacity=".35"/><path d="M20.5 5.5c-3-1-5.8-.7-8.5 1v13c2.7-1.7 5.5-2 8.5-1v-13Z" fill="currentColor" opacity=".18"/><path d="M3.5 5.5c3-1 5.8-.7 8.5 1 2.7-1.7 5.5-2 8.5-1v13c-3-1-5.8-.7-8.5 1-2.7-1.7-5.5-2-8.5-1v-13ZM12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    calc: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor" opacity=".28"/><rect x="5" y="3" width="14" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7.5" y="5.5" width="9" height="3.5" rx="1" fill="currentColor"/><circle cx="9" cy="12.5" r="1" fill="currentColor"/><circle cx="12" cy="12.5" r="1" fill="currentColor"/><circle cx="15" cy="12.5" r="1" fill="currentColor"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></svg>',
    award: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5" fill="currentColor" opacity=".3"/><circle cx="12" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.7 13.4L7.5 21l4.5-2.4 4.5 2.4-1.2-7.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6.5l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2.8-1.6Z" fill="currentColor"/></svg>',
    lifebuoy: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="currentColor" opacity=".25"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M3.5 6l5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2V6Z" fill="currentColor" opacity=".28"/><path d="M3.5 6l5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2V6ZM9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    linkic: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    handcoins: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="7" r="3.5" fill="currentColor" opacity=".35"/><circle cx="15.5" cy="7" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 14.5h3l3.5-1.5h4c.9 0 1.5.6 1.5 1.4 0 .8-.6 1.4-1.5 1.4H11l5.5-.3 3-2c.7-.4 1.5-.2 1.8.5.2.5 0 1-.4 1.4L15.5 20H6l-3-.5v-5Z" fill="currentColor" opacity=".25"/><path d="M3 14.5h3l3.5-1.5h4c.9 0 1.5.6 1.5 1.4 0 .8-.6 1.4-1.5 1.4H11l5.5-.3 3-2c.7-.4 1.5-.2 1.8.5.2.5 0 1-.4 1.4L15.5 20H6l-3-.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V7.5Z"/><path d="M4 7.5 15.5 4.2a1 1 0 0 1 1.3 1V7.5"/><path d="M20 11.5h-3.5a1.5 1.5 0 0 0 0 3H20"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3.5 12.5h17"/><path d="M11 12.5v1.5h2v-1.5"/></svg>',
    talk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><circle cx="8.5" cy="11" r=".9" fill="currentColor"/><circle cx="12" cy="11" r=".9" fill="currentColor"/><circle cx="15.5" cy="11" r=".9" fill="currentColor"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-2-.1-2.9-.4L4.5 20l1.3-3.6C4.4 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7Z"/><circle cx="8.5" cy="11" r=".9" fill="currentColor"/><circle cx="12" cy="11" r=".9" fill="currentColor"/><circle cx="15.5" cy="11" r=".9" fill="currentColor"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5h6l-1.6 3h-2.8L9 3.5Z"/><path d="M10.6 6.5C6.5 8.5 4 12 4 15.5c0 3 2.2 5 8 5s8-2 8-5c0-3.5-2.5-7-6.6-9"/><path d="M13.6 11.2c-.4-.6-1-.9-1.7-.9-1 0-1.8.6-1.8 1.4 0 1.9 3.8 1 3.8 2.9 0 .8-.8 1.5-1.9 1.5-.8 0-1.5-.4-1.9-1M12 9.3v1m0 6.3v1"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17.5h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5Z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
    logo: '<svg viewBox="0 0 64 34" fill="none"><path d="M2 31 22 6l9 11 7-8 24 22" fill="#2F5A46"/><path d="M22 6 13 17.5l5-2.5 4 4 4-4 5 2" stroke="#F5F1E9" stroke-width="1.6" stroke-linejoin="round"/><path d="M38 9l-5 6 3-1 2 2 3-2 2 1" stroke="#F5F1E9" stroke-width="1.4" stroke-linejoin="round"/><path d="M1 33c18-5 44-5 62 0" stroke="#2F5A46" stroke-width="2" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.3 3.6a1 1 0 0 1 1.4 0l8 7.3c.6.6.2 1.6-.6 1.6H19V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H6.5A1.5 1.5 0 0 1 5 19v-6.5H3.9c-.8 0-1.2-1-.6-1.6l8-7.3Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 16.8h.01M12 16.8h.01"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7"/><path d="M12 17h.01"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="#E0565B"><path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10Z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6.5 4h11v16l-5.5-4-5.5 4V4Z"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3.5 10 14"/><path d="m20.5 3.5-6.5 17-4-6.5-6.5-4 17-6.5Z"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3.5a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V7"/><path d="M6.5 11v3.5a5.5 5.5 0 0 0 11 0V11M12 20v1.5"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4.5l3 2"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 9v9H9"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18v3.5H3zM12 9v11"/><path d="M12 9c-2.5 0-4.5-1-4.5-2.7S10 4 12 9Zm0 0c2.5 0 4.5-1 4.5-2.7S14 4 12 9Z"/></svg>',
    coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 10.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 14.5v3c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="#6FA58A" stroke="#2F5A46" stroke-width="1.4" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="#E0A020" stroke-width="1.8" stroke-linejoin="round"><path d="M12 4 21 19.5H3L12 4Z" fill="#FCE9B8"/><path d="M12 10v4.5M12 17h.01" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/></svg>'
  };
  const icon = (name, cls) => { const s = h('span', {class: 'plus-ico' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true'}); s.innerHTML = SVG[name] || ''; return s; };
  // Illustrated icons (illustrations.js). Falls back to the line icon when the illustration set is missing.
  const ILLU_FOR = {cvpen: 'pen', bag: 'piggy', bulb: 'footsteps', listcheck: 'checklist', check: 'checklist', calendar: 'calendar', heart: 'heart'};
  const illu = (name, size, cls, fallback) => {
    if (!window.MomentumIllu || !window.MomentumIllu(name)) return icon(fallback || name, cls);
    const sp = h('span', {class: 'plus-illu' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true'}); sp.innerHTML = window.MomentumIllu(name, size || 44); return sp;
  };
  window.MomentumPlusIcon = icon;
  // Header on Home: mountain logo + gear (the existing "More" menu). AI consent settings move into that menu.
  const bar = document.querySelector('header.bar');
  if (bar && !bar.querySelector('.plus-logo')) bar.append(icon('logo', 'plus-logo'));
  // Chat header (reference): collapse-to-home at the start, avatar + name + Online in the middle, history at the end.
  if (bar && !$('plusChatHead')) {
    const av = h('span', {class: 'plus-avatar', 'aria-hidden': 'true'}); av.innerHTML = SVG.logo;
    bar.append(
      h('button', {type: 'button', id: 'plusChatHome', class: 'plus-chat-hbtn', 'aria-label': tr('Back to Home', 'חזרה לבית'), onclick: () => goHome()}, icon('collapse')),
      h('div', {id: 'plusChatHead', class: 'plus-chat-head'}, av, h('strong', {id: 'plusChatName'}), h('span', {class: 'plus-online'}, h('i'), h('span', {id: 'plusOnlineText'}))),
      h('button', {type: 'button', id: 'plusHistoryBtn', class: 'plus-chat-hbtn', onclick: () => { const p = $('chatHistory'); if (p) p.open = !p.open; }}, icon('history')));
  }
  // Language switcher next to the gear (Home header). Each language is its own edition of the app.
  if (bar && !$('plusLang')) {
    const langBox = h('div', {id: 'plusLang', class: 'plus-lang', role: 'group', 'aria-label': 'שפה / Language'});
    [['he', 'עב', 'עברית', './indexH.html?lang=he#home'], ['en', 'EN', 'English', './index.html?lang=en#home']].forEach(([code, short, name, url]) => {
      langBox.append(h('a', {href: url, lang: code, 'aria-label': name, 'aria-current': edition() === code ? 'true' : null, class: 'plus-lang-opt'}, short));
    });
    bar.append(langBox);
  }
  function paintChatHead() {
    if ($('plusChatName')) $('plusChatName').textContent = tr('Your Companion', 'המלווה שלך');
    if ($('plusOnlineText')) $('plusOnlineText').textContent = navigator.onLine === false ? tr('Offline', 'לא מחובר') : 'Online';
    if ($('plusHistoryBtn')) $('plusHistoryBtn').setAttribute('aria-label', tr('Previous conversations', 'שיחות קודמות'));
    const input = $('input'); if (input) input.placeholder = tr('Type a message...', 'הקלד הודעה...');
  }
  function moveConsent() {
    const cs = $('btnAIConsentSettings'), items = document.querySelector('.companion-more-items');
    if (cs && items && cs.parentElement !== items) { cs.classList.add('chip'); items.append(cs); cs.addEventListener('click', () => { const m = $('companionMore'); if (m) m.open = false; }); }
  }
  moveConsent(); document.addEventListener('DOMContentLoaded', moveConsent); setTimeout(moveConsent, 0);

  // Order matches the reference: (RTL) top-right, top-left, bottom-right, bottom-left.
  const HOME_BUTTONS = [
    {id: 'rights', icon: 'wallet', illu: 'wallet', topic: 'money', he: ['מה מגיע לי', '(מענק, פיקדון, נקודות זיכוי)', 'מענק, פיקדון, נקודות זיכוי ועוד — בשפה פשוטה.'], en: ['What I am entitled to', '(grant, deposit, tax points)', 'Grant, deposit, tax points and more — in plain words.']},
    {id: 'practical', icon: 'briefcase', illu: 'briefcase', topic: 'study', he: ['עבודה / לימודים / כסף', '', 'קורות חיים, לימודים, תקציב, טיול ומשפחה.'], en: ['Work / studies / money', '', 'CV, studies, budget, travel and family.']},
    {id: 'feel', icon: 'heart', illu: 'heart', topic: 'health', he: ['איך אני מרגיש עכשיו', '', 'לדבר, לפרוק, או לבדוק מה שלומך — בלי שיפוט.'], en: ['How I feel right now', '', 'Talk, vent or check in with yourself — no judgment.']},
    {id: 'journey', icon: 'map', illu: 'map', topic: 'journey', he: ['המסע שלי', '', 'המטרות, הכישורים והצעדים שלך במקום אחד.'], en: ['My Journey', '', 'Your goals, skills and steps in one place.']}
  ];
  function homeAction(id) {
    if (id === 'journey') { location.href = journeyUrl('overview'); return; }
    showPage(id);
  }

  /* -------- mood row on Home (same data as the "How I feel" page) -------- */
  const MOODS = [
    {v: 1, he: 'קשה מאוד', en: 'Very hard', color: '#F2A7A3', mouth: 'M8.3 16.6c1.9-2 5.5-2 7.4 0'},
    {v: 2, he: 'קשה', en: 'Hard', color: '#F3A877', mouth: 'M8.8 15.8c1.7-1 4.7-1 6.4 0'},
    {v: 3, he: 'ככה', en: 'So-so', color: '#F2CB63', mouth: 'M9 15h6'},
    {v: 4, he: 'טוב', en: 'Good', color: '#B6D98A', mouth: 'M8.8 14.2c1.7 1.2 4.7 1.2 6.4 0'},
    {v: 5, he: 'מצוין', en: 'Great', color: '#62B26F', mouth: 'M8.3 13.8c1.9 2.2 5.5 2.2 7.4 0'}
  ];
  function face(m) {
    const s = h('span', {class: 'plus-face', 'aria-hidden': 'true', style: 'background:' + m.color});
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#2A2F2A" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="10" r="1" fill="#2A2F2A" stroke="none"/><circle cx="15" cy="10" r="1" fill="#2A2F2A" stroke="none"/><path d="' + m.mouth + '"/>' + (m.brow ? '<path d="M7.5 7.6l2.4.8M16.5 7.6l-2.4.8"/>' : '') + '</svg>';
    return s;
  }
  let moodOpen = false;
  function moodRow() {
    const t = todayStr(), today = P.moods.find(m => m.d === t);
    const card = h('div', {class: 'plus-mood-card', role: 'group', 'aria-label': tr('How do you feel today?', 'איך אתה מרגיש היום?')},
      MOODS.map(m => h('button', {type: 'button', class: 'plus-mood-item', 'aria-pressed': String(!!today && today.v === m.v), onclick: () => {
        P.moods = [...P.moods.filter(x => x.d !== t), {d: t, v: m.v, note: (today && today.note) || ''}].slice(-90); store();
        moodOpen = true; renderHome();
      }}, face(m), h('span', {class: 'plus-mood-label'}, he() ? m.he : m.en))));
    return h('div', {class: 'plus-mood-wrap'}, card, today && moodOpen ? moodResponse(today) : (today ? h('button', {type: 'button', class: 'plus-mood-again', onclick: () => { moodOpen = true; renderHome(); }}, tr('What can help today? →', 'מה יכול לעזור היום? ←')) : null));
  }
  // A short, practical answer to the check-in, right here — no jump to another page.
  function moodResponse(today) {
    const v = today.v, t = todayStr();
    const recent = P.moods.slice(-7), lowRun = recent.slice(-3).length === 3 && recent.slice(-3).every(m => m.v <= 2);
    const note = h('input', {type: 'text', maxlength: '140', class: 'plus-mood-note', placeholder: tr('What affected today? (optional, only on your phone)', 'מה השפיע היום? (לא חובה, נשמר רק בטלפון)'), 'aria-label': tr('Note for today', 'הערה להיום')});
    note.value = today.note || '';
    note.addEventListener('change', () => { const m = P.moods.find(x => x.d === t); if (m) { m.note = note.value.trim().slice(0, 140); store(); toast(tr('Saved ✓', 'נשמר ✓')); } });
    const dots = h('div', {class: 'plus-mood-week', 'aria-label': tr('Last 7 check-ins', '7 הבדיקות האחרונות')}, recent.map(m => h('i', {class: 'mv' + m.v, title: m.d})));
    const action = (ill, title, sub, onclick, href) => {
      const inner = [illu(ill, 34, 'plus-mood-ill'), h('span', {}, h('b', {}, title), sub ? h('small', {}, sub) : null)];
      return href ? h('a', {class: 'plus-mood-act', href}, ...inner) : h('button', {type: 'button', class: 'plus-mood-act', onclick}, ...inner);
    };
    let title, acts;
    if (v <= 2) {
      title = lowRun ? tr('A few hard days in a row. That is a good reason to talk to someone.', 'כמה ימים קשים ברצף. זו סיבה טובה לדבר עם מישהו.') : tr('Thanks for being honest. A hard day is allowed.', 'תודה שאתה כן. מותר שיהיה יום קשה.');
      acts = [action('phone', tr('Talk to a person now', 'לדבר עם אדם עכשיו'), tr('ERAN 1201 · free, anonymous, 24/7', 'ער"ן 1201 · חינם, אנונימי, 24/7'), null, 'tel:1201'),
        action('heart', tr('One minute of breathing', 'דקה של נשימה'), tr('In 4 · hold 4 · out 6', 'שאיפה 4 · עצירה 4 · נשיפה 6'), e => breathe(e.currentTarget)),
        P.infoOnly ? null : action('talk', tr('Write it to the Companion', 'לכתוב למלווה'), tr('Not a person — but it listens', 'לא אדם — אבל מקשיב'), () => openTopic('support')),
        action('users', tr('More human help', 'עוד עזרה אנושית'), tr('Calm list of who to call', 'רשימה רגועה למי לפנות'), () => showPage('distress'))];
    } else if (v === 3) {
      title = tr('An ordinary day — good for one small step.', 'יום רגיל — מתאים לצעד קטן אחד.');
      acts = [action('footsteps', tr('Pick one small step', 'לבחור צעד קטן אחד'), tr('5–10 minutes is enough', '5–10 דקות זה מספיק'), () => { const el = document.querySelector('.plus-today-row'); if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'}); else showPage('rights'); }),
        action('wallet', tr('Check what I am entitled to', 'לבדוק מה מגיע לי'), null, () => showPage('rights')),
        action('heart', tr('One minute of breathing', 'דקה של נשימה'), null, e => breathe(e.currentTarget))];
    } else {
      title = tr('Good day! Use the energy for something that moves you forward.', 'יום טוב! כדאי לנצל את האנרגיה למשהו שמקדם.');
      acts = [PAGES.cv ? action('pen', tr('Work on my CV', 'לעבוד על קורות החיים'), tr('About 10 minutes', 'בערך 10 דקות'), () => showPage('cv')) : null,
        action('calendar', tr('Plan the week', 'לתכנן את השבוע'), tr('In My Journey', 'במסע שלי'), null, './my-journey.html?lang=' + S.lang),
        action('wallet', tr('Claim something I am owed', 'לממש משהו שמגיע לי'), null, () => showPage('rights'))];
    }
    return h('div', {class: 'plus-mood-resp', 'aria-live': 'polite'},
      h('div', {class: 'plus-mood-resp-top'}, h('p', {}, title), h('button', {type: 'button', class: 'plus-mood-close', 'aria-label': tr('Close', 'סגירה'), onclick: () => { moodOpen = false; renderHome(); }}, '✕')),
      h('div', {class: 'plus-mood-acts'}, acts.filter(Boolean)), note, recent.length > 1 ? dots : null);
  }
  function breathe(el) {
    if (!el || el.dataset.busy) return; el.dataset.busy = '1';
    const label = el.querySelector('b'), orig = label.textContent, reduce = document.documentElement.dataset.motion === 'reduce';
    const phases = [[tr('Breathe in…', 'שאיפה…'), 4], [tr('Hold…', 'עצירה…'), 4], [tr('Breathe out…', 'נשיפה…'), 6]];
    let round = 0, i = 0;
    el.classList.add('is-breathing');
    const next = () => {
      if (round >= 4) { label.textContent = tr('Well done ✓', 'כל הכבוד ✓'); el.classList.remove('is-breathing'); setTimeout(() => { label.textContent = orig; delete el.dataset.busy; }, 2500); return; }
      const [txt, sec] = phases[i]; label.textContent = txt; el.style.setProperty('--bdur', sec + 's'); el.dataset.phase = i;
      i++; if (i === phases.length) { i = 0; round++; }
      setTimeout(next, reduce ? sec * 1000 : sec * 1000);
    };
    next();
  }

  /* -------- compact rows: estimate + small step -------- */
  function distressBtn() {
    const b = btn(tr("I'm not feeling okay", 'אני לא מרגיש בסדר'), () => showPage('distress'), 'plus-distress');
    return b;
  }
  function rowCard(cls, iconName, label, value, onclick, note) {
    return h('button', {type: 'button', class: 'plus-row-card ' + cls, onclick},
      ILLU_FOR[iconName] ? illu(ILLU_FOR[iconName], 40, 'plus-row-illu', iconName) : icon(iconName, 'plus-row-ico'), h('span', {class: 'plus-row-text'}, h('small', {}, label, note ? h('em', {}, ' · ' + note) : null), h('strong', {}, value)), icon('chevron', 'plus-row-chev'));
  }
  function slimRow(ill, title, sub, onclick, cls) { return h('button', {type: 'button', class: 'plus-slim' + (cls ? ' ' + cls : ''), onclick}, illu(ill, 30, 'plus-slim-ill'), h('span', {class: 'plus-slim-t'}, h('b', {}, title), sub ? h('small', {}, sub) : null), icon('chev', 'plus-slim-chev')); }
  let homeFaqOpen = false;
  function estimateRow() {
    if (!KB) return null;
    if (!P.service || !P.monthsServed) return slimRow('piggy', tr('How much might I get?', 'כמה אולי מגיע לי?'), tr('Enter your months of service', 'מכניסים כמה חודשים שירתת'), () => showPage('rights'));
    if (false) return rowCard('plus-sage', 'bag', tr('How much might I get?', 'כמה אולי מגיע לי?'), tr('Enter your months of service →', 'הכנס כמה חודשים שירתת ←'), () => showPage('rights'));
    const e = KB.estimate(P.service, P.monthsServed, P.gender);
    if (!e || !e.grantRate) return null;
    const value = e.grant !== null ? '≈ ' + money(e.grant) : money(e.grantRate) + tr(' per month served', ' לכל חודש שירות');
    return slimRow('piggy', tr('My estimate: ', 'ההערכה שלי: ') + value, tr('Grant and deposit · updated ', 'מענק ופיקדון · עודכן ') + asOfLabel(e.asOf), () => showPage('rights'), 'plus-est-row');
  }
  let todayOpen = false;
  function todayRow() {
    const p = journey(), t = todayStr();
    const step = p && P.todayStep && P.todayStep.date === t && p.actions.find(a => a.id === P.todayStep.id);
    const value = step ? (step.status === 'done' ? '✓ ' : '') + step.title : tr('Pick something small — 10 minutes is plenty', 'בוחרים משהו קטן — 10 דקות זה מספיק');
    const isDone = step && step.status === 'done';
    const row = rowCard('plus-beige plus-today-row' + (isDone ? ' plus-row-done' : ''), isDone ? 'check' : 'bulb', isDone ? tr('Done for today. Nice one.', 'סגרת את היום. יפה.') : tr('Your step for today', 'הצעד שלך להיום'), value, () => { todayOpen = !todayOpen; renderHome(); });
    row.setAttribute('aria-expanded', String(todayOpen));
    return h('div', {}, row, todayOpen ? todayStepCard() : null);
  }

  /* -------- quick answers as chips -------- */
  let openAnswer = -1;
  function quickChips() {
    const faq = (KB && KB.data && KB.data.faq) || []; if (!faq.length) return null;
    const answer = openAnswer >= 0 && faq[openAnswer];
    return h('section', {class: 'plus-quick'},
      h('div', {class: 'plus-quick-chips'}, faq.slice(0, 6).map((f, i) => h('button', {type: 'button', class: 'plus-qchip', 'aria-expanded': String(i === openAnswer), onclick: () => { openAnswer = i === openAnswer ? -1 : i; renderHome(); }}, f.question))),
      answer ? h('div', {class: 'plus-qanswer', role: 'status'}, h('strong', {}, answer.question), h('p', {}, answer.answer), btn(tr('All rights & questions', 'כל הזכויות והשאלות'), () => showPage('rights'), 'plus-link')) : null);
  }

  function renderHome() {
    const keepY = (document.scrollingElement || document.documentElement).scrollTop;
    requestAnimationFrame(() => { try { (document.scrollingElement || document.documentElement).scrollTop = keepY; } catch (_) {} });
    plusHome.replaceChildren();
    plusHome.dir = he() ? 'rtl' : 'ltr';
    $('plusLegacySummary').textContent = tr('More options', 'אפשרויות נוספות');
    plusHome.append(
      h('h1', {id: 'plusHomeTitle', class: 'plus-hello'}, tr('Hello', 'שלום') + (P.name ? ' ' + P.name : '')),
      h('p', {class: 'plus-hello-sub'}, tr('How are you feeling today?', 'איך אתה מרגיש היום?')),
      moodRow()
    );
    const grid = h('div', {class: 'plus-home-grid'});
    HOME_BUTTONS.forEach(b => {
      const [title, detail, why] = he() ? b.he : b.en;
      grid.append(h('button', {type: 'button', class: 'plus-home-btn', 'data-home': b.id, title: why, onclick: () => homeAction(b.id)},
        illu(b.illu, 52, 'plus-home-illu', b.icon), h('strong', {}, title, detail ? h('span', {class: 'plus-home-detail'}, detail) : null), h('span', {class: 'plus-sr'}, why)));
    });
    plusHome.append(grid);
    if (!P.infoOnly) plusHome.append(h('button', {type: 'button', class: 'plus-chat-entry', onclick: () => goChat()}, h('span', {}, tr('Talk with the Companion', 'דבר עם המלווה')), icon('chat')));
    // Calm home (progressive disclosure): one "today" item, one short shortcut list, everything else folded.
    put(plusHome, todayRow());
    const est = P.hidden.includes('home:estimate') ? null : estimateRow();
    const slim = slimRow;
    const shortcuts = h('div', {class: 'plus-slim-list', role: 'list'},
      est ? est : null,
      PAGES.cv ? slim('pen', tr('Build my CV', 'בנה קורות חיים'), tr('Guided, with a clean PDF', 'מודרך, עם PDF נקי'), () => showPage('cv')) : null,
      PAGES.interviewsim ? slim('talk', tr('Interview simulator', 'סימולטור ראיון עבודה'), tr('Practice out loud, get feedback right away', 'מתרגלים בקול, מקבלים משוב מיד'), () => showPage('interviewsim')) : null,
      PAGES.tools ? slim('checklist', tr('My tools', 'הכלים שלי'), tr('Dates, deposit, phone numbers, scholarships', 'מועדים, פיקדון, טלפונים, מלגות'), () => showPage('tools')) : null);
    plusHome.append(shortcuts);
    const faq = quickChips();
    if (faq) plusHome.append(h('details', {class: 'plus-home-more', open: homeFaqOpen || undefined, ontoggle: e => { homeFaqOpen = e.currentTarget.open; }}, h('summary', {}, h('span', {}, tr('Common questions', 'שאלות נפוצות')), h('span', {class: 'plus-right-chev', 'aria-hidden': 'true'})), faq));
    const one = backupCard() || recommendationCard();
    if (one) plusHome.append(h('div', {class: 'plus-cards'}, one));
    plusHome.append(distressBtn(), privacyLine());
  }

  /* -------- small step for today + progress -------- */
  function todayStepCard() {
    const card = h('div', {class: 'plus-card', id: 'plusToday'});
    card.append(h('h2', {}, tr('One small step for today', 'צעד קטן אחד להיום')));
    const p = journey(), t = todayStr();
    const actions = p ? p.actions : [];
    const step = P.todayStep && P.todayStep.date === t && actions.find(a => a.id === P.todayStep.id);
    if (step) {
      const done = step.status === 'done';
      card.append(h('p', {class: done ? 'plus-done' : ''}, (done ? '✓ ' : '') + step.title),
        btn(done ? tr('Mark as not done', 'לסמן כלא בוצע') : tr('Done!', 'עשיתי!'), () => {
          try { Journey().upsert('actions', {...step, status: done ? 'todo' : 'done'}); toast(done ? tr('Marked as not done', 'סומן כלא בוצע') : tr('Well done! Step completed ✓', 'כל הכבוד! הצעד הושלם ✓')); } catch (e) { toast(tr('Could not update: ', 'לא הצלחתי לעדכן: ') + e.message); }
          if (!done) todayOpen = false;
          renderHome();
        }, 'plus-btn primary'),
        btn(tr('Change', 'להחליף'), () => { P.todayStep = null; store(); renderHome(); }, 'plus-link'));
    } else {
      const input = h('input', {type: 'text', maxlength: '160', id: 'plusTodayInput', placeholder: tr('e.g. check my grant in the personal area', 'למשל: לבדוק את המענק באזור האישי'), 'aria-label': tr('Small step for today', 'צעד קטן להיום')});
      card.append(h('p', {class: 'plus-muted'}, tr('Something you can do in 15 minutes. Skipping is fine too.', 'משהו שאפשר לעשות ב-15 דקות. גם לדלג זה בסדר.')), input,
        h('div', {class: 'plus-choices'}, stepIdeas().slice(0, 4).map(idea => btn(idea, () => { input.value = idea; input.focus(); }, 'plus-chip'))),
        h('div', {class: 'plus-row'}, btn(tr('Save step', 'שמירת הצעד'), () => {
          const v = input.value.trim(); if (!v) { input.focus(); return; }
          const rec = saveAction(v, tr('Small step for today', 'צעד קטן להיום'), t);
          if (rec) { P.todayStep = {date: t, id: rec.id}; store(); renderHome(); }
        }, 'plus-btn primary'), suggestStepButton(input)));
    }
    if (actions.length) {
      const done = actions.filter(a => a.status === 'done').length;
      card.append(h('div', {class: 'plus-progress', role: 'img', 'aria-label': tr(done + ' of ' + actions.length + ' steps done', done + ' מתוך ' + actions.length + ' צעדים')},
        h('div', {class: 'plus-progress-fill', style: 'width:' + Math.round(done / actions.length * 100) + '%'})),
        h('p', {class: 'plus-muted'}, tr(done + ' of ' + actions.length + ' steps done', done + ' מתוך ' + actions.length + ' צעדים הושלמו')));
    }
    return card;
  }
  function stepIdeas() {
    const m = monthsSinceDischarge();
    const early = he() ? ['לבדוק שהמענק הגיע לחשבון', 'לבקש נקודות זיכוי (טופס 101)', 'לבדוק כמה יש בפיקדון', 'לעדכן כתובת רשמית']
      : ['Check the grant reached my account', 'Ask for tax credit points (form 101)', 'Check my deposit balance', 'Update my official address'];
    const later = he() ? ['לבדוק זכאות לעבודה מועדפת', 'לתכנן שימוש בפיקדון', 'לקבוע שיחה במרכז צעירים', 'לכתוב 3 שורות על מה שעשיתי בשירות']
      : ['Check preferred-work eligibility', 'Plan how to use my deposit', 'Book a talk at a youth center', 'Write 3 lines about what I did in service'];
    return m !== null && m >= 2 ? later.concat(early) : early.concat(later);
  }
  function suggestStepButton(input) {
    const ideas = he()
      ? ['לבדוק את המענק באזור האישי', 'לבדוק כמה יש בפיקדון', 'לשלוח טופס 101 למעסיק', 'לקבוע שיחה במרכז צעירים', 'לכתוב 3 שורות על מה שעשיתי בשירות', 'לצאת להליכה של 20 דקות']
      : ['Check my grant in the personal area', 'Check my deposit balance', 'Give form 101 to my employer', 'Book a talk at a youth center', 'Write 3 lines about what I did in service', 'Take a 20-minute walk'];
    return btn(tr('Suggest one', 'תציע לי'), () => { input.value = ideas[Math.floor(Math.random() * ideas.length)]; input.focus(); }, 'plus-link');
  }

  /* -------- personal recommendation -------- */
  function recentUserText() {
    try { return (S.messages || []).filter(m => m.role === 'user').slice(-12).map(m => m.text).join(' '); } catch (_) { return ''; }
  }
  function recommendationCard() {
    const text = recentUserText() + ' ' + (P.pressing || '');
    const p = journey();
    const confirmed = p ? p.skills.filter(x => x.confirmed && x.evidence).length + (p.lifeSkills || []).length + (p.manualSkills || []).length : 0;
    const card = (title, body, actions) => h('div', {class: 'plus-card plus-rec'}, h('strong', {}, title), h('p', {}, body), h('div', {class: 'plus-row'}, actions));
    if (/studies|לימוד|תואר|ממדים|study/i.test(text))
      return card(tr('You mentioned studies', 'ראיתי שדיברת על לימודים'),
        tr('Here are options that may fit — check Mimadim, preparatory programs and scholarships.', 'הנה אפשרויות שאולי מתאימות לך — ממדים ללימודים, מכינות ומלגות.') + (confirmed ? ' ' + tr('The Companion can also match them to your confirmed skills.', 'המלווה יכול גם להתאים אותן לכישורים שאישרת.') : ''),
        [btn(tr('Study options', 'אפשרויות לימוד'), () => showPage('studies')), confirmed && !P.infoOnly ? btn(tr('Match to my skills', 'התאמה לכישורים שלי'), () => openTopic('study', tr('Suggest study options that fit my confirmed skills.', 'הצע לי אפשרויות לימוד שמתאימות לכישורים שאישרתי.')), 'plus-link') : null]);
    if (/work|עבודה|משרה|קורות|job|cv/i.test(text) || (confirmed && !(p && p.cvs.length)))
      return card(confirmed ? tr('You have ' + confirmed + ' confirmed skills', 'יש לך ' + confirmed + ' כישורים מאושרים') : tr('Looking for work?', 'מחפש עבודה?'),
        confirmed ? tr('Want a first CV draft built from them?', 'רוצה טיוטת קורות חיים ראשונה שנבנית מהם?') : tr('Start with your skills, a CV and preferred work.', 'אפשר להתחיל מהכישורים, קורות חיים ועבודה מועדפת.'),
        [!P.infoOnly ? btn(tr('Draft my CV', 'טיוטת קורות חיים'), () => openTopic('cv', tr('Draft a CV from my confirmed skills, without inventing anything.', 'הכן טיוטת קורות חיים מהכישורים שאישרתי, בלי להמציא פרטים.'))) : null, btn(tr('Work page', 'עמוד עבודה'), () => showPage('work'), 'plus-link')]);
    if (/money|כסף|מענק|פיקדון|grant|deposit/i.test(text))
      return card(tr('Money questions', 'שאלות על כסף'), tr('Grant, deposit, tax points and preferred work — in one page.', 'מענק, פיקדון, נקודות זיכוי ועבודה מועדפת — בעמוד אחד.'), [btn(tr('Money page', 'עמוד כסף'), () => showPage('money'))]);
    if (/feel|רגש|מרגיש|feelings/i.test(text))
      return card(tr('How are you, really?', 'מה שלומך באמת?'), tr('A short check-in can help.', 'בדיקה קצרה יכולה לעזור.'), [btn(tr('Check in', 'בדיקה קצרה'), () => showPage('feel'))]);
    if (!confirmed)
      return card(tr('What did the army teach you that employers want?', 'מה למדת בצבא שמעסיקים מחפשים?'), tr('A short questionnaire turns your service into words that work on a CV.', 'שאלון קצר שהופך את השירות שלך למילים שעובדות בקורות חיים.'), [h('a', {class: 'plus-btn', href: './skills-business.html?lang=' + S.lang}, tr('36 skills assessment', 'שאלון 36 הכישורים'))]);
    return null;
  }

  /* -------- backup reminder -------- */
  function backupCard() {
    const p = journey();
    const has = p && (p.goals.length + p.actions.length + p.education.length + p.cvs.length + p.skills.length) > 0;
    const last = P.backupRemindedAt ? Date.parse(P.backupRemindedAt) : 0;
    if (!has || P.days.length < 3 || Date.now() - last < 14 * 864e5) return null;
    return h('div', {class: 'plus-card plus-soft'}, h('strong', {}, tr('Keep your journey safe', 'שמירה על המסע שלך')),
      h('p', {}, tr('Everything is saved only on this device. A password-protected backup lets you restore it if the phone changes.', 'הכול נשמר רק במכשיר הזה. גיבוי מוצפן בסיסמה יאפשר לשחזר אם מחליפים טלפון.')),
      h('div', {class: 'plus-row'}, h('a', {class: 'plus-btn primary', href: journeyUrl('privacy'), onclick: () => { P.backupRemindedAt = new Date().toISOString(); store(); }}, tr('Back up now', 'לגיבוי עכשיו')),
        btn(tr('Later', 'אחר כך'), () => { P.backupRemindedAt = new Date().toISOString(); store(); renderHome(); }, 'plus-link')));
  }

  /* -------- what's new -------- */
  const WHATS_NEW_HE = ['מסך בית חדש עם 4 כפתורים וסרגל ניווט תחתון', 'עמודי זכויות, כסף, לימודים, עבודה, טיולים ומשפחה — עם חיפוש', 'כפתור "אני לא מרגיש בסדר" ועזרה אנושית', 'צעד קטן להיום, מעקב מצב רוח ורצף ימים', 'שמירה מהשיחה למסע, סיכום שיחה וחיפוש בשיחות', 'מצב כהה, גודל טקסט ומצב "מידע בלבד"'];
  const WHATS_NEW_EN = ['New home screen with 4 buttons and a bottom navigation bar', 'Rights, money, studies, work, travel and family pages — with search', '"I\'m not feeling okay" button and human help', 'Small step for today, mood check and day streak', 'Save from chat to My Journey, chat summary and chat search', 'Dark mode, text size and information-only mode'];
  function whatsNewList() { return h('ul', {class: 'plus-list'}, (he() ? WHATS_NEW_HE : WHATS_NEW_EN).map(x => h('li', {}, x))); }
  function whatsNewCard() {
    if (P.seenVersion === VERSION) return null;
    return h('div', {class: 'plus-card plus-new'}, h('strong', {}, tr("What's new", 'מה חדש')), whatsNewList(),
      btn(tr('Got it', 'הבנתי'), () => { P.seenVersion = VERSION; store(); renderHome(); }, 'plus-btn'));
  }

  /* ================================================================
     PAGES
     ================================================================ */
  const section = (title, ...kids) => h('section', {class: 'plus-card'}, h('h2', {}, title), ...kids);
  const disclaimer = () => h('p', {class: 'plus-disclaimer', role: 'note'}, icon('info', 'plus-inline-ico'), ' ' + (KB ? (he() ? KB.DISCLAIMER_HE : KB.DISCLAIMER_EN) : '') +
    (KB && KB.data ? ' ' + tr('Knowledge base updated: ', 'מאגר הידע עודכן: ') + KB.data.metadata.last_updated + '.' : ''));
  const hebrewNote = () => null; // the knowledge base now has a full English version
  const askButton = (topic, q) => P.infoOnly ? null : btn(tr('Ask the Companion about this', 'לשאול את המלווה על זה'), () => openTopic(topic, q), 'plus-btn');
  const list = items => h('ul', {class: 'plus-list'}, (items || []).map(x => h('li', {}, x)));
  const hideable = (id, node) => { if (P.hidden.includes(id)) return null; return node; };
  function notRelevantButton(id, label) {
    return btn(tr('Not relevant to me', 'לא רלוונטי לי'), () => {
      if (!P.hidden.includes(id)) P.hidden = [...P.hidden, id]; store();
      toast(tr('Hidden. You can restore it in Help.', 'הוסתר. אפשר להחזיר בעזרה.') + (label ? ' (' + label + ')' : ''));
      showPage(pageStack.pop() || 'rights');
    }, 'plus-link');
  }

  function rightCard(c) {
    const RIGHT_ILLU = {discharge_grant: 'banknote', personal_deposit: 'piggy', tax_credit_points: 'percent', preferred_work_grant: 'briefcase', public_transport_free: 'bus', arnona: 'house', bituach_leumi_exemption: 'shield', unemployment: 'coins', income_support: 'coins', mimadim_lelimudim: 'cap', lone_soldiers_extra: 'users'};
    const RIGHT_ICON = {discharge_grant: ['banknote', 'money'], personal_deposit: ['piggy', 'money'], tax_credit_points: ['percent', 'money'], preferred_work_grant: ['briefcase', 'work'], public_transport_free: ['bus', 'transport'], arnona: ['building', 'home'], bituach_leumi_exemption: ['shield', 'health'], unemployment: ['handcoins', 'money'], income_support: ['handcoins', 'money'], mimadim_lelimudim: ['cap', 'study'], lone_soldiers_extra: ['users', 'journey']};
    const e = P.service && P.monthsServed ? KB.estimate(P.service, P.monthsServed, P.gender) : null;
    const key = c.id === 'discharge_grant' && e && e.grant ? '≈ ' + money(e.grant) : c.id === 'personal_deposit' && e && e.deposit ? '≈ ' + money(e.deposit)
      : c.id === 'preferred_work_grant' && KB.data.rights_and_benefits.preferred_work_grant.amount_2026_number ? money(KB.data.rights_and_benefits.preferred_work_grant.amount_2026_number) : '';
    const first = c.lines[0] || '';
    const details = h('details', {class: 'plus-card plus-right plus-right-fold', 'data-right': c.id},
      h('summary', {class: 'plus-right-sum'}, (RIGHT_ILLU[c.id] ? illu(RIGHT_ILLU[c.id], 44, 'plus-right-illu') : icon((RIGHT_ICON[c.id] || ['info'])[0], 'plus-right-ico topic-' + ((RIGHT_ICON[c.id] || [, 'tasks'])[1]))),
        h('span', {class: 'plus-right-head'}, h('strong', {}, c.title), h('small', {}, key || (first.length > 70 ? first.slice(0, 68) + '…' : first))),
        icon('chevron', 'plus-right-chev')));
    const box = h('div', {class: 'plus-right-body'});
    details.append(box);
    c.lines.forEach(l => box.append(h('p', {}, l)));
    if (c.rates && c.rates.length) {
      const mine = KB.SERVICE_RATE_KEY[P.service];
      const table = h('table', {class: 'plus-table'}, h('caption', {}, tr('You may be entitled to — per month of service, by service type', 'ייתכן שמגיע לך — לכל חודש שירות, לפי סוג שירות')),
        h('tbody', {}, c.rates.map(r => h('tr', {class: r.key === mine ? 'plus-mine' : ''}, h('th', {scope: 'row'}, r.label + (r.key === mine ? tr(' (you)', ' (אתה)') : '')), h('td', {}, KB.fmtMoney(r.value))))));
      box.append(table);
      if (c.examples && c.examples.length) box.append(h('p', {class: 'plus-muted'}, tr('Examples: ', 'דוגמאות: ') + c.examples.join(' · ')));
    }
    if (c.list && c.list.length) box.append(h('strong', {}, c.listTitle || ''), list(c.list));
    if (c.warning) box.append(h('p', {class: 'plus-warning', role: 'note'}, icon('warn', 'plus-inline-ico'), ' ' + c.warning));
    const src = sourceLine(c.source); if (src) box.append(src);
    const row = h('div', {class: 'plus-row'});
    const officialUrl = c.url || (c.link ? KB.officialLink(c.link) : '');
    if (officialUrl) row.append(h('a', {class: 'plus-btn primary', href: officialUrl, target: '_blank', rel: 'noopener noreferrer'}, tr('Official site ↗', 'לאתר הרשמי ↗')));
    (c.extraLinks || []).forEach(x => row.append(h('a', {class: 'plus-btn', href: x.url, target: '_blank', rel: 'noopener noreferrer'}, x.label + ' ↗')));
    row.append(btn(tr('Save to My Journey', 'לשמור במסע'), () => saveAction(tr('Check: ', 'לבדוק: ') + c.title, (officialUrl ? officialUrl + '\n' : '') + c.lines.join('\n'))));
    const ask = askButton('rights', tr('Explain "' + c.title + '" and what I should check.', 'תסביר לי על ' + c.title + ' ומה כדאי לי לבדוק.')); if (ask) row.append(ask);
    row.append(notRelevantButton('right:' + c.id, c.title));
    box.append(row);
    return details;
  }

  function personalBanner() {
    const parts = [];
    if (P.service) parts.push(tr('Service: ', 'שירות: ') + (KB.SERVICE_LABEL[P.service] || P.service));
    if (P.lone) parts.push(tr('lone soldier', 'חייל/ת בודד/ה'));
    if (P.reservist) parts.push(tr('reservist', 'משרת/ת מילואים'));
    const m = monthsSinceDischarge(); if (m !== null) parts.push(tr(m + ' months since discharge', m + ' חודשים מהשחרור'));
    if (!parts.length) return h('p', {class: 'plus-muted'}, tr('Tip: answer 3 quick questions in Help → "My details" to highlight what is relevant to you.', 'טיפ: אפשר לענות על 3 שאלות קצרות בעזרה → "הפרטים שלי" כדי להדגיש מה רלוונטי לך.'));
    return h('p', {class: 'plus-soft plus-pill'}, parts.join(' · '));
  }

  function checklist() {
    const G = KB.data && KB.data.practical_guides; if (!G) return null;
    const m = monthsSinceDischarge();
    const early = m === null || m < 2;
    const year = !early && m >= 6 && G.first_year;
    const items = year ? G.first_year : early ? G.first_30_days : G.first_6_months;
    return section(year ? tr('First year', 'השנה הראשונה') : early ? tr('First 30 days', '30 הימים הראשונים') : tr('First 6 months', '6 החודשים הראשונים'),
      h('p', {class: 'plus-muted'}, tr('Tap a line to save it as a step.', 'אפשר ללחוץ על שורה כדי לשמור אותה כצעד.')),
      h('ul', {class: 'plus-checklist'}, items.map(x => h('li', {}, btn('＋ ' + x, () => saveAction(x, tr('From the checklist', 'מתוך רשימת הבדיקה')), 'plus-link')))));
  }

  function specialGroups() {
    const sg = KB.data && KB.data.special_groups; if (!sg) return null;
    const box = section(tr('Special paths', 'מסלולים מיוחדים'));
    const order = [['lone_soldiers', tr('Lone soldiers', 'חיילים בודדים'), P.lone], ['reservists', tr('Reservists', 'משרתי מילואים'), P.reservist], ['national_service', tr('National service', 'שירות לאומי'), P.service === 'national'], ['olim', tr('New immigrants', 'עולים חדשים'), false]];
    order.sort((a, b) => Number(b[2]) - Number(a[2]));
    for (const [key, title, mine] of order) {
      if (P.hidden.includes('group:' + key) || !sg[key]) continue;
      const d = h('details', {class: 'plus-details', open: mine || undefined}, h('summary', {}, title + (mine ? tr(' — relevant to you', ' — רלוונטי לך') : '')));
      if (sg[key].extra) d.append(list(sg[key].extra));
      if (sg[key].notes) d.append(h('p', {}, sg[key].notes));
      if (key === 'lone_soldiers' && KB.data.housing) d.append(h('p', {}, KB.data.housing.lone_soldiers_extra));
      if (key === 'reservists') d.append(list(KB.GUIDES.reservists));
      d.append(h('div', {class: 'plus-row'}, notRelevantButton('group:' + key, title)));
      box.append(d);
    }
    return box;
  }

  function officialLinks() {
    return section(tr('Official forms and sites', 'קישורים רשמיים'),
      h('ul', {class: 'plus-list'}, KB.GUIDES.officialLinksInfo.map(x => h('li', {},
        h('a', {href: KB.officialLink(x.key), target: '_blank', rel: 'noopener noreferrer'}, x.title + ' ↗'), ' — ', x.why))));
  }

  function faqSection(items) {
    if (!items.length) return null;
    return section(tr('Common questions', 'שאלות נפוצות'), ...items.map(f => h('details', {class: 'plus-details'}, h('summary', {}, f.question), h('p', {}, f.answer))));
  }

  const PAGES = {
    /* ----- How I feel ----- */
    feel() {
      const wrap = h('div');
      const t = todayStr(), todays = P.moods.find(m => m.d === t);
      put(wrap, h('h1', {class: 'plus-title'}, tr('How are you feeling today?', 'איך אתה מרגיש היום?')),
        h('p', {class: 'plus-soft plus-pill'}, KB && KB.data ? KB.data.emotional_support.normalization : tr('Many people feel empty, confused or without direction after discharge. That is completely normal.', 'הרבה אנשים מרגישים ריקים, מבולבלים או חסרי כיוון אחרי השחרור. זה נורמלי לגמרי.')));
      const faces = MOODS.map(m => face(m));
      const row = h('div', {class: 'plus-mood', role: 'group', 'aria-label': tr('Mood from 1 to 5', 'מצב רוח מ-1 עד 5')});
      faces.forEach((f, i) => row.append(h('button', {type: 'button', class: 'plus-mood-btn', 'aria-pressed': String(todays && todays.v === i + 1), 'aria-label': String(i + 1), onclick: () => {
        P.moods = [...P.moods.filter(m => m.d !== t), {d: t, v: i + 1}].slice(-90); store(); showPage('feel', false);
        if (false) toast(tr('Thank you for sharing. Human help is below.', 'תודה ששיתפת. עזרה אנושית נמצאת למטה.'));
      }}, f)));
      put(wrap, section(tr('Quick check (optional)', 'בדיקה קצרה (לא חובה)'), row, todays ? moodResponse(todays) : null, moodTrend(),
        h('p', {class: 'plus-muted'}, tr('This is just for you, not a diagnosis. You can skip it.', 'זה רק בשבילך, לא אבחון. אפשר לדלג.'))));
      if (!P.infoOnly) put(wrap, section(tr('What do you need right now?', 'מה אתה צריך עכשיו?'),
        h('div', {class: 'plus-row'}, btn(tr('I just want to talk', 'אני רק רוצה לדבר'), () => goChat('talk'), 'plus-btn primary'),
          btn(tr('I want to do something practical', 'אני רוצה לעשות משהו מעשי'), () => goChat('practical'), 'plus-btn'))));
      const sentences = KB && KB.data && KB.data.emotional_support.normalization_sentences;
      if (sentences) put(wrap, section(tr('Good to know', 'כדאי לדעת'), list(sentences)));
      put(wrap, section(tr('Common after discharge', 'דברים שמוכרים לרבים אחרי השחרור'), list(KB && KB.data ? KB.data.emotional_support.common_challenges : [])),
        distressBtn(),
        h('div', {class: 'plus-row'}, btn(tr('Relationships & family', 'מערכות יחסים ומשפחה'), () => showPage('family'), 'plus-link')));
      return wrap;
    },
    /* ----- Distress: gentle, calm, human help first ----- */
    distress() {
      const wrap = h('div');
      put(wrap, h('h1', {class: 'plus-title'}, tr("It's okay not to be okay", 'זה בסדר לא להיות בסדר')),
        h('p', {}, tr("Thank you for checking in. You don't have to handle this alone. Talking to a person can help, even when it feels hard to start.", 'תודה שעצרת לבדוק. אתה לא חייב להתמודד עם זה לבד. שיחה עם אדם יכולה לעזור, גם כשקשה להתחיל.')),
        h('p', {class: 'plus-soft plus-pill'}, tr('If you or someone else is in immediate danger — call 101 (MDA) or 100 (police) now.', 'אם אתה או מישהו אחר בסכנה מיידית — חייג עכשיו 101 (מד"א) או 100 (משטרה).')));
      put(wrap, humanHelpSection(), PAGES.contacts ? h('div', {class: 'plus-row'}, btn(tr('All support numbers — tap to call', 'כל מספרי התמיכה — לחיצה לחיוג'), () => showPage('contacts'), 'plus-btn primary')) : null);
      if (!P.infoOnly) put(wrap, section(tr('Prefer to write first?', 'מעדיף לכתוב קודם?'),
        h('p', {}, tr('You can write to the Companion. It is not a person and does not replace help, but it will listen and help you find the next step.', 'אפשר לכתוב למלווה. הוא לא אדם ולא מחליף עזרה, אבל הוא יקשיב ויעזור למצוא את הצעד הבא.')),
        btn(tr('Write to the Companion', 'לכתוב למלווה'), () => openTopic('support'), 'plus-btn')));
      put(wrap, h('p', {class: 'plus-muted'}, tr('This app does not contact anyone and is not monitored.', 'האפליקציה לא פונה לאף אחד ואינה מנוטרת.')));
      return wrap;
    },
    /* ----- Rights & benefits ----- */
    rights() {
      const wrap = h('div');
      put(wrap, h('h1', {class: 'plus-title plus-sr'}, tr('What am I entitled to?', 'מה מגיע לי?')), rightsSummary(), hebrewNote(), grantVsDeposit());
      const input = h('input', {type: 'search', id: 'plusRightsSearch', placeholder: tr('Search: grant, deposit, studies…', 'חיפוש: מענק, פיקדון, לימודים…'), 'aria-label': tr('Search rights and benefits', 'חיפוש בזכויות והטבות')});
      const results = h('div', {id: 'plusRightsResults', 'aria-live': 'polite'});
      const draw = () => {
        const {cards, faq} = KB.search(input.value);
        results.replaceChildren(...cards.filter(c => !P.hidden.includes('right:' + c.id)).map(rightCard));
        if (!results.children.length) results.append(h('p', {class: 'plus-muted'}, tr('No matches. Try another word or ask the Companion.', 'לא נמצאו תוצאות. אפשר לנסות מילה אחרת או לשאול את המלווה.')));
        const f = faqSection(faq); if (f) results.append(f);
      };
      input.addEventListener('input', draw);
      put(wrap, h('div', {class: 'plus-search'}, input), checklist(), results, specialGroups(), officialLinks(),
        h('div', {class: 'plus-row'}, askButton('rights'), PAGES.deadlines ? btn(tr('My dates', 'המועדים שלי'), () => showPage('deadlines'), 'plus-btn') : null, PAGES.deposit ? btn(tr('Deposit planner', 'מתכנן פיקדון'), () => showPage('deposit'), 'plus-btn') : null), disclaimer());
      draw();
      return wrap;
    },
    /* ----- Work / studies / money hub ----- */
    practical() {
      const tiles = [
        ['tools', 'checklist', tr('My tools', 'הכלים שלי'), tr('Dates, planners, numbers', 'מועדים, מתכננים, טלפונים')],
        ['money', 'coins', tr('Money', 'כסף'), tr('Grant, deposit, tax points, budget', 'מענק, פיקדון, נקודות זיכוי, תקציב')],
        ['work', 'briefcase', tr('Work & CV', 'עבודה וקורות חיים'), tr('Preferred work, CV, interviews', 'עבודה מועדפת, קורות חיים, ראיונות')],
        ['studies', 'cap', tr('Studies', 'לימודים'), tr('Mimadim, mechina, bagrut, scholarships', 'ממדים, מכינה, בגרויות, מלגות')],
        ['skills', 'award', tr('My skills', 'הכישורים שלי'), tr('36-skill assessment and translation', 'שאלון 36 כישורים ותרגום לאזרחות')],
        ['travel', 'map', tr('Travel', 'טיולים ונסיעות'), tr('Budget, insurance, funding', 'תקציב, ביטוח, מימון')],
        ['family', 'house', tr('Relationships & family', 'מערכות יחסים ומשפחה'), tr('Coming back home', 'החזרה הביתה')],
        ['feel', 'talk', tr('Emotional support', 'תמיכה רגשית'), tr('Talk or find human help', 'לדבר או למצוא עזרה אנושית')]
      ].filter(t => !P.hidden.includes('tile:' + t[0]));
      const wrap = h('div', {}, h('h1', {class: 'plus-title'}, tr('Work / studies / money', 'עבודה / לימודים / כסף')));
      const grid = h('div', {class: 'plus-tiles'});
      tiles.forEach(([id, icon, title, why]) => grid.append(h('button', {type: 'button', class: 'plus-tile', onclick: () => id === 'skills' ? (location.href = './skills-business.html?lang=' + S.lang) : showPage(id)},
        illu(icon, 40, 'plus-tile-ill'), h('strong', {}, title), h('small', {}, why))));
      put(wrap, grid, decisionTree());
      return wrap;
    },
    money() {
      const cards = KB.rightsCards().filter(c => c.cat === 'money' || c.id === 'preferred_work_grant').filter(c => !P.hidden.includes('right:' + c.id));
      return h('div', {}, h('h1', {class: 'plus-title plus-sr'}, tr('Money', 'כסף')), rightsSummary(), grantVsDeposit(),
        h('h2', {class: 'plus-group-title'}, tr('Details — tap to open', 'הפרטים — לוחצים כדי לפתוח')), ...cards.map(rightCard),
        h('details', {class: 'plus-card plus-right-fold'}, h('summary', {class: 'plus-right-sum'}, illu('coins', 44, 'plus-right-illu'), h('span', {class: 'plus-right-head'}, h('strong', {}, tr('Saving and budget tips', 'טיפים לחיסכון ותקציב')), h('small', {}, tr('General tips, not financial advice.', 'טיפים כלליים, לא ייעוץ פיננסי.'))), icon('chevron', 'plus-right-chev')),
          h('div', {class: 'plus-right-body'}, list(KB.GUIDES.savingsTips))),
        h('div', {class: 'plus-row'}, PAGES.tools ? btn(tr('Grant planner', 'מתכנן מענק'), () => showPage('grantplan'), 'plus-btn') : null, PAGES.tools ? btn(tr('Deposit planner', 'מתכנן פיקדון'), () => showPage('deposit'), 'plus-btn') : null,
          askButton('money', tr('Help me plan a simple budget for my grant.', 'תעזור לי לתכנן תקציב פשוט למענק שלי.'))), disclaimer());
    },
    work() {
      const W = KB.data && KB.data.work_and_career;
      const pw = KB.rightsCards().find(c => c.id === 'preferred_work_grant');
      const kit = (ill, title, sub, id) => PAGES[id] ? h('button', {type: 'button', class: 'plus-kit', onclick: () => showPage(id)}, illu(ill, 46), h('b', {}, title), h('small', {}, sub)) : null;
      const wrap = h('div', {}, h('h1', {class: 'plus-title'}, tr('Work & CV', 'עבודה וקורות חיים')),
        h('div', {class: 'plus-kits'}, kit('pen', tr('Build my CV', 'בנה קורות חיים'), tr('Guided + clean PDF', 'מודרך + PDF נקי'), 'cv'), kit('talk', tr('Interview simulator', 'סימולטור ראיון'), tr('Practice with feedback', 'תרגול עם משוב'), 'interviewsim')),
        hebrewNote(), disclaimer());
      if (pw && !P.hidden.includes('right:' + pw.id)) put(wrap, rightCard(pw));
      put(wrap, section(tr('Preferred work — examples', 'עבודה מועדפת — דוגמאות'), h('p', {}, tr('Approved sectors often include:', 'ענפים שמאושרים לרוב:')), list((KB.data.rights_and_benefits.preferred_work_grant || {}).sectors),
        h('p', {class: 'plus-muted'}, tr('Check the current list of approved employers on the official site before you start.', 'לפני שמתחילים — לבדוק באתר הרשמי את רשימת המעסיקים המאושרים העדכנית.'))));
      put(wrap, section(tr('Translate your role into civilian language', 'תרגום התפקיד לשפה אזרחית'),
        h('div', {class: 'plus-roles'}, KB.GUIDES.roleTranslations.map(r => h('details', {class: 'plus-details'}, h('summary', {}, r.role), h('p', {}, h('strong', {}, tr('Strengths: ', 'חוזקות: ')), r.civilian), h('p', {}, h('strong', {}, tr('Directions: ', 'כיוונים: ')), r.jobs)))),
        h('p', {class: 'plus-muted'}, tr('Suggestions only — keep what matches your real experience.', 'הצעות בלבד — לשמור רק מה שמתאים לניסיון האמיתי שלך.'))));
      put(wrap, section(tr('CV tips', 'טיפים לקורות חיים'), list(W && W.cv_tips)));
      put(wrap, section(tr('Ready CV examples by role', 'דוגמאות קורות חיים לפי תפקיד'), h('p', {class: 'plus-muted'}, KB.GUIDES.cvNote),
        ...KB.GUIDES.cvExamples.map(x => h('details', {class: 'plus-details'}, h('summary', {}, x.role), h('p', {}, x.summary), list(x.bullets),
          btn(tr('Copy', 'העתקה'), () => copy(x.summary + '\n' + x.bullets.map(b => '• ' + b).join('\n')), 'plus-link')))));
      put(wrap, interviewSection());
      put(wrap, section(tr('Free counseling', 'ייעוץ חינם'), h('p', {}, W ? W.counseling : '')));
      put(wrap, h('div', {class: 'plus-row'}, askButton('cv', tr('Help me build my CV from my real experience.', 'תעזור לי לבנות קורות חיים מהניסיון האמיתי שלי.')),
        PAGES.cv ? btn(tr('Build my CV', 'בנה קורות חיים'), () => showPage('cv'), 'plus-btn primary') : null,
        PAGES.interviewsim ? btn(tr('Interview simulator', 'סימולטור ראיון'), () => showPage('interviewsim'), 'plus-btn primary') : null,
        h('a', {class: 'plus-btn', href: './skills-business.html?lang=' + S.lang}, tr('36 skills assessment', 'שאלון 36 הכישורים')),
        h('a', {class: 'plus-btn', href: journeyUrl('cvs')}, tr('My CV drafts', 'טיוטות קורות החיים שלי'))));
      return wrap;
    },
    interview() { return h('div', {}, h('h1', {class: 'plus-title'}, tr('Talking about your service in a job interview', 'איך לדבר על השירות בראיון עבודה')), PAGES.interviewsim ? btn(tr('Practice in the interview simulator →', 'לתרגל בסימולטור הראיון ←'), () => showPage('interviewsim'), 'plus-btn primary') : null, interviewSection()); },
    studies() {
      const cards = KB.rightsCards().filter(c => c.cat === 'studies').filter(c => !P.hidden.includes('right:' + c.id));
      const dep = KB.rightsCards().find(c => c.id === 'personal_deposit');
      return h('div', {}, h('h1', {class: 'plus-title'}, tr('Studies', 'לימודים')), hebrewNote(), disclaimer(), ...cards.map(rightCard),
        dep ? section(tr('Paying with the deposit', 'מימון מהפיקדון'), h('p', {}, tr('The personal deposit can be used for studies, training and psychometric prep.', 'את הפיקדון האישי אפשר לממש ללימודים, הכשרה מקצועית והכנה לפסיכומטרי.')), btn(tr('Deposit details', 'פרטי הפיקדון'), () => showPage('money'), 'plus-link')) : null,
        h('div', {class: 'plus-row'}, askButton('study', tr('Help me compare study options that fit me.', 'תעזור לי להשוות אפשרויות לימוד שמתאימות לי.')),
          h('a', {class: 'plus-btn', href: journeyUrl('education')}, tr('My study plans', 'תוכניות הלימוד שלי'))));
    },
    travel() {
      const T = KB.data && KB.data.travel;
      return h('div', {}, h('h1', {class: 'plus-title'}, tr('Travel', 'טיולים ונסיעות')), hebrewNote(),
        section(tr('Funding', 'מימון'), h('p', {}, T.funding)),
        section(tr('Budget and preparation', 'תקציב והכנה'), list(T.budget_tips)),
        section(tr('Common destinations', 'יעדים נפוצים'), h('p', {}, T.common_destinations.join(' · '))),
        section(tr('Safety', 'בטיחות'), h('p', {}, T.safety)),
        disclaimer(),
        h('div', {class: 'plus-row'}, askButton('travel', tr('Help me plan a trip budget alongside my other plans.', 'תעזור לי לתכנן תקציב לטיול לצד התוכניות האחרות שלי.')),
          btn(tr('Save "check travel insurance"', 'לשמור "לבדוק ביטוח נסיעות"'), () => saveAction(tr('Check travel insurance (incl. extreme sports and rescue)', 'לבדוק ביטוח נסיעות (כולל ספורט אתגרי וחילוץ)'), ''), 'plus-link')));
    },
    family() {
      const F = KB.GUIDES.family;
      return h('div', {}, h('h1', {class: 'plus-title'}, tr('Relationships & family', 'מערכות יחסים ומשפחה')), hebrewNote(),
        h('p', {class: 'plus-soft plus-pill'}, F.intro), section(tr('Things that often help', 'דברים שלרוב עוזרים'), list(F.points)),
        h('div', {class: 'plus-row'}, askButton('family'), btn(tr('Human help', 'עזרה אנושית'), () => showPage('distress'), 'plus-link')));
    },
    onboarding() { return onboardingForm(); },
    help() { return helpPage(); }
  };

  /* Summary cards (reference layout): amount + "last updated" for the four main money rights */
  function rightsSummary() {
    if (!KB || !KB.data) return null;
    const wrap = h('div', {class: 'plus-sum-wrap'});
    // Personal inputs: every amount below is calculated from these (saved on this device).
    const svc = serviceSelect('plusSumService', P.service);
    const gen = genderSelect('plusSumGender');
    const months = h('input', {type: 'number', id: 'plusSumMonths', min: '1', max: '60', inputmode: 'numeric', value: P.monthsServed || '', placeholder: tr('e.g. 32', 'למשל 32'), 'aria-label': tr('Months of service', 'חודשי שירות')});
    const form = h('div', {class: 'plus-sum-form'},
      h('strong', {}, tr('Calculate for me', 'חשב בשבילי')),
      h('div', {class: 'plus-sum-fields'},
        h('label', {}, h('span', {}, tr('Service type', 'סוג שירות')), svc),
        h('label', {}, h('span', {}, tr('Months served', 'כמה חודשים שירתת?')), months),
        h('label', {}, h('span', {}, tr('Soldier', 'חייל / חיילת')), gen)));
    const cards = h('div', {class: 'plus-sum'});
    const note = h('p', {class: 'plus-muted plus-sum-note'});
    const noteExtra = h('div');
    const paint = () => {
      const r = KB.data.rights_and_benefits, m = Number(months.value);
      const e = KB.estimate(svc.value, m, P.gender) || {};
      const valid = Number.isInteger(m) && m > 0 && m <= 60;
      const asOf = tr('Last updated: ', 'עודכן לאחרונה: ') + asOfLabel(KB.data.metadata.amounts_as_of || KB.data.metadata.last_updated);
      const perMonth = tr(' / month served', ' לחודש שירות');
      const tax = e.taxMonthly ? (e.taxMonthly[0] === e.taxMonthly[1] ? money(e.taxMonthly[0]) : money(e.taxMonthly[0]) + '–' + money(e.taxMonthly[1])) + tr(' / month', ' לחודש')
        : tr('up to ', 'עד ') + money(2 * (r.tax_credit_points.point_value_2026_monthly || 0)) + tr(' / month', ' לחודש');
      const items = [
        {icon: 'gift', title: r.discharge_grant.name_he, amount: valid ? (e.grant ? '≈ ' + money(e.grant) : tr('Needs 12+ months', 'דרושים 12 חודשים ומעלה')) : money(e.grantRate) + perMonth, target: 'discharge_grant'},
        {icon: 'coins', title: r.personal_deposit.name_he, amount: valid && e.deposit ? '≈ ' + money(e.deposit) : money(e.depositRate) + perMonth, target: 'personal_deposit'},
        {icon: 'star', title: tr('Tax credit points', 'נקודות זיכוי'), amount: tax, target: 'tax_credit_points'},
        {icon: 'briefcase', title: tr('Preferred work', 'עבודה מועדפת'), amount: money(r.preferred_work_grant.amount_2026_number || 0), target: 'preferred_work_grant'}
      ];
      cards.replaceChildren(...items.map(it => h('button', {type: 'button', class: 'plus-sum-card', onclick: () => { const el = document.querySelector('[data-right="' + it.target + '"]'); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({behavior: 'smooth', block: 'start'}); } }},
        h('span', {class: 'plus-sum-ico'}, icon(it.icon)),
        h('span', {class: 'plus-sum-text'}, h('strong', {class: 'plus-sum-title'}, it.title), h('span', {class: 'plus-sum-amount'}, it.amount), h('small', {}, asOf, icon('refresh', 'plus-sum-ref'))))));
      const en2 = valid ? estimateNote(e) : null; noteExtra.replaceChildren(...(en2 ? [en2] : []));
      note.textContent = valid ? tr('This is an estimate for ' + m + ' months of service. Your exact amount is in your personal area.', 'זו הערכה לפי ' + m + ' חודשי שירות. את הסכום המדויק תראה באזור האישי.')
        : tr('Enter your months of service to see your own amounts.', 'הכנס כמה חודשים שירתת כדי לראות את הסכומים שלך.');
    };
    const save = () => {
      const m = Number(months.value);
      P.service = svc.value; P.gender = gen.value; P.monthsServed = Number.isInteger(m) && m > 0 && m <= 60 ? m : ''; store(); paint();
    };
    svc.addEventListener('change', save); gen.addEventListener('change', save); months.addEventListener('input', save);
    paint();
    wrap.append(form, note, noteExtra, cards);
    const w = (KB.data.important_warnings || [])[0];
    if (w) wrap.append(h('div', {class: 'plus-know', role: 'note'}, h('div', {class: 'plus-know-head'}, h('strong', {}, tr('Good to know!', 'חשוב לדעת!')), icon('warn', 'plus-know-ico')),
      h('p', {}, w), (() => {
        const more = h('ul', {class: 'plus-list', hidden: true}, (KB.data.important_warnings || []).slice(1).map(x => h('li', {}, x)));
        const b = btn(tr('More information →', 'למידע נוסף ←'), () => { more.hidden = !more.hidden; b.textContent = more.hidden ? tr('More information →', 'למידע נוסף ←') : tr('Show less', 'להסתיר'); b.setAttribute('aria-expanded', String(!more.hidden)); }, 'plus-know-more');
        b.setAttribute('aria-expanded', 'false');
        return h('div', {}, more, b);
      })()));
    return wrap;
  }
  function calculator() {
    const out = h('div', {'aria-live': 'polite'});
    const svc = serviceSelect('plusCalcService', P.service);
    const gen = genderSelect('plusCalcGender');
    const months = h('input', {type: 'number', id: 'plusCalcMonths', min: '1', max: '60', inputmode: 'numeric', value: P.monthsServed || '', placeholder: tr('e.g. 32', 'למשל 32'), 'aria-label': tr('Months of service', 'חודשי שירות')});
    const draw = () => out.replaceChildren(estimateBlock(svc.value, months.value) || h('p', {class: 'plus-muted'}, tr('Choose a service type.', 'בחר סוג שירות.')));
    gen.addEventListener('change', () => { P.gender = gen.value; store(); draw(); });
    svc.addEventListener('change', draw); months.addEventListener('input', draw); draw();
    return section(tr('Calculator — grant, deposit and tax points', 'מחשבון — מענק, פיקדון ונקודות זיכוי'),
      h('div', {class: 'plus-calc'}, h('label', {class: 'plus-field'}, h('span', {}, tr('Service type', 'סוג שירות')), svc), h('label', {class: 'plus-field'}, h('span', {}, tr('Months of service', 'חודשי שירות')), months), h('label', {class: 'plus-field'}, h('span', {}, tr('Soldier', 'חייל / חיילת')), gen)), out);
  }
  function moodTrend() {
    const last = P.moods.slice(-14);
    if (last.length < 2) return h('p', {class: 'plus-muted'}, tr('Your trend appears after a few check-ins.', 'המגמה תופיע אחרי כמה בדיקות.'));
    return h('div', {class: 'plus-trend', role: 'img', 'aria-label': tr('Mood over the last check-ins: ', 'מצב הרוח בבדיקות האחרונות: ') + last.map(m => m.v).join(', ')},
      last.map(m => h('span', {style: 'height:' + (m.v * 18) + 'px', title: m.d + ': ' + m.v})));
  }
  function humanHelpSection() {
    return section(tr('Talk to a person', 'לדבר עם אדם'), h('ul', {class: 'plus-help-list'}, KB.GUIDES.humanHelp.map(x => h('li', {},
      h('strong', {}, x.name), ' — ', x.tel ? h('a', {href: 'tel:' + x.tel, class: 'plus-tel'}, x.contact) : x.contact, h('br'), h('small', {}, x.note)))));
  }
  function interviewSection() {
    const I = KB.GUIDES.interview;
    return section(tr('How to talk about your service in an interview', 'איך לדבר על השירות בראיון עבודה'), h('p', {}, I.intro), list(I.tips),
      ...I.examples.map(x => h('details', {class: 'plus-details'}, h('summary', {}, '"' + x.q + '"'), h('p', {}, x.a))),
      askButton('applications', tr('Help me practice a job interview answer about my service.', 'תתרגל איתי תשובה לראיון עבודה על השירות שלי.')));
  }
  function decisionTree() {
    const D = KB.data && KB.data.practical_guides && KB.data.practical_guides.decision_tree; if (!D) return null;
    const labels = {not_sure: tr("I'm not sure", 'אני לא בטוח'), want_studies: tr('I want to study', 'אני רוצה ללמוד'), want_work: tr('I want to work', 'אני רוצה לעבוד'), want_travel: tr('I want to travel', 'אני רוצה לטייל'), feel_stuck: tr('I feel stuck', 'אני מרגיש תקוע')};
    const out = h('p', {class: 'plus-soft plus-pill', hidden: true, 'aria-live': 'polite'});
    return section(tr('Not sure where to start?', 'לא בטוח מאיפה להתחיל?'), h('div', {class: 'plus-row'}, Object.keys(D).map(k => btn(labels[k] || k, () => { out.hidden = false; out.textContent = D[k]; }, 'plus-btn'))), out);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(tr('Copied ✓', 'הועתק ✓')); }
    catch (_) { toast(tr('Copy is unavailable here.', 'העתקה אינה זמינה כאן.')); }
  }

  /* ---------------- onboarding (first visit only, all skippable) ---------------- */
  // Welcome wizard (27 Nov 2026): one friendly question per screen, big illustrated choices, skip anytime.
  function onboardingForm() {
    const D = {name: P.name || '', notYet: !!P.notDischarged, month: P.dischargeMonth || '', service: P.service || '', gender: P.gender || '', months: P.monthsServed || '', lone: !!P.lone, reservist: !!P.reservist, pressing: P.pressing || ''};
    let step = 0;
    const STEPS = 4;
    const wrap = h('div', {class: 'plus-onboarding plus-wiz'});
    const choice = (group, value, label, ill, sub) => {
      const on = D[group] === value;
      return h('button', {type: 'button', class: 'plus-wiz-choice' + (on ? ' is-on' : ''), 'aria-pressed': String(on), 'data-value': value, onclick: () => { D[group] = on ? '' : value; paint(); }},
        ill ? illu(ill, 46, 'plus-wiz-ill') : null, h('strong', {}, label), sub ? h('small', {}, sub) : null);
    };
    const chip = (key, label) => h('button', {type: 'button', class: 'plus-wiz-chip' + (D[key] ? ' is-on' : ''), 'aria-pressed': String(!!D[key]), onclick: () => { D[key] = !D[key]; paint(); }}, (D[key] ? '✓ ' : '') + label);
    const dots = () => h('div', {class: 'plus-wiz-dots', 'aria-label': tr('Step ' + (step + 1) + ' of ' + STEPS, 'שלב ' + (step + 1) + ' מתוך ' + STEPS)}, Array.from({length: STEPS}, (_, k) => h('i', {class: k === step ? 'on' : k < step ? 'done' : ''})));
    const nav = (nextLabel) => h('div', {class: 'plus-wiz-nav'},
      step > 0 ? btn(tr('Back', 'חזרה'), () => { step--; paint(); }, 'plus-wiz-back') : h('span'),
      h('button', {type: 'button', class: 'plus-btn primary plus-wiz-next', onclick: () => { if (step < STEPS - 1) { step++; paint(); } else finish(); }}, nextLabel || tr('Next', 'הבא')));
    function screen() {
      if (step === 0) {
        const name = h('input', {type: 'text', id: 'plusName', maxlength: '30', autocomplete: 'given-name', value: D.name, placeholder: tr('Your first name (optional)', 'השם הפרטי שלך (לא חובה)'), 'aria-label': tr('First name', 'שם פרטי')});
        name.addEventListener('input', () => { D.name = name.value.trim(); greet.textContent = D.name ? tr('Nice to meet you, ' + D.name + '!', 'נעים להכיר, ' + D.name + '!') : ''; });
        name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); step++; paint(); } });
        const greet = h('p', {class: 'plus-wiz-greet', 'aria-live': 'polite'}, D.name ? tr('Nice to meet you, ' + D.name + '!', 'נעים להכיר, ' + D.name + '!') : '');
        return [illu('map', 92, 'plus-wiz-hero'), h('h1', {class: 'plus-wiz-title'}, tr('Hi! I\'m your Companion', 'היי! אני המלווה שלך 👋')),
          h('p', {class: 'plus-wiz-sub'}, tr('A few quick taps and I\'ll show what is relevant to you. Everything stays on this phone.', 'כמה לחיצות קצרות ואראה לך מה רלוונטי בשבילך. הכול נשמר רק בטלפון הזה.')),
          h('label', {class: 'plus-wiz-label', for: 'plusName'}, tr('What should I call you?', 'איך לקרוא לך?')), name, greet, nav(tr('Let\'s start', 'יאללה, מתחילים'))];
      }
      if (step === 1) {
        const month = h('input', {type: 'month', id: 'plusDischarge', value: D.month, max: todayStr().slice(0, 7), 'aria-label': tr('Discharge month', 'חודש השחרור'), disabled: D.notYet || undefined});
        month.addEventListener('change', () => { D.month = month.value; });
        return [illu('calendar', 76, 'plus-wiz-hero'), h('h1', {class: 'plus-wiz-title'}, tr('When were you discharged?', 'מתי השתחררת?')),
          h('p', {class: 'plus-wiz-sub'}, tr('So I can remind you of the right dates.', 'כדי שאוכל להזכיר לך את המועדים הנכונים.')),
          month, h('div', {class: 'plus-wiz-chips'}, chip('notYet', tr('Not discharged yet', 'עוד לא השתחררתי'))), nav()];
      }
      if (step === 2) {
        const months = h('input', {type: 'number', id: 'plusMonths', min: '1', max: '60', inputmode: 'numeric', value: D.months, placeholder: '32', 'aria-label': tr('Months of service', 'חודשי שירות')});
        months.addEventListener('input', () => { D.months = months.value; });
        const step2 = d => () => { const v = Math.min(60, Math.max(1, (Number(months.value) || 0) + d)); months.value = v; D.months = v; };
        return [h('h1', {class: 'plus-wiz-title'}, tr('How did you serve?', 'איך שירתת?')),
          h('div', {class: 'plus-wiz-grid'}, choice('service', 'combat', tr('Combat', 'לוחם/ת'), 'shield'), choice('service', 'support', tr('Combat support', 'תומך/ת לחימה'), 'briefcase'),
            choice('service', 'other', tr('Other / rear', 'אחר / עורפי'), 'house'), choice('service', 'national', tr('National service', 'שירות לאומי'), 'users')),
          h('div', {class: 'plus-wiz-chips'}, h('button', {type: 'button', class: 'plus-wiz-chip' + (D.service === 'civ_mid' ? ' is-on' : ''), onclick: () => { D.service = 'civ_mid'; paint(); }}, tr('Civilian track (intermediate)', 'מסלול אזרחי ביניים')),
            h('button', {type: 'button', class: 'plus-wiz-chip' + (D.service === 'civ_split' ? ' is-on' : ''), onclick: () => { D.service = 'civ_split'; paint(); }}, tr('Civilian track (split)', 'מסלול אזרחי מפוצל'))),
          h('div', {class: 'plus-wiz-row'}, h('span', {class: 'plus-wiz-label'}, tr('I am a', 'אני')),
            h('div', {class: 'plus-wiz-seg'}, ['m', 'f'].map(g => h('button', {type: 'button', class: D.gender === g ? 'is-on' : '', 'aria-pressed': String(D.gender === g), onclick: () => { D.gender = g; paint(); }}, g === 'm' ? tr('male soldier', 'חייל') : tr('female soldier', 'חיילת'))))),
          h('div', {class: 'plus-wiz-row'}, h('span', {class: 'plus-wiz-label'}, tr('Months served', 'כמה חודשים שירתת?')),
            h('div', {class: 'plus-wiz-stepper'}, btn('−', step2(-1), 'plus-wiz-pm'), months, btn('+', step2(1), 'plus-wiz-pm'))),
          h('div', {class: 'plus-wiz-chips'}, chip('lone', tr('Lone soldier', 'חייל/ת בודד/ה')), chip('reservist', tr('Reservist', 'משרת/ת מילואים'))), nav()];
      }
      return [h('h1', {class: 'plus-wiz-title'}, tr('What would help you most right now?', 'מה הכי יעזור לך עכשיו?')),
        h('div', {class: 'plus-wiz-grid'}, choice('pressing', 'money', tr('Money', 'כסף'), 'piggy'), choice('pressing', 'rights', tr('My rights', 'מה מגיע לי'), 'wallet'),
          choice('pressing', 'work', tr('Work', 'עבודה'), 'briefcase'), choice('pressing', 'studies', tr('Studies', 'לימודים'), 'cap'),
          choice('pressing', 'feelings', tr('How I feel', 'איך אני מרגיש'), 'heart'), choice('pressing', 'unsure', tr('Not sure yet', 'עוד לא יודע'), 'compass')),
        nav(tr('Done — let\'s go', 'סיימתי, יאללה'))];
    }
    function paint() {
      wrap.replaceChildren(
        h('div', {class: 'plus-wiz-top'}, dots(), btn(tr('Skip', 'דילוג'), skip, 'plus-skip')),
        h('div', {class: 'plus-wiz-body', 'data-step': String(step)}, ...screen()));
      const first = wrap.querySelector('.plus-wiz-body input:not([disabled]), .plus-wiz-body .plus-wiz-choice');
      if (first && step > 0 && matchMedia('(pointer: fine)').matches) first.focus({preventScroll: true});
    }
    function skip() { if (!P.onboarded && !S.started) P.seenVersion = VERSION; P.onboarded = true; if (D.name) P.name = D.name; store(); goHome(); }
    function finish() {
      P.name = (D.name || '').slice(0, 30);
      P.notDischarged = D.notYet;
      P.dischargeMonth = D.notYet ? '' : (/^\d{4}-\d{2}$/.test(D.month) ? D.month : '');
      P.service = D.service; P.pressing = D.pressing; P.gender = D.gender || P.gender || '';
      P.lone = D.lone; P.reservist = D.reservist;
      const ms = Number(D.months); P.monthsServed = Number.isInteger(ms) && ms > 0 && ms <= 60 ? ms : '';
      if (!P.onboarded && !S.started) P.seenVersion = VERSION;
      P.onboarded = true; store();
      try { S.profile.background = {...(S.profile.background || {}), serviceType: P.service, reserve: P.reservist || !!(S.profile.background || {}).reserve}; save(); } catch (_) {}
      toast(P.name ? tr('Great, ' + P.name + ' ✓', 'מעולה, ' + P.name + ' ✓') : tr('Saved ✓', 'נשמר ✓'));
      pageStack = [];
      if (P.pressing === 'feelings') showPage('feel'); else if (P.pressing === 'money') showPage('money');
      else if (P.pressing === 'rights') showPage('rights'); else if (P.pressing === 'studies') showPage('studies');
      else if (P.pressing === 'work') showPage('work'); else goHome();
    }
    paint();
    return wrap;
  }

  /* ---------------- help & settings ---------------- */
  function helpPage() {
    const wrap = h('div', {}, h('h1', {class: 'plus-title'}, tr('Help', 'עזרה')));
    put(wrap, distressBtn(), humanHelpSection());
    if ($('btnHelp')) put(wrap, btn(tr('More support options in the app', 'אפשרויות תמיכה נוספות באפליקציה'), () => { hidePage(); goChat(); $('btnHelp').click(); }, 'plus-link'));
    // Display
    const sel = (id, value, opts, onchange) => { const s = h('select', {id, onchange}); opts.forEach(([v, l]) => s.append(h('option', {value: v, selected: v === value || undefined}, l))); return s; };
    put(wrap, section(tr('Display', 'תצוגה'),
      h('label', {class: 'plus-field'}, h('span', {}, tr('Theme', 'מצב תצוגה')), sel('plusTheme', P.theme === 'dark' ? 'dark' : 'light', [['light', tr('Light', 'בהיר')], ['dark', tr('Dark', 'כהה')]], e => { P.theme = e.target.value; store(); applyDisplay(); })),
      h('label', {class: 'plus-field'}, h('span', {}, tr('Text size', 'גודל טקסט')), sel('plusText', P.textSize, [['normal', tr('Normal', 'רגיל')], ['large', tr('Large', 'גדול')], ['xl', tr('Extra large', 'גדול מאוד')]], e => { P.textSize = e.target.value; store(); applyDisplay(); })),
      h('label', {class: 'plus-choice'}, h('input', {type: 'checkbox', checked: P.reduceMotion || undefined, onchange: e => { P.reduceMotion = e.target.checked; store(); applyDisplay(); }}), h('span', {}, tr('Reduce animations', 'הפחתת אנימציות'))),
      h('label', {class: 'plus-choice'}, h('input', {type: 'checkbox', checked: P.infoOnly || undefined, onchange: e => { P.infoOnly = e.target.checked; store(); applyDisplay(); paintNav(); showPage('help', false); }}), h('span', {}, tr('Information only (no chat)', 'מצב "מידע בלבד" (בלי שיחה)'))),
      h('p', {}, h('a', {class: 'plus-btn', href: edition() === 'he' ? './index.html#home' : './indexH.html#home'}, edition() === 'he' ? 'English' : 'עברית'),
        ' ', h('small', {class: 'plus-muted'}, tr('Each language keeps its own conversations.', 'לכל שפה יש היסטוריית שיחות משלה.')))));
    // My details
    put(wrap, section(tr('My details', 'הפרטים שלי'), personalBanner(), btn(tr('Edit my details', 'עריכת הפרטים שלי'), () => showPage('onboarding'), 'plus-btn')));
    // Privacy (short)
    put(wrap, section(tr('Privacy in short', 'פרטיות בקצרה'), list(he()
      ? ['הכול נשמר רק בדפדפן במכשיר הזה.', 'הודעות נשלחות ל-AI חיצוני רק אחרי שאישרת, ואפשר לבטל בכל רגע.', 'פרטי המסע נשלחים ל-AI רק אם הפעלת זאת בהגדרות המסע.', 'אפשר לייצא, לגבות או למחוק הכול.']
      : ['Everything is saved only in this browser on this device.', 'Messages go to an external AI only after you approve, and you can withdraw anytime.', 'Journey details are shared with the AI only if you turn that on in My Journey.', 'You can export, back up or delete everything.']),
      h('div', {class: 'plus-row'}, window.MomentumAIConsent ? btn(tr('Manage AI consent', 'ניהול הסכמה ל-AI'), () => window.MomentumAIConsent.settings(S.lang), 'plus-btn') : null,
        h('a', {class: 'plus-btn', href: journeyUrl('privacy')}, tr('Journey sharing & backup', 'שיתוף וגיבוי המסע')))));
    // Conversations
    if (!P.infoOnly && $('chatHistory')) put(wrap, section(tr('Past conversations', 'שיחות קודמות'), h('p', {class: 'plus-muted'}, tr('Search, open or delete a single conversation.', 'חיפוש, פתיחה או מחיקה של שיחה אחת.')),
      btn(tr('Open conversation history', 'לפתיחת היסטוריית השיחות'), () => { goChat(); $('chatHistory').open = true; }, 'plus-btn')));
    // Hidden topics
    if (P.hidden.length) put(wrap, section(tr('Topics I marked "not relevant"', 'נושאים שסימנתי "לא רלוונטי"'),
      h('ul', {class: 'plus-list'}, P.hidden.map(id => h('li', {}, hiddenLabel(id), ' ', btn(tr('Show again', 'להחזיר'), () => { P.hidden = P.hidden.filter(x => x !== id); store(); showPage('help', false); }, 'plus-link'))))));
    // What's new, invite
    // ("What's new" removed at the owner's request, 27 Nov 2026)
    put(wrap, section(tr('Invite a friend', 'להזמין חבר'), h('p', {class: 'plus-muted'}, tr('Shares only the app link — never your information.', 'משתף רק את הקישור לאפליקציה — אף פעם לא את המידע שלך.')),
      btn(tr('Share the app', 'שיתוף האפליקציה'), invite, 'plus-btn')));
    return wrap;
  }
  function hiddenLabel(id) {
    const [kind, key] = id.split(':');
    if (kind === 'right') { const c = KB.rightsCards().find(x => x.id === key); return c ? c.title : key; }
    return key;
  }
  async function invite() {
    const url = new URL(edition() === 'he' ? './indexH.html' : './index.html', location.href).href;
    const data = {title: tr('Momentum Companion', 'המלווה של מומנטום'), text: tr('A companion for discharged soldiers: rights, work, studies and support.', 'מלווה לחיילים משוחררים: זכויות, עבודה, לימודים ותמיכה.'), url};
    try { if (navigator.share) { await navigator.share(data); return; } } catch (_) { return; }
    copy(url);
  }

  /* ================================================================
     BOTTOM NAVIGATION
     ================================================================ */
  const nav = h('nav', {id: 'plusNav', class: 'plus-nav'});
  document.body.append(nav);
  const NAV = [
    ['home', 'home', () => goHome()],
    ['chat', 'chat', () => P.infoOnly ? showPage('rights') : goChat()],
    ['journey', 'calendar', () => { location.href = journeyUrl('overview'); }],
    ['help', 'person', () => showPage('help')]
  ];
  function paintNav() {
    nav.setAttribute('aria-label', tr('Main navigation', 'ניווט ראשי'));
    const iconFn = window.MomentumPlusIcon;
    nav.replaceChildren(...NAV.map(([id, icon, fn]) => {
      const label = {home: tr('Home', 'בית'), chat: P.infoOnly ? tr('Info', 'מידע') : tr('Chat', "צ'אט"), journey: tr('My Journey', 'המסע שלי'), help: tr('Me', 'אישי')}[id];
      return h('button', {type: 'button', 'data-nav': id, onclick: fn}, iconFn(id === 'chat' && P.infoOnly ? 'info' : icon, 'plus-nav-ico'), h('span', {}, label));
    }));
    setNav(currentNav);
  }
  let currentNav = 'home';
  function setNav(id) {
    currentNav = id;
    nav.querySelectorAll('[data-nav]').forEach(b => { if (b.dataset.nav === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }

  /* ================================================================
     CHAT — conversation modes, tools, save-to-journey, listen
     ================================================================ */
  const tools = h('div', {id: 'plusChatTools', class: 'plus-chat-tools'});
  if ($('composer')) $('composer').before(tools);
  function paintTools() {
    tools.hidden = !hasUserMessages();
    tools.replaceChildren(
      btn(tr("I'm not feeling okay", 'אני לא מרגיש בסדר'), () => showPage('distress'), 'plus-chip plus-chip-soft'),
      btn(tr('Summary & next step', 'סיכום וצעד הבא'), summarize, 'plus-chip'),
      btn(tr('Skip this question', 'דילוג על השאלה'), skipQuestion, 'plus-chip')
    );
  }
  function summarize() {
    if (typeof sendUser !== 'function') return;
    const userCount = (S.messages || []).filter(m => m.role === 'user').length;
    if (userCount < 2) { toast(tr('Talk a little more first, then I can summarize.', 'נדבר עוד קצת ואז אוכל לסכם.')); return; }
    sendUser(tr('Please summarize our conversation so far in 3–5 short lines, then suggest one small, concrete next step I could save to My Journey.',
      'סכם בבקשה את השיחה שלנו עד עכשיו ב-3–5 שורות קצרות, ואז הצע צעד הבא אחד קטן וקונקרטי שאוכל לשמור במסע שלי.'));
  }
  function skipQuestion() {
    if (typeof sendUser !== 'function') return;
    sendUser(tr("I'd rather skip that question for now.", 'אני מעדיף לדלג על השאלה הזאת כרגע.'));
  }
  function hasUserMessages() { return (S.messages || []).some(m => m.role === 'user'); }
  const pill = (iconName, text, fn, cls) => h('button', {type: 'button', class: 'plus-qr' + (cls ? ' ' + cls : ''), onclick: fn}, icon(iconName, 'plus-qr-ico'), h('span', {}, text));
  function maybeOfferModes() {
    const old = $('plusModes'); if (old) old.remove();
    paintSavePill();
    if (hasUserMessages() || S.activeTopic || P.infoOnly) return;
    const bar = h('div', {id: 'plusModes', class: 'plus-qrs', role: 'group', 'aria-label': tr('How would you like to start?', 'איך תרצה להתחיל?')},
      pill('talk', tr('I just want to talk', 'אני רק רוצה לדבר'), () => startMode('talk')),
      pill('check', tr('I want to do something practical', 'אני רוצה לעשות משהו מעשי'), () => startMode('practical')),
      pill('heart', tr("I'm not feeling okay", 'אני לא מרגיש בסדר'), () => showPage('distress')),
      btn(tr('Skip', 'דילוג'), () => bar.remove(), 'plus-qr-skip'));
    const thread = $('thread'); if (thread) thread.after(bar); else tools.after(bar);
    setTimeout(() => { const c = $('chat'); if (c) c.scrollTop = c.scrollHeight; }, 60);
  }
  // "Save to My Journey" for the latest reply (reference pill above the composer)
  function paintSavePill() {
    let p = $('plusSavePill');
    const last = [...(S.messages || [])].reverse().find(m => m.role === 'assistant' && m.text && m.text.length > 20);
    // Nothing worth saving yet (only the greeting / mode prompt): keep the screen free for the quick replies.
    if (!last || P.infoOnly || last.kind === 'opening' || last.kind === 'plus-mode' || !hasUserMessages()) { if (p) p.remove(); return; }
    if (!p) {
      p = h('button', {type: 'button', id: 'plusSavePill', class: 'plus-save-pill'}, h('span', {}), icon('bookmark', 'plus-qr-ico'));
      tools.before(p);
    }
    p.firstChild.textContent = tr('Save to "My Journey"', 'שמור ל"המסע שלי"');
    p.disabled = false;
    p.onclick = () => {
      const text = String(last.text);
      const first = text.split(/[.!?:\n]/).map(x => x.trim()).find(x => x.length > 8) || text;
      if (saveAction(first.slice(0, 150), text)) { p.firstChild.textContent = tr('Saved ✓', 'נשמר ✓'); p.disabled = true; }
    };
  }
  function startMode(mode) {
    P.chatMode = mode; store();
    const bar = $('plusModes'); if (bar) bar.remove();
    if (typeof pushMsg !== 'function') return;
    if (mode === 'talk') {
      const ns = KB && KB.data && KB.data.emotional_support.normalization_sentences;
      const norm = ns ? ns.join(' ') : (KB && KB.data ? KB.data.emotional_support.normalization : '');
      pushMsg('assistant', tr('Many people feel empty, confused or without direction after discharge. That is completely normal.\n\nThere is no agenda here. What is on your mind?',
        (norm || 'הרבה אנשים מרגישים ריקים, מבולבלים או חסרי כיוון אחרי השחרור. זה נורמלי לגמרי.') + '\n\nאין כאן סדר יום. מה עובר עליך?'), {kind: 'plus-mode'});
    } else {
      pushMsg('assistant', tr('Great — let us pick one practical thing. Rights and money, work and CV, or studies? Or write your own.',
        'מעולה — בוא נבחר דבר מעשי אחד. זכויות וכסף, עבודה וקורות חיים, או לימודים? או שתכתוב משהו משלך.'), {kind: 'plus-mode'});
      const quick = h('div', {class: 'plus-modes', id: 'plusModes'}, [['rights', tr('Rights & money', 'זכויות וכסף')], ['cv', tr('Work & CV', 'עבודה וקורות חיים')], ['study', tr('Studies', 'לימודים')]]
        .map(([id, l]) => btn(l, () => { quick.remove(); openTopic(id); }, 'plus-chip')));
      tools.after(quick);
    }
    try { save(); } catch (_) {}
    if ($('input')) $('input').focus({preventScroll: true});
  }

  // Add "save to my journey" and "listen" to assistant replies.
  function decorateTurns() {
    const thread = $('thread'); if (!thread) return;
    thread.querySelectorAll('.turn.them:not([data-plus])').forEach(turn => {
      turn.dataset.plus = '1';
      const body = turn.querySelector('.body'); if (!body) return;
      const text = body.textContent.trim();
      if (text.length < 40 || (typeof openingText === 'function' && text.startsWith(openingText(S.lang).slice(0, 30)))) return;
      const row = h('div', {class: 'plus-turn-tools'});
      const important = text.length > 280 || /צעד|step|תוכנית|plan|מטרה|goal/i.test(text);
      // Small icon buttons (save / listen) — the labelled "Save to My Journey" pill sits above the composer.
      const saveBtn = h('button', {type: 'button', class: 'plus-ticon', title: tr('Save to My Journey', 'לשמור במסע'), 'aria-label': important ? tr('Save this to My Journey', 'רוצה לשמור את זה במסע שלך?') : tr('Save to My Journey', 'לשמור במסע'), onclick: () => {
        const first = text.split(/[.!?:\n]/).map(x => x.trim()).find(x => x.length > 8) || text;
        const rec = saveAction(first.slice(0, 150), text);
        if (rec) { saveBtn.replaceChildren(icon('check')); saveBtn.disabled = true; }
      }}, icon('bookmark'));
      row.append(saveBtn);
      if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined')
        row.append(h('button', {type: 'button', class: 'plus-ticon', title: tr('Listen', 'האזנה'), 'aria-label': tr('Listen', 'האזנה'), onclick: () => listen(text)}, icon('speaker')));
      turn.append(row);
    });
  }
  function listen(text) {
    try {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
      const u = new SpeechSynthesisUtterance(text); u.lang = he() ? 'he-IL' : 'en-US';
      const v = (speechSynthesis.getVoices() || []).find(x => String(x.lang).toLowerCase().startsWith(he() ? 'he' : 'en')); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (_) { toast(tr('Read-aloud is not available in this browser.', 'הקראה אינה זמינה בדפדפן הזה.')); }
  }
  if ($('thread')) new MutationObserver(() => { decorateTurns(); paintSavePill(); paintTools(); if (hasUserMessages() && $('plusModes')) $('plusModes').remove(); }).observe($('thread'), {childList: true});

  // Clear recording indicator for the existing microphone button.
  const mic = $('btnMic');
  if (mic) {
    const rec = h('div', {id: 'plusRecording', class: 'plus-recording', role: 'status', hidden: true});
    if ($('composer')) $('composer').prepend(rec);
    new MutationObserver(() => {
      const live = mic.classList.contains('live');
      rec.hidden = !live;
      rec.textContent = live ? tr('Recording… tap the microphone again to stop.', 'מקליט… לחצו שוב על המיקרופון כדי לעצור.') : '';
    }).observe(mic, {attributes: true, attributeFilter: ['class']});
  }

  /* On phones, never pop the keyboard by itself: the many existing input.focus() calls
     (entering chat, choosing a topic, starting a mode) are ignored on touch screens.
     A tap on the text field still opens the keyboard normally. */
  (function noAutoKeyboard() {
    const input = $('input');
    if (!input || !window.matchMedia || !matchMedia('(pointer: coarse)').matches) return;
    const nativeFocus = HTMLElement.prototype.focus;
    input.focus = function () { /* programmatic focus disabled on touch devices */ };
    input.addEventListener('pointerdown', () => { input.focus = function (o) { return nativeFocus.call(input, o); }; setTimeout(() => { input.focus = function () {}; }, 400); });
  })();

  /* ---------------- offline message ---------------- */
  const offline = h('div', {id: 'plusOffline', class: 'plus-offline', role: 'status', hidden: true});
  document.body.prepend(offline);
  function paintOffline() {
    offline.hidden = navigator.onLine !== false;
    offline.textContent = tr('You are offline. Information pages and My Journey still work; the AI chat returns when you reconnect.', 'אין חיבור לאינטרנט. עמודי המידע והמסע שלך זמינים; השיחה עם ה-AI תחזור כשהחיבור יחזור.');
  }
  window.addEventListener('online', paintOffline); window.addEventListener('offline', paintOffline);

  /* ================================================================
     AI CONTEXT — knowledge base + (opt-in) personal context
     ================================================================ */
  function promptContext(lastUserText) {
    const parts = [];
    if (KB) { const k = KB.promptContext(lastUserText, {topic: S.activeTopic || ''}); if (k) parts.push(k); }
    if (PAGES.tools) parts.push('APP TOOLS the soldier can open from Home > My tools: My dates (personal deadlines from the discharge date, add to phone calendar), Deposit planner, Grant planner, After-discharge checklist, Phone numbers & places (tap to call, Waze), Scholarships, Payslip guide, Glossary. Mention the relevant one by name when it helps.');
    if (P.chatMode === 'talk' && !S.activeTopic) parts.push('CONVERSATION MODE: the soldier chose "I just want to talk". Listen first, reflect briefly, normalize the feelings, and do not push tasks or lists unless they ask.');
    if (P.chatMode === 'practical' && !S.activeTopic) parts.push('CONVERSATION MODE: the soldier chose "I want to do something practical". Be concrete and end with one small next step.');
    const j = journey();
    if (j && j.privacy && j.privacy.shareWithAI) {
      const facts = [];
      if (P.service) facts.push('service type: ' + P.service);
      if (P.lone) facts.push('lone soldier');
      if (P.reservist) facts.push('serves in reserves');
      if (P.monthsServed) facts.push('about ' + P.monthsServed + ' months of service');
      const m = monthsSinceDischarge(); if (m !== null) facts.push('about ' + m + ' months since discharge'); else if (P.notDischarged) facts.push('not yet discharged');
      if (P.pressing) facts.push('most pressing now: ' + P.pressing);
      if (facts.length) parts.push('SOLDIER-PROVIDED BACKGROUND (opted in; self-reported; do not infer eligibility from it): ' + facts.join('; ') + '.');
    }
    return parts.length ? '\n\n' + parts.join('\n\n') : '';
  }

  /* ================================================================
     START-UP
     ================================================================ */
  function paintAll() { applyDisplay(); paintNav(); paintTools(); paintOffline(); paintChatHead(); if (!hub.hidden) renderHome(); }
  // One-shot AI text (CV wording, interview feedback). Uses the same consent gate as the chat; nothing is sent without approval.
  async function aiText(system, prompt, maxTokens) {
    if (P.infoOnly) throw new Error(tr('Information-only mode is on.', 'מצב "מידע בלבד" פעיל.'));
    if (!window.MomentumAIConsent || typeof CONFIG === 'undefined') throw new Error(tr('AI is not available here.', 'ה-AI לא זמין כאן.'));
    const res = await window.MomentumAIConsent.request({model: CONFIG.MODEL, max_tokens: maxTokens || 900, system, messages: [{role: 'user', content: prompt}]}, CONFIG.API_URL, S.lang, {interactive: true});
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if (!text) throw new Error(tr('No reply', 'לא התקבלה תשובה'));
    return text;
  }
  const TOOL_CTX = {h, btn, tr, he, icon, illu, put, P, store, toast, saveAction, showPage, openTopic, KB, money, section, list, askButton, aiText, Journey, goChat, todayStr};
  [window.MomentumTools, window.MomentumCV, window.MomentumInterview, window.MomentumGuided].forEach(factory => {
    if (typeof factory !== 'function') return;
    try { const T = factory(TOOL_CTX); Object.assign(PAGES, T.pages || {}); Object.assign(PAGE_HEAD, T.heads || {}); }
    catch (e) { console.warn('tools', e); }
  });
  window.MomentumPlus = {promptContext, showPage, goHome, goChat, prefs: () => ({...P}), renderHome};
  new MutationObserver(paintAll).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  new MutationObserver(() => { if (!hub.hidden) { hidePage(); renderHome(); setNav('home'); } }).observe(hub, {attributes: true, attributeFilter: ['hidden']});
  if ($('chat')) new MutationObserver(() => { if (!$('chat').hidden) { setNav('chat'); decorateTurns(); paintChatHead(); paintSavePill(); paintTools(); } }).observe($('chat'), {attributes: true, attributeFilter: ['hidden']});
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyDisplay);

  const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('mp-booting')));
  reveal();
  recordVisit();
  paintAll();
  decorateTurns();
  const params = new URLSearchParams(location.search);
  let draft = '';
  try { draft = sessionStorage.getItem('momentum-plus-draft') || ''; sessionStorage.removeItem('momentum-plus-draft'); } catch (_) {}
  if (draft) { openTopic('cv', draft); return; }
  const wantsChat = location.hash === '#chatHistory' || params.get('section') === 'updates' || params.get('view') === 'chat';
  if (params.get('view') === 'chat' && !P.infoOnly) goChat();
  else if (params.get('page') && PAGES[params.get('page')]) showPage(params.get('page'));
  else if (!P.onboarded && !S.started && !wantsChat) { if (window.CompanionHome) window.CompanionHome.show(); showPage('onboarding'); }
  else if (!wantsChat && window.CompanionHome && !(typeof sendingUserMessage !== 'undefined' && sendingUserMessage)) { window.CompanionHome.show(); renderHome(); }
})();
