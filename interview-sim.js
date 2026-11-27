/* interview-sim.js — Job interview simulator (27 Nov 2026).
   A private practice interviewer: questions by job type, the interviewer can speak (device voices),
   answers by typing or voice, instant local feedback on common mistakes, optional AI feedback and a
   follow-up question (same consent gate), and good answers can be saved to the CV. Nothing is stored
   outside the phone. */
(function () {
  'use strict';
  window.MomentumInterview = function (ctx) {
    const {h, btn, tr, he, illu, P, store, toast, showPage, aiText} = ctx;

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

    /* ---------- local feedback: the common mistakes ---------- */
    const words = t => (String(t).match(/[\p{L}\p{N}"'׳״-]+/gu) || []);
    const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const has = (t, list) => list.filter(w => new RegExp('(^|[^\\p{L}])' + (/[\u0590-\u05FF]/.test(w) ? '[ובלהמשכ]{0,2}' : '') + esc(w) + '(?![\\p{L}])', 'iu').test(t));
    const JARGON = ['מ"כ', 'מ"מ', 'מ"פ', 'סמ"ל', 'רס"ר', 'קשר"ג', 'ש"ג', 'תש"ש', 'חפ"ק', 'שמ"פ', 'פלוגה', 'גדוד', 'חטיבה', 'מחלקה', 'מבצעי', 'מבצעית', 'שמירות', 'תרגילים', 'platoon', 'battalion', 'squad', 'company commander'];
    const WE = ['אנחנו', 'היינו', 'עשינו', 'הלכנו', 'עבדנו', 'ניהלנו', 'שלנו', 'we', 'our', 'us'];
    const I = ['אני', 'הייתי', 'עשיתי', 'הובלתי', 'ניהלתי', 'החלטתי', 'למדתי', 'הצלחתי', 'שלי', 'I', 'my', 'me'];
    const RANK = ['סמל', 'סמ"ר', 'רב"ט', 'רס"ל', 'סגן', 'סרן', 'רס"ן', 'sergeant', 'corporal', 'lieutenant', 'captain'];
    const FORMAL = ['הנני', 'הריני', 'לפיכך', 'על כן', 'הנ"ל', 'בברכה', 'hereby', 'therefore', 'aforementioned'];
    const VAGUE = ['דברים', 'כל מיני', 'וכו', 'וכו\'', 'בערך', 'משהו כזה', 'כאילו', 'stuff', 'things', 'etc', 'kind of', 'sort of'];
    function analyse(ans) {
      const t = String(ans || '').trim(), n = words(t).length, out = [];
      const add = (ok, en, he_, fix_en, fix_he) => out.push({ok, text: tr(en, he_), fix: ok ? '' : tr(fix_en, fix_he)});
      add(n >= 30 && n <= 170, 'Length', 'אורך', n < 30 ? 'Too short — add one concrete example (aim for 40–120 words).' : 'Too long — keep to about one minute (40–120 words).', n < 30 ? 'קצר מדי — להוסיף דוגמה אחת מוחשית (בערך 40–120 מילים).' : 'ארוך מדי — לשמור על בערך דקה (40–120 מילים).');
      const j = has(t, JARGON); add(!j.length, 'No military jargon', 'בלי ז׳רגון צבאי', 'Replace: ' + j.join(', ') + ' — say it in civilian words.', 'להחליף: ' + j.join(', ') + ' — במילים אזרחיות.');
      const we = has(t, WE).length, me = has(t, I).length; add(!(we > 1 && we > me), 'Your part ("I", not only "we")', 'החלק שלך ("אני", לא רק "אנחנו")', 'Say what YOU did: "I organised…", "I decided…".', 'להגיד מה אתה עשית: "אני ארגנתי…", "אני החלטתי…".');
      add(/\d/.test(t), 'A number or fact', 'מספר או עובדה', 'Add one real number: people, hours, how often, a result (only if true).', 'להוסיף מספר אמיתי אחד: אנשים, שעות, כמה פעמים, תוצאה (רק אם נכון).');
      const firstWords = t.split(/\s+/).slice(0, 8).join(' '); add(!has(firstWords, RANK).length, 'Start with you, not your rank', 'פותחים בך, לא בדרגה', 'Open with what you did; the rank (if at all) at the end.', 'לפתוח במה שעשית; הדרגה (אם בכלל) בסוף.');
      add(!has(t, FORMAL).length, 'Natural tone', 'טון טבעי', 'Too formal — talk like you would to a respected person, not a letter.', 'רשמי מדי — לדבר כמו לאדם מכובד, לא כמו במכתב.');
      const v = has(t, VAGUE); add(!v.length, 'Specific', 'ספציפי', 'Vague words (' + v.join(', ') + ') — replace with what actually happened.', 'מילים כלליות (' + v.join(', ') + ') — להחליף במה שקרה בפועל.');
      const result = /(בסוף|התוצאה|הצלחנו|הצלחתי|למדתי|השתפר|in the end|result|learned|improved|managed to)/i.test(t);
      add(result, 'Ends with a result', 'מסתיים בתוצאה', 'Finish with what came out of it or what you learned.', 'לסיים במה שיצא מזה או מה שלמדת.');
      const score = out.filter(x => x.ok).length;
      return {n, items: out, score, max: out.length};
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

    /* ---------- state ---------- */
    let st = null; // {track, qs, i, answers: [{q, a, res, ai}], phase}
    let root = null;
    const start = track => {
      const pool = [...BANK.general.slice(0, 3), ...(BANK[track] || []), ...BANK.general.slice(3)];
      const qs = (track === 'general' ? BANK.general : [pool[0], pool[1], ...(BANK[track] || []), BANK.general[3], BANK.general[7]]).slice(0, 6);
      st = {track, qs, i: 0, answers: [], phase: 'ask'}; P.simTrack = track; store(); paint(); setTimeout(() => speak(qtext()), 300);
    };
    const qtext = () => { const q = st.qs[st.i]; return he() ? q.he : q.en; };

    async function aiFeedback(box, answer) {
      const q = qtext();
      box.replaceChildren(h('p', {class: 'plus-muted'}, tr('Asking the AI (after your approval)…', 'שולח ל-AI (אחרי אישור שלך)…')));
      try {
        const system = [he() ? 'You are a warm, experienced Israeli job interviewer and coach for discharged soldiers. Reply in natural Hebrew.' : 'You are a warm, experienced job interviewer and coach for discharged Israeli soldiers. Reply in English.',
          'Judge only the answer given. Never invent facts about the candidate. Be specific and kind, like a good mentor. Return ONLY JSON:',
          '{"good":"one thing that works","improve":["2-3 concrete fixes"],"better":"a rewritten version of the SAME answer using only facts the candidate said, 60-110 words","followup":"one natural follow-up question an interviewer would ask next"}'].join('\n');
        const raw = await aiText(system, 'Interview question: ' + q + '\nCandidate answer: ' + answer, 900);
        const j = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]);
        const cur = st.answers[st.i]; if (cur) cur.ai = j;
        box.replaceChildren(
          j.good ? h('p', {class: 'sim-good'}, h('b', {}, tr('Works well: ', 'עובד טוב: ')), String(j.good)) : null,
          Array.isArray(j.improve) && j.improve.length ? h('div', {}, h('b', {}, tr('To improve:', 'לשפר:')), h('ul', {}, j.improve.slice(0, 3).map(x => h('li', {}, String(x))))) : null,
          j.better ? h('div', {class: 'sim-better'}, h('b', {}, tr('A stronger version (your facts only):', 'גרסה חזקה יותר (רק העובדות שלך):')), h('p', {}, String(j.better)),
            btn(tr('Use this version', 'להשתמש בגרסה הזו'), () => { const ta = root.querySelector('.sim-answer'); if (ta) { ta.value = String(j.better); ta.dispatchEvent(new Event('input')); } toast(tr('Updated — read it once and make sure it is true', 'עודכן — לקרוא פעם אחת ולוודא שזה נכון')); }, 'plus-btn')) : null,
          j.followup ? h('div', {class: 'sim-follow'}, h('b', {}, tr('Follow-up question:', 'שאלת המשך:')), h('p', {}, String(j.followup)),
            btn(tr('Practice it', 'לתרגל אותה'), () => { st.qs.splice(st.i + 1, 0, {en: String(j.followup), he: String(j.followup), look: ['Answer briefly and concretely.', 'לענות קצר ומוחשי.']}); next(); }, 'plus-link')) : null);
      } catch (e) {
        box.replaceChildren(h('p', {class: 'plus-muted'}, e.canceled ? tr('Nothing was sent.', 'לא נשלח כלום.') : tr('AI feedback is not available right now — the checklist above still works.', 'משוב AI לא זמין כרגע — הבדיקה למעלה עדיין עובדת.')));
      }
    }
    function next() {
      if (st.i < st.qs.length - 1) { st.i++; st.phase = 'ask'; paint(); setTimeout(() => speak(qtext()), 250); }
      else { st.phase = 'done'; paint(); }
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
        h('div', {class: 'sim-hero'}, illu('talk', 64), h('div', {}, h('h1', {}, tr('Interview simulator', 'סימולטור ראיון עבודה')),
          h('p', {}, tr('A real interview rhythm: the interviewer asks, you answer, you get feedback right away. Private, on your phone.', 'קצב של ראיון אמיתי: המראיין שואל, אתה עונה, ומקבל משוב מיד. פרטי, בטלפון שלך.')))),
        h('h2', {class: 'sim-h2'}, tr('What kind of job?', 'לאיזה סוג עבודה?')),
        h('div', {class: 'sim-tracks'}, TRACKS.map(([id, en, he_, ill]) => h('button', {type: 'button', class: 'sim-track' + (P.simTrack === id ? ' on' : ''), onclick: () => start(id)}, illu(ill, 40), h('b', {}, he() ? he_ : en)))),
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
      ta.value = cur.a || '';
      const live = h('p', {class: 'sim-live', 'aria-live': 'polite'});
      const count = () => { const n = words(ta.value).length; live.textContent = n ? tr(n + ' words', n + ' מילים') + (n < 30 ? tr(' · add a little more', ' · אפשר להוסיף עוד קצת') : n > 170 ? tr(' · try to shorten', ' · כדאי לקצר') : tr(' · good length', ' · אורך טוב')) : ''; };
      ta.addEventListener('input', count); count();
      let rec = null;
      const mic = SR ? btn(tr('Answer by voice', 'לענות בקול'), () => {
        if (rec) { rec.stop(); return; }
        try { rec = new SR(); rec.lang = he() ? 'he-IL' : 'en-US'; rec.interimResults = true; rec.continuous = true;
          const base = ta.value ? ta.value + ' ' : '';
          rec.onresult = e => { let txt = ''; for (let k = 0; k < e.results.length; k++) txt += e.results[k][0].transcript; ta.value = base + txt; count(); };
          rec.onend = () => { rec = null; mic.classList.remove('on'); mic.textContent = tr('Answer by voice', 'לענות בקול'); };
          rec.onerror = () => toast(tr('The microphone is not available.', 'המיקרופון לא זמין.'));
          rec.start(); mic.classList.add('on'); mic.textContent = tr('Listening… tap to stop', 'מקשיב… לחיצה לעצירה');
        } catch (_) { toast(tr('Voice is not supported in this browser.', 'הדפדפן לא תומך בדיבור.')); }
      }, 'plus-btn sim-mic') : null;
      return [
        h('div', {class: 'sim-top'}, h('span', {}, tr('Question ' + (st.i + 1) + ' of ' + st.qs.length, 'שאלה ' + (st.i + 1) + ' מתוך ' + st.qs.length)),
          h('div', {class: 'sim-dots'}, st.qs.map((_, k) => h('i', {class: k < st.i ? 'done' : k === st.i ? 'on' : ''})))),
        h('div', {class: 'sim-bubble'}, illu('talk', 40, 'sim-avatar'), h('div', {}, h('small', {}, tr('Interviewer', 'המראיין')), h('p', {}, he() ? q.he : q.en)),
          synth && P.simVoice !== 'off' ? h('button', {type: 'button', class: 'sim-replay', 'aria-label': tr('Hear the question again', 'לשמוע שוב'), onclick: () => speak(qtext())}, '↻') : null),
        h('p', {class: 'sim-look'}, h('b', {}, tr('What they look for: ', 'מה מחפשים: ')), q.look[he() ? 1 : 0]),
        ta, live,
        h('div', {class: 'plus-row'}, mic,
          btn(tr('Check my answer', 'לבדוק את התשובה'), () => { if (words(ta.value).length < 3) { ta.focus(); toast(tr('Write or say an answer first', 'קודם לכתוב או להגיד תשובה')); return; }
            if (rec) rec.stop(); st.answers[st.i] = {q: qtext(), a: ta.value.trim(), res: analyse(ta.value)}; st.phase = 'review'; paint(); }, 'plus-btn primary')),
        h('button', {type: 'button', class: 'plus-link sim-skip', onclick: () => { st.answers[st.i] = {q: qtext(), a: '', res: null}; next(); }}, tr('Skip this question', 'לדלג על השאלה'))];
    }
    function reviewScreen() {
      const cur = st.answers[st.i], r = cur.res, pct = Math.round(r.score / r.max * 100);
      const aiBox = h('div', {class: 'sim-ai', 'aria-live': 'polite'});
      return [
        h('div', {class: 'sim-top'}, h('span', {}, tr('Feedback · question ' + (st.i + 1), 'משוב · שאלה ' + (st.i + 1))), h('div', {class: 'sim-dots'}, st.qs.map((_, k) => h('i', {class: k < st.i ? 'done' : k === st.i ? 'on' : ''})))),
        h('div', {class: 'sim-score'}, h('div', {class: 'sim-ring', style: '--p:' + pct}, h('b', {}, r.score + '/' + r.max)),
          h('div', {}, h('strong', {}, pct >= 85 ? tr('Strong answer!', 'תשובה חזקה!') : pct >= 60 ? tr('Good — a couple of fixes', 'טוב — כמה תיקונים קטנים') : tr('A good start — let us sharpen it', 'התחלה טובה — בוא נחדד')),
            h('small', {}, tr(r.n + ' words', r.n + ' מילים')))),
        h('ul', {class: 'sim-checks'}, r.items.map(x => h('li', {class: x.ok ? 'ok' : 'no'}, h('span', {class: 'sim-mark', 'aria-hidden': 'true'}, x.ok ? '✓' : '!'), h('div', {}, h('b', {}, x.text), x.fix ? h('small', {}, x.fix) : null)))),
        h('details', {class: 'sim-mine'}, h('summary', {}, tr('My answer', 'התשובה שלי')), h('p', {}, cur.a)),
        P.infoOnly ? null : btn(tr('Detailed AI feedback + a stronger version', 'משוב AI מפורט + גרסה חזקה יותר'), () => aiFeedback(aiBox, cur.a), 'plus-btn sim-ai-btn'), aiBox,
        h('div', {class: 'plus-row'},
          btn(tr('Try this question again', 'לנסות שוב את השאלה'), () => { st.phase = 'ask'; paint(); }, 'plus-btn'),
          btn(st.i < st.qs.length - 1 ? tr('Next question', 'לשאלה הבאה') : tr('Finish', 'לסיום'), next, 'plus-btn primary')),
        pct >= 70 ? btn(tr('Save this answer to my CV draft', 'לשמור את התשובה לטיוטת קורות החיים'), () => saveToCv(cur.a), 'plus-link') : null];
    }
    function doneScreen() {
      const done = st.answers.filter(a => a && a.res);
      const avg = done.length ? Math.round(done.reduce((s, a) => s + a.res.score / a.res.max, 0) / done.length * 100) : 0;
      const missCount = {};
      done.forEach(a => a.res.items.forEach(x => { if (!x.ok) missCount[x.text] = (missCount[x.text] || 0) + 1; }));
      const focus = Object.entries(missCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
      const best = done.slice().sort((a, b) => b.res.score - a.res.score)[0];
      P.simHistory = [...(P.simHistory || []), {d: new Date().toISOString().slice(0, 10), track: st.track, avg, n: done.length}].slice(-20); store();
      return [
        h('div', {class: 'sim-hero'}, illu('award', 64), h('div', {}, h('h1', {}, tr('Interview finished', 'הראיון הסתיים')), h('p', {}, tr(done.length + ' answers · average ' + avg + '%', done.length + ' תשובות · ממוצע ' + avg + '%')))),
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
