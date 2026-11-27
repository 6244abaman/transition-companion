/* profile-analyzer.js — Optional Skill & Personality Analyzer (27 Nov 2026).
   window.MomentumProfile: a private, on-device profile (questionnaire + skills noticed in chat + confirmed
   skills from My Journey) that quietly improves the CV builder, interview simulator, chat, work and study
   suggestions, My Journey and tool recommendations. Nothing is invented: every item comes from the user.
   window.MomentumProfileUI: the questionnaire (in parts) and "What the app knows about me". */
(function () {
  'use strict';
  const KEY = 'momentum-profile-v1';
  const isHe = () => (document.documentElement.lang || '').startsWith('he') || /indexH\.html/.test(location.pathname) || new URLSearchParams(location.search).get('lang') === 'he';
  const T = (en, he) => isHe() ? he : en;

  /* ---------- vocabulary ---------- */
  const SKILLS = [
    ['leadership', 'Team leadership', 'הובלת צוות', 'people', ['הובל', 'פיקד', 'ניהלתי', 'ראש צוות', 'מפקד', 'מ"כ', 'led ', 'lead', 'managed', 'commanded']],
    ['teamwork', 'Teamwork', 'עבודת צוות', 'people', ['עבודת צוות', 'בצוות', 'teamwork', 'in a team']],
    ['responsibility', 'Responsibility', 'אחריות', 'ops', ['אחראי', 'אחראית', 'אחריות', 'responsib']],
    ['pressure', 'Working under pressure', 'עבודה תחת לחץ', 'ops', ['לחץ', 'pressure', 'stress']],
    ['planning', 'Planning and organisation', 'תכנון וארגון', 'ops', ['תכנו', 'תכננתי', 'ארגנתי', 'סידור עבודה', 'לוגיסט', 'planning', 'organis', 'organiz', 'schedul', 'logistic']],
    ['technical', 'Technical ability', 'הבנה טכנית', 'tech', ['טכני', 'מחשב', 'תוכנה', 'מערכות', 'רשתות', 'אלקטרוני', 'technical', 'computer', 'software', 'systems', 'network', 'electronic']],
    ['data', 'Working with data', 'עבודה עם נתונים', 'tech', ['נתונים', 'אקסל', 'דוחות', 'מודיעין', 'ניתוח', 'data', 'excel', 'reports', 'analys', 'intelligence']],
    ['teaching', 'Teaching and explaining', 'הדרכה והסברה', 'people', ['הדרכ', 'לימדתי', 'מדריך', 'מדריכה', 'חונך', 'trained', 'teach', 'instruct', 'mentor']],
    ['service', 'Service and communication', 'שירות ותקשורת', 'people', ['שירות לקוחות', 'לקוחות', 'תקשורת בין', 'customer', 'communicat']],
    ['care', 'Care and support', 'אכפתיות ותמיכה', 'care', ['תמיכה', 'רווחה', 'ת"ש', 'הקשבה', 'ליווי', 'support', 'welfare', 'caring', 'listening']],
    ['precision', 'Precision and attention to detail', 'דיוק וקפדנות', 'ops', ['דיוק', 'מדויק', 'קפדנ', 'בקרה', 'נהלים', 'precis', 'detail', 'accura', 'procedure', 'quality']],
    ['security', 'Security and safety', 'ביטחון ובטיחות', 'security', ['אבטחה', 'בטיחות', 'שמירה', 'security', 'safety', 'guard']],
    ['field', 'Field and physical work', 'עבודה בשטח וכושר', 'field', ['בשטח', 'כושר', 'פיזי', 'field work', 'physical', 'outdoor']],
    ['creative', 'Creativity', 'יצירתיות', 'creative', ['יצירתי', 'עיצוב', 'רעיונות', 'creativ', 'design', 'ideas']],
    ['problem', 'Problem solving', 'פתרון בעיות', 'tech', ['פתרתי', 'פתרון בעיות', 'אלתר', 'solved', 'problem solving', 'improvis']],
    ['learning', 'Learning quickly', 'למידה מהירה', 'study', ['למדתי מהר', 'לומד מהר', 'learn quickly', 'learned fast', 'fast learner']],
    ['languages', 'Languages', 'שפות', 'people', ['אנגלית', 'ערבית', 'רוסית', 'אמהרית', 'צרפתית', 'english', 'arabic', 'russian', 'french', 'amharic']],
    ['driving', 'Driving and operating equipment', 'נהיגה ותפעול כלים', 'field', ['נהג', 'נהיגה', 'רכב', 'מלגזה', 'כלי צמ', 'driving', 'driver', 'vehicle', 'forklift']]
  ];
  const SK = id => SKILLS.find(s => s[0] === id);
  const skillName = id => { const s = SK(id); return s ? T(s[1], s[2]) : id; };
  const SUBJECTS = [['math', 'Maths', 'מתמטיקה'], ['cs', 'Computer science', 'מדעי המחשב'], ['physics', 'Physics', 'פיזיקה'], ['bio', 'Biology', 'ביולוגיה'], ['chem', 'Chemistry', 'כימיה'],
    ['english', 'English', 'אנגלית'], ['lit', 'Literature / language', 'ספרות / לשון'], ['history', 'History / civics', 'היסטוריה / אזרחות'], ['econ', 'Economics / business', 'כלכלה / עסקים'],
    ['psych', 'Psychology / sociology', 'פסיכולוגיה / סוציולוגיה'], ['art', 'Art / design / film', 'אמנות / עיצוב / קולנוע'], ['sport', 'Sport', 'ספורט'], ['tech', 'Technology / electronics', 'טכנולוגיה / אלקטרוניקה']];
  // General directions to CHECK (not promises): from interests to fields.
  const STUDY_FOR = {math: ['Engineering', 'הנדסה', 'Economics', 'כלכלה'], cs: ['Computer science / software', 'מדעי המחשב / תוכנה', 'Practical engineering (handasai)', 'הנדסאות'], physics: ['Engineering', 'הנדסה', 'Practical engineering', 'הנדסאות'],
    bio: ['Health professions', 'מקצועות הבריאות', 'Nursing', 'סיעוד'], chem: ['Chemistry / pharmacy', 'כימיה / רוקחות', 'Lab technician', 'טכנאות מעבדה'], english: ['Tourism / international studies', 'תיירות / לימודים בינלאומיים', 'Translation', 'תרגום'],
    lit: ['Communication / media', 'תקשורת / מדיה', 'Education', 'חינוך'], history: ['Law', 'משפטים', 'Political science', 'מדעי המדינה'], econ: ['Business administration', 'מנהל עסקים', 'Accounting', 'ראיית חשבון'],
    psych: ['Psychology / social work', 'פסיכולוגיה / עבודה סוציאלית', 'Human resources', 'משאבי אנוש'], art: ['Design / architecture', 'עיצוב / אדריכלות', 'Film and media', 'קולנוע ומדיה'],
    sport: ['Physical education', 'חינוך גופני', 'Physiotherapy', 'פיזיותרפיה'], tech: ['Practical engineering (electronics)', 'הנדסאות אלקטרוניקה', 'Technician courses', 'קורסי טכנאות']};
  const WORK_FOR = {people: [['Shift / team lead', 'אחראי משמרת / ראש צוות'], ['Customer service and sales', 'שירות לקוחות ומכירות'], ['Recruitment / HR assistant', 'גיוס ומשאבי אנוש']],
    ops: [['Operations and logistics', 'תפעול ולוגיסטיקה'], ['Purchasing and inventory', 'רכש ומלאי'], ['Project coordination', 'תיאום פרויקטים']],
    tech: [['IT support', 'תמיכה טכנית (IT)'], ['Software testing (QA)', 'בדיקות תוכנה (QA)'], ['Technician roles', 'טכנאות']],
    security: [['Security and safety', 'אבטחה ובטיחות'], ['Control room / dispatch', 'מוקד ובקרה']],
    care: [['Youth work and informal education', 'עבודה עם נוער וחינוך בלתי פורמלי'], ['Support and welfare roles', 'תפקידי סיוע ורווחה']],
    field: [['Field work: agriculture, building, delivery', 'עבודה בשטח: חקלאות, בנייה, הובלה'], ['Professional driving', 'נהיגה מקצועית']],
    creative: [['Design, content and media', 'עיצוב, תוכן ומדיה']], study: [['Vocational training tracks', 'מסלולי הכשרה מקצועית']]};
  const TAG_TOOLS = {study: ['scholarships', 'studypaths', 'psychometric', 'fieldquiz'], tech: ['scholarships', 'studypaths', 'fieldquiz'], people: ['interviewsim', 'cv'], ops: ['deadlines', 'cv'], security: ['interviewsim'], field: ['grantplan', 'apartment'], care: ['studypaths'], creative: ['studypaths', 'cv']};
  const VALUES = [['stability', 'Stability', 'יציבות'], ['meaning', 'Meaning', 'משמעות'], ['money', 'Earning well', 'להרוויח טוב'], ['learning', 'Learning', 'למידה'], ['independence', 'Independence', 'עצמאות'], ['helping', 'Helping others', 'לעזור לאחרים'], ['creating', 'Creating', 'יצירה'], ['growth', 'Moving up', 'התקדמות']];
  const WORKSTYLE = [['alone', 'On my own', 'לבד'], ['team', 'In a team', 'בצוות'], ['mixed', 'Both', 'גם וגם']];
  const LEARN = [['doing', 'By doing', 'תוך כדי עשייה'], ['reading', 'Reading', 'קריאה'], ['watching', 'Watching', 'צפייה'], ['person', 'Someone explaining', 'הסבר מאדם']];
  const ENV = [['office', 'Office', 'משרד'], ['field', 'Outdoors / field', 'שטח'], ['people', 'With people', 'מול אנשים'], ['quiet', 'Quiet', 'שקט'], ['dynamic', 'Fast-paced', 'דינמי']];

  /* ---------- store ---------- */
  const blank = () => ({v: 1, enabled: true, shareWithAI: true, military: {roles: '', activities: []}, school: {liked: [], stoodOut: '', activities: ''}, feedback: [],
    self: {strengths: [], workStyle: '', learnStyle: '', environment: []}, deep: {values: [], pace: '', structure: ''}, chat: {}, hidden: [], about: '', aboutEdited: false, updated: ''});
  function read() {
    let p; try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { p = null; }
    const b = blank(); if (!p || typeof p !== 'object') return b;
    const out = {...b, ...p, military: {...b.military, ...(p.military || {})}, school: {...b.school, ...(p.school || {})}, self: {...b.self, ...(p.self || {})}, deep: {...b.deep, ...(p.deep || {})}};
    if (!Array.isArray(out.military.activities)) out.military.activities = []; if (!Array.isArray(out.feedback)) out.feedback = []; if (!Array.isArray(out.hidden)) out.hidden = [];
    if (!out.chat || typeof out.chat !== 'object') out.chat = {};
    return out;
  }
  function write(p) { p.updated = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (_) {} try { window.dispatchEvent(new CustomEvent('momentum-profile-changed')); } catch (_) {} return p; }
  const clip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n || 400);
  const detect = text => { const t = String(text || '').toLowerCase(); return SKILLS.filter(s => s[4].some(k => t.includes(k.toLowerCase()))).map(s => s[0]); };
  function journeySkills() { // skills the user confirmed in My Journey / the 36-skills questionnaire
    try { const J = window.MomentumJourney && window.MomentumJourney.read(); if (!J) return [];
      const names = [...(J.skills || []).filter(x => x.confirmed).map(x => [x.he, x.en].filter(Boolean).join(' ')), ...(J.manualSkills || []).map(x => x.name)];
      return [...new Set(names.flatMap(detect))]; } catch (_) { return []; }
  }
  /* The 36-skills questionnaire (skills-business.html) → profile skill ids. A rating of 5+ counts. */
  const ASSESS_MAP = {1: 'responsibility', 2: 'pressure', 3: 'planning', 4: 'planning', 5: 'problem', 6: 'technical', 7: 'planning', 8: 'problem', 9: 'planning', 10: 'responsibility', 11: 'leadership', 12: 'teamwork', 13: 'leadership', 14: 'teaching', 15: 'teamwork', 16: 'service', 17: 'planning', 18: 'precision', 19: 'pressure', 20: 'pressure', 21: 'learning', 22: 'pressure', 23: 'problem', 24: 'problem', 25: 'creative', 26: 'creative', 27: 'data', 28: 'learning', 29: 'creative', 30: 'learning', 31: 'responsibility', 32: 'responsibility', 33: 'responsibility', 34: 'precision', 35: 'service', 36: 'creative'};
  function assessment() { try { const a = JSON.parse(localStorage.getItem('momentum-business-skills-v1') || 'null'); return a && a.answers && typeof a.answers === 'object' ? a.answers : {}; } catch (_) { return {}; } }
  /* Ranked skills with their sources. Same skill in the questionnaire AND in chat (or My Journey) = stronger. */
  function skills(p) {
    p = p || read(); const map = {};
    const add = (id, pts, src) => { if (!SK(id) || p.hidden.includes(id)) return; const m = map[id] || (map[id] = {id, score: 0, src: new Set(), evidence: []}); m.score += pts; m.src.add(src); };
    p.military.activities.forEach(a => { const r = Number(a.rating) || 0; (a.skills || []).forEach(id => { add(id, 1 + r / 2, 'questionnaire'); if (a.what && map[id]) map[id].evidence.push(clip(a.what, 160)); }); detect(a.what).forEach(id => add(id, 0.5 + r / 4, 'questionnaire')); });
    p.self.strengths.forEach(id => add(id, 2.5, 'questionnaire'));
    detect(p.school.stoodOut + ' ' + p.school.activities).forEach(id => add(id, 1, 'questionnaire'));
    p.feedback.forEach(f => detect(f.text).forEach(id => add(id, 1.5, 'feedback')));
    Object.entries(p.chat).forEach(([id, n]) => add(id, Math.min(3, Number(n) || 0), 'chat'));
    journeySkills().forEach(id => add(id, 2, 'journey'));
    Object.entries(assessment()).forEach(([k, a]) => { const id = ASSESS_MAP[k], r = a && Number(a.rating); if (!id || !(r >= 5)) return; add(id, (r - 4) * 0.8, 'assessment'); if (a.evidence && map[id]) map[id].evidence.push(clip(a.evidence, 160)); });
    return Object.values(map).map(m => { const strong = m.src.size > 1; return {id: m.id, name: skillName(m.id), tag: SK(m.id)[3], score: Math.round((m.score * (strong ? 1.4 : 1)) * 10) / 10, sources: [...m.src], strong, evidence: [...new Set(m.evidence)].slice(0, 2)}; })
      .sort((a, b) => b.score - a.score);
  }
  function tags(p) { p = p || read(); const t = {}; skills(p).slice(0, 6).forEach(s => { t[s.tag] = (t[s.tag] || 0) + s.score; }); if (p.school.liked.length) t.study = (t.study || 0) + p.school.liked.length;
    const QT = {people: 'people', tech: 'tech', data: 'tech', care: 'care', field: 'field'}; if (p.quiz && Array.isArray(p.quiz.tags)) p.quiz.tags.forEach((q, i) => { const k = QT[q]; if (k) t[k] = (t[k] || 0) + (i === 0 ? 4 : 2); }); return Object.entries(t).sort((a, b) => b[1] - a[1]).map(x => x[0]); }
  const has = p => { p = p || read(); return !!(Object.keys(assessment()).length || (p.quiz && p.quiz.tags && p.quiz.tags.length) || p.military.roles || p.military.activities.length || p.school.liked.length || p.school.stoodOut || p.feedback.length || p.self.strengths.length || p.deep.values.length || Object.keys(p.chat).length); };
  const active = () => { const p = read(); return p.enabled && has(p); };
  function completion(p) { p = p || read(); const parts = [!!(p.military.roles || p.military.activities.length), !!(p.school.liked.length || p.school.stoodOut), p.feedback.length > 0, !!(p.self.strengths.length || p.self.workStyle), !!(p.deep.values.length || p.deep.pace)]; return {done: parts.filter(Boolean).length, of: parts.length, parts}; }
  const QL = {people: ['People & leadership', 'אנשים והובלה'], tech: ['Technical & hands-on', 'טכני ומעשי'], data: ['Analysis & systems', 'ניתוח ומערכות'], care: ['Care & education', 'טיפול וחינוך'], field: ['Field & action', 'שטח ואקשן']};
  const quizLabel = k => QL[k] ? T(QL[k][0], QL[k][1]) : k;
  // What a suggestion is based on — shown next to it, so nothing looks like a guess.
  function basis(kind) {
    const p = read(), parts = [];
    if (kind === 'study') { if (p.school.liked.length) parts.push(T('subjects you liked: ', 'מקצועות שאהבת: ') + p.school.liked.map(s => label(SUBJECTS, s)).join(', ')); }
    else { const top = skills(p).slice(0, 3).map(s => s.name); if (top.length) parts.push(T('your strengths: ', 'החוזקות שלך: ') + top.join(', ')); if (p.quiz && p.quiz.tags) parts.push(T('your quiz result: ', 'תוצאת השאלון: ') + p.quiz.tags.map(quizLabel).join(', ')); }
    return parts.join(' · ');
  }
  const label = (list, id) => { const x = list.find(v => v[0] === id); return x ? T(x[1], x[2]) : ''; };
  /* "About me" — assembled only from the user's own answers (editable). */
  function aboutDraft(p) {
    p = p || read(); const top = skills(p).slice(0, 3).map(s => s.name), H = isHe(), parts = [];
    if (p.military.roles) parts.push(H ? 'בשירות: ' + clip(p.military.roles, 120) + '.' : 'In service: ' + clip(p.military.roles, 120) + '.');
    if (top.length) parts.push(H ? 'החוזקות שלי: ' + top.join(', ') + '.' : 'My strengths: ' + top.join(', ') + '.');
    const ENV_P = {office: ['in an office', 'במשרד'], field: ['outdoors', 'בשטח'], people: ['with people', 'מול אנשים'], quiet: ['in a quiet place', 'בסביבה שקטה'], dynamic: ['in a fast-paced place', 'בסביבה דינמית']};
    const WS_P = {alone: ['on my own', 'לבד'], team: ['in a team', 'בצוות'], mixed: ['both alone and in a team', 'גם לבד וגם בצוות']};
    const env = p.self.environment.map(e => ENV_P[e] && ENV_P[e][H ? 1 : 0]).filter(Boolean), ws = WS_P[p.self.workStyle] ? WS_P[p.self.workStyle][H ? 1 : 0] : '';
    if (ws || env.length) parts.push((H ? 'אני עובד הכי טוב ' : 'I work best ') + [ws, env.join(H ? ' ו' : ' and ')].filter(Boolean).join(H ? ', ' : ', ') + '.');
    const vals = p.deep.values.map(v => label(VALUES, v)).filter(Boolean);
    if (vals.length) parts.push(H ? 'חשוב לי: ' + vals.join(', ') + '.' : 'What matters to me: ' + vals.join(', ').toLowerCase() + '.');
    return parts.join(' ');
  }
  const about = () => { const p = read(); return p.aboutEdited && p.about ? p.about : aboutDraft(p); };
  /* Short context for the AI (chat, interview, CV) — only when the user allows it. */
  function aiSummary() {
    const p = read(); if (!p.enabled || !p.shareWithAI || !has(p)) return '';
    const sk = skills(p).slice(0, 6).map(s => s.name + (s.strong ? ' (confirmed in several places)' : '') + (s.evidence[0] ? ' — e.g. "' + s.evidence[0] + '"' : ''));
    const L = ['SOLDIER PROFILE (from their own optional questionnaire; use it only when relevant, never invent beyond it, never list it back unprompted):'];
    if (p.military.roles) L.push('Service roles: ' + clip(p.military.roles, 200));
    if (sk.length) L.push('Strongest skills: ' + sk.join('; '));
    if (p.school.liked.length) L.push('Liked at school: ' + p.school.liked.map(s => label(SUBJECTS, s)).join(', '));
    if (p.self.workStyle || p.self.environment.length) L.push('Works best: ' + [label(WORKSTYLE, p.self.workStyle), ...p.self.environment.map(e => label(ENV, e))].filter(Boolean).join(', '));
    if (p.self.learnStyle) L.push('Learns best: ' + label(LEARN, p.self.learnStyle));
    if (p.deep.values.length) L.push('Values: ' + p.deep.values.map(v => label(VALUES, v)).join(', '));
    const a = about(); if (a) L.push('About me (their words): ' + clip(a, 400));
    return L.join('\n');
  }
  function noteChat(text) { // a skill the soldier talks about in chat counts as evidence too
    const p = read(); if (!p.enabled) return; const found = detect(text); if (!found.length) return;
    found.forEach(id => { p.chat[id] = Math.min(5, (Number(p.chat[id]) || 0) + 1); }); write(p);
  }
  const workDirections = () => { if (!active()) return []; const out = []; tags().forEach(t => (WORK_FOR[t] || []).forEach(w => { if (!out.some(o => o[0] === w[0])) out.push(w); })); return out.slice(0, 5).map(w => T(w[0], w[1])); };
  const studyDirections = () => { const p = read(); if (!p.enabled) return []; const out = []; p.school.liked.forEach(s => { const x = STUDY_FOR[s]; if (x) [[x[0], x[1]], [x[2], x[3]]].forEach(w => { if (!out.some(o => o[0] === w[0])) out.push(w); }); });
    if (tags(p).includes('tech') && !out.some(o => o[0].startsWith('Practical'))) out.push(['Practical engineering (handasai)', 'הנדסאות']); return out.slice(0, 6).map(w => T(w[0], w[1])); };
  const recommendedTools = () => { if (!active()) return []; return [...new Set(tags().slice(0, 2).flatMap(t => TAG_TOOLS[t] || []))]; };
  const cvBullets = () => { const p = read(); if (!p.enabled) return []; const fromQ = p.military.activities.filter(a => a.what && (Number(a.rating) || 0) >= 5).sort((a, b) => b.rating - a.rating).map(a => clip(a.what, 200)); const fromA = Object.values(assessment()).filter(a => a && a.confirmed && a.evidence && Number(a.rating) >= 5).sort((a, b) => b.rating - a.rating).map(a => clip(a.evidence, 200)); return [...new Set([...fromQ, ...fromA])].slice(0, 6); };

  window.MomentumProfile = {basis, read, write, blank, skills, tags, has, active, completion, about, aboutDraft, aiSummary, noteChat, workDirections, studyDirections, recommendedTools, cvBullets, skillName, SKILLS, SUBJECTS, VALUES, WORKSTYLE, LEARN, ENV,
    clear() { try { localStorage.removeItem(KEY); } catch (_) {} try { window.dispatchEvent(new CustomEvent('momentum-profile-changed')); } catch (_) {} }};

  /* =================== UI =================== */
  window.MomentumProfileUI = function (ctx) {
    const {h, btn, tr, he, illu, toast, showPage, aiText, P} = ctx;
    const MP = window.MomentumProfile;
    let part = 0, root = null, mode = 'menu';
    const PARTS = [['service', 'Your service', 'השירות שלך', 'flag'], ['school', 'High school', 'תיכון', 'book'], ['feedback', 'What others say', 'מה אחרים אומרים', 'users'], ['self', 'How you work', 'איך אתה עובד', 'compass'], ['deep', 'Deeper (optional)', 'להעמיק (לא חובה)', 'heart']];
    const chipSet = (list, selected, onToggle, multi) => h('div', {class: 'pa-chips'}, list.map(([id, en, he_]) => h('button', {type: 'button', class: 'pa-chip' + (selected.includes(id) ? ' on' : ''), 'aria-pressed': String(selected.includes(id)), onclick: () => onToggle(id)}, he() ? he_ : en)));
    const txt = (val, ph, on, rows) => { const el = rows ? h('textarea', {rows: String(rows), placeholder: ph, class: 'pa-in'}) : h('input', {type: 'text', placeholder: ph, class: 'pa-in'}); el.value = val || ''; el.addEventListener('input', () => on(el.value)); return el; };
    const skillChoices = SKILLS.map(s => [s[0], s[1], s[2]]);

    function serviceForm(p) {
      const list = h('div', {class: 'pa-acts'});
      const paintActs = () => list.replaceChildren(...p.military.activities.map((a, i) => h('div', {class: 'pa-act'},
        h('div', {class: 'pa-act-top'}, txt(a.name, tr('Activity or responsibility (e.g. running the duty roster)', 'פעילות או אחריות (למשל: סידור עבודה ותורנויות)'), v => { a.name = v; MP.write(p); }),
          btn('✕', () => { p.military.activities.splice(i, 1); MP.write(p); paintActs(); }, 'pa-del')),
        h('div', {class: 'pa-rate'}, h('small', {}, tr('How good were you at it? 1–7', 'כמה טוב היית בזה? 1–7')),
          h('div', {class: 'pa-scale', role: 'radiogroup'}, [1, 2, 3, 4, 5, 6, 7].map(n => h('button', {type: 'button', role: 'radio', 'aria-checked': String(Number(a.rating) === n), class: Number(a.rating) === n ? 'on' : '', onclick: () => { a.rating = n; MP.write(p); paintActs(); }}, String(n))))),
        txt(a.what, tr('What did you actually do? One or two sentences, in your words', 'מה עשית בפועל? משפט-שניים, במילים שלך'), v => { a.what = v; MP.write(p); }, 2),
        h('small', {class: 'pa-sub'}, tr('Skills it built (tap)', 'כישורים שזה פיתח (לבחור)')),
        chipSet(skillChoices, a.skills || [], id => { a.skills = (a.skills || []).includes(id) ? a.skills.filter(x => x !== id) : [...(a.skills || []), id]; MP.write(p); paintActs(); }))));
      paintActs();
      return [h('label', {class: 'pa-field'}, h('b', {}, tr('Your roles in service', 'התפקידים שלך בשירות')), txt(p.military.roles, tr('e.g. Combat soldier, then team leader', 'למשל: לוחם, אחר כך ראש צוות'), v => { p.military.roles = v; MP.write(p); })),
        h('b', {class: 'pa-h'}, tr('Activities — rate each one', 'פעילויות — לדרג כל אחת')), list,
        btn(tr('+ Add an activity', '+ להוסיף פעילות'), () => { p.military.activities.push({name: '', rating: 0, what: '', skills: []}); MP.write(p); paintActs(); }, 'plus-btn')];
    }
    function schoolForm(p) {
      const re = () => paint();
      return [h('b', {class: 'pa-h'}, tr('Subjects you liked', 'מקצועות שאהבת')), chipSet(SUBJECTS, p.school.liked, id => { p.school.liked = p.school.liked.includes(id) ? p.school.liked.filter(x => x !== id) : [...p.school.liked, id]; MP.write(p); re(); }),
        h('label', {class: 'pa-field'}, h('b', {}, tr('Where did you stand out?', 'במה בלטת?')), txt(p.school.stoodOut, tr('A subject, a project, a role in class…', 'מקצוע, פרויקט, תפקיד בכיתה…'), v => { p.school.stoodOut = v; MP.write(p); })),
        h('label', {class: 'pa-field'}, h('b', {}, tr('Activities (youth movement, volunteering, sport…)', 'פעילויות (תנועת נוער, התנדבות, ספורט…)')), txt(p.school.activities, '', v => { p.school.activities = v; MP.write(p); }, 2))];
    }
    function feedbackForm(p) {
      const list = h('div', {class: 'pa-acts'});
      const paintFb = () => list.replaceChildren(...p.feedback.map((f, i) => h('div', {class: 'pa-act'},
        h('div', {class: 'pa-act-top'}, chipSet([['friend', 'Friend', 'חבר'], ['family', 'Family', 'משפחה'], ['commander', 'Commander', 'מפקד'], ['other', 'Other', 'אחר']], [f.from], id => { f.from = id; MP.write(p); paintFb(); }), btn('✕', () => { p.feedback.splice(i, 1); MP.write(p); paintFb(); }, 'pa-del')),
        txt(f.text, tr('What did they say about you? (their words if you remember)', 'מה הם אמרו עליך? (במילים שלהם אם אתה זוכר)'), v => { f.text = v; MP.write(p); }, 2))));
      paintFb();
      return [h('p', {class: 'plus-muted'}, tr('Optional. Often others see strengths we take for granted.', 'לא חובה. לפעמים אחרים רואים חוזקות שאנחנו לוקחים כמובנות מאליהן.')), list,
        btn(tr('+ Add a remark', '+ להוסיף משפט'), () => { p.feedback.push({from: 'friend', text: ''}); MP.write(p); paintFb(); }, 'plus-btn')];
    }
    function selfForm(p) {
      const re = () => paint();
      return [h('b', {class: 'pa-h'}, tr('Your strengths (pick up to 5)', 'החוזקות שלך (עד 5)')), chipSet(skillChoices, p.self.strengths, id => { const s = p.self.strengths; p.self.strengths = s.includes(id) ? s.filter(x => x !== id) : s.length >= 5 ? s : [...s, id]; MP.write(p); re(); }),
        h('b', {class: 'pa-h'}, tr('You work best…', 'אתה עובד הכי טוב…')), chipSet(WORKSTYLE, [p.self.workStyle], id => { p.self.workStyle = p.self.workStyle === id ? '' : id; MP.write(p); re(); }),
        h('b', {class: 'pa-h'}, tr('You learn best…', 'אתה לומד הכי טוב…')), chipSet(LEARN, [p.self.learnStyle], id => { p.self.learnStyle = p.self.learnStyle === id ? '' : id; MP.write(p); re(); }),
        h('b', {class: 'pa-h'}, tr('Where you feel good working', 'איפה טוב לך לעבוד')), chipSet(ENV, p.self.environment, id => { const e = p.self.environment; p.self.environment = e.includes(id) ? e.filter(x => x !== id) : [...e, id]; MP.write(p); re(); })];
    }
    function deepForm(p) {
      const re = () => paint();
      return [h('b', {class: 'pa-h'}, tr('What matters to you in work (up to 3)', 'מה חשוב לך בעבודה (עד 3)')), chipSet(VALUES, p.deep.values, id => { const v = p.deep.values; p.deep.values = v.includes(id) ? v.filter(x => x !== id) : v.length >= 3 ? v : [...v, id]; MP.write(p); re(); }),
        h('b', {class: 'pa-h'}, tr('Pace', 'קצב')), chipSet([['calm', 'Calm and steady', 'רגוע ויציב'], ['fast', 'Fast and changing', 'מהיר ומשתנה']], [p.deep.pace], id => { p.deep.pace = p.deep.pace === id ? '' : id; MP.write(p); re(); }),
        h('b', {class: 'pa-h'}, tr('Structure', 'מבנה')), chipSet([['clear', 'Clear instructions', 'הוראות ברורות'], ['flexible', 'Freedom to decide', 'חופש להחליט']], [p.deep.structure], id => { p.deep.structure = p.deep.structure === id ? '' : id; MP.write(p); re(); })];
    }

    function aboutBox(p) {
      const ta = h('textarea', {rows: '4', class: 'pa-in'}); ta.value = MP.about();
      ta.addEventListener('input', () => { const q = MP.read(); q.about = ta.value; q.aboutEdited = true; MP.write(q); });
      const status = h('p', {class: 'plus-muted', 'aria-live': 'polite'});
      return h('section', {class: 'pa-card'}, h('div', {class: 'pa-card-head'}, illu('pen', 34), h('b', {}, tr('About me', 'עליי')), h('small', {}, tr('Used in your CV, interview and chat. Edit freely.', 'משמש בקורות החיים, בראיון ובצ\'אט. אפשר לערוך חופשי.'))),
        ta, h('div', {class: 'plus-row'},
          btn(tr('Rebuild from my answers', 'לבנות מחדש מהתשובות'), () => { const q = MP.read(); q.aboutEdited = false; q.about = ''; MP.write(q); ta.value = MP.about(); }, 'plus-link'),
          P.infoOnly || typeof aiText !== 'function' ? null : btn(tr('Polish the wording with AI', 'ליטוש ניסוח עם AI'), async () => {
            status.textContent = tr('Writing…', 'כותב…');
            try { const out = await aiText('You polish a short "About me" for a discharged Israeli soldier. ' + (he() ? 'Write natural Hebrew, first person, masculine.' : 'Write natural English, first person.') + ' Use ONLY the facts given. Do not add skills, numbers, roles or achievements. 2-3 sentences. Return only the text.', 'Facts:\n' + MP.aiSummary() + '\n\nCurrent text:\n' + ta.value, 300);
              ta.value = out.trim(); const q = MP.read(); q.about = ta.value; q.aboutEdited = true; MP.write(q); status.textContent = tr('Done — check that every word is true.', 'מוכן — לבדוק שכל מילה נכונה.'); }
            catch (e) { status.textContent = e.canceled ? '' : tr('AI is not available right now.', 'ה-AI לא זמין כרגע.'); } }, 'plus-link')), status);
    }
    /* "What the app knows about me" — see, edit, delete, switch off. */
    function knows() {
      const p = MP.read(), sk = MP.skills(p);
      const srcL = {questionnaire: tr('questionnaire', 'שאלון'), chat: tr('chat', 'צ\'אט'), journey: tr('My Journey', 'המסע שלי'), feedback: tr('others', 'אחרים'), assessment: tr('strengths check', 'שאלון החוזקות')};
      const row = (title, sub, onDel) => h('div', {class: 'pa-know'}, h('div', {}, h('b', {}, title), sub ? h('small', {}, sub) : null), onDel ? btn(tr('Delete', 'מחיקה'), onDel, 'pa-x') : null);
      const toggle = (labelTxt, key) => { const c = h('input', {type: 'checkbox'}); c.checked = !!p[key]; c.addEventListener('change', () => { const q = MP.read(); q[key] = c.checked; MP.write(q); paint(); }); return h('label', {class: 'pa-toggle'}, c, h('span', {}, labelTxt)); };
      return [h('div', {class: 'pa-card'}, toggle(tr('Use my profile to personalise the app', 'להשתמש בפרופיל כדי להתאים את האפליקציה'), 'enabled'),
          toggle(tr('Include it when I talk to the AI (chat, interview, CV)', 'לכלול אותו כשאני מדבר עם ה-AI (צ\'אט, ראיון, קורות חיים)'), 'shareWithAI'),
          h('p', {class: 'plus-muted'}, tr('Everything stays on this phone. Nothing here was guessed — it all comes from what you wrote or chose.', 'הכול נשאר בטלפון הזה. שום דבר כאן לא נוחש — הכול ממה שכתבת או בחרת.'))),
        h('h3', {class: 'pa-h3'}, tr('Skills the app sees', 'כישורים שהאפליקציה רואה')),
        sk.length ? h('div', {class: 'pa-card'}, ...sk.map(s => row(s.name + (s.strong ? ' ★' : ''), tr('from: ', 'מקור: ') + s.sources.map(x => srcL[x] || x).join(' + ') + (s.strong ? tr(' · seen in more than one place', ' · מופיע ביותר ממקום אחד') : ''),
          () => { const q = MP.read(); q.hidden = [...new Set([...q.hidden, s.id])]; delete q.chat[s.id]; q.self.strengths = q.self.strengths.filter(x => x !== s.id); MP.write(q); paint(); })))
          : h('p', {class: 'plus-muted'}, tr('Nothing yet.', 'עדיין כלום.')),
        p.hidden.length ? btn(tr('Show skills I removed again', 'להחזיר כישורים שמחקתי'), () => { const q = MP.read(); q.hidden = []; MP.write(q); paint(); }, 'plus-link') : null,
        h('h3', {class: 'pa-h3'}, tr('Your answers', 'התשובות שלך')),
        h('div', {class: 'pa-card'},
          p.military.roles ? row(tr('Service roles', 'תפקידים בשירות'), p.military.roles, () => { const q = MP.read(); q.military.roles = ''; MP.write(q); paint(); }) : null,
          ...p.military.activities.filter(a => a.name || a.what).map((a, i) => row((a.name || tr('Activity', 'פעילות')) + (a.rating ? ' · ' + a.rating + '/7' : ''), a.what, () => { const q = MP.read(); q.military.activities.splice(i, 1); MP.write(q); paint(); })),
          p.school.liked.length ? row(tr('Liked at school', 'אהבת בתיכון'), p.school.liked.map(s => label(SUBJECTS, s)).join(', '), () => { const q = MP.read(); q.school.liked = []; MP.write(q); paint(); }) : null,
          p.school.stoodOut ? row(tr('Stood out in', 'בלטת ב'), p.school.stoodOut, () => { const q = MP.read(); q.school.stoodOut = ''; MP.write(q); paint(); }) : null,
          ...p.feedback.filter(f => f.text).map((f, i) => row(tr('Remark', 'משפט') + ' — ' + label([['friend', 'Friend', 'חבר'], ['family', 'Family', 'משפחה'], ['commander', 'Commander', 'מפקד'], ['other', 'Other', 'אחר']], f.from), f.text, () => { const q = MP.read(); q.feedback.splice(i, 1); MP.write(q); paint(); })),
          p.deep.values.length ? row(tr('Values', 'ערכים'), p.deep.values.map(v => label(VALUES, v)).join(', '), () => { const q = MP.read(); q.deep.values = []; MP.write(q); paint(); }) : null,
          p.quiz && p.quiz.tags ? row(tr('"Which field fits me?" result', 'תוצאת "איזה תחום מתאים לי?"'), p.quiz.tags.map(quizLabel).join(', ') + (p.quiz.date ? ' · ' + p.quiz.date : ''), () => { const q = MP.read(); delete q.quiz; MP.write(q); paint(); }) : null,
          Object.keys(p.chat).length ? row(tr('Skills noticed in chat', 'כישורים שזוהו בצ\'אט'), Object.keys(p.chat).map(skillName).join(', '), () => { const q = MP.read(); q.chat = {}; MP.write(q); paint(); }) : null),
        aboutBox(p),
        h('div', {class: 'plus-row'}, btn(tr('Edit my answers', 'לערוך את התשובות'), () => { mode = 'form'; part = 0; paint(); }, 'plus-btn'),
          btn(tr('Delete my whole profile', 'למחוק את כל הפרופיל'), () => { if (confirm(tr('Delete the whole profile from this phone?', 'למחוק את כל הפרופיל מהטלפון?'))) { MP.clear(); mode = 'menu'; paint(); toast(tr('Profile deleted', 'הפרופיל נמחק')); } }, 'plus-link pa-danger'))];
    }
    function menu() {
      const p = MP.read(), c = MP.completion(p), sk = MP.skills(p).slice(0, 5), started = MP.has(p);
      return [h('div', {class: 'pa-hero'}, h('div', {}, h('small', {class: 'sim-kicker'}, tr('Optional · in parts · private', 'לא חובה · בחלקים · פרטי')),
          h('h2', {}, tr('Get to know your strengths', 'להכיר את החוזקות שלך')),
          h('p', {}, tr('A few short parts about your service, school and how you work. The app then quietly tailors your CV, interview practice, chat and suggestions.', 'כמה חלקים קצרים על השירות, התיכון ואיך אתה עובד. האפליקציה תתאים בשקט את קורות החיים, תרגול הראיון, הצ\'אט וההמלצות.'))), illu('compass', 66)),
        h('div', {class: 'pa-progress'}, h('span', {}, tr(c.done + ' of ' + c.of + ' parts', c.done + ' מתוך ' + c.of + ' חלקים')), h('div', {class: 'sim-prog'}, h('i', {style: 'width:' + Math.round(c.done / c.of * 100) + '%'}))),
        h('div', {class: 'pa-parts'}, PARTS.map(([id, en, he_, ill], i) => h('button', {type: 'button', class: 'pa-part' + (c.parts[i] ? ' done' : ''), onclick: () => { mode = 'form'; part = i; paint(); }},
          illu(ill, 36), h('span', {}, h('b', {}, he() ? he_ : en), h('small', {}, c.parts[i] ? tr('Done — tap to edit', 'מולא — לעריכה') : tr('A minute or two', 'דקה-שתיים'))), h('span', {class: 'pa-tick', 'aria-hidden': 'true'}, c.parts[i] ? '✓' : '')))),
        started ? h('section', {class: 'pa-card'}, h('b', {}, tr('Your top strengths so far', 'החוזקות המובילות שלך עד עכשיו')),
          h('div', {class: 'pa-chips'}, sk.map(s => h('span', {class: 'pa-chip on static'}, s.name + (s.strong ? ' ★' : '')))),
          sk.some(s => s.strong) ? h('small', {class: 'plus-muted'}, tr('★ = appears in more than one place (stronger evidence)', '★ = מופיע ביותר ממקום אחד (ראיה חזקה יותר)')) : null) : null,
        started ? h('div', {class: 'plus-row'}, btn(tr('What the app knows about me', 'מה האפליקציה יודעת עליי'), () => { mode = 'knows'; paint(); }, 'plus-btn primary'),
          PAGES_has('cv') ? btn(tr('Use it in my CV', 'להשתמש בזה בקורות החיים'), () => showPage('cv'), 'plus-btn') : null) : null];
    }
    const PAGES_has = id => !!(window.MomentumPlus);
    function form() {
      const p = MP.read(), [id, en, he_, ill] = PARTS[part];
      const body = [serviceForm, schoolForm, feedbackForm, selfForm, deepForm][part](p);
      return [h('div', {class: 'sim-top'}, h('span', {}, tr('Part ' + (part + 1) + ' of ' + PARTS.length, 'חלק ' + (part + 1) + ' מתוך ' + PARTS.length)), h('div', {class: 'sim-prog'}, h('i', {style: 'width:' + Math.round((part + 1) / PARTS.length * 100) + '%'}))),
        h('div', {class: 'pa-form-head'}, illu(ill, 44), h('h2', {}, he() ? he_ : en)),
        h('section', {class: 'pa-card pa-form'}, ...body),
        h('div', {class: 'plus-wiz-nav'}, btn(tr('Save and close', 'לשמור ולסגור'), () => { mode = 'menu'; paint(); toast(tr('Saved ✓', 'נשמר ✓')); }, 'plus-wiz-back'),
          part < PARTS.length - 1 ? btn(tr('Next part', 'לחלק הבא'), () => { part++; paint(); }, 'plus-btn primary plus-wiz-next') : btn(tr('Finish', 'סיום'), () => { mode = 'knows'; paint(); toast(tr('Your profile is ready ✓', 'הפרופיל מוכן ✓')); }, 'plus-btn primary plus-wiz-next')),
        h('p', {class: 'plus-muted pa-skip'}, tr('Every question is optional — skip anything.', 'כל שאלה היא רשות — אפשר לדלג על הכול.'))];
    }
    function paint() {
      const scr = mode === 'form' ? form() : mode === 'knows' ? knows() : menu();
      root.replaceChildren(...scr.filter(Boolean));
      try { (document.scrollingElement || document.documentElement).scrollTop = 0; } catch (_) {}
    }
    function page() { root = h('div', {class: 'pa'}); const q = new URLSearchParams(location.search); mode = q.get('view') === 'knows' ? 'knows' : 'menu'; paint(); return root; }
    function knowsPage() { root = h('div', {class: 'pa'}); mode = 'knows'; paint(); return root; }
    return {pages: {profile: page, aboutme: knowsPage}, heads: {profile: {icon: 'compass', title: ['My strengths profile', 'פרופיל החוזקות שלי']}, aboutme: {icon: 'compass', title: ['What the app knows about me', 'מה האפליקציה יודעת עליי']}}};
  };
})();
