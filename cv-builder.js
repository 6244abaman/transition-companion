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
      milRole: '', milFrom: '', milTo: '', story: '', people: '', systems: '', results: '', bullets: [], jobs: '', education: '', skills: '', computer: '', languages: '', extra: '', refs: true, jobAd: ''});
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
    // Israeli CV convention: action nouns, not "I did" (הובלת צוות… rather than הובלתי צוות…); English: start with a verb, no "I".
    const FP_HE = [['הובלתי', 'הובלת'], ['ניהלתי', 'ניהול'], ['הדרכתי', 'הדרכת'], ['עבדתי', 'עבודה'], ['תכננתי', 'תכנון'], ['טיפלתי', 'טיפול'], ['ביצעתי', 'ביצוע'], ['תיאמתי', 'תיאום'],
      ['אחראי על', 'אחריות על'], ['אחראית על', 'אחריות על'], ['הייתי אחראי', 'אחריות'], ['הייתי אחראית', 'אחריות'], ['ארגנתי', 'ארגון'], ['שיפרתי', 'שיפור'], ['בניתי', 'בניית'], ['פיתחתי', 'פיתוח'],
      ['לימדתי', 'הוראה'], ['ליוויתי', 'ליווי'], ['פיקדתי על', 'הובלת'], ['פיקדתי', 'הובלה'], ['הכשרתי', 'הכשרת'], ['קידמתי', 'קידום'], ['השתתפתי', 'השתתפות'], ['נתתי', 'מתן'], ['כתבתי', 'כתיבת'], ['הכנתי', 'הכנת'], ['דאגתי', 'הקפדה'], ['סידרתי', 'סידור'], ['אחראי', 'אחריות'], ['אחראית', 'אחריות']];
    const pro = t => { let x = String(t || '').trim(); if (/[֐-׿]/.test(x)) FP_HE.forEach(([a, b]) => { x = x.replace(new RegExp('(^|[\\s,(])' + a + '(?=[\\s,.]|$)', 'g'), '$1' + b); }); else x = x.replace(/^I\s+/i, '').replace(/^./, m => m.toUpperCase()); return x; };
    function localBullets(c) {
      const H = c.lang === 'he', out = [];
      if (c.people) out.push(H ? 'הובלת צוות של ' + c.people + ' אנשים — תכנון משימות, חלוקת עבודה וליווי אישי.' : 'Led a team of ' + c.people + ' people — planning tasks, dividing work and supporting each person.');
      if (c.systems) out.push(H ? 'אחריות על ' + civilian(c.systems) + '.' : 'Responsible for ' + civilian(c.systems) + '.');
      if (c.results) out.push(pro(civilian(c.results)));
      if (c.story) civilian(c.story).split(/[\n.]+/).map(x => x.trim()).filter(x => x.length > 12).slice(0, 4).forEach(x => out.push(pro(x.replace(/^[-•*]\s*/, '')) + '.'));
      return [...new Set(out)].slice(0, 6);
    }

    /* ---------- preview (same structure as the PDF) ---------- */
    const L = c => c.lang === 'he'
      ? {summary: 'תקציר מקצועי', exp: 'שירות צבאי', mil: 'שירות צבאי', jobs: 'ניסיון תעסוקתי', edu: 'השכלה וקורסים', skills: 'כישורים', computer: 'יישומי מחשב', langs: 'שפות', extra: 'התנדבות ופעילות נוספת', refs: 'המלצות יינתנו לפי דרישה'}
      : {summary: 'Professional summary', exp: 'Military service', mil: 'Military service', jobs: 'Work experience', edu: 'Education & courses', skills: 'Skills', computer: 'Computer skills', langs: 'Languages', extra: 'Volunteering & activities', refs: 'References available on request'};
    const job = x => { let yrs = '', rest = x; const m = x.match(/^\s*([^|]{2,20}?)\s*\|\s*(.+)$/); if (m && /\d/.test(m[1])) { yrs = m[1].trim(); rest = m[2]; } const [t, ...d] = rest.split(' — '); return {yrs, t: t.trim(), d: d.join(' — ').trim()}; };
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
        sec(l.jobs, lines(c.jobs).map(x => { const j = job(x); return h('div', {class: 'cv-job'}, h('p', {class: 'cv-role'}, h('b', {}, j.t), j.yrs ? h('span', {}, '  ' + j.yrs) : null), j.d ? h('p', {class: 'cv-jobd'}, j.d) : null); })),
        sec(l.edu, lines(c.education).map(x => h('p', {}, x))),
        sec(l.skills, splitList(c.skills).length ? h('p', {}, splitList(c.skills).join(' · ')) : null),
        sec(l.computer, splitList(c.computer).length ? h('p', {}, splitList(c.computer).join(' · ')) : null),
        sec(l.langs, splitList(c.languages).length ? h('p', {}, splitList(c.languages).join(' · ')) : null),
        sec(l.extra, lines(c.extra).map(x => h('p', {}, x))),
        c.refs ? h('p', {class: 'cv-refs'}, l.refs) : null);
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
      if (lines(c.jobs).length) { head(l.jobs); lines(c.jobs).forEach(x => { const j = job(x); d.keep(30); d.twoSided(j.t, j.yrs, {size: 11, bold: true, dir, color: '#1C232B', color2: GREY}); if (j.d) { d.space(1); d.text(j.d, body); } d.space(4); }); }
      if (lines(c.education).length) { head(l.edu); lines(c.education).forEach(x => { d.text(x, body); d.space(1); }); }
      if (splitList(c.skills).length) { head(l.skills); d.text(splitList(c.skills).join('  ·  '), body); }
      if (splitList(c.computer).length) { head(l.computer); d.text(splitList(c.computer).join('  ·  '), body); }
      if (splitList(c.languages).length) { head(l.langs); d.text(splitList(c.languages).join('  ·  '), body); }
      if (lines(c.extra).length) { head(l.extra); lines(c.extra).forEach(x => { d.text(x, body); d.space(1); }); }
      if (c.refs) { d.space(12); d.text(l.refs, {size: 9.5, color: GREY, dir}); }
      const safe = x => String(x || '').trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_|_$/g, '');
      const file = [safe(c.first), safe(c.last)].filter(Boolean).join('_') || 'My';
      return {doc: d, file: file + '_CV.pdf'};
    }

    /* ---------- AI polish (optional, never invents) ---------- */
    // AI "career writer": rewrites only from the facts given, suggests (never applies silently), and asks for missing real numbers.
    let suggestion = null;
    async function polish(statusEl, mode) {
      const c = cv(), H = c.lang === 'he';
      const system = [
        H ? 'You are a senior Israeli career counsellor who writes CVs for discharged IDF soldiers. Write in natural, professional Hebrew.' : 'You are a senior career counsellor who writes CVs for discharged Israeli soldiers. Write in natural, professional English.',
        'HARD RULES: Never invent experience, numbers, ranks, dates, employers, courses, tools or achievements. Use only facts in the input. If a strong bullet needs a number that was not given, do not add one — instead add a short question to "questions".',
        'Translate every military term and acronym into plain civilian language an HR recruiter understands. No classified or unit-identifying detail.',
        H ? 'Hebrew style: action nouns, not first person (הובלת צוות של 12 אנשים, not הובלתי).' : 'English style: start each bullet with a strong past-tense verb, no "I".',
        'Bullets: one line each, Action + context + result (only real results), 3-6 bullets, most relevant to the target job first.',
        'Summary: 2-3 lines, who I am + strongest proven strengths + what job I want. No clichés like "hard-working team player" without evidence.',
        c.jobAd ? 'Tailor wording to the job ad: reuse its keywords only where the facts truly match; list matching skills first.' : '',
        'Return ONLY valid JSON: {"headline":"civilian job title","role":"civilian name for the military role","summary":"...","bullets":["..."],"skills":["up to 8, only supported by the input"],"tips":["2-4 concrete improvements"],"questions":["0-3 questions asking for real numbers or facts"]}'
      ].filter(Boolean).join('\n');
      const prompt = ['Target role: ' + (c.headline || 'not given'), 'Military role: ' + (c.milRole || ''), 'Years: ' + [c.milFrom, c.milTo].filter(Boolean).join('-'), 'People led: ' + (c.people || 'not given'),
        'Systems/equipment/processes: ' + (c.systems || 'not given'), 'Results: ' + (c.results || 'not given'), 'Free story: ' + (c.story || ''), 'Current bullets: ' + c.bullets.filter(Boolean).join(' | '),
        'Civilian jobs: ' + (c.jobs || 'none'), (window.MomentumProfile && window.MomentumProfile.aiSummary()) || '', 'Education: ' + (c.education || ''), 'Skills: ' + (c.skills || ''), 'Current summary: ' + (c.summary || ''), c.jobAd ? 'Job ad:\n' + c.jobAd.slice(0, 2500) : ''].join('\n');
      statusEl.textContent = tr('Writing with AI (after your approval)…', 'ה-AI כותב (אחרי אישור שלך)…');
      try {
        const raw = await aiText(system, prompt, 1400);
        const json = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]);
        const arr = v => Array.isArray(v) ? v.map(String).map(x => x.trim()).filter(Boolean) : [];
        suggestion = {mode, role: String(json.role || '').trim(), headline: String(json.headline || '').trim(), summary: String(json.summary || '').trim(), bullets: arr(json.bullets).slice(0, 7), skills: arr(json.skills).slice(0, 8), tips: arr(json.tips).slice(0, 4), questions: arr(json.questions).slice(0, 3)};
        statusEl.textContent = ''; paint();
      } catch (e) {
        statusEl.textContent = e.canceled ? tr('Nothing was sent.', 'לא נשלח כלום.') : tr('Could not get AI wording: ', 'לא הצלחתי לקבל ניסוח מה-AI: ') + e.message + tr(' — the civilian translator works without AI.', ' — המתרגם האזרחי עובד גם בלי AI.');
      }
    }
    function suggestionCard() {
      if (!suggestion) return null;
      const c = cv(), sg = suggestion;
      const apply = what => { if (what.includes('b') && sg.bullets.length) c.bullets = sg.bullets.slice(); if (what.includes('s') && sg.summary) c.summary = sg.summary;
        if (what.includes('h') && sg.headline && !c.headline) c.headline = sg.headline; if (what.includes('b') && sg.role) c.milRole = sg.role; else if (c.milRole) c.milRole = civilian(c.milRole); if (what.includes('k') && sg.skills.length) c.skills = [...new Set([...splitList(c.skills), ...sg.skills])].join(', ');
        store(); suggestion = null; paint(); toast(tr('Applied — read every line once more ✓', 'עודכן — כדאי לקרוא כל שורה שוב ✓')); };
      return h('div', {class: 'cv-ai'},
        h('div', {class: 'cv-ai-head'}, illu('pen', 30), h('strong', {}, tr('AI suggestion — your call', 'הצעת AI — ההחלטה שלך'))),
        sg.role ? h('div', {class: 'cv-ai-block'}, h('small', {}, tr('Role, in civilian words', 'התפקיד, במילים אזרחיות')), h('p', {}, h('b', {}, sg.role))) : null,
        sg.summary ? h('div', {class: 'cv-ai-block'}, h('small', {}, tr('Summary', 'תקציר')), h('p', {}, sg.summary)) : null,
        sg.bullets.length ? h('div', {class: 'cv-ai-block'}, h('small', {}, tr('Service lines', 'שורות השירות')), h('ul', {}, sg.bullets.map(b => h('li', {}, b)))) : null,
        sg.skills.length ? h('div', {class: 'cv-ai-block'}, h('small', {}, tr('Skills', 'כישורים')), h('p', {}, sg.skills.join(' · '))) : null,
        sg.questions.length ? h('div', {class: 'cv-ai-q'}, h('strong', {}, tr('To make it stronger, answer (only if true):', 'כדי לחזק — כדאי לענות (רק אם נכון):')), h('ul', {}, sg.questions.map(q => h('li', {}, q)))) : null,
        sg.tips.length ? h('div', {class: 'cv-ai-tips'}, h('strong', {}, tr('Tips', 'טיפים')), h('ul', {}, sg.tips.map(q => h('li', {}, q)))) : null,
        h('div', {class: 'plus-row'}, btn(tr('Use all', 'להשתמש בהכול'), () => apply('bshk'), 'plus-btn primary'),
          sg.bullets.length ? btn(tr('Only the lines', 'רק השורות'), () => apply('b'), 'plus-btn') : null,
          sg.summary ? btn(tr('Only the summary', 'רק התקציר'), () => apply('s'), 'plus-btn') : null,
          btn(tr('Keep mine', 'להשאיר שלי'), () => { suggestion = null; paint(); }, 'plus-link')),
        h('p', {class: 'plus-muted'}, tr('AI can be wrong. It was told never to invent facts — still, check that every line is true.', 'AI יכול לטעות. הוא הונחה לא להמציא עובדות — ובכל זאת בדוק שכל שורה נכונה.')));
    }

    /* ---------- quality check (local, instant) ---------- */
    function quality() {
      const c = cv(), H = c.lang === 'he', bl = c.bullets.filter(Boolean);
      const all = [c.milRole, c.results, ...bl].join(' ');
      const items = [
        [!!(c.first && c.last && c.phone && c.email), tr('Name, phone and email', 'שם, טלפון ואימייל')],
        [!!c.headline, tr('A civilian job title at the top', 'שם תפקיד אזרחי בראש העמוד')],
        [c.summary.length >= 60 && c.summary.length <= 420, tr('Summary of 2–3 lines', 'תקציר של 2–3 שורות')],
        [bl.length >= 3 && bl.length <= 7, tr('3–6 clear service lines', '3–6 שורות שירות ברורות')],
        [/\d/.test(all), tr('At least one real number (people, hours, results)', 'לפחות מספר אמיתי אחד (אנשים, שעות, תוצאות)')],
        [!jargonFound(all).length, tr('No military jargon', 'בלי ז׳רגון צבאי')],
        [H ? !/(^|\s)(הובלתי|ניהלתי|עבדתי|הדרכתי|טיפלתי)(\s|$)/.test(all) : !/(^|\.\s*)I\s/.test(all), tr('Professional style (no "I did")', 'סגנון מקצועי (בלי "עשיתי")')],
        [splitList(c.skills).length >= 3, tr('At least 3 skills', 'לפחות 3 כישורים')]
      ];
      const ok = items.filter(x => x[0]).length;
      return h('div', {class: 'cv-quality'},
        h('div', {class: 'cv-q-top'}, h('strong', {}, tr('CV strength', 'חוזק קורות החיים')), h('span', {class: 'cv-q-score'}, ok + '/' + items.length)),
        h('div', {class: 'cv-q-bar'}, h('i', {style: 'width:' + Math.round(ok / items.length * 100) + '%'})),
        h('ul', {}, items.map(([v, t]) => h('li', {class: v ? 'ok' : ''}, h('span', {'aria-hidden': 'true'}, v ? '✓' : '○'), ' ', t))));
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
          btn(tr('Translate to civilian lines', 'תרגם לשורות אזרחיות'), () => { if (c.milRole) c.milRole = civilian(c.milRole); c.bullets = c.bullets.map(b => pro(civilian(b))); const add = localBullets(c).filter(b => !c.bullets.includes(b)); c.bullets.push(...add); if (!add.length) toast(tr('Add a few details first', 'כדאי להוסיף קודם כמה פרטים')); store(); paintBullets(); refreshPreview(); checkJargon(); }, 'plus-btn primary'),
          P.infoOnly ? null : btn(tr('Write it better with AI ✨', 'ה-AI ינסח לי יותר טוב ✨'), () => polish(status, 'service'), 'plus-btn cv-ai-btn')),
        status, suggestionCard(), warn,
        (() => { const M = window.MomentumProfile; const sug = M ? M.cvBullets().map(b => pro(civilian(b))).filter(b => !c.bullets.includes(b)) : [];
          let rated = 0; try { const a = JSON.parse(localStorage.getItem('momentum-business-skills-v1') || 'null'); rated = a && a.answers ? Object.keys(a.answers).length : 0; } catch (_) {}
          const link = rated ? null : h('a', {class: 'cv-from-profile cv-skills-link', href: './skills-business.html?lang=' + (he() ? 'he' : 'en')}, h('b', {}, tr('Not sure what to write?', 'לא בטוח מה לכתוב?')), h('small', {}, tr('The 5-minute strengths check turns your service into ready CV lines →', 'שאלון החוזקות (5 דקות) הופך את השירות לשורות מוכנות לקורות חיים ←')));
          if (!sug.length) return link;
          return sug.length ? h('div', {class: 'cv-from-profile'}, h('small', {}, tr('From your strengths profile — your highest-rated activities (tap to add):', 'מפרופיל החוזקות — הפעילויות שדירגת הכי גבוה (לחיצה מוסיפה):')),
            ...sug.map(b => btn('+ ' + b, () => { c.bullets.push(b); store(); paint(); }, 'cv-sug'))) : null; })(),
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
      const M = window.MomentumProfile;
      const profSkills = M && M.active() ? M.skills().slice(0, 8).map(s => s.name).filter(n => !splitList(c.skills).includes(n)) : [];
      const aboutTxt = M && M.active() ? M.about() : '';
      const status = h('p', {class: 'plus-muted', 'aria-live': 'polite'});
      return [h('h2', {class: 'cv-step-title'}, tr('Education, skills and summary', 'השכלה, כישורים ותקציר')),
        field('jobs', tr('Civilian jobs (one per line: years | job, place — what you did)', 'עבודות אזרחיות (שורה לכל אחת: שנים | תפקיד, מקום — מה עשית)'), {placeholder: tr('2022–2023 | Sales assistant, Super-Pharm — customer service and cash register', '2022–2023 | מוכר, סופר-פארם — שירות לקוחות וקופה')}, true),
        field('education', tr('Education & courses (one per line)', 'השכלה וקורסים (שורה לכל אחד)'), {placeholder: tr('Full matriculation — 2022\nFirst-aid course — 2024', 'בגרות מלאה — 2022\nקורס עזרה ראשונה — 2024')}, true),
        field('skills', tr('Skills (comma separated)', 'כישורים (מופרדים בפסיק)'), {placeholder: tr('Teamwork, responsibility, working under pressure', 'עבודת צוות, אחריות, עבודה תחת לחץ')}),
        field('computer', tr('Computer skills (optional)', 'יישומי מחשב (לא חובה)'), {placeholder: 'Excel, Word, Google Sheets'}),
        field('languages', tr('Languages', 'שפות'), {placeholder: tr('Hebrew — native, English — very good', 'עברית — שפת אם, אנגלית — טובה מאוד')}),
        field('extra', tr('Volunteering / other experience (optional)', 'התנדבות / ניסיון נוסף (לא חובה)'), {}, true),
        profSkills.length ? h('div', {class: 'cv-from-profile'}, h('small', {}, tr('Skills from your profile (tap to add):', 'כישורים מהפרופיל שלך (לחיצה מוסיפה):')),
          ...profSkills.map(n => btn('+ ' + n, () => { c.skills = [...splitList(c.skills), n].join(', '); store(); paint(); }, 'cv-sug'))) : null,
        field('summary', tr('Short professional summary (2–3 lines)', 'תקציר מקצועי קצר (2–3 שורות)'), {}, true),
        aboutTxt && !c.summary ? btn(tr('Start from my "About me"', 'להתחיל מה"עליי" שלי'), () => { c.summary = aboutTxt; store(); paint(); }, 'plus-link') : null,
        h('label', {class: 'switch-row cv-refs-toggle'}, (() => { const x = h('input', {type: 'checkbox'}); x.checked = !!c.refs; x.addEventListener('change', () => { cv().refs = x.checked; store(); refreshPreview(); }); return x; })(), h('span', {}, L(c).refs)),
        h('details', {class: 'cv-ad', open: c.jobAd ? true : undefined}, h('summary', {}, tr('Applying to a specific job? Paste the ad (optional)', 'מגישים למשרה מסוימת? הדביקו את המודעה (לא חובה)')),
          field('jobAd', tr('Job ad text — the AI will match your real experience to it', 'טקסט המודעה — ה-AI יתאים אליה את הניסיון האמיתי שלך'), {rows: '5'}, true)),
        P.infoOnly ? null : h('div', {class: 'cv-ai-cta'}, illu('pen', 40), h('div', {}, h('strong', {}, tr('Let AI write a professional CV from your details', 'ה-AI יכתוב לך קורות חיים מקצועיים מהפרטים שלך')),
          h('p', {}, tr('Summary, service lines and skills — like a career counsellor. Uses only what you wrote; you approve every change.', 'תקציר, שורות שירות וכישורים — כמו יועץ קריירה. רק ממה שכתבת; אתה מאשר כל שינוי.'))),
          btn(tr('Write my CV with AI ✨', 'כתוב לי עם AI ✨'), () => polish(status, 'full'), 'plus-btn primary')),
        status, suggestionCard(), quality()];
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
      try { const r = await makePdf(); if (!r) return; r.doc.download(r.file); toast(r.doc.pageCount > 1 ? tr('Downloaded ✓ — tip: try to keep it to one page.', 'ירד ✓ — טיפ: עדיף לקצר לעמוד אחד.') : tr('Your CV is downloading ✓', 'קורות החיים יורדים ✓')); saveJourney(true); }
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
