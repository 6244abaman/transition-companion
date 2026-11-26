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
    const dark = P.theme === 'dark' || ((!P.theme || P.theme === 'auto') && matchMedia('(prefers-color-scheme: dark)').matches);
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
  document.body.append(printArea);

  const ENCOURAGE_HE = ['כל צעד קטן נחשב.', 'זה בסדר לא לדעת עדיין.', 'כל הכבוד שחזרת לכאן.', 'אין קצב אחד נכון.'];
  const ENCOURAGE_EN = ['Every small step counts.', "It's okay not to know yet.", 'Good to see you back here.', "There's no single right pace."];

  function paintProgress(p) {
    const total = p.actions.length, done = p.actions.filter(a => a.status === 'done').length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const list = he() ? ENCOURAGE_HE : ENCOURAGE_EN;
    progress.replaceChildren(
      h('h2', {}, tr('Your progress', 'ההתקדמות שלך')),
      total ? h('p', {class: 'jp-big'}, tr(done + ' of ' + total + ' steps', done + ' מתוך ' + total + ' צעדים')) : h('p', {class: 'muted'}, tr('Add a first small step — it can be tiny.', 'אפשר להוסיף צעד ראשון קטן — אפילו קטן מאוד.')),
      h('div', {class: 'jp-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': tr('Steps completed', 'צעדים שהושלמו')}, h('div', {class: 'jp-fill', style: 'width:' + pct + '%'})),
      h('p', {class: 'muted'}, list[(done + total) % list.length] + (pct === 100 && total ? ' 🎉' : '')),
      h('div', {class: 'actions'}, h('a', {class: 'button', href: companionUrl()}, tr('← Companion home', '→ לבית המלווה')))
    );
  }

  let monthOffset = 0;
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
        'aria-label': d + (items.length ? ' — ' + items.length + tr(' steps', ' צעדים') : ''), onclick: () => {
          detail.replaceChildren(...(items.length ? items.map(a => h('p', {}, (a.status === 'done' ? '✓ ' : '• ') + a.title)) : [h('p', {class: 'muted'}, tr('Nothing planned for this day.', 'אין צעדים מתוכננים ליום הזה.'))]));
        }}, String(d), items.length ? h('span', {class: 'jp-dot', 'aria-hidden': 'true'}) : null);
      grid.append(cell);
    }
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
    paintProgress(p); paintCalendar(p); paintLinks(p); paintTools(p); paintManualSkills(p);
  }
  // my-journey.js re-renders its own sections; repaint ours after it (and after language changes).
  let queued = false;
  const queue = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; paintAll(); }, 0); };
  if ($('stats')) new MutationObserver(queue).observe($('stats'), {childList: true});
  new MutationObserver(queue).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  window.addEventListener('storage', queue);
  paintAll();
})();
