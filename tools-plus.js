/* Momentum Companion — "My tools" (26 Nov 2026).
   One organised place for the practical tools: personal deadlines with calendar export,
   deposit and grant planners, after-discharge checklist, contacts (tap to call / save / navigate),
   scholarships, payslip guide, glossary. Everything stays on this device.
   Loaded before companion-plus.js, which calls window.MomentumTools(ctx) to register the pages. */
(function () {
  'use strict';

  window.MomentumTools = function (ctx) {
    const {h, btn, tr, he, icon, put, P, store, toast, saveAction, showPage, openTopic, KB, money, section, list} = ctx;
    const R = () => (KB && KB.data && KB.data.rights_and_benefits) || {};
    const HACHVANA = 'https://www.hachvana.mod.gov.il/';
    const ext = (label, url) => h('a', {class: 'plus-link', href: url, target: '_blank', rel: 'noopener'}, label + ' ↗');
    const note = text => h('p', {class: 'plus-muted'}, text);
    const verify = () => note(tr('General information, checked November 2026. Always confirm in your personal area or on the official site.',
      'מידע כללי, נבדק בנובמבר 2026. תמיד לאמת באזור האישי או באתר הרשמי.'));

    /* ---------- share (WhatsApp / phone share sheet) ---------- */
    function share(title, text) {
      if (navigator.share) { navigator.share({title, text}).catch(() => {}); return; }
      window.open('https://wa.me/?text=' + encodeURIComponent(title + '\n\n' + text), '_blank', 'noopener');
    }
    const shareBtn = (title, textFn) => btn(tr('Share (WhatsApp…)', 'שיתוף (וואטסאפ…)'), () => share(title, textFn()), 'plus-btn');

    /* ---------- files: calendar (.ics) and contacts (.vcf) ---------- */
    function download(name, type, body) {
      const a = h('a', {href: URL.createObjectURL(new Blob([body], {type})), download: name});
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
    const ymd = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const esc = s => String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
    function ics(events) {
      const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Momentum Companion//HE', 'CALSCALE:GREGORIAN'];
      events.forEach((e, i) => {
        const end = new Date(e.date); end.setDate(end.getDate() + 1);
        lines.push('BEGIN:VEVENT', 'UID:momentum-' + ymd(e.date) + '-' + i + '-' + e.id + '@companion', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + ymd(e.date), 'DTEND;VALUE=DATE:' + ymd(end), 'SUMMARY:' + esc(e.title), 'DESCRIPTION:' + esc(e.text + (e.url ? '\n' + e.url : '')),
          'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(e.title), 'END:VALARM', 'END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      return lines.join('\r\n');
    }
    const fmtDate = d => d.toLocaleDateString(he() ? 'he-IL' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
    const endOfMonthAfter = (d, n) => new Date(d.getFullYear(), d.getMonth() + n + 1, 0);

    /* ================= DEADLINES ================= */
    function deadlineItems(D) {
      const r = R();
      return [
        {id: 'deposit-open', date: addDays(D, 14), title: tr('Personal deposit opens', 'הפיקדון האישי נפתח לשימוש'), text: tr('From about day 14 you can request deposit money for approved uses in the personal area.', 'בערך מהיום ה-14 אפשר לבקש כסף מהפיקדון למטרות מאושרות, דרך האזור האישי.'), url: HACHVANA},
        {id: 'grant', date: addDays(D, 60), title: tr('Check the discharge grant arrived', 'לבדוק שמענק השחרור הגיע'), text: tr('The grant is usually paid within 60 days of discharge. If not, contact the Division (*5266).', 'המענק משולם בדרך כלל עד 60 יום מהשחרור. אם לא הגיע — לפנות לאגף (‎*5266).'), url: HACHVANA},
        {id: 'btl', date: endOfMonthAfter(D, 2), title: tr('National Insurance exemption ends', 'סוף הפטור מביטוח לאומי'), text: tr('If you are not working, the temporary exemption lasts two months after the discharge month. After that, payments may apply.', 'אם אינך עובד, הפטור הזמני נמשך חודשיים אחרי חודש השחרור. אחרי זה ייתכן חיוב.'), url: (r.bituach_leumi_exemption || {}).official_url || 'https://www.btl.gov.il/'},
        {id: 'arnona', date: addMonths(D, 4), title: tr('Arnona exemption ends', 'סוף הפטור מארנונה'), text: tr('Up to 4 months from discharge, for 70 m² of an apartment you own or rent (90 m² with 5+ residents). Request it from your local authority.', 'עד 4 חודשים מהשחרור, על 70 מ"ר בדירה בבעלותך או בשכירות (90 מ"ר אם גרים 5 ומעלה). מבקשים ברשות המקומית.'), url: 'https://www.kolzchut.org.il/he/פטור_מארנונה_לחיילים_בשירות_חובה_וחיילים_משוחררים'},
        {id: 'transport', date: addMonths(D, 12), title: tr('Free public transport ends', 'סוף הנסיעות החינם בתחבורה הציבורית'), text: tr('12 months from discharge. Remember to validate every ride.', '12 חודשים מהשחרור. חובה לתקף כל נסיעה.'), url: (r.public_transport_free || {}).official_url || HACHVANA},
        {id: 'unemployment', date: addMonths(D, 12), title: tr('First year: unemployment option', 'השנה הראשונה: אפשרות לדמי אבטלה'), text: tr('Discharged soldiers may get unemployment benefit in the first year after working 6 months. Check conditions at National Insurance.', 'משוחררים יכולים לקבל דמי אבטלה בשנה הראשונה אחרי 6 חודשי עבודה. לבדוק תנאים בביטוח לאומי.'), url: 'https://www.btl.gov.il/'},
        {id: 'tax', date: addMonths(D, 36), title: tr('Extra tax credit points end', 'סוף נקודות הזיכוי של השחרור'), text: tr('The points last 36 months, but only if you ask for them on form 101 at work. Missed months can be refunded later.', 'הנקודות נמשכות 36 חודשים — רק אם ביקשת אותן בטופס 101 בעבודה. חודשים שפוספסו אפשר לקבל בהחזר מס.'), url: (r.tax_credit_points || {}).official_url},
        {id: 'preferred', date: addMonths(D, 42), title: tr('Preferred-work grant: check your deadline', 'מענק עבודה מועדפת: לבדוק את המועד שלך'), text: tr('Our source lists 42 months from discharge for this grant. Confirm the exact rule at National Insurance.', 'לפי המקור שלנו המועד הוא עד 42 חודשים מהשחרור. לוודא את הכלל המדויק בביטוח לאומי.'), url: (r.preferred_work_grant || {}).official_url},
        {id: 'mimadim', date: addMonths(D, 60), title: tr('Mimadim: first request deadline', 'ממדים ללימודים: מועד אחרון לבקשה ראשונה'), text: tr('First request usually within 5 years of discharge.', 'בקשה ראשונה בדרך כלל עד 5 שנים מהשחרור.'), url: 'https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/UniformToStudies.aspx'},
        {id: 'deposit-5y', date: addMonths(D, 60), title: tr('5 years: deposit balance released', '5 שנים: יתרת הפיקדון משתחררת'), text: tr('After 5 years the remaining deposit is transferred to your updated bank account. Keep your bank details current.', 'אחרי 5 שנים יתרת הפיקדון מועברת לחשבון הבנק המעודכן. כדאי לוודא שפרטי הבנק מעודכנים.'), url: HACHVANA}
      ].sort((a, b) => a.date - b.date);
    }
    function deadlines() {
      const wrap = h('div');
      const input = h('input', {type: 'date', id: 'plusDischargeDate', value: P.dischargeDate || '', 'aria-label': tr('Discharge date', 'תאריך השחרור')});
      const out = h('div', {id: 'plusDeadlines'});
      const paint = () => {
        out.replaceChildren();
        const v = input.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { out.append(note(tr('Enter your discharge date (or the expected one) to see your personal dates.', 'הכנס את תאריך השחרור (או התאריך הצפוי) כדי לראות את המועדים שלך.'))); return; }
        const [y, m, d] = v.split('-').map(Number); const D = new Date(y, m - 1, d);
        const items = deadlineItems(D), now = new Date(); now.setHours(0, 0, 0, 0);
        const next = items.find(i => i.date >= now);
        out.append(h('div', {class: 'plus-row'},
          btn(tr('Add all to my calendar', 'להוסיף הכול ליומן'), () => download('momentum-dates.ics', 'text/calendar', ics(items.filter(i => i.date >= now))), 'plus-btn primary'),
          shareBtn(tr('My dates after discharge', 'המועדים שלי אחרי השחרור'), () => items.map(i => fmtDate(i.date) + ' — ' + i.title).join('\n'))));
        const ol = h('ol', {class: 'plus-timeline'});
        items.forEach(i => {
          const past = i.date < now;
          ol.append(h('li', {class: 'plus-tl-item' + (past ? ' is-past' : '') + (i === next ? ' is-next' : '')},
            h('span', {class: 'plus-tl-date'}, fmtDate(i.date) + (past ? tr(' · passed', ' · עבר') : i === next ? tr(' · next', ' · הבא') : '')),
            h('strong', {}, i.title), h('p', {}, i.text),
            h('div', {class: 'plus-row'},
              past ? null : btn(tr('To calendar', 'ליומן'), () => download('momentum-' + i.id + '.ics', 'text/calendar', ics([i])), 'plus-link'),
              past ? null : btn(tr('Save as a step', 'לשמור כצעד'), () => saveAction(i.title, i.text, i.date.toISOString().slice(0, 10)), 'plus-link'),
              i.url ? ext(tr('Official info', 'מידע רשמי'), i.url) : null)));
        });
        out.append(ol);
      };
      input.addEventListener('change', () => {
        P.dischargeDate = input.value;
        if (/^\d{4}-\d{2}/.test(input.value)) P.dischargeMonth = input.value.slice(0, 7);
        store(); paint();
      });
      put(wrap, section(tr('When were you discharged?', 'מתי השתחררת?'), input,
        note(tr('Saved only on this device. The calendar file opens in Google Calendar or the iPhone calendar, with a reminder a week before.', 'נשמר רק במכשיר. קובץ היומן נפתח ביומן גוגל או ביומן של האייפון, עם תזכורת שבוע לפני.'))), out, verify());
      paint();
      return wrap;
    }

    /* ================= DEPOSIT PLANNER ================= */
    const USES = [ // the 6 uses set by law (hachvana, Oct 2026)
      {id: 'studies', he: ['לימודים', 'תואר, מכינה, פסיכומטרי, לימודי תעודה במוסד מוכר.', 'בדרך כלל הכסף מועבר ישירות למוסד, אחרי אישור רישום.'], en: ['Studies', 'Degree, preparatory programme, psychometric, certificate studies at a recognised institution.', 'Money usually goes straight to the institution after proof of enrolment.']},
      {id: 'training', he: ['הכשרה מקצועית', 'קורסים מקצועיים במוסדות מוכרים (למשל חשמלאות, סייבר, הנהלת חשבונות).', 'לבדוק שהמוסד והקורס מוכרים לפני התשלום.'], en: ['Vocational training', 'Professional courses at recognised institutions (e.g. electrician, cyber, bookkeeping).', 'Check the institution and course are recognised before paying.']},
      {id: 'driving', he: ['רישיון נהיגה', 'שיעורי נהיגה ואגרות, כולל רכב כבד.', 'דרך בית ספר לנהיגה מורשה; את פרטי המסמכים רואים באזור האישי.'], en: ['Driving licence', 'Driving lessons and fees, including heavy vehicles.', 'Through a licensed driving school; the required documents are listed in the personal area.']},
      {id: 'business', he: ['עסק', 'פתיחה או הרחבה של עסק.', 'בדרך כלל דרושה תוכנית עסקית; אפשר לקבל ליווי במרכזי צעירים ובאגף.'], en: ['Business', 'Opening or expanding a business.', 'Usually needs a business plan; youth centres and the Division offer guidance.']},
      {id: 'housing', he: ['דירה', 'רכישת דירה, בית או קרקע לבנייה.', 'שכירות אינה אחת המטרות הרשמיות. הפרטים והמסמכים באזור האישי.'], en: ['Home', 'Buying an apartment, house or land to build on.', 'Renting is not one of the official uses. Details and documents are in the personal area.']},
      {id: 'wedding', he: ['נישואין', 'אפשר לממש לצורך נישואין.', 'הפרטים והמסמכים באזור האישי.'], en: ['Marriage', 'Can be used for marriage.', 'Details and documents are in the personal area.']}
    ];
    function depositPlanner() {
      const wrap = h('div');
      const pick = h('div', {class: 'plus-choices', role: 'group'});
      const detail = h('div', {'aria-live': 'polite'});
      const paint = () => {
        pick.replaceChildren(...USES.map(u => h('button', {type: 'button', class: 'plus-chip', 'aria-pressed': String(P.depositGoal === u.id), onclick: () => { P.depositGoal = u.id; store(); paint(); }}, (he() ? u.he : u.en)[0])));
        const u = USES.find(x => x.id === P.depositGoal);
        detail.replaceChildren();
        if (!u) { detail.append(note(tr('Pick a goal to see what to prepare.', 'בחר מטרה כדי לראות מה להכין.'))); return; }
        const [title, what, tip] = he() ? u.he : u.en;
        const e = P.service && P.monthsServed && KB ? KB.estimate(P.service, P.monthsServed, P.gender) : null;
        detail.append(section(title, h('p', {}, what), h('p', {}, tip),
          e && e.deposit ? h('p', {}, h('strong', {}, tr('Your estimated deposit: ', 'הפיקדון המשוער שלך: ') + '≈ ' + money(e.deposit))) : btn(tr('Calculate my deposit', 'לחשב את הפיקדון שלי'), () => showPage('rights'), 'plus-link'),
          h('h3', {}, tr('Steps', 'שלבים')),
          h('ol', {class: 'plus-list'}, [tr('Log in to the personal area on the Division site.', 'להיכנס לאזור האישי באתר האגף.'), tr('Choose the use and check the required documents.', 'לבחור את המטרה ולבדוק אילו מסמכים נדרשים.'), tr('Upload the documents and submit.', 'להעלות את המסמכים ולהגיש.'), tr('Track the request status in the personal area.', 'לעקוב אחרי הבקשה באזור האישי.'), tr('The deposit can be used only inside Israel.', 'אפשר להשתמש בפיקדון רק בתוך ישראל.')].map(x => h('li', {}, x))),
          h('p', {class: 'plus-warn'}, '⚠ ' + ((R().personal_deposit || {}).scam_warning || tr('Never pay a company to "release" your deposit.', 'לא משלמים לאף חברה כדי "לשחרר" את הפיקדון.'))),
          h('div', {class: 'plus-row'}, ext(tr('Personal area', 'לאזור האישי'), HACHVANA),
            btn(tr('Save as a step', 'לשמור כצעד'), () => saveAction(tr('Deposit request: ', 'בקשת פיקדון: ') + title, tip), 'plus-link'))));
      };
      put(wrap, section(tr('What do you want to use the deposit for?', 'למה תרצה להשתמש בפיקדון?'), pick), detail, verify());
      paint();
      return wrap;
    }

    /* ================= GRANT PLANNER (your own split, no advice) ================= */
    function grantPlanner() {
      const wrap = h('div');
      const e = P.service && P.monthsServed && KB ? KB.estimate(P.service, P.monthsServed, P.gender) : null;
      P.grantPlan = P.grantPlan || {total: e && e.grant ? Math.round(e.grant) : '', parts: {}};
      const G = P.grantPlan;
      const BUCKETS = [['cushion', tr('Safety cushion', 'כרית ביטחון')], ['trip', tr('Trip', 'טיול')], ['studies', tr('Studies', 'לימודים')], ['home', tr('Rent / home', 'שכירות / בית')], ['car', tr('Licence / car', 'רישיון / רכב')], ['other', tr('Other', 'אחר')]];
      const total = h('input', {type: 'number', min: '0', inputmode: 'numeric', value: G.total, 'aria-label': tr('Grant amount', 'סכום המענק')});
      const left = h('p', {class: 'plus-plan-left', 'aria-live': 'polite'});
      const fields = BUCKETS.map(([k, label]) => {
        const inp = h('input', {type: 'number', min: '0', inputmode: 'numeric', value: G.parts[k] || '', 'aria-label': label});
        inp.addEventListener('input', () => { G.parts[k] = Number(inp.value) || 0; store(); calc(); });
        return h('label', {class: 'plus-plan-field'}, h('span', {}, label), inp);
      });
      function calc() {
        const used = Object.values(G.parts).reduce((a, b) => a + (Number(b) || 0), 0);
        const rest = (Number(G.total) || 0) - used;
        left.textContent = tr('Planned: ', 'תוכנן: ') + money(used) + ' · ' + (rest >= 0 ? tr('Not yet planned: ', 'עוד לא תוכנן: ') + money(rest) : tr('Over by ', 'חריגה של ') + money(-rest));
        left.classList.toggle('is-over', rest < 0);
      }
      total.addEventListener('input', () => { G.total = Number(total.value) || ''; store(); calc(); });
      put(wrap, section(tr('Plan your grant your way', 'לתכנן את המענק בדרך שלך'),
        note(tr('The grant is free money — you decide. Write how much you want for each thing. This is a planning aid, not financial advice.', 'המענק הוא כסף חופשי — אתה מחליט. כתוב כמה תרצה לכל דבר. זה כלי תכנון, לא ייעוץ פיננסי.')),
        h('label', {class: 'plus-plan-field plus-plan-total'}, h('span', {}, tr('Grant amount (₪)', 'סכום המענק (₪)')), total),
        e && e.grant ? note(tr('Pre-filled from your estimate. The exact amount is in your personal area.', 'מולא לפי ההערכה שלך. הסכום המדויק באזור האישי.')) : null,
        h('div', {class: 'plus-plan-grid'}, fields), left,
        h('div', {class: 'plus-row'}, shareBtn(tr('My grant plan', 'התוכנית שלי למענק'), () => BUCKETS.filter(([k]) => G.parts[k]).map(([k, l]) => l + ': ' + money(G.parts[k])).join('\n')))));
      calc();
      return wrap;
    }

    /* ================= AFTER-DISCHARGE CHECKLIST ================= */
    const TODO = [
      ['bank', tr('Update bank details and address', 'לעדכן פרטי בנק וכתובת'), 'deadlines'],
      ['grant', tr('Check the grant arrived (within 60 days)', 'לבדוק שהמענק הגיע (עד 60 יום)'), 'deadlines'],
      ['ravkav', tr('Set the Rav-Kav profile for free travel', 'לעדכן פרופיל ברב-קו לנסיעות חינם'), null],
      ['arnona', tr('Ask for the arnona exemption (if you rent or own)', 'לבקש פטור מארנונה (אם שוכר או בעלים)'), null],
      ['tax', tr('Give form 101 with the tax points to the employer', 'למסור למעסיק טופס 101 עם נקודות הזיכוי'), 'payslip'],
      ['deposit', tr('Look at the deposit in the personal area', 'להציץ בפיקדון באזור האישי'), 'deposit'],
      ['btl', tr('Check National Insurance status', 'לבדוק מצב בביטוח לאומי'), null],
      ['health', tr('Make sure you are registered with a health fund', 'לוודא שאתה רשום בקופת חולים'), null],
      ['reserves', tr('Check reserve-duty details', 'לבדוק פרטים על מילואים'), null],
      ['study', tr('Look at scholarships and preparatory programmes', 'לבדוק מלגות ומכינות'), 'scholarships'],
      ['docs', tr('Back up the discharge certificate and documents', 'לגבות את תעודת השחרור והמסמכים'), null],
      ['talk', tr('Remember: it is fine to ask for emotional help', 'לזכור: מותר לבקש עזרה רגשית'), 'contacts']
    ];
    function checklistPage() {
      const wrap = h('div');
      P.afterChecks = P.afterChecks || [];
      const ul = h('ul', {class: 'plus-check-list'});
      const bar = h('div', {class: 'plus-progress'}, h('div', {class: 'plus-progress-fill'}));
      const count = h('p', {class: 'plus-muted'});
      const paint = () => {
        ul.replaceChildren(...TODO.map(([id, label, goto]) => {
          const done = P.afterChecks.includes(id);
          const cb = h('input', {type: 'checkbox', checked: done || undefined, 'aria-label': label});
          cb.addEventListener('change', () => { P.afterChecks = cb.checked ? [...new Set([...P.afterChecks, id])] : P.afterChecks.filter(x => x !== id); store(); paint(); });
          return h('li', {class: done ? 'is-done' : ''}, h('label', {}, cb, h('span', {}, label)), goto ? btn(tr('Open', 'לפתוח'), () => showPage(goto), 'plus-link') : null);
        }));
        const n = P.afterChecks.filter(x => TODO.some(t => t[0] === x)).length;
        bar.firstChild.style.width = Math.round(n / TODO.length * 100) + '%';
        count.textContent = tr(n + ' of ' + TODO.length + ' done', n + ' מתוך ' + TODO.length + ' בוצעו');
      };
      put(wrap, section(tr('After discharge — one list', 'אחרי השחרור — רשימה אחת'), bar, count, ul,
        h('div', {class: 'plus-row'}, shareBtn(tr('My after-discharge list', 'הרשימה שלי אחרי השחרור'), () => TODO.map(([id, l]) => (P.afterChecks.includes(id) ? '✓ ' : '○ ') + l).join('\n')))));
      paint();
      return wrap;
    }

    /* ================= CONTACTS (verified 26 Nov 2026) ================= */
    const CONTACTS = [
      {group: 'rights', name: tr('Division for Discharged Soldiers', 'האגף לחיילים משוחררים ומילואים'), tel: '*5266', note: tr('Rights, grant, deposit. WhatsApp too.', 'זכויות, מענק, פיקדון. יש גם וואטסאפ.'), url: HACHVANA},
      {group: 'rights', name: tr('National Insurance', 'ביטוח לאומי'), tel: '*6050', note: tr('Preferred work, unemployment, exemption.', 'עבודה מועדפת, אבטלה, פטור.'), url: 'https://www.btl.gov.il/'},
      {group: 'rights', name: tr('IDF public inquiries (deposit amount appeal)', 'פניות הציבור צה"ל (ערעור על סכום הפיקדון)'), tel: '1111', note: tr('Extension 5.', 'שלוחה 5.')},
      {group: 'support', name: tr('ERAN — emotional first aid', 'ער"ן — עזרה ראשונה נפשית'), tel: '1201', note: tr('24/7, anonymous.', '24/7, אנונימי.'), url: 'https://www.eran.org.il/'},
      {group: 'support', name: tr('NATAL — trauma helpline', 'נט"ל — קו סיוע לטראומה'), tel: '1-800-363-363', note: tr('Free helpline.', 'קו סיוע חינמי.'), url: 'https://www.natal.org.il/'},
      {group: 'support', name: tr('"Nefesh Achat" — support line for veterans', '"נפש אחת" — קו תמיכה ללוחמים ומשוחררים'), tel: '*8944', note: tr('24/7, by the Defense Ministry with NATAL.', '24/7, של משרד הביטחון בשיתוף נט"ל.')},
      {group: 'support', name: tr('SAHAR — online chat', 'סה"ר — צ\'אט תמיכה ברשת'), tel: '', note: tr('Anonymous written chat, 24/7.', 'צ\'אט כתוב ואנונימי, 24/7.'), url: 'https://sahar.org.il/'},
      {group: 'emergency', name: tr('Magen David Adom', 'מד"א'), tel: '101'},
      {group: 'emergency', name: tr('Police', 'משטרה'), tel: '100'}
    ];
    const PLACES = [
      [tr('Youth centre (Merkaz Tzeirim)', 'מרכז צעירים'), 'מרכז צעירים'],
      [tr('National Insurance branch', 'סניף ביטוח לאומי'), 'סניף ביטוח לאומי'],
      [tr('Employment Service office', 'לשכת שירות התעסוקה'), 'לשכת שירות התעסוקה'],
      [tr('Division district office', 'מחוז האגף לחיילים משוחררים'), 'האגף לחיילים משוחררים משרד הביטחון']
    ];
    function vcf() {
      return CONTACTS.filter(c => c.tel).map(c => ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + c.name, 'ORG:Momentum Companion', 'TEL;TYPE=VOICE:' + c.tel, c.url ? 'URL:' + c.url : '', 'END:VCARD'].filter(Boolean).join('\r\n')).join('\r\n');
    }
    function contacts() {
      const wrap = h('div');
      const groups = [['support', tr('Emotional support', 'תמיכה רגשית')], ['rights', tr('Rights and money', 'זכויות וכסף')], ['emergency', tr('Emergency', 'חירום')]];
      groups.forEach(([g, title]) => wrap.append(section(title, h('ul', {class: 'plus-contacts'}, CONTACTS.filter(c => c.group === g).map(c => h('li', {},
        h('div', {}, h('strong', {}, c.name), c.note ? h('small', {}, c.note) : null),
        h('div', {class: 'plus-row'},
          c.tel ? h('a', {class: 'plus-btn primary plus-call', href: 'tel:' + c.tel.replace(/[^\d*#+]/g, '')}, '📞 ' + c.tel) : null,
          c.url ? ext(c.tel ? tr('Site', 'אתר') : tr('Open chat', 'לפתוח צ\'אט'), c.url) : null)))))));
      wrap.append(h('div', {class: 'plus-row'}, btn(tr('Save all numbers to my contacts', 'לשמור את כל המספרים באנשי הקשר'), () => download('momentum-contacts.vcf', 'text/vcard', vcf()), 'plus-btn')));
      wrap.append(section(tr('Find a place near me', 'למצוא מקום קרוב אליי'), h('ul', {class: 'plus-contacts'}, PLACES.map(([label, q]) => h('li', {}, h('strong', {}, label),
        h('div', {class: 'plus-row'}, ext('Waze', 'https://waze.com/ul?q=' + encodeURIComponent(q)), ext(tr('Google Maps', 'גוגל מפות'), 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q))))))),
        note(tr('Maps open with a search; your location is used only by the maps app, not by us.', 'המפות נפתחות עם חיפוש. המיקום שלך משמש רק את אפליקציית המפות, לא אותנו.')));
      wrap.append(verify());
      return wrap;
    }

    /* ================= SCHOLARSHIPS (checked 27 Nov 2026) =================
       Only an official page counts as a link. Anything not yet confirmed is shown as "To check" — never a Google search. */
    const CHECKED = '2026-11-27';
    const SCH = () => [
      {group: 'gov', name: tr('Mimadim (Uniform to Studies)', 'ממדים ללימודים'), url: 'https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/UniformToStudies.aspx', src: tr('Division for Discharged Soldiers', 'האגף לחיילים משוחררים'),
        desc: tr('Full tuition for the degree for eligible soldiers. Since May 2026 it can be combined with Mil-GO.', 'מימון שכר לימוד מלא לתואר לזכאים. ממאי 2026 אפשר לשלב עם מיל-GO.'), who: tr('Combat; lone soldiers, new immigrants, minorities, families receiving family payments', 'לוחמים; חיילים בודדים, עולים, בני מיעוטים, מקבלי תשלומי משפחה'), when: tr('Changes each year — see the official page', 'מועד משתנה — לפי העמוד הרשמי')},
      {group: 'gov', name: tr('Mil-GO (Council for Higher Education)', 'מיל-GO (המל"ג)'), url: '', src: tr('CHE / Ministry of Education', 'המל"ג / משרד החינוך'),
        desc: tr('Need-based study grant in several tiers, for degree, mechina or practical-engineer studies.', 'מלגה לפי מצב סוציו-אקונומי, בכמה מדרגות, לתואר, מכינה או הנדסאים.'), who: tr('Students at recognised institutions', 'סטודנטים במוסדות מוכרים'), when: tr('The next round will be announced by the CHE', 'מועד ההרשמה הבא יפורסם על ידי המל"ג')},
      {group: 'periphery', name: tr('Yiud 44 — studying in the periphery', 'ייעוד 44 — לומדים בפריפריה'), url: 'https://www.kolzchut.org.il/he/%D7%9E%D7%99%D7%9E%D7%95%D7%9F_%D7%9C%D7%99%D7%9E%D7%95%D7%93%D7%99%D7%9D_%D7%91%D7%90%D7%96%D7%95%D7%A8%D7%99_%D7%A1%D7%99%D7%95%D7%A2_%D7%9C%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D_%D7%9E%D7%A9%D7%95%D7%97%D7%A8%D7%A8%D7%99%D7%9D_%D7%95%D7%9E%D7%A1%D7%99%D7%99%D7%9E%D7%99_%D7%A9%D7%99%D7%A8%D7%95%D7%AA_%D7%9C%D7%90%D7%95%D7%9E%D7%99-%D7%90%D7%96%D7%A8%D7%97%D7%99', src: tr('Kol Zchut (Division information)', 'כל זכות (מידע של האגף)'),
        desc: tr('First-year tuition for a bachelor\'s degree at an institution in a support area. No volunteering.', 'מימון שנה א\' לתואר ראשון במוסד שנמצא באזור סיוע. בלי התנדבות.'), who: tr('Discharged soldiers who completed service; reservists and lone soldiers up to 10 years', 'משוחררים שהשלימו שירות; מילואים ובודדים עד 10 שנים'), when: tr('Through the personal area after the institution reports', 'דרך האזור האישי, אחרי שהמוסד מדווח')},
      {group: 'periphery', name: tr('Yiud 45 — periphery residents', 'ייעוד 45 — תושבי פריפריה'), url: 'https://www.kolzchut.org.il/he/%D7%9E%D7%99%D7%9E%D7%95%D7%9F_%D7%95%D7%A1%D7%99%D7%95%D7%A2_%D7%91%D7%9C%D7%99%D7%9E%D7%95%D7%93%D7%99%D7%9D_%D7%9C%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D_%D7%9E%D7%A9%D7%95%D7%97%D7%A8%D7%A8%D7%99%D7%9D_%D7%95%D7%9E%D7%A1%D7%99%D7%99%D7%9E%D7%99_%D7%A9%D7%99%D7%A8%D7%95%D7%AA_%D7%9C%D7%90%D7%95%D7%9E%D7%99-%D7%90%D7%96%D7%A8%D7%97%D7%99_%D7%94%D7%9E%D7%AA%D7%92%D7%95%D7%A8%D7%A8%D7%99%D7%9D_%D7%91%D7%A4%D7%A8%D7%99%D7%A4%D7%A8%D7%99%D7%94', src: tr('Kol Zchut (Division information)', 'כל זכות (מידע של האגף)'),
        desc: tr('Help funding the first year of a degree for those who live in a support area.', 'סיוע במימון שנה א\' לתואר למי שגר באזור סיוע.'), who: tr('Discharged soldiers and national-service graduates living in the periphery', 'משוחררים ומסיימי שירות לאומי שגרים בפריפריה'), when: tr('Registration dates are published each year by the Division', 'מועדי ההרשמה מתפרסמים כל שנה באתר האגף')},
      {group: 'periphery', name: tr('Yiud 46 — mechina graduates from the periphery', 'ייעוד 46 — בוגרי מכינה מהפריפריה'), url: '', src: tr('Division for Discharged Soldiers', 'האגף לחיילים משוחררים'),
        desc: tr('For periphery residents who completed a Division-funded pre-academic mechina.', 'לתושבי פריפריה שסיימו מכינה במימון האגף.'), who: tr('Periphery', 'פריפריה'), when: tr('Changes', 'מועד משתנה')},
      {group: 'funds', name: 'IMPACT! (FIDF)', url: 'https://www.fidf.org/impact', src: 'FIDF',
        desc: tr('A scholarship for each study year plus mentoring, with about 130 volunteer hours a year.', 'מלגה לכל שנת לימוד ועוד ליווי, עם כ-130 שעות התנדבות בשנה.'), who: tr('Combat and combat support, by socio-economic need', 'לוחמים ותומכי לחימה, לפי מצב סוציו-אקונומי'), when: tr('Usually 1 March – 31 May', 'בדרך כלל 1 במרץ – 31 במאי')},
      {group: 'funds', name: tr('HESEG Foundation', 'קרן הישג'), url: 'https://www.heseg.com', src: tr('HESEG', 'קרן הישג'),
        desc: tr('Tuition and living support for the whole degree.', 'מלגת שכר לימוד וקיום לאורך התואר.'), who: tr('Lone soldiers (not children of emissaries), usually within 2 years of discharge', 'חיילים בודדים (לא בני שליחים), בדרך כלל עד שנתיים מהשחרור'), when: tr('Usually 1 March – end of June', 'בדרך כלל 1 במרץ – סוף יוני')},
      {group: 'funds', name: tr('Gruss Foundation', 'קרן גרוס'), url: '', src: tr('Gruss Foundation', 'קרן גרוס'),
        desc: tr('Help for studies; requires having used part of the deposit and no other funding.', 'סיוע ללימודים; צריך לנצל חלק מהפיקדון ולא לקבל מימון אחר.'), who: tr('Lone soldiers, periphery, Ethiopian-Israelis, Haredim, minorities — within 5 years of discharge', 'בודדים, פריפריה, יוצאי אתיופיה, חרדים, בני מיעוטים — עד 5 שנים מהשחרור'), when: tr('For 2026-27: 15 Sep – 15 Dec 2026 (per a scholarship listing)', 'לתשפ"ז: 15.9.26 – 15.12.26 (לפי לוח מלגות)')},
      {group: 'funds', name: tr('Mifal HaPais scholarships', 'מלגות מפעל הפיס'), url: 'https://www.pais.co.il', src: tr('Mifal HaPais', 'מפעל הפיס'),
        desc: tr('Matching scholarships run through partner organisations and municipalities, usually with volunteering.', 'מלגות בשיתוף ארגונים ורשויות, בדרך כלל עם התנדבות.'), who: tr('Students at recognised institutions', 'סטודנטים במוסדות מוכרים'), when: tr('Changes', 'מועד משתנה')},
      {group: 'funds', name: tr('Eli Cohen scholarships', 'מלגות אלי כהן'), url: '', src: '', desc: tr('Not confirmed yet.', 'עוד לא אומת.'), who: '', when: ''},
      {group: 'funds', name: tr('Rothschild', 'רוטשילד'), url: '', src: '', desc: tr('Not confirmed yet.', 'עוד לא אומת.'), who: '', when: ''},
      {group: 'funds', name: tr('Atidim', 'עתידים'), url: '', src: '', desc: tr('Not confirmed yet.', 'עוד לא אומת.'), who: '', when: ''},
      {group: 'funds', name: tr('Hazanek LeAtid', 'הזנק לעתיד'), url: '', src: '', desc: tr('Not confirmed yet.', 'עוד לא אומת.'), who: '', when: ''},
      {group: 'funds', name: tr('ISEF', 'אייסף'), url: '', src: '', desc: tr('For first-generation students from the social and geographic periphery — not confirmed yet.', 'לדור ראשון להשכלה גבוהה מהפריפריה — עוד לא אומת.'), who: '', when: ''},
      {group: 'institution', name: tr('Your institution', 'המוסד שבו תלמד'), url: '', src: '', desc: tr('Every university and college has scholarships for discharged and combat soldiers. Ask the Dean of Students.', 'בכל אוניברסיטה ומכללה יש מלגות למשוחררים וללוחמים. שואלים בדקנט הסטודנטים.'), who: tr('Everyone', 'כולם'), when: tr('Each institution sets its own dates', 'כל מוסד קובע מועדים')},
      {group: 'city', name: tr('Your municipality / youth centre', 'העירייה / מרכז הצעירים'), url: '', src: '', desc: tr('Many local authorities give scholarships to young residents. The youth centre can help you apply.', 'הרבה רשויות נותנות מלגות לצעירים תושבי המקום. מרכז הצעירים עוזר להגיש.'), who: tr('Residents', 'תושבים'), when: tr('Each authority sets its own dates', 'כל רשות קובעת מועדים')}
    ];
    const SCH_GROUPS = () => [['gov', tr('Mimadim and government', 'ממדים וממשלה'), 'gift'], ['periphery', tr('Periphery', 'פריפריה'), 'home'], ['funds', tr('Foundations', 'קרנות'), 'star'], ['institution', tr('Your institution', 'מוסד הלימודים'), 'bulb'], ['city', tr('Municipality', 'עירייה'), 'person']];
    function scholarships() {
      const wrap = h('div');
      const q = h('input', {type: 'search', placeholder: tr('Search a scholarship…', 'חיפוש מלגה…'), 'aria-label': tr('Search scholarships', 'חיפוש מלגות')});
      const list = h('div');
      const fmt = d => new Date(d).toLocaleDateString(he() ? 'he-IL' : 'en-GB', {day: 'numeric', month: 'numeric', year: 'numeric'});
      const card = s => h('article', {class: 'plus-sch'},
        h('div', {class: 'plus-sch-top'}, h('strong', {}, s.name), s.url ? h('span', {class: 'plus-badge-ok'}, tr('Official link', 'קישור רשמי')) : h('span', {class: 'plus-badge-check'}, tr('To check', 'לבדיקה'))),
        h('p', {}, s.desc),
        s.who ? h('p', {class: 'plus-sch-meta'}, h('b', {}, tr('Who: ', 'למי: ')), s.who) : null,
        s.when ? h('p', {class: 'plus-sch-meta'}, h('b', {}, tr('When: ', 'מתי: ')), s.when) : null,
        h('p', {class: 'plus-sch-meta plus-muted'}, tr('Checked: ', 'נבדק: ') + fmt(CHECKED) + (s.src ? ' · ' + tr('Source: ', 'מקור: ') + s.src : '')),
        h('div', {class: 'plus-row'}, s.url ? ext(tr('To the official page', 'לעמוד הרשמי'), s.url) : null,
          btn(tr('Save in My Journey', 'שמור במסע שלי'), () => saveAction(tr('Check scholarship: ', 'לבדוק מלגה: ') + s.name, [s.desc, s.when, s.url].filter(Boolean).join('\n')), 'plus-btn')));
      const paint = () => {
        const t = q.value.trim().toLowerCase();
        list.replaceChildren(...SCH_GROUPS().map(([g, title, ic]) => {
          const items = SCH().filter(s => s.group === g && (!t || (s.name + ' ' + s.desc + ' ' + s.who).toLowerCase().includes(t)));
          return items.length ? h('section', {class: 'plus-sch-group'}, h('h2', {class: 'plus-group-title'}, icon(ic, 'plus-ico-dot topic-study'), title), ...items.map(card)) : null;
        }));
      };
      q.addEventListener('input', paint);
      put(wrap, section(tr('Scholarships for discharged soldiers', 'מלגות לחיילים משוחררים'),
        note(tr('Dates and amounts change every year. "To check" means we have not confirmed an official page yet — ask the institution or a youth centre.', 'מועדים וסכומים משתנים כל שנה. "לבדיקה" אומר שעוד לא אימתנו עמוד רשמי — אפשר לשאול במוסד או במרכז הצעירים.')), q),
        list, h('div', {class: 'plus-row'}, ctx.askButton ? ctx.askButton('study', tr('Which scholarships might fit me?', 'אילו מלגות אולי מתאימות לי?')) : null));
      paint();
      return wrap;
    }

    /* ================= PAYSLIP GUIDE ================= */
    const SLIP = [
      [tr('Base salary', 'שכר בסיס'), tr('Your agreed pay before additions. Check the hourly rate is not below minimum wage.', 'השכר המוסכם לפני תוספות. לבדוק שהתעריף לשעה לא נמוך משכר המינימום.')],
      [tr('Overtime', 'שעות נוספות'), tr('Hours beyond a normal day are paid extra.', 'שעות מעבר ליום רגיל משולמות בתוספת.')],
      [tr('Travel', 'נסיעות'), tr('Travel to work is usually reimbursed.', 'הוצאות נסיעה לעבודה בדרך כלל מוחזרות.')],
      [tr('Income tax', 'מס הכנסה'), tr('Check your discharge tax credit points appear. If not — form 101.', 'לבדוק שנקודות הזיכוי של השחרור מופיעות. אם לא — טופס 101.')],
      [tr('Credit points', 'נקודות זיכוי'), tr('The number of points; each one lowers your tax.', 'מספר הנקודות; כל נקודה מורידה מס.')],
      [tr('National Insurance + health tax', 'ביטוח לאומי + מס בריאות'), tr('Deducted automatically.', 'מנוכים אוטומטית.')],
      [tr('Pension', 'פנסיה'), tr('By law, pension contributions start after a set period at work. Make sure it appears when it should.', 'לפי החוק הפרשות לפנסיה מתחילות אחרי תקופה מסוימת בעבודה. לוודא שזה מופיע כשצריך.')],
      [tr('Vacation / sick balance', 'יתרת חופשה / מחלה'), tr('Days you have accumulated.', 'הימים שצברת.')],
      [tr('Gross and net', 'ברוטו ונטו'), tr('Gross = before deductions; net = what reaches your account.', 'ברוטו = לפני ניכויים; נטו = מה שנכנס לחשבון.')]
    ];
    function payslip() {
      const wrap = h('div');
      wrap.append(section(tr('Your first payslip — line by line', 'התלוש הראשון — שורה אחרי שורה'),
        h('dl', {class: 'plus-glossary'}, SLIP.flatMap(([t, d]) => [h('dt', {}, t), h('dd', {}, d)])),
        h('p', {class: 'plus-warn'}, '⚠ ' + ((R().tax_credit_points || {}).not_automatic || tr('Tax points are not automatic — ask on form 101.', 'נקודות הזיכוי לא אוטומטיות — מבקשים בטופס 101.'))),
        h('div', {class: 'plus-row'}, ext(tr('Workers\' rights (Kol Zchut)', 'זכויות עובדים (כל זכות)'), 'https://www.kolzchut.org.il/'), ext(tr('Tax Authority', 'רשות המסים'), (R().tax_credit_points || {}).official_url || 'https://www.gov.il/'))));
      if (!P.infoOnly) wrap.append(h('div', {class: 'plus-row'}, btn(tr('Something looks wrong — ask the Companion', 'משהו נראה לא תקין — לשאול את המלווה'), () => openTopic('money', tr('Help me check my payslip. ', 'תעזור לי לבדוק את התלוש שלי. ')), 'plus-btn')));
      wrap.append(verify());
      return wrap;
    }

    /* ================= GLOSSARY ================= */
    const WORDS = [
      [tr('Grant (Ma\'anak)', 'מענק'), tr('Free money paid after discharge. Spend it as you like.', 'כסף חופשי שמשולם אחרי השחרור. משתמשים בו איך שרוצים.')],
      [tr('Deposit (Pikadon)', 'פיקדון'), tr('Money saved for approved uses for 5 years; then released.', 'כסף שמור למטרות מאושרות במשך 5 שנים; אחרי זה משתחרר.')],
      [tr('Preferred work', 'עבודה מועדפת'), tr('Work in approved sectors that earns a National Insurance grant.', 'עבודה בענפים מאושרים שמזכה במענק מביטוח לאומי.')],
      [tr('Mimadim', 'ממדים ללימודים'), tr('Tuition funding for eligible discharged soldiers.', 'מימון שכר לימוד לחיילים משוחררים זכאים.')],
      [tr('Tax credit points', 'נקודות זיכוי'), tr('Lower your income tax. Ask on form 101.', 'מורידות את מס ההכנסה. מבקשים בטופס 101.')],
      [tr('Form 101', 'טופס 101'), tr('The form you give an employer with your tax details.', 'הטופס שממלאים אצל המעסיק עם פרטי המס.')],
      [tr('Tax coordination (Te\'um mas)', 'תיאום מס'), tr('Needed when you have two jobs, so tax is not overcharged.', 'נדרש כשיש שתי עבודות, כדי שלא ינכו יותר מדי מס.')],
      [tr('Personal area', 'אזור אישי'), tr('Your account on the Division site: amounts, requests, documents.', 'החשבון שלך באתר האגף: סכומים, בקשות, מסמכים.')],
      [tr('Eligibility (Zaka\'ut)', 'זכאות'), tr('Whether you meet the conditions for a right.', 'האם אתה עומד בתנאים של זכות מסוימת.')],
      [tr('Allowance (Kitzba)', 'קצבה'), tr('A regular payment, e.g. from National Insurance.', 'תשלום קבוע, למשל מביטוח לאומי.')]
    ];
    function glossary() {
      const wrap = h('div');
      const faq = (KB && KB.data && KB.data.faq) || [];
      wrap.append(section(tr('Words that confuse everyone', 'מילים שמבלבלות את כולם'), h('dl', {class: 'plus-glossary'}, WORDS.flatMap(([t, d]) => [h('dt', {}, t), h('dd', {}, d)]))));
      if (faq.length) wrap.append(section(tr('Common questions', 'שאלות נפוצות'), ...faq.map(f => h('details', {class: 'plus-details'}, h('summary', {}, f.question), h('p', {}, f.answer)))));
      return wrap;
    }


    /* ================= BATCH 2: life, work and progress tools ================= */
    function copyText(text) {
      try { navigator.clipboard.writeText(text).then(() => toast(tr('Copied ✓', 'הועתק ✓')), () => toast(tr('Could not copy', 'לא הצלחתי להעתיק'))); }
      catch (_) { toast(tr('Could not copy', 'לא הצלחתי להעתיק')); }
    }
    const steps = items => h('ol', {class: 'plus-list'}, items.map(x => h('li', {}, x)));

    /* First apartment */
    function apartment() {
      const wrap = h('div');
      wrap.append(
        section(tr('Before you sign', 'לפני שחותמים'), steps([
          tr('Read the whole contract. Check rent, dates, who fixes what, and the exit/notice terms.', 'לקרוא את כל החוזה. לבדוק שכירות, תאריכים, מי מתקן מה, ותנאי יציאה והודעה מוקדמת.'),
          tr('Ask what guarantee is required: guarantors, bank guarantee, promissory note or cash deposit. Know the risk of each.', 'לשאול איזו ערבות נדרשת: ערבים, ערבות בנקאית, שטר חוב או פיקדון כספי. להבין את הסיכון בכל אחת.'),
          tr('The Fair Rent Law limits some demands (for example, the size of guarantees). Check on Kol Zchut.', 'חוק השכירות ההוגנת מגביל חלק מהדרישות (למשל גובה הערבויות). לבדוק ב"כל זכות".'),
          tr('Visit at different hours. Check water pressure, mould, noise, phone signal.', 'לבקר בשעות שונות. לבדוק לחץ מים, עובש, רעש, קליטה.')
        ]), ext(tr('Renting rights (Kol Zchut)', 'זכויות בשכירות (כל זכות)'), 'https://www.kolzchut.org.il/he/שכירות_דירה')),
        section(tr('Moving-in day', 'יום הכניסה'), steps([
          tr('Photograph every room and existing damage; send the photos to the landlord.', 'לצלם כל חדר וכל נזק קיים, ולשלוח את התמונות לבעל הדירה.'),
          tr('Write down the electricity, water and gas meter readings.', 'לרשום את מוני החשמל, המים והגז.'),
          tr('Transfer arnona, electricity, water and gas to your name.', 'להעביר על שמך ארנונה, חשמל, מים וגז.'),
          tr('Ask the local authority for the arnona exemption if you are within 4 months of discharge.', 'לבקש ברשות המקומית פטור מארנונה, אם עוד לא עברו 4 חודשים מהשחרור.')
        ]), h('div', {class: 'plus-row'}, btn(tr('My dates', 'המועדים שלי'), () => showPage('deadlines'), 'plus-link'), btn(tr('Monthly budget', 'תקציב חודשי'), () => showPage('money'), 'plus-link'))),
        verify());
      return wrap;
    }

    /* Insurance */
    function insurance() {
      const rows = [
        [tr('Health fund (basic)', 'קופת חולים (בסיסי)'), tr('Required by law', 'חובה לפי חוק'), tr('Make sure you moved from IDF medical care to a health fund.', 'לוודא שעברת מהרפואה הצבאית לקופת חולים.')],
        [tr('Supplementary health', 'ביטוח משלים בקופה'), tr('Optional', 'לבחירה'), tr('Extra services at the health fund. Compare what you actually need.', 'שירותים נוספים בקופה. להשוות מה באמת צריך.')],
        [tr('Private health', 'ביטוח בריאות פרטי'), tr('Optional', 'לבחירה'), tr('Check for double coverage with the supplementary plan.', 'לבדוק כפל ביטוח מול המשלים.')],
        [tr('Car — compulsory', 'רכב — חובה'), tr('Required if you have a car', 'חובה אם יש רכב'), tr('Covers bodily injury only.', 'מכסה רק נזקי גוף.')],
        [tr('Car — third party / comprehensive', 'רכב — צד ג\' / מקיף'), tr('Recommended with a car', 'מומלץ עם רכב'), tr('Covers damage to others\' cars (third party) or also your own (comprehensive).', 'מכסה נזק לרכב של אחרים (צד ג\') או גם לרכב שלך (מקיף).')],
        [tr('Apartment contents', 'תכולת דירה'), tr('Optional', 'לבחירה'), tr('Some landlords ask for third-party cover.', 'יש בעלי דירות שמבקשים צד ג\'.')],
        [tr('Travel abroad', 'נסיעות לחו"ל'), tr('Strongly recommended', 'מומלץ מאוד'), tr('Check extreme sports and long-trip cover.', 'לבדוק כיסוי לספורט אתגרי ולטיול ארוך.')]
      ];
      return h('div', {}, section(tr('Which insurance do I need?', 'איזה ביטוח צריך?'),
        h('ul', {class: 'plus-contacts'}, rows.map(([n, need, d]) => h('li', {}, h('div', {}, h('strong', {}, n), h('small', {}, d)), h('span', {class: 'plus-pill plus-soft'}, need)))),
        h('p', {}, tr('Check all your existing policies in one place on the Insurance Mountain ("Har HaBituach") site.', 'אפשר לראות את כל הביטוחים שלך במקום אחד באתר "הר הביטוח".')),
        ext(tr('Har HaBituach (Capital Market Authority)', 'הר הביטוח (רשות שוק ההון)'), 'https://harb.cma.gov.il/')), verify());
    }

    /* Ready-made letters */
    const LETTERS = () => [
      [tr('Short cover note', 'מכתב מקדים קצר'), tr('Hello [name],\nI am applying for the [role] position. I recently finished my military service as [role in service], where I [one concrete thing you did]. I would be glad to talk.\nThank you,\n[your name] · [phone]',
        'שלום [שם],\nאני מגיש מועמדות למשרת [תפקיד]. סיימתי לאחרונה שירות צבאי כ[תפקיד בשירות], שם [דבר אחד מוחשי שעשית]. אשמח לשוחח.\nתודה,\n[השם שלך] · [טלפון]')],
      [tr('Ask for form 106 / payslips', 'בקשת טופס 106 / תלושים'), tr('Hello,\nPlease send me form 106 for [year] and my payslips for [months], for a tax refund request.\nThank you,\n[your name] · ID [number]',
        'שלום,\nאבקש לקבל טופס 106 לשנת [שנה] ותלושי שכר לחודשים [חודשים], לצורך בקשת החזר מס.\nתודה,\n[השם שלך] · ת"ז [מספר]')],
      [tr('Ask for a preferred-work confirmation', 'בקשת אישור עבודה מועדפת'), tr('Hello,\nI worked at [workplace] from [date] to [date] as preferred work. Please give me the employer confirmation for National Insurance.\nThank you,\n[your name]',
        'שלום,\nעבדתי ב[מקום העבודה] מ-[תאריך] עד [תאריך] בעבודה מועדפת. אבקש אישור מעסיק עבור ביטוח לאומי.\nתודה,\n[השם שלך]')],
      [tr('Thank you after an interview', 'תודה אחרי ראיון'), tr('Hello [name],\nThank you for the interview today. I enjoyed hearing about [something from the interview] and I am still very interested in the role.\nBest,\n[your name]',
        'שלום [שם],\nתודה על הראיון היום. נהניתי לשמוע על [משהו מהראיון] ואני עדיין מאוד מעוניין בתפקיד.\nבברכה,\n[השם שלך]')],
      [tr('Resignation notice', 'הודעה על סיום עבודה'), tr('Hello [name],\nI am giving notice that my last day of work will be [date]. Thank you for the opportunity.\n[your name]',
        'שלום [שם],\nאני מודיע שיום העבודה האחרון שלי יהיה [תאריך]. תודה על ההזדמנות.\n[השם שלך]')]
    ];
    function letters() {
      const wrap = h('div');
      wrap.append(note(tr('Replace the [brackets], then copy or share.', 'מחליפים את מה שבסוגריים [ ], ואז מעתיקים או משתפים.')));
      LETTERS().forEach(([title, text]) => {
        const ta = h('textarea', {class: 'plus-letter', rows: '6', 'aria-label': title}); ta.value = text;
        wrap.append(h('details', {class: 'plus-details plus-card'}, h('summary', {}, title), ta,
          h('div', {class: 'plus-row'}, btn(tr('Copy', 'העתקה'), () => copyText(ta.value), 'plus-btn primary'), btn(tr('Share', 'שיתוף'), () => share(title, ta.value), 'plus-btn'),
            P.infoOnly ? null : btn(tr('Improve with the Companion', 'לשפר עם המלווה'), () => openTopic('applications', tr('Help me improve this letter:\n', 'תעזור לי לשפר את המכתב הזה:\n') + ta.value), 'plus-link'))));
      });
      return wrap;
    }

    /* Explain an official letter */
    function explainLetter() {
      const ta = h('textarea', {class: 'plus-letter', rows: '8', placeholder: tr('Paste the letter or message here (remove ID numbers first).', 'הדבק כאן את המכתב או ההודעה (רצוי למחוק קודם מספרי ת"ז).'), 'aria-label': tr('Official letter', 'מכתב רשמי')});
      return h('div', {}, section(tr('Got an official letter you don\'t understand?', 'קיבלת מכתב רשמי ולא מבין אותו?'),
        note(tr('Copy it from WhatsApp, email or a PDF and paste it here. The Companion explains it in simple words and what to do next. It is sent to the AI only after your approval.', 'מעתיקים מוואטסאפ, מייל או PDF ומדביקים כאן. המלווה מסביר במילים פשוטות ומה עושים עכשיו. נשלח ל-AI רק אחרי שאישרת.')),
        ta, h('div', {class: 'plus-row'},
          P.infoOnly ? note(tr('Information-only mode is on.', 'מצב "מידע בלבד" פעיל.')) : btn(tr('Explain it to me', 'תסביר לי'), () => {
            const v = ta.value.trim(); if (!v) { ta.focus(); return; }
            openTopic('rights', tr('Explain this official letter in simple words: what it says, whether I need to do something, and by when. Do not guess facts that are not written.\n\n', 'תסביר לי את המכתב הרשמי הזה במילים פשוטות: מה כתוב, האם אני צריך לעשות משהו, ועד מתי. אל תנחש פרטים שלא כתובים.\n\n') + v.slice(0, 4000));
          }, 'plus-btn primary'),
          btn(tr('Glossary', 'מילון מונחים'), () => showPage('glossary'), 'plus-link'))));
    }

    /* Which field fits me — a light 6-question quiz */
    const QUIZ = () => [
      [tr('What did you enjoy most in service?', 'מה הכי נהנית ממנו בשירות?'), [[tr('Leading people', 'להוביל אנשים'), 'people'], [tr('Fixing / technical things', 'לתקן ודברים טכניים'), 'tech'], [tr('Analysing information', 'לנתח מידע'), 'data'], [tr('Helping others', 'לעזור לאחרים'), 'care'], [tr('Action and outdoors', 'אקשן ושטח'), 'field']]],
      [tr('A good workday for you is…', 'יום עבודה טוב בשבילך זה…'), [[tr('Talking with many people', 'לדבר עם הרבה אנשים'), 'people'], [tr('Building something', 'לבנות משהו'), 'tech'], [tr('Solving a puzzle', 'לפתור בעיה'), 'data'], [tr('Making a difference for someone', 'לעשות שינוי למישהו'), 'care'], [tr('Moving, not sitting', 'לזוז, לא לשבת'), 'field']]],
      [tr('Which would you learn now?', 'מה היית לומד עכשיו?'), [[tr('Management / sales', 'ניהול / מכירות'), 'people'], [tr('Electricity / mechanics / code', 'חשמל / מכונאות / קוד'), 'tech'], [tr('Economics / data', 'כלכלה / נתונים'), 'data'], [tr('Education / health / social work', 'חינוך / בריאות / עבודה סוציאלית'), 'care'], [tr('Security / agriculture / sport', 'ביטחון / חקלאות / ספורט'), 'field']]]
    ];
    const FIELDS = {
      people: [tr('People & leadership', 'אנשים והובלה'), tr('Sales, customer success, team management, HR, entrepreneurship.', 'מכירות, שירות לקוחות, ניהול צוות, משאבי אנוש, יזמות.')],
      tech: [tr('Technical & hands-on', 'טכני ומעשי'), tr('Electrician, technician, practical engineer, maintenance, programming.', 'חשמלאי, טכנאי, הנדסאי, אחזקה, תכנות.')],
      data: [tr('Analysis & systems', 'ניתוח ומערכות'), tr('Data, accounting, cyber, research, logistics planning.', 'נתונים, הנהלת חשבונות, סייבר, מחקר, תכנון לוגיסטי.')],
      care: [tr('Care & education', 'טיפול וחינוך'), tr('Teaching, nursing, paramedic, social work, informal education.', 'הוראה, סיעוד, פרמדיק, עבודה סוציאלית, חינוך בלתי פורמלי.')],
      field: [tr('Field & action', 'שטח ואקשן'), tr('Security, agriculture, tourism and guiding, sport, fitness training.', 'ביטחון, חקלאות, תיירות והדרכה, ספורט, אימון כושר.')]
    };
    function fieldQuiz() {
      const wrap = h('div'); const answers = [];
      const box = h('div', {'aria-live': 'polite'});
      const paint = () => {
        box.replaceChildren();
        const Q = QUIZ();
        if (answers.length < Q.length) {
          const [q, opts] = Q[answers.length];
          box.append(section(tr('Question ', 'שאלה ') + (answers.length + 1) + '/' + Q.length, h('p', {}, h('strong', {}, q)),
            h('div', {class: 'plus-choices'}, opts.map(([label, k]) => btn(label, () => { answers.push(k); paint(); }, 'plus-chip')))));
          return;
        }
        const score = {}; answers.forEach(k => score[k] = (score[k] || 0) + 1);
        const top = Object.keys(score).sort((a, b) => score[b] - score[a]).slice(0, 2);
        box.append(section(tr('Directions worth checking', 'כיוונים ששווה לבדוק'),
          ...top.map(k => h('div', {class: 'plus-card plus-soft'}, h('strong', {}, FIELDS[k][0]), h('p', {}, FIELDS[k][1]))),
          note(tr('Just a starting point, not a verdict. A youth centre or the skills questionnaire go deeper.', 'זו רק נקודת התחלה, לא קביעה. מרכז צעירים או שאלון הכישורים מעמיקים יותר.')),
          h('div', {class: 'plus-row'}, btn(tr('Again', 'שוב'), () => { answers.length = 0; paint(); }, 'plus-link'),
            h('a', {class: 'plus-btn', href: './skills-business.html?lang=' + (he() ? 'he' : 'en')}, tr('Skills questionnaire', 'שאלון הכישורים')),
            P.infoOnly ? null : btn(tr('Talk it through', 'לדבר על זה עם המלווה'), () => openTopic('career', tr('A short quiz suggested: ', 'שאלון קצר הציע לי: ') + top.map(k => FIELDS[k][0]).join(', ') + tr('. Help me check if it fits.', '. תעזור לי לבדוק אם זה מתאים.')), 'plus-btn'))));
      };
      paint(); wrap.append(box); return wrap;
    }

    /* Compare study paths */
    function studyPaths() {
      const rows = [
        [tr('Bachelor\'s degree', 'תואר ראשון'), tr('3–4 years', '3–4 שנים'), tr('Bagrut + psychometric (or alternatives)', 'בגרות + פסיכומטרי (או חלופות)'), tr('Deposit, Mimadim, scholarships', 'פיקדון, ממדים, מלגות')],
        [tr('Practical engineer (handasai)', 'הנדסאי'), tr('About 2 years', 'כשנתיים'), tr('Usually full bagrut in some subjects', 'בדרך כלל בגרות בחלק מהמקצועות'), tr('Deposit, Division funding', 'פיקדון, מימון האגף')],
        [tr('Vocational course', 'קורס מקצועי'), tr('Months', 'חודשים'), tr('Varies by course', 'משתנה לפי קורס'), tr('Deposit, Labor Ministry courses', 'פיקדון, קורסים של משרד העבודה')],
        [tr('Pre-academic mechina', 'מכינה קדם-אקדמית'), tr('Months to a year', 'חודשים עד שנה'), tr('For those without full bagrut', 'למי שאין בגרות מלאה'), tr('Often funded for discharged soldiers', 'לרוב במימון למשוחררים')],
        [tr('Open University', 'האוניברסיטה הפתוחה'), tr('Flexible', 'גמיש'), tr('No entry requirements at the start', 'בלי תנאי קבלה בהתחלה'), tr('Deposit, scholarships', 'פיקדון, מלגות')]
      ];
      return h('div', {}, section(tr('Compare paths', 'השוואת מסלולים'),
        ...rows.map(([n, len, req, fund]) => h('div', {class: 'plus-card plus-soft plus-compare'}, h('strong', {}, n),
          h('dl', {class: 'plus-glossary'}, h('dt', {}, tr('Length', 'משך')), h('dd', {}, len), h('dt', {}, tr('Entry', 'קבלה')), h('dd', {}, req), h('dt', {}, tr('Funding', 'מימון')), h('dd', {}, fund)))),
        note(tr('Typical, not exact. Costs change by institution — check before enrolling.', 'טיפוסי, לא מדויק. העלויות משתנות לפי מוסד — לבדוק לפני הרשמה.')),
        h('div', {class: 'plus-row'}, btn(tr('Scholarships', 'מלגות'), () => showPage('scholarships'), 'plus-link'), btn(tr('Studies page', 'עמוד הלימודים'), () => showPage('studies'), 'plus-link'))), verify());
    }

    /* Lost direction — small steps, not a life plan */
    function lostDirection() {
      const S2 = [
        tr('Today: sleep, eat and go outside for 20 minutes. That counts.', 'היום: לישון, לאכול ולצאת החוצה ל-20 דקות. זה נחשב.'),
        tr('Write 3 things you liked doing — in service or before.', 'לכתוב 3 דברים שנהנית לעשות — בשירות או לפני.'),
        tr('Pick one small task from "After discharge".', 'לבחור משימה קטנה אחת מ"אחרי השחרור".'),
        tr('Talk with one person: a friend, a youth centre, or the Companion.', 'לדבר עם אדם אחד: חבר, מרכז צעירים או המלווה.'),
        tr('Try something for a week (a job, a course, volunteering) — it is allowed to change.', 'לנסות משהו לשבוע (עבודה, קורס, התנדבות) — מותר לשנות.')
      ];
      const n = (KB && KB.data && KB.data.emotional_support && KB.data.emotional_support.normalization) || '';
      return h('div', {}, section(tr('Lost direction? That\'s normal.', 'איבדת כיוון? זה נורמלי.'), n ? h('p', {}, n) : null,
        h('ol', {class: 'plus-list'}, S2.map(x => h('li', {}, x, ' ', btn('＋', () => saveAction(x, tr('Small steps', 'צעדים קטנים')), 'plus-link')))),
        h('div', {class: 'plus-row'}, btn(tr('After-discharge list', 'רשימה אחרי השחרור'), () => showPage('afterlist'), 'plus-link'), btn(tr('Which field fits me?', 'איזה תחום מתאים לי?'), () => showPage('fieldquiz'), 'plus-link'),
          P.infoOnly ? null : btn(tr('Just talk', 'רק לדבר'), () => openTopic('support'), 'plus-btn'))));
    }

    /* Monthly summary + calm badges */
    function summary() {
      const J = (() => { try { return window.MomentumJourney ? window.MomentumJourney.read() : null; } catch (_) { return null; } })();
      const now = new Date(), ym = now.toISOString().slice(0, 7);
      const acts = J ? J.actions || [] : [];
      const doneMonth = acts.filter(a => a.status === 'done' && String(a.updatedAt || a.dueDate || '').startsWith(ym)).length;
      const doneAll = acts.filter(a => a.status === 'done').length;
      const moods = (P.moods || []).filter(m => String(m.d).startsWith(ym));
      const checks = (P.afterChecks || []).length;
      const badges = [
        [J && J.cvs && J.cvs.length, tr('CV started', 'קורות חיים בדרך')],
        [(P.afterChecks || []).includes('tax'), tr('Tax points handled', 'נקודות זיכוי טופלו')],
        [(P.afterChecks || []).includes('deposit'), tr('Deposit checked', 'הפיקדון נבדק')],
        [P.dischargeDate, tr('Dates in place', 'המועדים מסודרים')],
        [J && (J.skills || []).some(x => x.confirmed), tr('Skills confirmed', 'כישורים אושרו')],
        [doneAll >= 5, tr('5 steps done', '5 צעדים הושלמו')]
      ];
      const text = () => [tr('My month', 'החודש שלי') + ' (' + ym + ')', tr('Steps done this month: ', 'צעדים שהושלמו החודש: ') + doneMonth, tr('Steps done overall: ', 'צעדים שהושלמו בסך הכול: ') + doneAll,
        tr('After-discharge list: ', 'רשימה אחרי השחרור: ') + checks + '/12', tr('Achievements: ', 'הישגים: ') + badges.filter(b => b[0]).map(b => b[1]).join(', ')].join('\n');
      return h('div', {}, section(tr('This month', 'החודש הזה'),
        h('div', {class: 'plus-stats'},
          h('div', {}, h('strong', {}, String(doneMonth)), h('small', {}, tr('steps this month', 'צעדים החודש'))),
          h('div', {}, h('strong', {}, String(checks) + '/12'), h('small', {}, tr('after-discharge list', 'רשימה אחרי השחרור'))),
          h('div', {}, h('strong', {}, String(moods.length)), h('small', {}, tr('mood check-ins', 'בדיקות מצב רוח')))),
        h('h3', {}, tr('Calm achievements', 'הישגים שקטים')),
        h('div', {class: 'plus-badges'}, badges.map(([ok, label]) => h('span', {class: 'plus-badge' + (ok ? ' is-on' : '')}, (ok ? '✓ ' : '○ ') + label))),
        note(tr('No pressure — progress is not a race.', 'בלי לחץ — התקדמות היא לא מרוץ.')),
        h('div', {class: 'plus-row'}, shareBtn(tr('My monthly summary', 'הסיכום החודשי שלי'), text), btn(tr('My steps to calendar', 'הצעדים שלי ליומן'), journeyToCalendar, 'plus-btn'), btn(tr('Open My Journey', 'לפתוח את המסע שלי'), () => { location.href = './my-journey.html?lang=' + (he() ? 'he' : 'en') + '#overview'; }, 'plus-link'))));
    }

    /* Install as an app */
    let deferredInstall = null;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
    function install() {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches;
      return h('div', {}, section(tr('Put the Companion on your home screen', 'להוסיף את המלווה למסך הבית'),
        standalone ? h('p', {}, tr('It is already installed ✓', 'כבר מותקן ✓')) :
          deferredInstall ? btn(tr('Install', 'התקנה'), () => { deferredInstall.prompt(); deferredInstall = null; }, 'plus-btn primary') :
          steps(ios ? [tr('Tap the Share button in Safari.', 'ללחוץ על כפתור השיתוף בספארי.'), tr('Choose "Add to Home Screen".', 'לבחור "הוסף למסך הבית".')]
            : [tr('Open the browser menu (⋮).', 'לפתוח את תפריט הדפדפן (⋮).'), tr('Choose "Install app" or "Add to Home screen".', 'לבחור "התקנת אפליקציה" או "הוספה למסך הבית".')]),
        note(tr('Information pages and My Journey also work offline. Reminders come through the calendar ("My dates").', 'עמודי המידע והמסע שלי עובדים גם בלי אינטרנט. תזכורות מגיעות דרך היומן ("המועדים שלי").'))));
    }


    /* ================= BATCH 3 ================= */
    /* Everything I may be entitled to — one total + rights not yet checked */
    function total() {
      const wrap = h('div');
      const r = R();
      const e = P.service && P.monthsServed && KB ? KB.estimate(P.service, P.monthsServed, P.gender) : null;
      if (!e) { wrap.append(section(tr('First, your service details', 'קודם, פרטי השירות'), note(tr('Enter service type and months to calculate.', 'צריך להזין סוג שירות וחודשים כדי לחשב.')), btn(tr('Enter details', 'להזין פרטים'), () => showPage('rights'), 'plus-btn primary'))); return wrap; }
      const taxMax = e.taxMonthly ? e.taxMonthly[1] * ((r.tax_credit_points || {}).duration_months || 36) : 0;
      const pw = (r.preferred_work_grant || {}).amount_2026_number || 0;
      const rows = [
        [tr('Discharge grant', 'מענק שחרור'), e.grant, tr('Automatic', 'אוטומטי')],
        [tr('Personal deposit', 'פיקדון אישי'), e.deposit, tr('For approved uses', 'למטרות מאושרות')],
        [tr('Tax credit points (36 months, max)', 'נקודות זיכוי (36 חודשים, לכל היותר)'), taxMax, tr('Only if you work and ask on form 101', 'רק אם עובדים ומבקשים בטופס 101')],
        [tr('Preferred-work grant', 'מענק עבודה מועדפת'), pw, tr('Only if you work in an approved sector', 'רק אם עובדים בענף מאושר')]
      ];
      const sure = (e.grant || 0) + (e.deposit || 0), maybe = taxMax + pw;
      wrap.append(section(tr('Everything together (estimate)', 'הכול ביחד (הערכה)'),
        h('ul', {class: 'plus-contacts'}, rows.map(([n, v, c]) => h('li', {}, h('div', {}, h('strong', {}, n), h('small', {}, c)), h('strong', {}, v ? '≈ ' + money(v) : '—')))),
        h('div', {class: 'plus-stats'}, h('div', {}, h('strong', {}, money(sure)), h('small', {}, tr('grant + deposit', 'מענק + פיקדון'))), h('div', {}, h('strong', {}, money(maybe)), h('small', {}, tr('possible if you work', 'אפשרי אם עובדים'))), h('div', {}, h('strong', {}, money(sure + maybe)), h('small', {}, tr('total, at most', 'סך הכול, לכל היותר')))),
        note(tr('Plus free public transport for 12 months and an arnona exemption for 4 months. Estimate only — exact amounts are in the personal area.', 'ובנוסף נסיעות חינם 12 חודשים ופטור מארנונה ל-4 חודשים. הערכה בלבד — הסכומים המדויקים באזור האישי.'))));
      const missed = [['tax', tr('Tax credit points — did you give form 101?', 'נקודות זיכוי — מסרת טופס 101?')], ['ravkav', tr('Free travel — is your Rav-Kav profile updated?', 'נסיעות חינם — עדכנת פרופיל ברב-קו?')],
        ['arnona', tr('Arnona exemption — did you ask the local authority?', 'פטור מארנונה — ביקשת ברשות המקומית?')], ['deposit', tr('Deposit — did you look at it in the personal area?', 'פיקדון — הצצת באזור האישי?')],
        ['btl', tr('National Insurance — is your status right?', 'ביטוח לאומי — המצב שלך תקין?')]].filter(([k]) => !(P.afterChecks || []).includes(k));
      if (missed.length) wrap.append(section(tr('Rights you may have missed', 'זכויות שאולי פספסת'), h('ul', {class: 'plus-list'}, missed.map(([, t]) => h('li', {}, t))),
        btn(tr('Open the after-discharge list', 'לפתוח את הרשימה אחרי השחרור'), () => showPage('afterlist'), 'plus-btn')));
      else wrap.append(section(tr('Rights you may have missed', 'זכויות שאולי פספסת'), h('p', {}, tr('Nice — you have checked the main ones ✓', 'יפה — בדקת את העיקריות ✓'))));
      return wrap;
    }

    /* Psychometric planner */
    function psychometric() {
      const wrap = h('div');
      const input = h('input', {type: 'date', id: 'plusPsyDate', value: P.psyDate || '', 'aria-label': tr('Test date', 'תאריך המבחן')});
      const out = h('div', {'aria-live': 'polite'});
      const paint = () => {
        out.replaceChildren();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) { out.append(note(tr('Pick the test date you registered for (dates are on the NITE site).', 'בחר את תאריך המבחן שנרשמת אליו (המועדים באתר המרכז הארצי לבחינות).'))); return; }
        const [y, m, d] = input.value.split('-').map(Number); const T = new Date(y, m - 1, d);
        const weeks = Math.max(0, Math.ceil((T - new Date()) / (7 * 864e5)));
        const plan = [
          [tr('Diagnostic test and choose a course or self-study', 'מבחן אבחון ובחירת קורס או לימוד עצמי'), 1],
          [tr('Basics: math formulas, vocabulary, English words', 'יסודות: נוסחאות במתמטיקה, אוצר מילים, מילים באנגלית'), 0.35],
          [tr('Practice by chapter, timing yourself', 'תרגול לפי פרקים, עם זמן'), 0.65],
          [tr('Full simulations each week and reviewing mistakes', 'סימולציות מלאות כל שבוע ולמידה מטעויות'), 0.9],
          [tr('Last week: rest, light review, logistics', 'שבוע אחרון: מנוחה, חזרה קלה, סידורים'), 1]
        ];
        out.append(section(tr(weeks + ' weeks to the test', weeks + ' שבועות עד המבחן'),
          h('ol', {class: 'plus-list'}, plan.map(([t]) => h('li', {}, t))),
          note(tr('Many people prepare about 2–4 months. Psychometric prep can be paid from the deposit.', 'הרבה מתכוננים בערך 2–4 חודשים. אפשר לממן הכנה לפסיכומטרי מהפיקדון.')),
          h('div', {class: 'plus-row'}, btn(tr('Test date to calendar', 'תאריך המבחן ליומן'), () => download('psychometric.ics', 'text/calendar', ics([{id: 'psy', date: T, title: tr('Psychometric test', 'מבחן פסיכומטרי'), text: tr('Good luck!', 'בהצלחה!')}])), 'plus-btn primary'),
            btn(tr('Deposit planner', 'מתכנן פיקדון'), () => { P.depositGoal = 'studies'; store(); showPage('deposit'); }, 'plus-link'))));
      };
      input.addEventListener('change', () => { P.psyDate = input.value; store(); paint(); });
      put(wrap, section(tr('Psychometric planner', 'מתכנן פסיכומטרי'), input, ext(tr('Test dates and registration (NITE)', 'מועדים והרשמה (מאל"ו)'), 'https://www.nite.org.il/')), out);
      paint();
      return wrap;
    }

    /* Interview practice */
    function interview() {
      const Qs = [tr('Tell me about yourself.', 'ספר לי על עצמך.'), tr('What did you do in the army, and what did you learn?', 'מה עשית בצבא ומה למדת?'), tr('Tell me about a difficult situation and how you handled it.', 'ספר על מצב קשה ואיך התמודדת.'),
        tr('Why this job?', 'למה העבודה הזאת?'), tr('Where do you see yourself in a year?', 'איפה אתה רואה את עצמך בעוד שנה?')];
      let i = 0;
      const q = h('p', {class: 'plus-interview-q'});
      const ta = h('textarea', {class: 'plus-letter', rows: '5', 'aria-label': tr('Your answer', 'התשובה שלך')});
      const paint = () => { q.textContent = (i + 1) + '/' + Qs.length + ' — ' + Qs[i]; ta.value = ''; };
      paint();
      return h('div', {}, section(tr('Practice an interview', 'תרגול ראיון עבודה'),
        note(tr('Answer in writing or out loud. Then the Companion can give feedback (sent only after your approval).', 'עונים בכתב או בקול. אחר כך המלווה יכול לתת משוב (נשלח רק אחרי אישור).')),
        q, ta, h('div', {class: 'plus-row'},
          P.infoOnly ? null : btn(tr('Get feedback', 'לקבל משוב'), () => { const a = ta.value.trim(); if (!a) { ta.focus(); return; } openTopic('applications', tr('Job interview practice. Question: "', 'תרגול ראיון עבודה. השאלה: "') + Qs[i] + tr('". My answer: "', '". התשובה שלי: "') + a + tr('". Give short, kind feedback and one improved version.', '". תן משוב קצר ועדין וגרסה משופרת אחת.')); }, 'plus-btn primary'),
          btn(tr('Next question', 'שאלה הבאה'), () => { i = (i + 1) % Qs.length; paint(); }, 'plus-btn'),
          btn(tr('Tips', 'טיפים'), () => showPage('interview'), 'plus-link'))));
    }

    /* Steps from My Journey → phone calendar */
    function journeyToCalendar() {
      let J = null; try { J = window.MomentumJourney ? window.MomentumJourney.read() : null; } catch (_) {}
      const acts = (J ? J.actions || [] : []).filter(a => a.status !== 'done' && /^\d{4}-\d{2}-\d{2}/.test(a.dueDate || ''));
      if (!acts.length) { toast(tr('No open steps with a date yet.', 'עדיין אין צעדים פתוחים עם תאריך.')); return; }
      download('my-steps.ics', 'text/calendar', ics(acts.map((a, k) => { const [y, m, d] = a.dueDate.slice(0, 10).split('-').map(Number); return {id: 'step' + k, date: new Date(y, m - 1, d), title: a.title, text: a.notes || ''}; })));
    }

    /* ================= TOOLS HUB ================= */
    const GROUPS = () => [
      [tr('Money and dates', 'כסף ומועדים'), [
        ['deadlines', 'calendar', tr('My dates', 'המועדים שלי'), tr('Personal timeline + calendar', 'ציר זמן אישי + יומן')],
        ['deposit', 'coins', tr('Deposit planner', 'מתכנן פיקדון'), tr('What to prepare for each use', 'מה להכין לכל מטרה')],
        ['grantplan', 'gift', tr('Grant planner', 'מתכנן מענק'), tr('Split it your way', 'לחלק בדרך שלך')],
        ['payslip', 'wallet', tr('My payslip', 'התלוש שלי'), tr('Line by line + tax points', 'שורה אחרי שורה + נקודות זיכוי')],
        ['total', 'bag', tr('Everything I may get', 'כל מה שאולי מגיע לי'), tr('One total + what you missed', 'סכום אחד + מה פספסת')]]],
      [tr('Arrangements and bureaucracy', 'סידורים ובירוקרטיה'), [
        ['afterlist', 'check', tr('After-discharge list', 'רשימה אחרי השחרור'), tr('12 things, tick as you go', '12 דברים, מסמנים תוך כדי')],
        ['contacts', 'person', tr('Phone numbers & places', 'טלפונים ומקומות'), tr('Call, save, navigate', 'חיוג, שמירה, ניווט')],
        ['explain', 'help', tr('Explain a letter', 'להסביר מכתב רשמי'), tr('Paste it, get plain words', 'מדביקים ומקבלים הסבר פשוט')],
        ['glossary', 'info', tr('Glossary & questions', 'מילון ושאלות'), tr('Bureaucracy in plain words', 'בירוקרטיה במילים פשוטות')]]],
      [tr('Work and studies', 'עבודה ולימודים'), [
        ['cv', 'file', tr('Build my CV', 'בנה קורות חיים'), tr('Guided + clean PDF', 'מודרך + PDF נקי')],
        ['letters', 'send', tr('Ready letters', 'מכתבים מוכנים'), tr('Cover note, 106, thanks', 'מכתב מקדים, 106, תודה')],
        ['fieldquiz', 'compass', tr('Which field fits me?', 'איזה תחום מתאים לי?'), tr('3 quick questions', '3 שאלות קצרות')],
        ['studypaths', 'bulb', tr('Compare study paths', 'השוואת מסלולי לימוד'), tr('Degree, handasai, course', 'תואר, הנדסאי, קורס')],
        ['scholarships', 'star', tr('Scholarships', 'מלגות'), tr('List + reminders', 'רשימה + תזכורות')],
        ['psychometric', 'calendar', tr('Psychometric planner', 'מתכנן פסיכומטרי'), tr('Countdown + weekly plan', 'ספירה לאחור + תוכנית')],
        ['interviewprep', 'talk', tr('Interview practice', 'תרגול ראיון'), tr('Question, answer, feedback', 'שאלה, תשובה, משוב')]]],
      [tr('Home and life', 'בית וחיים עצמאיים'), [
        ['apartment', 'home', tr('First apartment', 'דירה ראשונה'), tr('Contract, guarantees, moving in', 'חוזה, ערבויות, כניסה')],
        ['insurance', 'bookmark', tr('Insurance', 'ביטוחים'), tr('What you really need', 'מה באמת צריך')]]],
      [tr('Me and my progress', 'אני וההתקדמות שלי'), [
        ['summary', 'history', tr('My month', 'החודש שלי'), tr('Summary + calm achievements', 'סיכום + הישגים שקטים')],
        ['lost', 'heart', tr('Lost direction', 'איבדתי כיוון'), tr('Small steps, not a life plan', 'צעדים קטנים, לא תוכנית חיים')],
        ['install', 'logo', tr('App on my phone', 'אפליקציה בטלפון'), tr('Home-screen icon', 'אייקון במסך הבית')]]]
    ];
    const TOOL_ICON = {deadlines: 'calendar', deposit: 'piggy', grantplan: 'banknote', payslip: 'file', total: 'calc', afterlist: 'listcheck', contacts: 'phone', explain: 'file', glossary: 'book', letters: 'file', fieldquiz: 'compass', studypaths: 'cap', scholarships: 'award', psychometric: 'book', interviewprep: 'talk', apartment: 'building', insurance: 'shield', summary: 'flag', lost: 'heart', install: 'phone', budget: 'calc', links: 'linkic', start: 'map', prefcheck: 'briefcase', missing: 'listcheck', weekly: 'calendar', cv: 'file', coach: 'talk', action: 'flag'};
    const TOOL_ILLU = {cv: 'pen', deadlines: 'calendar', deposit: 'piggy', grantplan: 'banknote', payslip: 'receipt', total: 'calc', afterlist: 'checklist', contacts: 'phone', explain: 'letter', glossary: 'book', letters: 'letter', fieldquiz: 'compass', studypaths: 'signpost', scholarships: 'cap', psychometric: 'pencil', interviewprep: 'talk', apartment: 'house', insurance: 'shield', summary: 'flag', lost: 'heart', install: 'phonecheck'};
    const illu = (name, size, cls) => { const sp = h('span', {class: 'plus-illu ' + (cls || ''), 'aria-hidden': 'true'}); sp.innerHTML = window.MomentumIllu ? window.MomentumIllu(name, size) : ''; return sp; };
    function tools() {
      const wrap = h('div');
      GROUPS().forEach(([title, items], gi) => {
        const topic = ['money', 'tasks', 'study', 'home', 'journey'][gi] || 'tasks';
        const grid = h('div', {class: 'plus-tools-grid'});
        items.forEach(([id, ic, name, why]) => grid.append(h('button', {type: 'button', class: 'plus-tool', 'data-tool': id, onclick: () => showPage(id)}, (window.MomentumIllu && TOOL_ILLU[id] ? illu(TOOL_ILLU[id], 44, 'plus-tool-illu') : icon(TOOL_ICON[id] || ic, 'plus-tool-ico topic-' + topic)), h('strong', {}, name), h('small', {}, why))));
        wrap.append(h('section', {class: 'plus-tools-group'}, h('h2', {}, icon(['calc', 'listcheck', 'cap', 'building', 'flag'][gi] || 'info', 'plus-ico-dot topic-' + topic), title), grid));
      });
      return wrap;
    }

    return {
      pages: {tools, deadlines, deposit: depositPlanner, grantplan: grantPlanner, afterlist: checklistPage, contacts, scholarships, payslip, glossary,
        total, psychometric, interviewprep: interview, apartment, insurance, letters, explain: explainLetter, fieldquiz: fieldQuiz, studypaths: studyPaths, lost: lostDirection, summary, install},
      heads: {
        tools: {icon: 'bulb', title: ['My tools', 'הכלים שלי']}, deadlines: {icon: 'calendar', title: ['My dates', 'המועדים שלי']},
        deposit: {icon: 'coins', title: ['Deposit planner', 'מתכנן פיקדון']}, grantplan: {icon: 'gift', title: ['Grant planner', 'מתכנן מענק']},
        afterlist: {icon: 'check', title: ['After discharge', 'אחרי השחרור']}, contacts: {icon: 'person', title: ['Numbers & places', 'טלפונים ומקומות']},
        scholarships: {icon: 'compass', title: ['Scholarships', 'מלגות']}, payslip: {icon: 'wallet', title: ['My payslip', 'התלוש שלי']},
        glossary: {icon: 'info', title: ['Glossary', 'מילון']},
        total: {icon: 'bag', title: ['Everything I may get', 'כל מה שאולי מגיע לי']}, psychometric: {icon: 'calendar', title: ['Psychometric planner', 'מתכנן פסיכומטרי']}, interviewprep: {icon: 'talk', title: ['Interview practice', 'תרגול ראיון']},
        apartment: {icon: 'home', title: ['First apartment', 'דירה ראשונה']}, insurance: {icon: 'bookmark', title: ['Insurance', 'ביטוחים']},
        letters: {icon: 'send', title: ['Ready letters', 'מכתבים מוכנים']}, explain: {icon: 'help', title: ['Explain a letter', 'להסביר מכתב']},
        fieldquiz: {icon: 'compass', title: ['Which field fits me?', 'איזה תחום מתאים לי?']}, studypaths: {icon: 'bulb', title: ['Study paths', 'מסלולי לימוד']},
        lost: {icon: 'heart', title: ['Lost direction', 'איבדתי כיוון']}, summary: {icon: 'history', title: ['My month', 'החודש שלי']}, install: {icon: 'logo', title: ['App on my phone', 'אפליקציה בטלפון']}
      }
    };
  };
})();
