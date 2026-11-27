/* interview-sim.js — Job interview simulator (27 Nov 2026).
   A private practice interviewer: questions by job type, the interviewer can speak (device voices),
   answers by typing or voice, instant local feedback on common mistakes, optional AI feedback and a
   follow-up question (same consent gate), and good answers can be saved to the CV. Nothing is stored
   outside the phone. */
(function () {
  'use strict';
  window.MomentumInterview = function (ctx) {
    const {h, btn, tr, he, illu, icon, P, store, toast, showPage, aiText} = ctx;

    /* ---------- question bank ---------- */
    const Q = (en, he_, look_en, look_he) => ({en, he: he_, look: [look_en, look_he]});
    const BANK = {
      general: [
        Q('Tell me about yourself.', 'ספר לי על עצמך.', 'A 60–90 second story: who you are, what you did, what you want now.', 'סיפור של דקה-דקה וחצי: מי אתה, מה עשית, מה אתה רוצה עכשיו.'),
        Q('What did you do in the army, and what did you learn there?', 'מה עשית בצבא ומה למדת שם?', 'Civilian words, your own part, one example.', 'מילים אזרחיות, החלק שלך, דוגמה אחת.'),
        Q('Tell me about a difficult situation and how you handled it.', 'ספר על מצב קשה ואיך התמודדת איתו.', 'Situation → what YOU did → result.', 'מצב ← מה אתה עשית ← מה יצא.'),
        Q('Why do you want this job?', 'למה אתה רוצה את העבודה הזאת?', 'Connect your strengths to the job — not only the salary.', 'לחבר בין החוזקות שלך לתפקיד — לא רק המשכורת.'),
        Q('What is a weakness of yours?', 'מה נקודת חולשה שלך?', 'A real one, and what you do to improve it.', 'חולשה אמיתית, ומה אתה עושה כדי להשתפר.'),
        Q('Where do you see yourself in a year?', 'איפה אתה רואה את עצמך בעוד שנה?', 'Honest and relevant: learning, growing in the role.', 'כנה ורלוונטי: ללמוד, להתקדם בתפקיד.'),
        Q('Tell me about a time you worked in a team.', 'ספר על פעם שעבדת בצוות.', 'Your role in the team, not only "we".', 'התפקיד שלך בצוות, לא רק "אנחנו".'),
        Q('Do you have any questions for us?', 'יש לך שאלות אלינו?', 'Always have one: training, a typical day, what success looks like.', 'תמיד להכין אחת: הכשרה, יום טיפוסי, איך נראית הצלחה.')
      ],
      operations: [
        Q('How do you handle many tasks at the same time?', 'איך אתה מסתדר עם הרבה משימות במקביל?', 'A method (lists, priorities) + an example.', 'שיטה (רשימות, סדרי עדיפויות) + דוגמה.'),
        Q('Tell me about a time something went wrong in a plan. What did you do?', 'ספר על פעם שתוכנית השתבשה. מה עשית?', 'Calm, fast decision, what you learned.', 'רוגע, החלטה מהירה, מה למדת.'),
        Q('How do you make sure work is done accurately?', 'איך אתה מוודא שהעבודה נעשית בדיוק?', 'Checks, procedures, a number if you have one.', 'בקרות, נהלים, מספר אם יש.')
      ],
      service: [
        Q('Tell me about an angry customer or person you had to calm down.', 'ספר על לקוח או אדם כועס שהיית צריך להרגיע.', 'Listening, empathy, a solution.', 'הקשבה, אמפתיה, פתרון.'),
        Q('What does good service mean to you?', 'מה זה שירות טוב בשבילך?', 'A short definition + an example from your life.', 'הגדרה קצרה + דוגמה מהחיים שלך.'),
        Q('How do you handle a target you are not reaching?', 'מה אתה עושה כשאתה לא עומד ביעד?', 'Honesty, a plan, asking for help.', 'כנות, תוכנית, לבקש עזרה.')
      ],
      security: [
        Q('How do you stay alert during long shifts?', 'איך אתה נשאר ערני במשמרות ארוכות?', 'Concrete habits, responsibility.', 'הרגלים מעשיים, אחריות.'),
        Q('Tell me about a time you had to follow a procedure strictly.', 'ספר על פעם שהיית צריך לפעול בדיוק לפי נוהל.', 'Why the procedure matters, what you did.', 'למה הנוהל חשוב, מה עשית.'),
        Q('What would you do if a colleague broke a safety rule?', 'מה היית עושה אם עמית עבר על כלל בטיחות?', 'Respectful, but safety first.', 'בכבוד, אבל בטיחות קודם.')
      ],
      tech: [
        Q('Tell me about a technical problem you solved.', 'ספר על בעיה טכנית שפתרת.', 'The problem, your steps, the result.', 'הבעיה, השלבים שלך, התוצאה.'),
        Q('How do you learn a new system or tool?', 'איך אתה לומד מערכת או כלי חדש?', 'Your method + an example.', 'השיטה שלך + דוגמה.'),
        Q('How do you explain a technical issue to someone who is not technical?', 'איך אתה מסביר בעיה טכנית למי שלא מבין בזה?', 'Simple words, patience.', 'מילים פשוטות, סבלנות.')
      ],
      studies: [
        Q('Why did you choose this field of study?', 'למה בחרת בתחום הלימודים הזה?', 'A real reason + what you already did toward it.', 'סיבה אמיתית + מה כבר עשית בכיוון.'),
        Q('How will you manage studies alongside work?', 'איך תשלב לימודים עם עבודה?', 'A realistic plan.', 'תוכנית מציאותית.'),
        Q('What did your service give you that will help you study?', 'מה השירות נתן לך שיעזור לך בלימודים?', 'Discipline, responsibility — with an example.', 'משמעת, אחריות — עם דוגמה.')
      ]
    };
    const TRACKS = [['general', 'Any job', 'כל עבודה', 'briefcase'], ['operations', 'Operations & logistics', 'תפעול ולוגיסטיקה', 'checklist'], ['service', 'Service & sales', 'שירות ומכירות', 'talk'],
      ['security', 'Security & safety', 'אבטחה ובטיחות', 'shield'], ['tech', 'Technical & IT', 'טכני ומחשבים', 'phonecheck'], ['studies', 'Studies interview', 'ראיון ללימודים', 'cap']];

    /* ---------- question types: each one has its own structure and checks ---------- */
    const KIND_BY_TEXT = {
      'Tell me about yourself.': 'intro', 'What did you do in the army, and what did you learn there?': 'army', 'Tell me about a difficult situation and how you handled it.': 'story',
      'Why do you want this job?': 'motivation', 'What is a weakness of yours?': 'weakness', 'Where do you see yourself in a year?': 'future', 'Tell me about a time you worked in a team.': 'story',
      'Do you have any questions for us?': 'ask', 'How do you handle many tasks at the same time?': 'method', 'Tell me about a time something went wrong in a plan. What did you do?': 'story',
      'How do you make sure work is done accurately?': 'method', 'Tell me about an angry customer or person you had to calm down.': 'story', 'What does good service mean to you?': 'method',
      'How do you handle a target you are not reaching?': 'method', 'How do you stay alert during long shifts?': 'method', 'Tell me about a time you had to follow a procedure strictly.': 'story',
      'What would you do if a colleague broke a safety rule?': 'hypo', 'Tell me about a technical problem you solved.': 'story', 'How do you learn a new system or tool?': 'method',
      'How do you explain a technical issue to someone who is not technical?': 'method', 'Why did you choose this field of study?': 'motivation', 'How will you manage studies alongside work?': 'method',
      'What did your service give you that will help you study?': 'army'};
    const kindOf = q => q.kind || KIND_BY_TEXT[q.en] || 'story';
    const PLAN = {
      intro: [['Who I am, in a few words (where from, what I do now)', 'מי אני בכמה מילים (מאיפה, מה אני עושה עכשיו)'], ['What I did in service — in civilian words', 'מה עשיתי בשירות — במילים אזרחיות'], ['One example I am proud of', 'דוגמה אחת שאני גאה בה'], ['What I am looking for now, and why here', 'מה אני מחפש עכשיו, ולמה כאן']],
      army: [['My role, in civilian words', 'התפקיד שלי, במילים אזרחיות'], ['What I was responsible for (a number if true)', 'על מה הייתי אחראי (מספר, אם נכון)'], ['One thing I learned', 'דבר אחד שלמדתי'], ['How it helps in this job', 'איך זה עוזר בעבודה הזו']],
      story: [['The situation — one sentence', 'המצב — משפט אחד'], ['What I did (I, not we)', 'מה אני עשיתי (אני, לא אנחנו)'], ['What came out of it', 'מה יצא מזה'], ['What I learned', 'מה למדתי']],
      motivation: [['What attracts me to this role or field', 'מה מושך אותי בתפקיד או בתחום'], ['A strength of mine that fits', 'חוזקה שלי שמתאימה'], ['An example that shows it', 'דוגמה שמראה את זה']],
      weakness: [['A real weakness (not "perfectionist")', 'חולשה אמיתית (לא "פרפקציוניסט")'], ['A short example', 'דוגמה קצרה'], ['What I do to improve it', 'מה אני עושה כדי להשתפר']],
      future: [['What I want to learn this year', 'מה אני רוצה ללמוד השנה'], ['How I want to grow here', 'איך אני רוצה להתקדם כאן']],
      ask: [['A question about the role or training', 'שאלה על התפקיד או ההכשרה'], ['A question about the team or what success looks like', 'שאלה על הצוות או איך נראית הצלחה']],
      method: [['My method — the steps', 'השיטה שלי — הצעדים'], ['An example from service or life', 'דוגמה מהשירות או מהחיים'], ['The result', 'התוצאה']],
      hypo: [['What I would do first', 'מה הייתי עושה קודם'], ['How I would talk to the person', 'איך הייתי מדבר עם האדם'], ['Why — the principle', 'למה — העיקרון']]
    };
    const LEN = {ask: [8, 70], future: [18, 120], weakness: [25, 150]};

    /* ---------- word lists (Hebrew prefixes ו/ב/ל/ה/מ/ש/כ handled) ---------- */
    const words = t => (String(t).match(/[\p{L}\p{N}"'׳״-]+/gu) || []);
    const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = (w, g) => new RegExp('(^|[^\\p{L}])(' + (/[֐-׿]/.test(w) ? '[ובלהמשכ]{0,2}' : '') + esc(w) + ')(?![\\p{L}])', 'iu' + (g ? 'g' : ''));
    const has = (t, list) => list.filter(w => rx(w).test(t));
    const CIV = {'מ"כ': 'ראש צוות', 'מ"מ': 'מנהל צוות', 'מ"פ': 'מנהל יחידה', 'סמ"ל': 'סגן ראש צוות', 'רס"ר': 'אחראי לוגיסטיקה ומשמעת', 'קשר"ג': 'אחראי תקשורת', 'ש"ג': 'בקרת כניסה',
      'תש"ש': 'רווחת עובדים', 'חפ"ק': 'צוות ניהול שטח', 'שמ"פ': 'יחידת מילואים', 'פלוגה': 'יחידה', 'גדוד': 'ארגון של מאות אנשים', 'חטיבה': 'ארגון גדול', 'מחלקה': 'צוות', 'מבצעי': 'תפעולי', 'מבצעית': 'תפעולית',
      'שמירות': 'משמרות אבטחה', 'תרגילים': 'אימונים מעשיים', 'כיתה': 'צוות', platoon: 'team', battalion: 'organisation of several hundred people', squad: 'team', 'company commander': 'unit manager', 'guard duty': 'security shifts', drills: 'hands-on training'};
    const JARGON = Object.keys(CIV);
    const WE = ['אנחנו', 'היינו', 'עשינו', 'הלכנו', 'עבדנו', 'ניהלנו', 'החלטנו', 'הצלחנו', 'שלנו', 'we', 'our', 'us'];
    const I = ['אני', 'הייתי', 'עשיתי', 'הובלתי', 'ניהלתי', 'החלטתי', 'למדתי', 'הצלחתי', 'ארגנתי', 'דאגתי', 'שלי', 'I', 'my', 'me'];
    const RANK = ['סמל', 'סמ"ר', 'רב"ט', 'רס"ל', 'סגן', 'סרן', 'רס"ן', 'sergeant', 'corporal', 'lieutenant', 'captain'];
    const FORMAL = ['הנני', 'הריני', 'לפיכך', 'על כן', 'הנ"ל', 'בברכה', 'hereby', 'therefore', 'aforementioned'];
    const VAGUE = ['דברים', 'כל מיני', 'וכו', 'בערך', 'משהו כזה', 'כאילו', 'stuff', 'things', 'etc', 'kind of', 'sort of'];
    const CLICHE = ['פרפקציוניסט', 'פרפקציוניסטית', 'עובד יותר מדי', 'עובדת יותר מדי', 'אכפתי מדי', 'perfectionist', 'work too hard', 'care too much'];
    const T = {
      result: /(בסוף|התוצאה|הצלחנו|הצלחתי|למדתי|השתפר|שיפרתי|הבנתי|in the end|result|learned|improved|managed to|realised|realized)/i,
      action: /(אני\s|הובלתי|ארגנתי|החלטתי|דאגתי|דיברתי|בדקתי|פתרתי|תכננתי|ישבתי|הסברתי|I\s(led|organi[sz]ed|decided|made sure|talked|checked|solved|planned|explained))/i,
      goal: /(מחפש|מחפשת|רוצה|מעוניין|מעוניינת|שואף|looking for|want|would like|hope)/i,
      company: /(התפקיד|החברה|המקום|הצוות|התחום|אצלכם|כאן|the role|this job|your company|the team|here|this field)/i,
      money: /(כסף|משכורת|שכר|salary|money|pay)/i,
      improve: /(משתפר|משתפרת|לומד|לומדת|עובד על|עובדת על|עובד עם|עובדת עם|מתרגל|מתרגלת|שיפרתי|מבקש|מבקשת|ביקשתי|עזרה|רשימ|תזכורת|יומן|משוב|מקפיד|מקפידה|היום אני|improv|working on|practis|practic|learning|I now|these days I|ask for)/i,
      steps: /(קודם|אחר כך|ואז|בהתחלה|רשימה|סדר עדיפויות|שלב|first|then|after that|list|priorit|step)/i,
      would: /(הייתי|הייתה|I would|I'd)/i,
      learn: /(ללמוד|להתקדם|להתפתח|לגדול|learn|grow|develop|progress)/i
    };

    function analyse(ans, q) {
      const t = String(ans || '').trim(), n = words(t).length, out = [], kind = kindOf(q || {}), [lo, hi] = LEN[kind] || [30, 170];
      const add = (ok, en, he_, fix_en, fix_he, weight) => out.push({ok, w: weight || 1, text: tr(en, he_), fix: ok ? '' : tr(fix_en, fix_he)});
      // 1. content that THIS question needs
      if (kind === 'intro') { add(T.goal.test(t), 'Ends with what you are looking for', 'סוגר במה שאתה מחפש', 'Finish with one sentence: what you want now and why this place.', 'לסיים במשפט אחד: מה אתה מחפש עכשיו ולמה דווקא כאן.', 2); add(/\d|שירת|בצבא|בשירות|השירות|army|service|served/i.test(t) || has(t, JARGON).length > 0, 'Mentions your service briefly', 'מזכיר את השירות בקצרה', 'Add one sentence about what you did in service, in civilian words.', 'להוסיף משפט אחד על מה שעשית בשירות, במילים אזרחיות.'); }
      if (kind === 'army') { add(T.action.test(t), 'Your own actions', 'מה אתה עשית', 'Describe what YOU did, with action words: "I led", "I organised".', 'לתאר מה אתה עשית, עם פעלים: "הובלתי", "ארגנתי".', 2); add(/(למדתי|הבנתי|learned|taught me)/i.test(t), 'What you learned', 'מה למדת', 'Add: "From this I learned…".', 'להוסיף: "מזה למדתי…".', 2); }
      if (kind === 'story') { add(T.action.test(t), 'What YOU did (the action)', 'מה אתה עשית (הפעולה)', 'The heart of the story is your action: "I talked to…", "I decided…".', 'לב הסיפור הוא הפעולה שלך: "דיברתי עם…", "החלטתי…".', 2); add(T.result.test(t), 'The result', 'התוצאה', 'Finish with what came out of it or what you learned.', 'לסיים במה שיצא מזה או מה שלמדת.', 2); }
      if (kind === 'motivation') { add(T.company.test(t), 'About this role, not general', 'על התפקיד הזה, לא כללי', 'Say what attracts you to THIS role or field.', 'להגיד מה מושך אותך דווקא בתפקיד או בתחום הזה.', 2); add(!(T.money.test(t) && !T.company.test(t)), 'More than money', 'יותר מכסף', 'Money is fine to want, but lead with interest and fit.', 'מותר לרצות כסף, אבל לפתוח בעניין ובהתאמה.'); }
      if (kind === 'weakness') { add(!has(t, CLICHE).length, 'A real weakness (no cliché)', 'חולשה אמיתית (בלי קלישאה)', '"Perfectionist" sounds rehearsed — pick something real but not critical for the job.', '"פרפקציוניסט" נשמע משונן — לבחור משהו אמיתי שלא קריטי לתפקיד.', 2); add(T.improve.test(t), 'What you do about it', 'מה אתה עושה עם זה', 'Add how you are improving it — a habit, a tool, asking for feedback.', 'להוסיף איך אתה משתפר — הרגל, כלי, בקשת משוב.', 2); }
      if (kind === 'future') add(T.learn.test(t), 'Growth, not a vague wish', 'התפתחות, לא משאלה כללית', 'Say what you want to learn or how you want to grow in the role.', 'להגיד מה אתה רוצה ללמוד או איך להתקדם בתפקיד.', 2);
      if (kind === 'ask') add(/\?/.test(t), 'An actual question', 'שאלה אמיתית', 'Ask at least one real question (with a "?"): training, a typical day, success.', 'לשאול לפחות שאלה אחת (עם "?"): הכשרה, יום טיפוסי, הצלחה.', 3);
      if (kind === 'method') { add(T.steps.test(t), 'A clear method (steps)', 'שיטה ברורה (צעדים)', 'Describe your steps: "first… then…".', 'לתאר צעדים: "קודם… ואז…".', 2); add(/(למשל|לדוגמה|פעם|בשירות|for example|once|in the army|when I)/i.test(t), 'An example', 'דוגמה', 'Back the method with one short example.', 'לגבות את השיטה בדוגמה קצרה אחת.', 2); }
      if (kind === 'hypo') { add(T.would.test(t), 'What you would do', 'מה היית עושה', 'Answer directly: "I would first…".', 'לענות ישירות: "קודם הייתי…".', 2); add(/(בטיחות|כבוד|safety|respect|rule|נוהל)/i.test(t), 'The principle behind it', 'העיקרון מאחורי זה', 'Add why: safety first, but with respect.', 'להוסיף למה: בטיחות קודם, אבל בכבוד.'); }
      // 2. general interview habits
      add(n >= lo && n <= hi, 'Length', 'אורך', n < lo ? 'A bit short — add one concrete detail.' : 'Too long — aim for about one minute.', n < lo ? 'קצר מעט — להוסיף פרט מוחשי אחד.' : 'ארוך מדי — לכוון לבערך דקה.');
      const j = has(t, JARGON); add(!j.length, 'No military jargon', 'בלי ז׳רגון צבאי', 'Replace the marked words above.', 'להחליף את המילים המסומנות למעלה.', 2);
      if (kind !== 'ask' && kind !== 'future') { const we = has(t, WE).length, me = has(t, I).length; add(!(we > 0 && we >= me), '"I", not only "we"', '"אני", לא רק "אנחנו"', 'Interviewers hire you, not the unit — say what YOU did.', 'מראיינים מקבלים אותך, לא את היחידה — להגיד מה אתה עשית.', 2); }
      if (['story', 'army', 'method', 'intro'].includes(kind)) add(/\d/.test(t), 'A real number', 'מספר אמיתי', 'Add one number if true: people, hours, how often, a result.', 'להוסיף מספר אחד אם נכון: אנשים, שעות, כמה פעמים, תוצאה.');
      add(!has(t.split(/\s+/).slice(0, 8).join(' '), RANK).length, 'Starts with you, not rank', 'פותח בך, לא בדרגה', 'Open with what you did; the rank later, if at all.', 'לפתוח במה שעשית; הדרגה אחר כך, אם בכלל.');
      add(!has(t, FORMAL).length, 'Natural tone', 'טון טבעי', 'Too formal — talk, do not write a letter.', 'רשמי מדי — לדבר, לא לכתוב מכתב.');
      add(!has(t, VAGUE).length, 'Specific words', 'מילים ספציפיות', 'Replace the marked vague words with what actually happened.', 'להחליף את המילים הכלליות המסומנות במה שקרה בפועל.');
      const max = out.reduce((s, x) => s + x.w, 0), got = out.filter(x => x.ok).reduce((s, x) => s + x.w, 0);
      return {n, kind, items: out, score: out.filter(x => x.ok).length, max: out.length, pct: Math.round(got / max * 100)};
    }
    // The answer itself, with the problem words marked and a civilian alternative where there is one.
    function marked(t) {
      const marks = [];
      const scan = (list, cls) => list.forEach(w => { const r = rx(w, true); let m; while ((m = r.exec(t))) { const start = m.index + m[1].length; marks.push({start, end: start + m[2].length, cls, w}); } });
      scan(JARGON, 'jar'); scan(WE, 'we'); scan(VAGUE, 'vag'); scan(FORMAL, 'for'); scan(CLICHE, 'cli');
      marks.sort((a, b) => a.start - b.start);
      const out = []; let i = 0;
      marks.forEach(m => { if (m.start < i) return; if (m.start > i) out.push(document.createTextNode(t.slice(i, m.start)));
        const civ = CIV[m.w] || CIV[m.w.toLowerCase()];
        out.push(h('mark', {class: 'sim-m sim-m-' + m.cls, title: civ ? tr('Say: ', 'במקום: ') + civ : ''}, t.slice(m.start, m.end)), civ ? h('span', {class: 'sim-civ'}, ' → ' + civ) : null);
        i = m.end; });
      if (i < t.length) out.push(document.createTextNode(t.slice(i)));
      return {nodes: out.filter(Boolean), count: marks.length};
    }

    /* ---------- voice: interviewer speaks, you can answer by voice ---------- */
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    const voicesFor = lang => synth ? (synth.getVoices() || []).filter(v => String(v.lang).toLowerCase().startsWith(lang)) : [];
    function speak(text) {
      if (!synth || P.simVoice === 'off') return;
      try { synth.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = he() ? 'he-IL' : 'en-US'; u.rate = 0.98;
        const v = voicesFor(he() ? 'he' : 'en').find(x => x.name === P.simVoice) || voicesFor(he() ? 'he' : 'en')[0]; if (v) u.voice = v; synth.speak(u); } catch (_) {}
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Lucide "mic" (ISC licence)
    const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>';
    const micLabel = (el, on) => { el.innerHTML = MIC; el.append(document.createTextNode(' ' + (on ? tr('Stop', 'עצירה') : tr('Voice', 'בקול')))); };

    /* ---------- state ---------- */
    let st = null; // {track, qs, i, answers: [{q, a, res, ai}], phase}
    let root = null;
    const start = track => {
      const pool = [...BANK.general.slice(0, 3), ...(BANK[track] || []), ...BANK.general.slice(3)];
      const qs = (track === 'general' ? BANK.general : [pool[0], pool[1], ...(BANK[track] || []), BANK.general[3], BANK.general[7]]).slice(0, 6);
      st = {track, qs, i: 0, answers: [], phase: 'ask'}; P.simTrack = track; store(); paint(); setTimeout(() => speak(qtext()), 300);
    };
    const qtext = () => { const q = st.qs[st.i]; return he() ? q.he : q.en; };

    /* ---------- the AI interviewer (the site's own AI, through the consent gate) ---------- */
    const aiOn = () => !P.infoOnly && P.simAI !== false && typeof aiText === 'function';
    const TRACK_NAME = id => { const t = TRACKS.find(x => x[0] === id); return t ? t[1] : 'Any job'; };
    const parseJSON = raw => JSON.parse((String(raw).match(/\{[\s\S]*\}/) || [raw])[0]);
    const coachSystem = () => [
      he() ? 'You are a senior Israeli recruiter and interview coach. You are interviewing a discharged IDF soldier for a "' + TRACK_NAME(st.track) + '" job. Write natural, warm, direct Hebrew (spoken style, not formal).'
           : 'You are a senior recruiter and interview coach interviewing a discharged Israeli soldier for a "' + TRACK_NAME(st.track) + '" job. Write natural, warm, direct English.',
      'Rules: judge ONLY what the candidate actually said. Never invent facts, numbers, units or achievements. Quote their exact words when pointing at a problem. Be concrete like a real mentor — no generic advice.',
      'Military terms must become civilian words an HR person understands. No classified detail.',
      'Return ONLY valid JSON.'].join('\n');
    async function aiFeedback(box, cur) {
      const q = st.qs[st.i];
      box.replaceChildren(h('div', {class: 'sim-ai-loading'}, h('span', {class: 'sim-ai-dot'}), h('span', {class: 'sim-ai-dot'}), h('span', {class: 'sim-ai-dot'}), h('span', {}, tr('The interviewer is reading your answer…', 'המראיין קורא את התשובה שלך…'))));
      try {
        const misses = cur.res.items.filter(x => !x.ok).map(x => x.text).join('; ');
        const prompt = ['Question: ' + (he() ? q.he : q.en), 'What a good answer contains: ' + q.look[he() ? 1 : 0], 'Candidate answer: """' + cur.a + '"""',
          'Automatic checks that failed: ' + (misses || 'none'), cur.sec ? 'Answer took ' + cur.sec + ' seconds.' : '',
          'Return JSON: {"score":1-10,"verdict":"one honest sentence, like an interviewer thinking out loud","good":["1-2 specific strengths, quoting them"],"fix":[{"quote":"exact words from the answer or empty","why":"what an interviewer hears","instead":"what to say instead, using only their facts"}],"better":"the SAME answer rewritten to be strong, 60-110 words, only their facts, first person, natural speech","followup":"the next question a real interviewer would ask based on THIS answer"}'].filter(Boolean).join('\n');
        const j = parseJSON(await aiText(coachSystem(), prompt, 1200));
        cur.ai = j; renderAI(box, j, cur);
      } catch (e) {
        box.replaceChildren(h('div', {class: 'sim-ai-off'}, h('p', {}, e.canceled ? tr('You chose not to send — the local checks above still apply.', 'בחרת לא לשלוח — הבדיקות למעלה עדיין תקפות.') : tr('The AI interviewer is not available right now. The checks above still work.', 'המראיין ה-AI לא זמין כרגע. הבדיקות למעלה עדיין עובדות.')),
          btn(tr('Try again', 'לנסות שוב'), () => aiFeedback(box, cur), 'plus-link')));
      }
    }
    function renderAI(box, j, cur) {
      const score = Math.max(1, Math.min(10, Number(j.score) || 0));
      // one score on screen: once the interviewer answers, the ring shows the interviewer's score
      const ring = root && root.querySelector('.sim-score .sim-ring');
      if (ring && score) { ring.style.setProperty('--p', score * 10); ring.querySelector('b').textContent = score + '/10';
        const lbl = root.querySelector('.sim-score strong'); if (lbl) lbl.textContent = score >= 8 ? tr('Strong answer!', 'תשובה חזקה!') : score >= 6 ? tr('Good — a couple of fixes', 'טוב — כמה תיקונים') : tr('A good start — let us sharpen it', 'התחלה טובה — בוא נחדד'); }
      const fixes = Array.isArray(j.fix) ? j.fix.slice(0, 3) : [];
      box.replaceChildren(h('div', {class: 'sim-ai-card'},
        h('div', {class: 'sim-ai-head'}, illu('talk', 38), h('div', {}, h('small', {}, tr('The interviewer thinks', 'המראיין חושב')), h('p', {class: 'sim-verdict'}, String(j.verdict || '')))),
        Array.isArray(j.good) && j.good.length ? h('div', {class: 'sim-ai-good'}, h('b', {}, tr('What works', 'מה עובד')), h('ul', {}, j.good.slice(0, 2).map(x => h('li', {}, String(x))))) : null,
        fixes.length ? h('div', {class: 'sim-ai-fixes'}, h('b', {}, tr('What to change', 'מה לשנות')), ...fixes.map(f => h('div', {class: 'sim-ai-fix'},
          f.quote ? h('p', {class: 'sim-q'}, '"' + String(f.quote) + '"') : null, h('p', {}, String(f.why || '')), f.instead ? h('p', {class: 'sim-instead'}, h('b', {}, tr('Instead: ', 'במקום: ')), String(f.instead)) : null))) : null,
        j.better ? h('div', {class: 'sim-better'}, h('b', {}, tr('Your answer, stronger (your facts only)', 'התשובה שלך, חזקה יותר (רק העובדות שלך)')), h('p', {}, String(j.better)),
          h('div', {class: 'plus-row'}, btn(tr('Practise this version', 'לתרגל את הגרסה הזו'), () => { st.phase = 'ask'; st.prefill = String(j.better); paint(); }, 'plus-btn'),
            btn(tr('Save to my CV draft', 'לשמור לקורות החיים'), () => saveToCv(String(j.better)), 'plus-link'))) : null,
        j.followup ? h('p', {class: 'sim-next-hint'}, tr('The interviewer will follow up on this.', 'המראיין ימשיך עם שאלת המשך על זה.')) : null));
    }
    // After an answer: a real interviewer often digs deeper once, then moves on.
    function next() {
      const cur = st.answers[st.i], q = st.qs[st.i];
      if (aiOn() && cur && cur.ai && cur.ai.followup && !q.isFollow && !cur.followed) {
        cur.followed = true;
        st.qs.splice(st.i + 1, 0, {kind: 'story', isFollow: true, en: String(cur.ai.followup), he: String(cur.ai.followup), look: ['The interviewer is digging into your last answer — be specific.', 'המראיין מעמיק בתשובה הקודמת — כדאי להיות ספציפי.']});
      }
      if (st.i < st.qs.length - 1) { st.i++; st.phase = 'ask'; paint(); setTimeout(() => speak(qtext()), 250); }
      else { st.phase = 'done'; paint(); }
    }
    async function aiReport(box) {
      const done = st.answers.filter(a => a && a.a);
      if (!done.length) return;
      box.replaceChildren(h('div', {class: 'sim-ai-loading'}, h('span', {class: 'sim-ai-dot'}), h('span', {class: 'sim-ai-dot'}), h('span', {class: 'sim-ai-dot'}), h('span', {}, tr('The interviewer is writing a summary…', 'המראיין כותב סיכום…'))));
      try {
        const prompt = done.map((a, k) => (k + 1) + '. Q: ' + a.q + '\nA: ' + a.a).join('\n\n') +
          '\n\nReturn JSON: {"ready":1-10,"headline":"one honest sentence about how this candidate comes across","strengths":["3 strengths seen in the answers, with evidence"],"work_on":["3 specific things to practise before a real interview"],"tip":"one concrete thing to do the day before the interview"}';
        const j = parseJSON(await aiText(coachSystem(), prompt, 1200));
        box.replaceChildren(h('div', {class: 'sim-ai-card sim-report'},
          h('div', {class: 'sim-ai-head'}, illu('award', 40), h('div', {}, h('small', {}, tr('Interviewer summary', 'סיכום המראיין')), h('p', {class: 'sim-verdict'}, String(j.headline || ''))), j.ready ? h('b', {class: 'sim-ai-score'}, Math.max(1, Math.min(10, Number(j.ready))) + '/10') : null),
          Array.isArray(j.strengths) ? h('div', {class: 'sim-ai-good'}, h('b', {}, tr('Your strengths', 'החוזקות שלך')), h('ul', {}, j.strengths.slice(0, 3).map(x => h('li', {}, String(x))))) : null,
          Array.isArray(j.work_on) ? h('div', {class: 'sim-ai-fixes'}, h('b', {}, tr('Practise before the real one', 'לתרגל לפני הראיון האמיתי')), h('ul', {}, j.work_on.slice(0, 3).map(x => h('li', {}, String(x))))) : null,
          j.tip ? h('p', {class: 'sim-instead'}, h('b', {}, tr('The day before: ', 'יום לפני: ')), String(j.tip)) : null));
      } catch (e) { box.replaceChildren(h('p', {class: 'plus-muted'}, tr('The AI summary is not available right now.', 'סיכום ה-AI לא זמין כרגע.'))); }
    }
    function saveToCv(text) {
      if (!P.cv || typeof P.cv !== 'object') P.cv = {lang: he() ? 'he' : 'en', bullets: []};
      if (!Array.isArray(P.cv.bullets)) P.cv.bullets = [];
      const line = String(text).replace(/\s+/g, ' ').trim();
      const short = line.length > 180 ? line.slice(0, line.lastIndexOf(' ', 175)) + '…' : line;
      P.cv.bullets.push(short); store();
      toast(tr('Added to your CV draft — edit it there', 'נוסף לטיוטת קורות החיים — אפשר לערוך שם'));
    }

    /* ---------- screens ---------- */
    function setupScreen() {
      const vs = voicesFor(he() ? 'he' : 'en');
      const voiceSel = h('select', {class: 'sim-voice', 'aria-label': tr('Interviewer voice', 'הקול של המראיין')},
        h('option', {value: 'off'}, tr('Silent (text only)', 'בלי קול (טקסט בלבד)')), ...vs.map(v => h('option', {value: v.name}, v.name)));
      voiceSel.value = P.simVoice || (vs[0] ? vs[0].name : 'off');
      voiceSel.addEventListener('change', () => { P.simVoice = voiceSel.value; store(); speak(tr('Hello, nice to meet you.', 'שלום, נעים להכיר.')); });
      return [
        h('div', {class: 'sim-hero sim-hero-dark'}, h('div', {}, h('small', {class: 'sim-kicker'}, tr('6 questions · about 10 minutes', '6 שאלות · בערך 10 דקות')),
          h('h2', {}, tr('Walk in to the real interview already practised', 'להגיע לראיון האמיתי כבר אחרי אימון')),
          h('p', {}, tr('The interviewer asks, you answer in writing or out loud, and get clear feedback right away.', 'המראיין שואל, אתה עונה בכתב או בקול, ומקבל משוב ברור מיד.'))), illu('talk', 72)),
        (P.simHistory || []).length ? h('p', {class: 'sim-last'}, tr('Last practice: ', 'אימון אחרון: ') + P.simHistory[P.simHistory.length - 1].avg + '%' + tr(' — try to beat it', ' — נסה לשבור את השיא')) : null,
        h('h2', {class: 'sim-h2'}, tr('What kind of job?', 'לאיזה סוג עבודה?')),
        h('div', {class: 'sim-tracks'}, TRACKS.map(([id, en, he_, ill]) => h('button', {type: 'button', class: 'sim-track' + (P.simTrack === id ? ' on' : ''), onclick: () => start(id)}, illu(ill, 42), h('span', {}, h('b', {}, he() ? he_ : en), h('small', {}, tr('Start →', 'להתחיל ←')))))),
        P.infoOnly ? null : h('label', {class: 'sim-aimode'}, (() => { const c = h('input', {type: 'checkbox'}); c.checked = P.simAI !== false; c.addEventListener('change', () => { P.simAI = c.checked; store(); }); return c; })(),
          h('span', {}, h('b', {}, tr('AI interviewer (recommended)', 'מראיין AI (מומלץ)')), h('small', {}, tr('Reads every answer, quotes what to change, asks real follow-up questions and sums up. Uses the app\'s AI after your approval.', 'קורא כל תשובה, מצטט מה לשנות, שואל שאלות המשך אמיתיות ומסכם. משתמש ב-AI של האפליקציה אחרי אישור שלך.')))),
        h('div', {class: 'sim-settings'},
          h('label', {}, h('span', {}, tr('Interviewer voice', 'הקול של המראיין')), voiceSel),
          !vs.length && synth ? h('small', {class: 'plus-muted'}, tr('No voice for this language on this device — the questions will be shown as text.', 'אין במכשיר קול לשפה הזו — השאלות יוצגו כטקסט.')) : null),
        h('details', {class: 'plus-card plus-right-fold sim-tips'}, h('summary', {class: 'plus-right-sum'}, h('span', {class: 'plus-right-title'}, tr('What the feedback checks', 'מה המשוב בודק')), h('span', {class: 'plus-right-chev', 'aria-hidden': 'true'})),
          h('div', {class: 'plus-right-body'}, h('ul', {class: 'plus-list'}, [tr('Length — about one minute', 'אורך — בערך דקה'), tr('Military jargon', 'ז׳רגון צבאי'), tr('"We" instead of "I"', '"אנחנו" במקום "אני"'), tr('A real number or fact', 'מספר או עובדה אמיתיים'), tr('Opening with your rank', 'פתיחה בדרגה'), tr('Too formal', 'רשמי מדי'), tr('Vague words', 'מילים כלליות'), tr('Ending with a result', 'סיום בתוצאה')].map(x => h('li', {}, x))),
            h('p', {class: 'plus-muted'}, tr('The checklist runs on your phone. AI feedback is optional and asks for your approval.', 'הבדיקה רצה בטלפון. משוב AI הוא רשות ומבקש אישור.')))),
        h('div', {class: 'plus-row'}, btn(tr('Tips for talking about your service', 'טיפים לדבר על השירות'), () => showPage('interview'), 'plus-link'))];
    }
    function askScreen() {
      const q = st.qs[st.i], cur = st.answers[st.i] || {a: ''};
      const ta = h('textarea', {class: 'sim-answer', rows: '6', placeholder: tr('Type your answer — or press the microphone and talk', 'כתוב את התשובה — או לחץ על המיקרופון ודבר'), 'aria-label': tr('Your answer', 'התשובה שלך')});
      ta.value = st.prefill || cur.a || ''; st.prefill = '';
      const live = h('p', {class: 'sim-live', 'aria-live': 'polite'});
      const [lo, hi] = LEN[kindOf(q)] || [30, 170];
      let t0 = 0, timer = null;
      const fmt = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      const count = () => { const n = words(ta.value).length, sec = t0 ? Math.round((Date.now() - t0) / 1000) : 0;
        live.textContent = n ? tr(n + ' words', n + ' מילים') + (sec ? ' · ' + fmt(sec) : '') + (n < lo ? tr(' · add a little more', ' · אפשר להוסיף עוד קצת') : n > hi ? tr(' · try to shorten', ' · כדאי לקצר') : tr(' · good length', ' · אורך טוב')) : ''; };
      const startClock = () => { if (!t0) { t0 = Date.now(); timer = setInterval(() => { if (!ta.isConnected) { clearInterval(timer); return; } count(); }, 1000); } };
      ta.addEventListener('input', () => { startClock(); count(); }); count();
      const plan = PLAN[kindOf(q)] || PLAN.story;
      const fields = plan.map(([en, he_]) => h('input', {type: 'text', class: 'sim-plan-in', placeholder: tr(en, he_), 'aria-label': tr(en, he_)}));
      const builder = h('details', {class: 'sim-plan'}, h('summary', {}, tr('Build it step by step (' + plan.length + ' short parts)', 'לבנות שלב אחרי שלב (' + plan.length + ' חלקים קצרים)')),
        h('ol', {class: 'sim-plan-list'}, fields.map((f, k) => h('li', {}, h('small', {}, tr(plan[k][0], plan[k][1])), f))),
        btn(tr('Put it together', 'לחבר לתשובה'), () => { const parts = fields.map(f => f.value.trim()).filter(Boolean).map(x => /[.!?]$/.test(x) ? x : x + '.');
          if (!parts.length) { fields[0].focus(); return; } ta.value = parts.join(' '); startClock(); count(); ta.focus(); toast(tr('Your answer is ready — read it out loud once', 'התשובה מוכנה — כדאי לקרוא אותה בקול פעם אחת')); }, 'plus-btn'));
      let rec = null;
      const mic = SR ? btn(tr('Voice', 'בקול'), () => {
        if (rec) { rec.stop(); return; }
        try { rec = new SR(); rec.lang = he() ? 'he-IL' : 'en-US'; rec.interimResults = true; rec.continuous = true;
          const base = ta.value ? ta.value + ' ' : '';
          rec.onresult = e => { let txt = ''; for (let k = 0; k < e.results.length; k++) txt += e.results[k][0].transcript; ta.value = base + txt; count(); };
          rec.onend = () => { rec = null; mic.classList.remove('on'); micLabel(mic, false); };
          rec.onerror = () => toast(tr('The microphone is not available.', 'המיקרופון לא זמין.'));
          rec.start(); startClock(); mic.classList.add('on'); micLabel(mic, true);
        } catch (_) { toast(tr('Voice is not supported in this browser.', 'הדפדפן לא תומך בדיבור.')); }
      }, 'sim-mic') : null;
      if (mic) micLabel(mic, false);
      return [
        h('div', {class: 'sim-top'}, h('span', {}, tr('Question ' + (st.i + 1) + ' of ' + st.qs.length, 'שאלה ' + (st.i + 1) + ' מתוך ' + st.qs.length)),
          h('div', {class: 'sim-prog', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(st.qs.length), 'aria-valuenow': String(st.i + 1)}, h('i', {style: 'width:' + Math.round((st.i + 1) / st.qs.length * 100) + '%'}))),
        h('div', {class: 'sim-bubble'}, illu('talk', 40, 'sim-avatar'), h('div', {}, h('small', {}, q.isFollow ? tr('Interviewer · follow-up', 'המראיין · שאלת המשך') : tr('Interviewer', 'המראיין')), h('p', {}, he() ? q.he : q.en)),
          synth && P.simVoice !== 'off' ? h('button', {type: 'button', class: 'sim-replay', 'aria-label': tr('Hear the question again', 'לשמוע שוב'), onclick: () => speak(qtext())}, icon('speaker')) : null),
        h('p', {class: 'sim-look'}, h('b', {}, tr('What they look for: ', 'מה מחפשים: ')), q.look[he() ? 1 : 0]),
        h('div', {class: 'sim-answer-card'}, h('small', {class: 'sim-you'}, tr('Your answer', 'התשובה שלך')), ta, h('div', {class: 'sim-answer-foot'}, live, mic)),
        builder,
        h('div', {class: 'sim-actions'},
          btn(tr('Check my answer', 'לבדוק את התשובה'), () => { if (words(ta.value).length < 3) { ta.focus(); toast(tr('Write or say an answer first', 'קודם לכתוב או להגיד תשובה')); return; }
            if (rec) rec.stop(); if (timer) clearInterval(timer); st.answers[st.i] = {q: qtext(), a: ta.value.trim(), sec: t0 ? Math.round((Date.now() - t0) / 1000) : 0, res: analyse(ta.value, st.qs[st.i])}; st.phase = 'review'; paint(); }, 'plus-btn primary sim-cta')),
        h('button', {type: 'button', class: 'plus-link sim-skip', onclick: () => { st.answers[st.i] = {q: qtext(), a: '', res: null}; next(); }}, tr('Skip this question', 'לדלג על השאלה'))];
    }
    function reviewScreen() {
      const cur = st.answers[st.i], r = cur.res, pct = r.pct;
      const mk = marked(cur.a);
      if (aiOn()) { if (cur.ai) setTimeout(() => renderAI(aiBox, cur.ai, cur)); else setTimeout(() => aiFeedback(aiBox, cur)); }
      else if (!P.infoOnly) setTimeout(() => aiBox.replaceChildren(btn(tr('Get the AI interviewer\'s feedback', 'לקבל משוב מהמראיין ה-AI'), () => aiFeedback(aiBox, cur), 'plus-btn sim-ai-btn')));
      const aiBox = h('div', {class: 'sim-ai', 'aria-live': 'polite'});
      return [
        h('div', {class: 'sim-top'}, h('span', {}, tr('Feedback · question ' + (st.i + 1), 'משוב · שאלה ' + (st.i + 1))), h('div', {class: 'sim-prog'}, h('i', {style: 'width:' + Math.round((st.i + 1) / st.qs.length * 100) + '%'}))),
        h('div', {class: 'sim-score'}, h('div', {class: 'sim-ring', style: '--p:' + pct}, h('b', {}, pct + '%')),
          h('div', {}, h('strong', {}, pct >= 85 ? tr('Strong answer!', 'תשובה חזקה!') : pct >= 60 ? tr('Good — a couple of fixes', 'טוב — כמה תיקונים קטנים') : tr('A good start — let us sharpen it', 'התחלה טובה — בוא נחדד')),
            h('small', {}, tr(r.n + ' words', r.n + ' מילים') + (cur.sec ? ' · ' + Math.floor(cur.sec / 60) + ':' + String(cur.sec % 60).padStart(2, '0') : '') + ' · ' + tr(r.score + ' of ' + r.max + ' checks', r.score + ' מתוך ' + r.max + ' בדיקות')))),
        h('div', {class: 'sim-marked'}, h('small', {}, mk.count ? tr('Your answer — marked words to change', 'התשובה שלך — מסומן מה כדאי לשנות') : tr('Your answer', 'התשובה שלך')), h('p', {}, ...mk.nodes),
          mk.count ? h('div', {class: 'sim-legend'}, h('span', {class: 'sim-m sim-m-jar'}, tr('military jargon', 'ז׳רגון')), h('span', {class: 'sim-m sim-m-we'}, tr('"we"', '"אנחנו"')), h('span', {class: 'sim-m sim-m-vag'}, tr('vague', 'כללי'))) : null),
        aiBox,
        (() => { const misses = r.items.filter(x => !x.ok), kids = [
            misses.length ? h('ul', {class: 'sim-checks'}, misses.map(x => h('li', {class: 'no'}, h('span', {class: 'sim-mark', 'aria-hidden': 'true'}, '!'), h('div', {}, h('b', {}, x.text), h('small', {}, x.fix))))) : null,
            r.items.some(x => x.ok) ? h('div', {class: 'sim-passed'}, h('small', {}, tr('Already good:', 'כבר טוב:')), ...r.items.filter(x => x.ok).map(x => h('span', {class: 'sim-pass'}, '✓ ' + x.text))) : null];
          const title = misses.length ? tr('Quick checks — ' + misses.length + ' to fix', 'בדיקות מהירות — ' + misses.length + ' לתקן') : tr('Quick checks — all good', 'בדיקות מהירות — הכול טוב');
          return aiOn() ? h('details', {class: 'sim-quick'}, h('summary', {}, title), ...kids) : h('div', {class: 'sim-quick-open'}, h('h3', {class: 'sim-h3'}, title), ...kids); })(),
        h('div', {class: 'plus-row'},
          btn(tr('Try this question again', 'לנסות שוב את השאלה'), () => { st.phase = 'ask'; paint(); }, 'plus-btn'),
          btn(st.i < st.qs.length - 1 || (aiOn() && cur.ai && cur.ai.followup && !st.qs[st.i].isFollow) ? tr('Next question', 'לשאלה הבאה') : tr('Finish', 'לסיום'), next, 'plus-btn primary')),
        pct >= 75 ? btn(tr('Save this answer to my CV draft', 'לשמור את התשובה לטיוטת קורות החיים'), () => saveToCv(cur.a), 'plus-link') : null];
    }
    function doneScreen() {
      const done = st.answers.filter(a => a && a.res);
      const avg = done.length ? Math.round(done.reduce((s, a) => s + a.res.pct, 0) / done.length) : 0;
      const missCount = {};
      done.forEach(a => a.res.items.forEach(x => { if (!x.ok) missCount[x.text] = (missCount[x.text] || 0) + 1; }));
      const focus = Object.entries(missCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
      const best = done.slice().sort((a, b) => b.res.pct - a.res.pct)[0];
      const rep = h('div', {'aria-live': 'polite'}); if (aiOn()) setTimeout(() => aiReport(rep));
      P.simHistory = [...(P.simHistory || []), {d: new Date().toISOString().slice(0, 10), track: st.track, avg, n: done.length}].slice(-20); store();
      return [
        h('div', {class: 'sim-hero'}, illu('award', 64), h('div', {}, h('h1', {}, tr('Interview finished', 'הראיון הסתיים')), h('p', {}, tr(done.length + ' answers · average ' + avg + '%', done.length + ' תשובות · ממוצע ' + avg + '%')))),
        rep,
        focus.length ? h('div', {class: 'plus-card'}, h('strong', {}, tr('Your focus for next time', 'על מה לעבוד בפעם הבאה')), h('ul', {class: 'plus-list'}, focus.map(f => h('li', {}, f)))) : h('div', {class: 'plus-card'}, h('strong', {}, tr('Excellent — no repeating mistakes.', 'מצוין — אין טעויות שחוזרות על עצמן.'))),
        best && best.a ? h('div', {class: 'plus-card'}, h('strong', {}, tr('Your strongest answer', 'התשובה הכי חזקה שלך')), h('p', {class: 'plus-muted'}, best.q), h('p', {}, best.a),
          btn(tr('Save to my CV draft', 'לשמור לטיוטת קורות החיים'), () => saveToCv(best.a), 'plus-link')) : null,
        h('div', {class: 'plus-row'}, btn(tr('Another interview', 'ראיון נוסף'), () => { st = null; paint(); }, 'plus-btn primary'), PAGES_CV() ? btn(tr('Open my CV', 'לפתוח את קורות החיים'), () => showPage('cv'), 'plus-btn') : null)];
    }
    const PAGES_CV = () => true;
    function paint() {
      const scr = !st ? setupScreen() : st.phase === 'ask' ? askScreen() : st.phase === 'review' ? reviewScreen() : doneScreen();
      root.replaceChildren(...scr.filter(Boolean));
      try { (document.scrollingElement || document.documentElement).scrollTop = 0; } catch (_) {}
    }
    function page() { root = h('div', {class: 'sim'}); st = null; if (synth) { synth.getVoices(); synth.onvoiceschanged = () => { if (!st && root.isConnected) paint(); }; } paint(); return root; }
    return {pages: {interviewsim: page}, heads: {interviewsim: {icon: 'talk', title: ['Interview simulator', 'סימולטור ראיון']}}};
  };
})();
