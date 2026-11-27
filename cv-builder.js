/* cv-builder.js — "Build my CV" (27 Nov 2026).
   Guided, private CV builder for discharged soldiers: 3 steps, live preview, military→civilian wording,
   optional AI polish (same consent gate as the chat, never invents numbers), clean ATS-friendly text PDF
   generated on the device (pdf-maker.js) and saved to My Journey. */
(function () {
  'use strict';
  window.MomentumCV = function (ctx) {
    const {h, btn, tr, he, illu, P, store, toast, showPage, aiText, Journey} = ctx;
    const ACCENT = '#1F3A5F', ACCENT2 = '#2E6B8A', GREY = '#55606A';

    const blank = () => ({lang: he() ? 'he' : 'en', first: '', last: '', phone: '', email: '', city: '', linkedin: '', headline: '', summary: '',
      milRole: '', milFrom: '', milTo: '', story: '', people: '', systems: '', results: '', bullets: [], education: '', skills: '', languages: '', extra: ''});
    const cv = () => { if (!P.cv || typeof P.cv !== 'object') P.cv = blank(); const b = blank(); for (const k in b) if (P.cv[k] === undefined) P.cv[k] = b[k]; if (!Array.isArray(P.cv.bullets)) P.cv.bullets = []; return P.cv; };
    let step = 0;

    /* ---------- military → civilian wording (local, no network) ---------- */
    const W = src => new RegExp('(^|[^\u0590-\u05FFA-Za-z])((?:ו|ב|ל|ה|מ|ש|כ){0,2})(' + src + ')(?![\u0590-\u05FFA-Za-z])', 'g');
    const JARGON_HE = [
      [W('מ"?כ|מפקד כיתה'), 'ראש צוות'],
      [W('מ"?מ|מפקד מחלקה'), 'מנהל צוות'],
      [W('מ"?פ|מפקד פלוגה'), 'מנהל יחידה'],
      [W('רס"?ר'), 'אחראי לוגיסטיקה ומשמעת'],
      [W('סמ"?ל'), 'סגן ראש צוות'],
      [W('קשר"?ג'), 'אחראי מערכות תקשורת'],
      [W('אפסנאי'), 'אחראי מלאי וציוד'],
      [W('ש"?ג'), 'אבטחה ובקרת כניסה'],
      [W('תש"?ש'), 'תמיכה ברווחת עובדים'],
      [W('מש"?קית ת"?ש'), 'רכזת רווחה ותמיכה בעובדים'],
      [W('חפ"?ק'), 'צוות ניהול שטח'],
      [W('שמ"?פ'), 'יחידת מילואים'],
      [W('מחלקה'), 'צוות'],
      [W('כיתה'), 'צוות'],
      [W('פלוגה'), 'יחידה'],
      [W('גדוד'), 'יחידה של מאות אנשים'],
      [W('חטיבה'), 'ארגון גדול'],
      [W('מבצעית'), 'תפעולית'],
      [W('מבצעי'), 'תפעולי'],
      [W('תרגילים'), 'אימונים מעשיים'],
      [W('שמירות'), 'משמרות אבטחה'],
      [W('חיילים'), 'אנשים'],
      [W('לוחמים'), 'אנשי צוות']
    ];
    const JARGON_EN = [[/\bsquad leader\b/gi, 'team leader'], [/\bplatoon\b/gi, 'team'], [/\bcompany\b/gi, 'unit'], [/\bbattalion\b/gi, 'organisation of several hundred people'],
      [/\bsoldiers\b/gi, 'people'], [/\bmission(s)?\b/gi, 'project$1'], [/\bdrills\b/gi, 'hands-on training'], [/\bguard duty\b/gi, 'security shifts'], [/\boperational\b/gi, 'operations']];
    const isHe = t => /[\u0590-\u05FF]/.test(String(t || ''));
    const civilian = t => isHe(t) ? JARGON_HE.reduce((s, [re, to]) => s.replace(re, (m, pre, pfx) => pre + (pfx || '') + to), String(t || '')) : JARGON_EN.reduce((s, [re, to]) => s.replace(re, to), String(t || ''));
    const jargonFound = t => { const hits = []; (isHe(t) ? JARGON_HE : JARGON_EN).forEach(([re]) => { const m = new RegExp(re.source, re.flags.replace('g', '')).exec(String(t)); if (m) hits.push((m[3] || m[0]).trim()); }); return [...new Set(hits)]; };
    function localBullets(c) {
      const H = c.lang === 'he', out = [];
      if (c.people) out.push(H ? 'הובלתי צוות של ' + c.people + ' אנשים — תכנון משימות, חלוקת עבודה וליווי אישי.' : 'Led a team of ' + c.people + ' people — planning tasks, dividing work and supporting each person.');
      if (c.systems) out.push(H ? 'עבדתי באחריות עם ' + civilian(c.systems) + '.' : 'Worked responsibly with ' + civilian(c.systems) + '.');
      if (c.results) out.push(civilian(c.results));
      if (c.story) civilian(c.story).split(/[\n.]+/).map(x => x.trim()).filter(x => x.length > 12).slice(0, 4).forEach(x => out.push(x.replace(/^[-•*]\s*/, '') + '.'));
      return [...new Set(out)].slice(0, 6);
    }

    /* ---------- preview (same structure as the PDF) ---------- */
    const L = c => c.lang === 'he'
      ? {summary: 'תקציר', exp: 'ניסיון', mil: 'שירות צבאי', edu: 'השכלה וקורסים', skills: 'כישורים', langs: 'שפות', extra: 'התנדבות וניסיון נוסף'}
      : {summary: 'Summary', exp: 'Experience', mil: 'Military service', edu: 'Education & courses', skills: 'Skills', langs: 'Languages', extra: 'Volunteering & other experience'};
    const contactLine = c => [c.phone, c.email, c.city, c.linkedin].filter(Boolean).join(' · ');
    const lines = s => String(s || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
    const splitList = s => String(s || '').split(/[,\n]+/).map(x => x.trim()).filter(Boolean);
    function preview() {
      const c = cv(), l = L(c);
      const sec = (title, ...kids) => kids.flat().filter(Boolean).length ? h('section', {}, h('h4', {}, title), ...kids) : null;
      return h('div', {class: 'cv-preview', dir: c.lang === 'he' ? 'rtl' : 'ltr', lang: c.lang},
        h('div', {class: 'cv-name'}, [c.first, c.last].filter(Boolean).join(' ') || (c.lang === 'he' ? 'השם שלך' : 'Your name')),
        c.headline ? h('div', {class: 'cv-head'}, c.headline) : null,
        contactLine(c) ? h('div', {class: 'cv-contact'}, contactLine(c)) : null,
        h('hr'),
        sec(l.summary, c.summary ? h('p', {}, c.summary) : null),
        sec(l.exp, (c.milRole || c.bullets.length) ? [h('p', {class: 'cv-role'}, h('b', {}, c.milRole || l.mil), (c.milFrom || c.milTo) ? h('span', {}, '  ' + [c.milFrom, c.milTo].filter(Boolean).join('–')) : null),
          h('ul', {}, c.bullets.filter(Boolean).map(b => h('li', {}, b)))] : null),
        sec(l.edu, lines(c.education).map(x => h('p', {}, x))),
        sec(l.skills, splitList(c.skills).length ? h('p', {}, splitList(c.skills).join(' · ')) : null),
        sec(l.langs, splitList(c.languages).length ? h('p', {}, splitList(c.languages).join(' · ')) : null),
        sec(l.extra, lines(c.extra).map(x => h('p', {}, x))));
    }

    /* ---------- PDF ---------- */
    async function makePdf() {
      const c = cv(), l = L(c), rtl = c.lang === 'he';
      if (!window.MomentumPDF) { toast(tr('PDF is not available', 'PDF לא זמין')); return null; }
      const d = window.MomentumPDF.create({dir: rtl ? 'rtl' : 'ltr', lang: c.lang, title: [c.first, c.last].filter(Boolean).join(' ') + ' — CV', margin: 52});
      await d.ready();
      const dir = rtl ? 'rtl' : 'ltr';
      const name = [c.first, c.last].filter(Boolean).join(' ') || ' ';
      // Header: soft band, large name, civilian headline, contact line
      d.rect(0, d.H - 6, d.W, 6, ACCENT);
      d.space(4);
      d.text(name, {size: 26, bold: true, color: ACCENT, dir, lineHeight: 1.2});
      if (c.headline) { d.space(3); d.text(c.headline, {size: 13.5, color: ACCENT2, dir}); }
      if (contactLine(c)) { d.space(3); d.text(contactLine(c), {size: 10, color: GREY, dir}); }
      d.space(6); d.rule({color: ACCENT, width: 1.4, gap: 6});
      const head = t => { d.keep(54); d.space(8); d.heading(t, {size: 12.5, color: ACCENT, dir, marker: ACCENT2}); d.rule({color: '#D5DEE7', width: 0.6, gap: 4}); };
      const body = {size: 10.6, dir, color: '#1C232B', lineHeight: 1.5};
      if (c.summary) { head(l.summary); d.text(c.summary, body); }
      if (c.milRole || c.bullets.filter(Boolean).length) {
        head(l.exp);
        d.twoSided((c.milRole || l.mil), [c.milFrom, c.milTo].filter(Boolean).join(' – '), {size: 11.2, bold: true, dir, color: '#1C232B', color2: GREY});
        d.space(3);
        c.bullets.filter(Boolean).forEach(b => { d.bullet(b, {...body, dotColor: ACCENT2}); d.space(2); });
      }
      if (lines(c.education).length) { head(l.edu); lines(c.education).forEach(x => { d.text(x, body); d.space(1); }); }
      if (splitList(c.skills).length) { head(l.skills); d.text(splitList(c.skills).join('  ·  '), body); }
      if (splitList(c.languages).length) { head(l.langs); d.text(splitList(c.languages).join('  ·  '), body); }
      if (lines(c.extra).length) { head(l.extra); lines(c.extra).forEach(x => { d.text(x, body); d.space(1); }); }
      const safe = x => String(x || '').trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_|_$/g, '');
      const file = [safe(c.first), safe(c.last)].filter(Boolean).join('_') || 'My';
      return {doc: d, file: file + '_CV.pdf'};
    }

    /* ---------- AI polish (optional, never invents) ---------- */
    async function polish(statusEl) {
      const c = cv();
      const H = c.lang === 'he';
      const system = (H ? 'אתה עוזר לכתוב קורות חיים לחיילים משוחררים בישראל. כתוב בעברית.' : 'You help discharged Israeli soldiers write CVs. Write in English.') +
        ' Rules: never invent experience, numbers, ranks, dates or achievements; use only facts the user gave. Replace military jargon and acronyms with plain civilian language. Use "I" actions, lead with civilian value, one line per bullet, 4-6 bullets. Return ONLY JSON: {"headline":"...","summary":"2-3 lines","bullets":["..."]}.';
      const prompt = 'Military role: ' + c.milRole + '\nPeople led: ' + (c.people || 'not given') + '\nSystems/equipment: ' + (c.systems || 'not given') + '\nResults: ' + (c.results || 'not given') + '\nStory: ' + c.story + '\nCurrent bullets: ' + c.bullets.join(' | ') + '\nTarget role: ' + (c.headline || 'not given');
      statusEl.textContent = tr('Asking the AI (after your approval)…', 'שולח ל-AI (אחרי אישור שלך)…');
      try {
        const raw = await aiText(system, prompt, 900);
        const json = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]);
        if (Array.isArray(json.bullets) && json.bullets.length) c.bullets = json.bullets.map(String).slice(0, 8);
        if (json.summary && !c.summary) c.summary = String(json.summary);
        if (json.headline && !c.headline) c.headline = String(json.headline);
        store(); statusEl.textContent = tr('Done — please read every line and fix anything that is not accurate.', 'מוכן — קרא כל שורה ותקן כל דבר שלא מדויק.'); paint();
      } catch (e) {
        statusEl.textContent = e.canceled ? tr('Nothing was sent.', 'לא נשלח כלום.') : tr('Could not get AI wording: ', 'לא הצלחתי לקבל ניסוח מה-AI: ') + e.message + tr(' — you can use the civilian translator instead.', ' — אפשר להשתמש במתרגם האזרחי במקום.');
      }
    }

    /* ---------- UI ---------- */
    const field = (key, label, attrs, multiline) => {
      const c = cv();
      const el = multiline ? h('textarea', Object.assign({rows: '4'}, attrs || {})) : h('input', Object.assign({type: 'text'}, attrs || {}));
      el.value = c[key] || '';
      el.addEventListener('input', () => { cv()[key] = el.value; store(); refreshPreview(); });
      return h('label', {class: 'cv-field'}, h('span', {}, label), el);
    };
    let previewBox = null, root = null;
    const refreshPreview = () => { if (previewBox) previewBox.replaceChildren(preview()); };

    function stepDetails() {
      const c = cv();
      return [h('h2', {class: 'cv-step-title'}, tr('Your details', 'הפרטים שלך')),
        h('div', {class: 'cv-lang'}, h('span', {}, tr('CV language', 'שפת קורות החיים')),
          h('div', {class: 'plus-wiz-seg'}, ['he', 'en'].map(lg => h('button', {type: 'button', class: c.lang === lg ? 'is-on' : '', onclick: () => { cv().lang = lg; store(); paint(); }}, lg === 'he' ? 'עברית' : 'English')))),
        h('div', {class: 'cv-grid'}, field('first', tr('First name', 'שם פרטי'), {autocomplete: 'given-name'}), field('last', tr('Last name', 'שם משפחה'), {autocomplete: 'family-name'})),
        field('headline', tr('Job you are aiming for (civilian title)', 'התפקיד שאתה מכוון אליו (שם אזרחי)'), {placeholder: tr('e.g. Operations coordinator', 'למשל: רכז תפעול')}),
        h('div', {class: 'cv-grid'}, field('phone', tr('Phone', 'טלפון'), {type: 'tel', inputmode: 'tel', dir: 'ltr', autocomplete: 'tel'}), field('email', tr('Email', 'אימייל'), {type: 'email', dir: 'ltr', autocomplete: 'email'})),
        h('div', {class: 'cv-grid'}, field('city', tr('City', 'עיר')), field('linkedin', tr('LinkedIn (optional)', 'לינקדאין (לא חובה)'), {dir: 'ltr'}))];
    }
    function stepService() {
      const c = cv();
      const status = h('p', {class: 'plus-muted', 'aria-live': 'polite'});
      const warn = h('p', {class: 'cv-jargon', 'aria-live': 'polite'});
      const checkJargon = () => { const j = jargonFound([c.milRole, c.results, ...c.bullets].join(' ')); warn.textContent = j.length ? tr('Military words an interviewer may not know: ', 'מילים צבאיות שמראיין אולי לא יבין: ') + j.join(', ') + tr(' — press “Translate to civilian lines”.', ' — לחץ על "תרגם לשורות אזרחיות".') : ''; };
      const bulletsBox = h('div', {class: 'cv-bullets'});
      const paintBullets = () => {
        bulletsBox.replaceChildren(...c.bullets.map((b, i) => {
          const ta = h('textarea', {rows: '2', 'aria-label': tr('Bullet ', 'שורה ') + (i + 1)}); ta.value = b;
          ta.addEventListener('input', () => { c.bullets[i] = ta.value; store(); refreshPreview(); checkJargon(); });
          return h('div', {class: 'cv-bullet'}, ta, btn('✕', () => { c.bullets.splice(i, 1); store(); paintBullets(); refreshPreview(); }, 'cv-del'));
        }), btn(tr('+ Add a line', '+ הוספת שורה'), () => { c.bullets.push(''); store(); paintBullets(); }, 'plus-link'));
      };
      paintBullets(); checkJargon();
      return [h('h2', {class: 'cv-step-title'}, tr('Your service, in civilian words', 'השירות שלך, במילים אזרחיות')),
        field('milRole', tr('What was your role? (plain words)', 'מה היה התפקיד שלך? (במילים פשוטות)'), {placeholder: tr('e.g. Team leader in a field unit', 'למשל: ראש צוות ביחידת שטח')}),
        h('div', {class: 'cv-grid'}, field('milFrom', tr('From (year)', 'משנה'), {inputmode: 'numeric', placeholder: '2023'}), field('milTo', tr('To (year)', 'עד שנה'), {inputmode: 'numeric', placeholder: '2026'})),
        field('story', tr('Tell it freely — what did you actually do?', 'ספר בחופשיות — מה עשית בפועל?'), {placeholder: tr('Day to day, responsibilities, moments you are proud of…', 'היום-יום, אחריות, רגעים שאתה גאה בהם…')}, true),
        h('div', {class: 'cv-grid'}, field('people', tr('How many people did you lead? (number, optional)', 'כמה אנשים הובלת? (מספר, לא חובה)'), {inputmode: 'numeric'}), field('systems', tr('Equipment / systems / processes', 'ציוד / מערכות / תהליכים'))),
        field('results', tr('A result or improvement (only if true)', 'תוצאה או שיפור (רק אם זה נכון)')),
        h('div', {class: 'plus-row'},
          btn(tr('Translate to civilian lines', 'תרגם לשורות אזרחיות'), () => { if (c.milRole) c.milRole = civilian(c.milRole); c.bullets = c.bullets.map(civilian); const add = localBullets(c).filter(b => !c.bullets.includes(b)); c.bullets.push(...add); if (!add.length) toast(tr('Add a few details first', 'כדאי להוסיף קודם כמה פרטים')); store(); paintBullets(); refreshPreview(); checkJargon(); }, 'plus-btn primary'),
          P.infoOnly ? null : btn(tr('Polish with AI ✨', 'שיפור ניסוח עם AI ✨'), () => polish(status), 'plus-btn')),
        status, warn,
        h('strong', {class: 'cv-sub'}, tr('Lines in your CV (edit every line)', 'השורות בקורות החיים (אפשר לערוך כל שורה)')), bulletsBox,
        h('p', {class: 'plus-muted'}, tr('Tip: "I led a team of 12" beats "we were a platoon". Never add numbers that are not true.', 'טיפ: "הובלתי צוות של 12" עדיף על "היינו מחלקה". לא מוסיפים מספרים שלא נכונים.'))];
    }
    function stepMore() {
      const c = cv();
      // pre-fill skills from My Journey (confirmed skills + manual skills) the first time
      if (!c.skills) {
        try {
          const J = Journey() && Journey().read();
          const names = J ? [...(J.skills || []).filter(x => x.confirmed).map(x => he() ? (x.he || x.en) : (x.en || x.he)), ...(J.manualSkills || []).map(x => x.name)].filter(Boolean) : [];
          if (names.length) { c.skills = names.slice(0, 10).join(', '); store(); }
        } catch (_) {}
      }
      const status = h('p', {class: 'plus-muted', 'aria-live': 'polite'});
      return [h('h2', {class: 'cv-step-title'}, tr('Education, skills and summary', 'השכלה, כישורים ותקציר')),
        field('education', tr('Education & courses (one per line)', 'השכלה וקורסים (שורה לכל אחד)'), {placeholder: tr('Full matriculation — 2022\nFirst-aid course — 2024', 'בגרות מלאה — 2022\nקורס עזרה ראשונה — 2024')}, true),
        field('skills', tr('Skills (comma separated)', 'כישורים (מופרדים בפסיק)'), {placeholder: tr('Teamwork, responsibility, working under pressure', 'עבודת צוות, אחריות, עבודה תחת לחץ')}),
        field('languages', tr('Languages', 'שפות'), {placeholder: tr('Hebrew — native, English — very good', 'עברית — שפת אם, אנגלית — טובה מאוד')}),
        field('extra', tr('Volunteering / other experience (optional)', 'התנדבות / ניסיון נוסף (לא חובה)'), {}, true),
        field('summary', tr('Short professional summary (2–3 lines)', 'תקציר מקצועי קצר (2–3 שורות)'), {}, true),
        P.infoOnly ? null : btn(tr('Suggest a summary with AI ✨', 'הצעה לתקציר עם AI ✨'), () => polish(status), 'plus-btn'), status];
    }
    function paint() {
      const steps = [stepDetails, stepService, stepMore];
      const titles = [tr('Details', 'פרטים'), tr('Service', 'שירות'), tr('Finish', 'סיום')];
      previewBox = h('div', {class: 'cv-preview-box'}, preview());
      const isLast = step === steps.length - 1;
      root.replaceChildren(
        h('div', {class: 'cv-hero'}, illu('pen', 54, 'cv-hero-ill'), h('div', {}, h('h1', {}, tr('Build my CV', 'בנה קורות חיים')), h('p', {}, tr('Private, on your phone. Download a clean PDF in minutes.', 'פרטי, בטלפון שלך. PDF נקי להורדה תוך דקות.')))),
        h('ol', {class: 'cv-steps', 'aria-label': tr('Step ' + (step + 1) + ' of 3', 'שלב ' + (step + 1) + ' מתוך 3')}, titles.map((t, i) => h('li', {class: i === step ? 'on' : i < step ? 'done' : ''}, h('button', {type: 'button', onclick: () => { step = i; paint(); }}, h('b', {}, String(i + 1)), h('span', {}, t))))),
        h('p', {class: 'cv-progress'}, tr('Step ' + (step + 1) + ' of 3', 'שלב ' + (step + 1) + ' מתוך 3')),
        h('div', {class: 'cv-form'}, ...steps[step]()),
        h('div', {class: 'plus-wiz-nav'},
          step > 0 ? btn(tr('Back', 'חזרה'), () => { step--; paint(); window.scrollTo(0, 0); }, 'plus-wiz-back') : h('span'),
          isLast ? btn(tr('Download my CV (PDF)', 'הורד קורות חיים'), download, 'plus-btn primary plus-wiz-next')
            : btn(tr('Next', 'הבא'), () => { step++; paint(); const pg = document.getElementById('plusPage'); if (pg) pg.scrollTo({top: 0}); }, 'plus-btn primary plus-wiz-next')),
        h('details', {class: 'cv-preview-wrap', open: true}, h('summary', {}, tr('Live preview', 'תצוגה מקדימה חיה')), previewBox),
        isLast ? h('div', {class: 'plus-row'}, btn(tr('Save to My Journey', 'שמור במסע שלי'), saveJourney, 'plus-btn'), btn(tr('Start over', 'להתחיל מחדש'), () => { if (confirm(tr('Clear this CV?', 'למחוק את קורות החיים האלה?'))) { P.cv = blank(); store(); step = 0; paint(); } }, 'plus-link')) : null,
        h('p', {class: 'plus-muted'}, tr('Nothing leaves your phone unless you press an AI button and approve. The PDF has no logo or watermark.', 'שום דבר לא יוצא מהטלפון אלא אם לחצת על כפתור AI ואישרת. ב-PDF אין לוגו או סימן מים.')));
    }
    async function download() {
      try { const r = await makePdf(); if (!r) return; r.doc.download(r.file); toast(tr('Your CV is downloading ✓', 'קורות החיים יורדים ✓')); saveJourney(true); }
      catch (e) { toast(tr('Could not create the PDF: ', 'לא הצלחתי ליצור PDF: ') + e.message); }
    }
    function saveJourney(quiet) {
      const c = cv(), J = Journey(); if (!J) return;
      try {
        const title = (c.lang === 'he' ? 'קורות חיים — ' : 'CV — ') + ([c.first, c.last].filter(Boolean).join(' ') || (c.headline || ''));
        const existing = (J.read().cvs || []).find(x => x.title === title);
        J.upsert('cvs', {...(existing || {}), title, targetRole: c.headline, language: c.lang, summary: c.summary, bullets: c.bullets.filter(Boolean), status: 'ready'});
        if (quiet !== true) toast(tr('Saved to My Journey ✓', 'נשמר במסע שלך ✓'));
      } catch (e) { if (quiet !== true) toast(e.message); }
    }
    function cvPage() { root = h('div', {class: 'cv-builder'}); paint(); return root; }
    return {pages: {cv: cvPage}, heads: {cv: {icon: 'briefcase', title: ['Build my CV', 'בנה קורות חיים']}}};
  };
})();
