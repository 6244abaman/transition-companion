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
    const USES = [
      {id: 'studies', he: ['לימודים', 'תואר, מכינה, פסיכומטרי, לימודי תעודה במוסד מוכר.', 'בדרך כלל הכסף מועבר ישירות למוסד, אחרי אישור רישום.'], en: ['Studies', 'Degree, preparatory programme, psychometric, certificate studies at a recognised institution.', 'Money usually goes straight to the institution after proof of enrolment.']},
      {id: 'training', he: ['הכשרה מקצועית', 'קורסים מקצועיים במוסדות מוכרים (למשל חשמלאות, סייבר, הנהלת חשבונות).', 'לבדוק שהמוסד והקורס מוכרים לפני התשלום.'], en: ['Vocational training', 'Professional courses at recognised institutions (e.g. electrician, cyber, bookkeeping).', 'Check the institution and course are recognised before paying.']},
      {id: 'driving', he: ['רישיון נהיגה', 'שיעורי נהיגה ואגרות, כולל רכב כבד.', 'דרך בית ספר לנהיגה מורשה; את פרטי המסמכים רואים באזור האישי.'], en: ['Driving licence', 'Driving lessons and fees, including heavy vehicles.', 'Through a licensed driving school; the required documents are listed in the personal area.']},
      {id: 'business', he: ['עסק', 'פתיחה או הרחבה של עסק.', 'בדרך כלל דרושה תוכנית עסקית; אפשר לקבל ליווי במרכזי צעירים ובאגף.'], en: ['Business', 'Opening or expanding a business.', 'Usually needs a business plan; youth centres and the Division offer guidance.']},
      {id: 'housing', he: ['דיור', 'רכישת דירה, בית או קרקע, ובתנאים מסוימים גם שכירות.', 'התנאים לשכירות מוגבלים — לבדוק באזור האישי לפני שמתכננים.'], en: ['Housing', 'Buying an apartment, house or land, and in some conditions renting.', 'Renting has limited conditions — check the personal area before planning on it.']},
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
        const e = P.service && P.monthsServed && KB ? KB.estimate(P.service, P.monthsServed) : null;
        detail.append(section(title, h('p', {}, what), h('p', {}, tip),
          e && e.deposit ? h('p', {}, h('strong', {}, tr('Your estimated deposit: ', 'הפיקדון המשוער שלך: ') + '≈ ' + money(e.deposit))) : btn(tr('Calculate my deposit', 'לחשב את הפיקדון שלי'), () => showPage('rights'), 'plus-link'),
          h('h3', {}, tr('Steps', 'שלבים')),
          h('ol', {class: 'plus-list'}, [tr('Log in to the personal area on the Division site.', 'להיכנס לאזור האישי באתר האגף.'), tr('Choose the use and check the required documents.', 'לבחור את המטרה ולבדוק אילו מסמכים נדרשים.'), tr('Upload the documents and submit.', 'להעלות את המסמכים ולהגיש.'), tr('Track the request status in the personal area.', 'לעקוב אחרי הבקשה באזור האישי.')].map(x => h('li', {}, x))),
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
      const e = P.service && P.monthsServed && KB ? KB.estimate(P.service, P.monthsServed) : null;
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

    /* ================= SCHOLARSHIPS ================= */
    const SCHOLARSHIPS = [
      {name: 'ממדים ללימודים', en: 'Mimadim (Uniform to Studies)', url: 'https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/UniformToStudies.aspx', note: tr('Up to full tuition for eligible soldiers (combat, lone soldiers and more).', 'עד מימון מלא של שכר הלימוד לזכאים (לוחמים, בודדים ועוד).')},
      {name: 'מלגות פריפריה ("גרים בפריפריה")', en: 'Periphery scholarships'},
      {name: 'ייעוד', en: 'Yiud'}, {name: 'IMPACT!', en: 'IMPACT!'}, {name: 'מיל-GO', en: 'Mil-GO (reservists)'},
      {name: 'קרן הישג', en: 'Heseg Foundation (lone soldiers)'}, {name: 'קרן גרוס', en: 'Gross Foundation'}, {name: 'מלגות אלי כהן', en: 'Eli Cohen scholarships'},
      {name: 'מפעל הפיס', en: 'Mifal HaPais'}, {name: 'רוטשילד', en: 'Rothschild'}, {name: 'עתידים', en: 'Atidim'}, {name: 'הזנק לעתיד', en: 'Hazanek LeAtid'},
      {name: 'אייסף', en: 'ISEF'}, {name: 'מלגות של המוסד ושל העירייה', en: 'Your institution and municipality'}
    ];
    function scholarships() {
      const wrap = h('div');
      const q = h('input', {type: 'search', placeholder: tr('Search a scholarship…', 'חיפוש מלגה…'), 'aria-label': tr('Search scholarships', 'חיפוש מלגות')});
      const ul = h('ul', {class: 'plus-contacts'});
      const paint = () => {
        const t = q.value.trim().toLowerCase();
        ul.replaceChildren(...SCHOLARSHIPS.filter(s => !t || (s.name + ' ' + s.en).toLowerCase().includes(t)).map(s => h('li', {},
          h('div', {}, h('strong', {}, he() ? s.name : s.en), s.note ? h('small', {}, s.note) : null),
          h('div', {class: 'plus-row'},
            s.url ? ext(tr('Official site', 'אתר רשמי'), s.url) : ext(tr('Search online', 'חיפוש ברשת'), 'https://www.google.com/search?q=' + encodeURIComponent(s.name + ' מלגה חיילים משוחררים')),
            btn(tr('Remind me', 'להזכיר לי'), () => saveAction(tr('Check scholarship: ', 'לבדוק מלגה: ') + (he() ? s.name : s.en), tr('Check eligibility, dates and documents.', 'לבדוק זכאות, מועדים ומסמכים.')), 'plus-link')))));
      };
      q.addEventListener('input', paint);
      put(wrap, section(tr('Scholarships for discharged soldiers', 'מלגות לחיילים משוחררים'),
        note(tr('Dates and amounts change every year — check each one before applying. Combining government scholarships is usually limited.', 'מועדים וסכומים משתנים כל שנה — לבדוק כל מלגה לפני הגשה. שילוב של כמה מלגות ממשלתיות בדרך כלל מוגבל.')), q, ul),
        h('div', {class: 'plus-row'}, ctx.askButton ? ctx.askButton('study', tr('Which scholarships might fit me?', 'אילו מלגות אולי מתאימות לי?')) : null));
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

    /* ================= TOOLS HUB ================= */
    const GROUPS = () => [
      [tr('Money and dates', 'כסף ומועדים'), [
        ['deadlines', 'calendar', tr('My dates', 'המועדים שלי'), tr('Personal timeline + calendar', 'ציר זמן אישי + יומן')],
        ['deposit', 'coins', tr('Deposit planner', 'מתכנן פיקדון'), tr('What to prepare for each use', 'מה להכין לכל מטרה')],
        ['grantplan', 'gift', tr('Grant planner', 'מתכנן מענק'), tr('Split it your way', 'לחלק בדרך שלך')],
        ['payslip', 'wallet', tr('My payslip', 'התלוש שלי'), tr('Line by line + tax points', 'שורה אחרי שורה + נקודות זיכוי')]]],
      [tr('Arrangements and help', 'סידורים ועזרה'), [
        ['afterlist', 'check', tr('After-discharge list', 'רשימה אחרי השחרור'), tr('12 things, tick as you go', '12 דברים, מסמנים תוך כדי')],
        ['contacts', 'person', tr('Phone numbers & places', 'טלפונים ומקומות'), tr('Call, save, navigate', 'חיוג, שמירה, ניווט')]]],
      [tr('Studies and words', 'לימודים ומילים'), [
        ['scholarships', 'compass', tr('Scholarships', 'מלגות'), tr('List + reminders', 'רשימה + תזכורות')],
        ['glossary', 'info', tr('Glossary & questions', 'מילון ושאלות'), tr('Bureaucracy in plain words', 'בירוקרטיה במילים פשוטות')]]]
    ];
    function tools() {
      const wrap = h('div');
      GROUPS().forEach(([title, items]) => {
        const grid = h('div', {class: 'plus-tools-grid'});
        items.forEach(([id, ic, name, why]) => grid.append(h('button', {type: 'button', class: 'plus-tool', 'data-tool': id, onclick: () => showPage(id)}, icon(ic, 'plus-tool-ico'), h('strong', {}, name), h('small', {}, why))));
        wrap.append(h('section', {class: 'plus-tools-group'}, h('h2', {}, title), grid));
      });
      return wrap;
    }

    return {
      pages: {tools, deadlines, deposit: depositPlanner, grantplan: grantPlanner, afterlist: checklistPage, contacts, scholarships, payslip, glossary},
      heads: {
        tools: {icon: 'bulb', title: ['My tools', 'הכלים שלי']}, deadlines: {icon: 'calendar', title: ['My dates', 'המועדים שלי']},
        deposit: {icon: 'coins', title: ['Deposit planner', 'מתכנן פיקדון']}, grantplan: {icon: 'gift', title: ['Grant planner', 'מתכנן מענק']},
        afterlist: {icon: 'check', title: ['After discharge', 'אחרי השחרור']}, contacts: {icon: 'person', title: ['Numbers & places', 'טלפונים ומקומות']},
        scholarships: {icon: 'compass', title: ['Scholarships', 'מלגות']}, payslip: {icon: 'wallet', title: ['My payslip', 'התלוש שלי']},
        glossary: {icon: 'info', title: ['Glossary', 'מילון']}
      }
    };
  };
})();
