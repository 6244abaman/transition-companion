/* My Journey additions: visual progress, calendar of planned steps, printable/PDF export,
 * saved links, skills added manually, sharing a summary with a counselor (explicit consent),
 * Skills → CV prompt, and the Companion's display preferences (dark mode, text size, motion).
 * Local only — no network calls. */
(function () {
  'use strict';
  const Store = window.MomentumJourney;
  if (!Store || !document.getElementById('view-overview')) return;
  const $ = id => document.getElementById(id);
  const he = () => document.documentElement.lang === 'he';
  const tr = (en, hb) => he() ? hb : en;
  const read = () => { try { return Store.read(); } catch (_) { return null; } };

  /* display preferences shared with the Companion */
  try {
    const P = JSON.parse(localStorage.getItem('momentum-companion-plus-v1') || '{}');
    const dark = P.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.text = P.textSize || 'normal';
    document.documentElement.dataset.motion = P.reduceMotion ? 'reduce' : 'full';
  } catch (_) {}

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  }
  function say(msg, error) {
    const s = $('status'); if (!s) return;
    s.textContent = msg; s.style.background = error ? '#fce7e7' : '#def1e9'; s.setAttribute('role', 'alert');
    clearTimeout(say.t); say.t = setTimeout(() => s.removeAttribute('role'), 3500);
  }
  const attempt = fn => { try { const r = fn(); return r; } catch (e) { say(tr('An error occurred: ', 'אירעה שגיאה: ') + e.message, true); return null; } };
  const companionUrl = () => (he() ? './indexH.html' : './index.html') + '#home';

  /* ---------------- containers (created once, repainted after each render) ---------------- */
  const progress = h('div', {class: 'card jp-progress', id: 'jpProgress'});
  const calendar = h('div', {class: 'card', id: 'jpCalendar'});
  const links = h('div', {class: 'card', id: 'jpLinks'});
  const tools = h('div', {class: 'card', id: 'jpTools'});
  const overview = $('view-overview');
  overview.insertBefore(progress, overview.querySelector('.grid'));
  overview.append(calendar, links, tools);
  const manual = h('div', {id: 'jpManualSkills'});
  $('view-skills').append(manual);
  const printArea = h('section', {id: 'jpPrint', 'aria-hidden': 'true'});

  /* ---------- reference layout: header, goal, next steps, skills, week, links, bottom nav ---------- */
  const ICO = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 16.8h.01M12 16.8h.01"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="13" r="7.5"/><circle cx="11" cy="13" r="4"/><circle cx="11" cy="13" r=".8" fill="currentColor"/><path d="m11 13 8.5-8.5M16.5 4.5h3v3"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5Z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="#2F5A46"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15l-1-1Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="#F2C14E" stroke="#C99A2E" stroke-width="1.2" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.3 3.6a1 1 0 0 1 1.4 0l8 7.3c.6.6.2 1.6-.6 1.6H19V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H6.5A1.5 1.5 0 0 1 5 19v-6.5H3.9c-.8 0-1.2-1-.6-1.6l8-7.3Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-2-.1-2.9-.4L4.5 20l1.3-3.6C4.4 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7Z"/><circle cx="8.5" cy="11" r=".9" fill="currentColor"/><circle cx="12" cy="11" r=".9" fill="currentColor"/><circle cx="15.5" cy="11" r=".9" fill="currentColor"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/></svg>'
  };
  const ico = (name, cls) => { const s = h('span', {class: 'jp-ico ' + (cls || ''), 'aria-hidden': 'true'}); s.innerHTML = ICO[name]; return s; };
  const companionBase = () => he() ? './indexH.html' : './index.html';
  const top = h('section', {id: 'jpTop', class: 'jp-top'});
  const mainEl = document.querySelector('main');
  mainEl.insertBefore(top, mainEl.firstChild);
  const bottomNav = h('nav', {class: 'jp-nav', id: 'jpNav'});
  document.body.append(bottomNav);
  const clickTab = tab => { const b = document.querySelector('[data-tab="' + tab + '"]'); if (b) { b.click(); b.scrollIntoView({behavior: 'smooth', block: 'start'}); } };
  const todayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  let selectedDay = todayKey();

  // Empty state: add the first step right here, with clear feedback (brief §1.5, §4).
  function quickAdd() {
    const input = h('input', {type: 'text', maxlength: '160', placeholder: tr('e.g. Check my grant arrived', 'למשל: לבדוק שהמענק הגיע'), 'aria-label': tr('First small step', 'צעד ראשון קטן')});
    const ideas = [tr('Check my grant arrived', 'לבדוק שהמענק הגיע'), tr('Give form 101 at work', 'למסור טופס 101 בעבודה'), tr('Update my Rav-Kav profile', 'לעדכן פרופיל ברב-קו')];
    const add = t => {
      t = (t || input.value).trim(); if (!t) { input.focus(); return; }
      if (attempt(() => Store.upsert('actions', {title: t, status: 'todo', dueDate: todayKey()})) !== null) { say(tr('Your first step is saved ✓', 'הצעד הראשון שלך נשמר ✓')); paintAll(); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    return h('div', {class: 'jp-quickadd'},
      h('p', {class: 'jp-empty-msg'}, tr('No steps here yet. Want to add a small step for today?', 'עדיין אין כאן צעדים. רוצה להוסיף צעד קטן להיום?')),
      h('div', {class: 'jp-dayadd'}, input, h('button', {type: 'button', class: 'button primary', onclick: () => add()}, tr('Add', 'הוספה'))),
      h('div', {class: 'jp-chips'}, ideas.map(t => h('button', {type: 'button', class: 'jp-chip jp-chip-add', onclick: () => add(t)}, '+ ' + t))));
  }

  function paintTop(p) {
    const goal = p.goals.find(g => g.status === 'active') || p.goals.find(g => g.status !== 'achieved');
    const goalCard = h('div', {class: 'jp-goal'},
      ico('target', 'jp-goal-ico'),
      h('div', {class: 'jp-goal-text'}, h('strong', {}, tr('My goal', 'המטרה שלי')), h('span', {}, goal ? goal.title : tr('Set a goal — anything that matters to you', 'הגדירו מטרה — כל דבר שחשוב לכם'))),
      h('button', {type: 'button', class: 'jp-goal-edit', 'aria-label': goal ? tr('Edit goals', 'עריכת המטרות') : tr('Add a goal', 'הוספת מטרה'), onclick: () => { if (goal) clickTab('goals'); else { const add = document.querySelector('[data-add="goals"]'); if (add) add.click(); } }}, ico('pencil')));
    const open = p.actions.filter(a => a.status !== 'done');
    const steps = [...open, ...p.actions.filter(a => a.status === 'done')].slice(0, 3);
    const stepsBox = h('div', {class: 'jp-steps'}, steps.length ? steps.map(a => h('label', {class: 'jp-step' + (a.status === 'done' ? ' jp-step-done' : '')},
      h('span', {class: 'jp-step-title'}, a.title),
      h('input', {type: 'checkbox', checked: a.status === 'done' || undefined, onchange: e => { attempt(() => Store.upsert('actions', {...a, status: e.target.checked ? 'done' : 'todo'})); say(e.target.checked ? tr('Well done ✓', 'כל הכבוד ✓') : tr('Updated', 'עודכן')); paintAll(); }}))) :
      [quickAdd()]);
    const skillNames = [...p.skills.filter(x => x.confirmed && x.evidence).map(x => he() ? (x.he || x.en) : (x.en || x.he)),
      ...(p.lifeSkills || []).map(x => he() ? (x.he || x.en) : (x.en || x.he)), ...(p.manualSkills || []).map(x => x.name)].filter(Boolean);
    const skillsBox = h('div', {class: 'jp-chips'}, skillNames.length ? skillNames.slice(0, 8).map(n => h('span', {class: 'jp-chip'}, n)) :
      [h('a', {class: 'jp-chip jp-chip-add', href: './skills-business.html?lang=' + (he() ? 'he' : 'en')}, tr('+ Discover your skills', '+ גילוי הכישורים שלי'))]);
    // week strip: 5 days starting today (reference shows 5 day cards, today selected)
    const days = h('div', {class: 'jp-week'});
    const names = he() ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const detail = h('div', {class: 'jp-week-detail', 'aria-live': 'polite'});
    for (let i = 0; i < 5; i++) {
      const d = new Date(); d.setDate(d.getDate() + i - 2); const k = todayKey(d); // today in the middle, like the reference
      const items = p.actions.filter(a => a.dueDate === k);
      const b = h('button', {type: 'button', class: 'jp-wday' + (k === selectedDay ? ' jp-wday-on' : ''), 'aria-pressed': String(k === selectedDay), onclick: () => { selectedDay = k; paintAll(); }},
        h('span', {}, names[d.getDay()] + "'"), h('strong', {}, String(d.getDate())), h('i', {class: items.length ? 'jp-wdot' : 'jp-wdot jp-wdot-empty'}));
      days.append(b);
      if (k === selectedDay) detail.append(daySheet(p, k));
    }
    // order days so the first (today) is at the start side; reference shows today highlighted in the middle area
    const link = (p.links || [])[0];
    const linksCard = h('div', {class: 'jp-linkcard'}, link ? h('a', {href: link.url, target: '_blank', rel: 'noopener noreferrer', class: 'jp-link'}, h('span', {class: 'jp-link-text'}, h('strong', {}, link.title), h('small', {dir: 'ltr'}, link.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))), ico('ext', 'jp-link-ext')) :
      h('button', {type: 'button', class: 'jp-link', onclick: () => { const el = $('jpLinks'); if (el) el.scrollIntoView({behavior: 'smooth'}); }}, h('span', {class: 'jp-link-text'}, h('strong', {}, tr('Save a useful link', 'שמירת קישור שימושי')), h('small', {}, tr('Official forms, job sites…', 'טפסים רשמיים, אתרי משרות…'))), ico('ext', 'jp-link-ext')));
    const sec = (title, iconName, extra, body) => h('section', {class: 'jp-sec'}, h('div', {class: 'jp-sec-head'}, h('h2', {}, ico(iconName, 'jp-sec-ico'), title), extra || null), body);
    top.replaceChildren(
      h('div', {class: 'jp-head'}, ico('calendar', 'jp-head-ico'), h('h1', {}, tr('My Journey', 'המסע שלי')), h('a', {class: 'jp-back', href: companionBase() + '#home', 'aria-label': tr('Back to Companion', 'חזרה למלווה')}, ico('back'))),
      goalCard,
      sec(tr('Next steps', 'הצעדים הבאים'), 'leaf', h('button', {type: 'button', class: 'jp-all', onclick: () => clickTab('actions')}, tr('Show all →', 'הצג הכל ←')), stepsBox),
      sec(tr('My skills', 'הכישורים שלי'), 'star', null, h('div', {class: 'jp-card'}, skillsBox)),
      sec(tr('Schedule planning', 'תכנון לוח זמנים'), 'calendar', null, h('div', {}, days, detail)),
      sec(tr('Saved links', 'קישורים שמורים'), 'link', null, linksCard),
      h('div', {class: 'jp-more-head'}, h('span', {}, tr('All details', 'כל הפרטים')), h('button', {type: 'button', class: 'jp-lang', onclick: () => $('language') && $('language').click()}, he() ? 'English' : 'עברית'))
    );
    bottomNav.setAttribute('aria-label', tr('Main navigation', 'ניווט ראשי'));
    bottomNav.replaceChildren(
      h('a', {href: companionBase() + '#home'}, ico('home'), h('span', {}, tr('Home', 'בית'))),
      h('a', {href: companionBase() + '?view=chat'}, ico('chat'), h('span', {}, tr('Chat', "צ'אט"))),
      h('a', {href: '#', 'aria-current': 'page', onclick: e => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }}, ico('calendar'), h('span', {}, tr('My Journey', 'המסע שלי'))),
      h('a', {href: companionBase() + '?page=help'}, ico('person'), h('span', {}, tr('Me', 'אישי'))));
  }
  document.body.append(printArea);

  const ENCOURAGE_HE = ['כל צעד קטן נחשב.', 'זה בסדר לא לדעת עדיין.', 'כל הכבוד שחזרת לכאן.', 'אין קצב אחד נכון.'];
  const ENCOURAGE_EN = ['Every small step counts.', "It's okay not to know yet.", 'Good to see you back here.', "There's no single right pace."];

  function paintProgress(p) {
    const total = p.actions.length, done = p.actions.filter(a => a.status === 'done').length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const list = he() ? ENCOURAGE_HE : ENCOURAGE_EN;
    const weekAgo = Date.now() - 7 * 864e5;
    const doneWeek = p.actions.filter(a => a.status === 'done' && Date.parse(a.updatedAt || a.createdAt || 0) >= weekAgo).length;
    const activeGoals = p.goals.filter(g => g.status !== 'achieved').length;
    const open = total - done;
    const stat = (n, label) => h('div', {class: 'jp-stat'}, h('strong', {}, String(n)), h('span', {}, label));
    progress.replaceChildren(
      h('h2', {}, tr('Your progress', 'ההתקדמות שלך')),
      h('div', {class: 'jp-stats'}, stat(activeGoals, tr('active goals', 'מטרות פעילות')), stat(open, tr('open steps', 'צעדים פתוחים')), stat(doneWeek, tr('done this week', 'הושלמו השבוע'))),
      h('div', {class: 'jp-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': tr('Steps completed', 'צעדים שהושלמו')}, h('div', {class: 'jp-fill', style: 'width:' + pct + '%'})),
      h('p', {class: 'muted'}, total ? list[(done + total) % list.length] + (pct === 100 ? ' 🎉' : '') : tr('No steps yet — that is completely fine. One small step is enough to start.', 'עדיין אין צעדים — זה בסדר גמור. מספיק צעד קטן אחד כדי להתחיל.')),
      h('div', {class: 'actions'}, h('a', {class: 'button', href: companionUrl()}, tr('← Companion home', '→ לבית המלווה')))
    );
  }

  // One day: its steps (move to another day, mark done) + add a step for this day (brief §1.1, §4.3).
  function daySheet(p, k) {
    const items = p.actions.filter(a => a.dueDate === k);
    const nice = (() => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(he() ? 'he-IL' : 'en-GB', {weekday: 'long', day: 'numeric', month: 'long'}); })();
    const input = h('input', {type: 'text', maxlength: '160', placeholder: tr('A small step for this day…', 'צעד קטן ליום הזה…'), 'aria-label': tr('New step', 'צעד חדש')});
    const add = () => {
      const t = input.value.trim(); if (!t) { input.focus(); return; }
      if (attempt(() => Store.upsert('actions', {title: t, status: 'todo', dueDate: k})) !== null) { say(tr('Step added to ' + nice + ' ✓', 'הצעד נוסף ל' + nice + ' ✓')); selectedDay = k; paintAll(); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    return h('div', {class: 'jp-daysheet'},
      h('strong', {class: 'jp-daysheet-title'}, nice),
      items.length ? h('ul', {class: 'jp-daylist'}, items.map(a => {
        const move = h('input', {type: 'date', value: a.dueDate || '', 'aria-label': tr('Move to another day', 'להעביר ליום אחר')});
        move.addEventListener('change', () => { if (!move.value) return; attempt(() => Store.upsert('actions', {...a, dueDate: move.value})); say(tr('Step moved ✓', 'הצעד הועבר ✓')); paintAll(); });
        const cb = h('input', {type: 'checkbox', checked: a.status === 'done' || undefined, 'aria-label': tr('Done', 'בוצע')});
        cb.addEventListener('change', () => { attempt(() => Store.upsert('actions', {...a, status: cb.checked ? 'done' : 'todo'})); say(cb.checked ? tr('Well done ✓', 'כל הכבוד ✓') : tr('Updated', 'עודכן')); paintAll(); });
        return h('li', {class: a.status === 'done' ? 'is-done' : ''}, h('label', {}, cb, h('span', {}, safeDisplay(a.title))), move);
      })) : h('p', {class: 'muted mini'}, tr('Nothing planned for this day yet.', 'עוד אין צעדים ליום הזה.')),
      h('div', {class: 'jp-dayadd'}, input, h('button', {type: 'button', class: 'button', onclick: add}, tr('Add', 'הוספה'))));
  }

  let monthOffset = 0;
  let calSelected = todayKey();
  function paintCalendar(p) {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + monthOffset);
    const y = base.getFullYear(), m = base.getMonth();
    const key = d => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const byDay = {};
    p.actions.filter(a => a.dueDate && a.dueDate.startsWith(key(1).slice(0, 7))).forEach(a => { (byDay[a.dueDate] = byDay[a.dueDate] || []).push(a); });
    const days = new Date(y, m + 1, 0).getDate(), first = new Date(y, m, 1).getDay();
    const weekdays = he() ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const grid = h('div', {class: 'jp-cal', role: 'grid', 'aria-label': tr('Planned steps calendar', 'לוח צעדים מתוכננים')}, weekdays.map(w => h('div', {class: 'jp-wd', role: 'columnheader'}, w)));
    for (let i = 0; i < first; i++) grid.append(h('div', {class: 'jp-day jp-empty'}));
    const today = new Date(); const todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const detail = h('div', {class: 'jp-cal-detail', 'aria-live': 'polite'});
    for (let d = 1; d <= days; d++) {
      const items = byDay[key(d)] || [];
      const cell = h('button', {type: 'button', class: 'jp-day' + (key(d) === todayKey ? ' jp-today' : '') + (items.length ? ' jp-has' : ''), role: 'gridcell',
        'aria-label': d + (key(d) === todayKey ? tr(' (today)', ' (היום)') : '') + (items.length ? ' — ' + items.length + tr(' steps', ' צעדים') : ''), 'aria-current': key(d) === todayKey ? 'date' : null, onclick: () => {
          calSelected = key(d);
          grid.querySelectorAll('.jp-sel').forEach(x => x.classList.remove('jp-sel')); cell.classList.add('jp-sel');
          detail.replaceChildren(daySheet(p, calSelected));
        }}, String(d), items.length ? h('span', {class: 'jp-dot', 'aria-hidden': 'true'}, items.length > 1 ? String(items.length) : '') : null);
      if (key(d) === calSelected) cell.classList.add('jp-sel');
      grid.append(cell);
    }
    if (calSelected.startsWith(key(1).slice(0, 7))) detail.replaceChildren(daySheet(p, calSelected));
    else detail.replaceChildren(h('p', {class: 'muted mini'}, tr('Tap a day to see or add steps.', 'לוחצים על יום כדי לראות או להוסיף צעדים.')));
    const title = base.toLocaleDateString(he() ? 'he-IL' : 'en-GB', {month: 'long', year: 'numeric'});
    const undated = p.actions.filter(a => !a.dueDate && a.status !== 'done').length;
    calendar.replaceChildren(h('div', {class: 'topline'}, h('h2', {}, tr('Calendar of planned steps', 'לוח שנה של צעדים מתוכננים')),
      h('div', {class: 'actions'}, h('button', {type: 'button', class: 'small', onclick: () => { monthOffset--; paintAll(); }}, tr('‹ Previous', '› הקודם')), h('strong', {}, title), h('button', {type: 'button', class: 'small', onclick: () => { monthOffset++; paintAll(); }}, tr('Next ›', 'הבא ‹')))),
      grid, detail, undated ? h('p', {class: 'muted mini'}, tr(undated + ' open steps have no date. Add a date in "Edit" to see them here.', 'ל-' + undated + ' צעדים פתוחים אין תאריך. אפשר להוסיף תאריך ב"עריכה" כדי לראות אותם כאן.')) : null);
  }

  function paintLinks(p) {
    const title = h('input', {type: 'text', maxlength: '160', placeholder: tr('Name (e.g. Personal area)', 'שם (למשל: האזור האישי)'), 'aria-label': tr('Link name', 'שם הקישור')});
    const url = h('input', {type: 'url', maxlength: '500', placeholder: 'https://', 'aria-label': tr('Link address', 'כתובת הקישור'), dir: 'ltr'});
    links.replaceChildren(h('h2', {}, tr('My saved links', 'קישורים ששמרתי')),
      p.links && p.links.length ? h('ul', {class: 'jp-links'}, p.links.map(l => h('li', {}, h('a', {href: l.url, target: '_blank', rel: 'noopener noreferrer'}, l.title + ' ↗'), ' ',
        h('button', {type: 'button', class: 'small quiet', 'aria-label': tr('Remove ', 'הסרת ') + l.title, onclick: () => { attempt(() => Store.removeLink(l.id)); paintAll(); }}, '✕')))) : h('p', {class: 'muted'}, tr('Save official forms and pages you want to come back to.', 'אפשר לשמור טפסים ועמודים רשמיים שתרצו לחזור אליהם.')),
      h('div', {class: 'grid jp-form'}, h('div', {class: 'field'}, title), h('div', {class: 'field'}, url)),
      h('button', {type: 'button', class: 'primary', onclick: () => {
        if (attempt(() => Store.addLink({title: title.value, url: url.value.trim()}))) { say(tr('Saved ✓', 'נשמר ✓')); paintAll(); }
      }}, tr('Save link', 'שמירת קישור')));
  }

  function paintManualSkills(p) {
    const name = h('input', {type: 'text', maxlength: '120', placeholder: tr('Skill name', 'שם הכישור'), 'aria-label': tr('Skill name', 'שם הכישור')});
    const ev = h('textarea', {maxlength: '1500', rows: '2', placeholder: tr('Your example (optional, no classified details)', 'דוגמה שלך (רשות, בלי פרטים מסווגים)'), 'aria-label': tr('Your example', 'הדוגמה שלך')});
    const p36 = p.skills.filter(x => x.confirmed && x.evidence).length + (p.manualSkills || []).filter(x => x.evidence).length;
    manual.replaceChildren(h('hr'), h('h3', {}, tr('Skills I added myself', 'כישורים שהוספתי בעצמי')),
      h('p', {class: 'muted'}, tr('Anything beyond the 36 — languages, a craft, a license, a hobby you are good at.', 'כל מה שמעבר ל-36: שפות, מקצוע, רישיון, תחביב שאתם טובים בו.')),
      ...(p.manualSkills || []).map(s => h('div', {class: 'record'}, h('div', {class: 'heading'}, h('h3', {}, s.name),
        h('button', {type: 'button', class: 'small danger', onclick: () => { if (confirm(tr('Remove this skill?', 'להסיר את הכישור?'))) { attempt(() => Store.removeManualSkill(s.id)); paintAll(); } }}, tr('Remove', 'הסרה'))), s.evidence ? h('p', {}, s.evidence) : null)),
      h('div', {class: 'field'}, name), h('div', {class: 'field'}, ev),
      h('button', {type: 'button', class: 'primary', onclick: () => { if (attempt(() => Store.addManualSkill({name: name.value, evidence: ev.value}))) { say(tr('Saved ✓', 'נשמר ✓')); paintAll(); } }}, tr('Add skill', 'הוספת כישור')),
      p36 ? h('div', {class: 'privacy-note'}, h('strong', {}, tr('Ready for a CV?', 'מוכנים לקורות חיים?')), ' ',
        tr('You have ' + p36 + ' skills with your own examples. The Companion can draft a CV from them — without inventing anything.', 'יש לך ' + p36 + ' כישורים עם דוגמאות משלך. המלווה יכול להכין מהם טיוטת קורות חיים — בלי להמציא כלום.'), ' ',
        h('a', {href: (he() ? './indexH.html' : './index.html') + '?view=chat', class: 'button primary', onclick: () => { try { sessionStorage.setItem('momentum-plus-draft', tr('Draft a CV from my confirmed skills, without inventing anything.', 'הכן טיוטת קורות חיים מהכישורים שאישרתי, בלי להמציא פרטים.')); } catch (_) {} }}, tr('Draft my CV', 'טיוטת קורות חיים'))) : null);
  }

  function summaryText(p, parts) {
    const L = [];
    L.push(tr('My Journey — summary', 'המסע שלי — סיכום') + ' (' + new Date().toLocaleDateString(he() ? 'he-IL' : 'en-GB') + ')', '');
    if (parts.goals && p.goals.length) { L.push(tr('Goals:', 'מטרות:')); p.goals.forEach(g => L.push('• ' + g.title + ' [' + g.status + ']' + (g.targetDate ? ' — ' + g.targetDate : ''))); L.push(''); }
    if (parts.actions && p.actions.length) { L.push(tr('Steps:', 'צעדים:')); p.actions.forEach(a => L.push((a.status === 'done' ? '✓ ' : '• ') + a.title + (a.dueDate ? ' — ' + a.dueDate : '') + (a.notes && parts.notes ? '\n   ' + a.notes.replace(/\n/g, ' ').slice(0, 200) : ''))); L.push(''); }
    if (parts.education && p.education.length) { L.push(tr('Study plans:', 'תוכניות לימוד:')); p.education.forEach(e => L.push('• ' + e.title + (e.institution ? ' — ' + e.institution : '') + ' [' + e.status + ']')); L.push(''); }
    if (parts.skills) {
      const sk = p.skills.filter(x => x.confirmed && x.evidence).map(x => (he() ? (x.he || x.en) : (x.en || x.he)) + ' (' + x.rating + '/7)');
      (p.manualSkills || []).forEach(x => sk.push(x.name));
      if (sk.length) { L.push(tr('Skills:', 'כישורים:')); sk.forEach(s => L.push('• ' + s)); L.push(''); }
    }
    return L.join('\n').trim();
  }

  function paintTools(p) {
    const box = (id, label, checked) => h('label', {class: 'switch-row'}, h('input', {type: 'checkbox', id, checked: checked || undefined}), h('span', {}, label));
    const parts = () => ({goals: $('jpG').checked, actions: $('jpA').checked, education: $('jpE').checked, skills: $('jpS').checked, notes: $('jpN').checked});
    tools.replaceChildren(h('h2', {}, tr('Export and share', 'ייצוא ושיתוף')),
      h('p', {class: 'muted'}, tr('Choose what to include. Nothing is sent automatically.', 'בוחרים מה לכלול. שום דבר לא נשלח אוטומטית.')),
      box('jpG', tr('Goals', 'מטרות'), true), box('jpA', tr('Steps', 'צעדים'), true), box('jpE', tr('Study plans', 'תוכניות לימוד'), true), box('jpS', tr('Skills', 'כישורים'), true), box('jpN', tr('Personal notes on steps', 'הערות אישיות על צעדים'), false),
      h('div', {class: 'actions'},
        h('button', {type: 'button', class: 'primary', onclick: () => printSummary(summaryText(read(), parts()))}, tr('Save as PDF / print', 'שמירה כ-PDF / הדפסה')),
        h('button', {type: 'button', onclick: () => shareWithCounselor(summaryText(read(), parts()))}, tr('Share with a counselor', 'שיתוף עם יועץ/ת'))),
      h('p', {class: 'muted mini'}, tr('Printing opens your device\'s print dialog — choose "Save as PDF" there.', 'ההדפסה פותחת את חלון ההדפסה של המכשיר — שם בוחרים "שמירה כ-PDF".')));
  }
  function printSummary(text) {
    printArea.replaceChildren(h('pre', {dir: he() ? 'rtl' : 'ltr'}, text));
    window.print();
  }
  async function shareWithCounselor(text) {
    if (!confirm(tr('This creates a text summary with the parts you chose. You decide where to send it. Continue?', 'ייווצר סיכום טקסט עם החלקים שבחרת, ואת/ה מחליט/ה למי לשלוח אותו. להמשיך?'))) return;
    try { if (navigator.share) { await navigator.share({title: tr('My Journey summary', 'סיכום המסע שלי'), text}); return; } } catch (_) { return; }
    try { await navigator.clipboard.writeText(text); say(tr('Summary copied. Paste it into a message to your counselor.', 'הסיכום הועתק. אפשר להדביק אותו בהודעה ליועץ/ת.')); }
    catch (_) { printSummary(text); }
  }

  function paintAll() {
    const p = read(); if (!p) return;
    paintTop(p); paintProgress(p); paintCalendar(p); paintLinks(p); paintTools(p); paintManualSkills(p);
  }
  // my-journey.js re-renders its own sections; repaint ours after it (and after language changes).
  let queued = false;
  const queue = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; paintAll(); }, 0); };
  if ($('stats')) new MutationObserver(queue).observe($('stats'), {childList: true});
  new MutationObserver(queue).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  window.addEventListener('storage', queue);
  paintAll();
})();
