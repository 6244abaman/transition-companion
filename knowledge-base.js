/* Momentum knowledge base helpers.
 * Data: knowledge-base-full.json (via the generated knowledge-base-data.js).
 * Guides below are general guidance written for the Companion. They are NOT official
 * sources and never state amounts. Amounts come only from the knowledge base file and
 * are always shown with the "verify on the official site" disclaimer.
 * No network calls, no personal data. */
(function (root) {
  'use strict';
  const KB = root.MOMENTUM_KB_DATA || null;
  const DISCLAIMER_HE = 'הסכומים והתנאים משתנים — יש לאמת תמיד באתר הרשמי לפני שמחליטים.';
  const DISCLAIMER_EN = 'Amounts and conditions change. Always verify on the official site before deciding.';

  const fmtMoney = n => typeof n === 'number' ? n.toLocaleString('he-IL', {maximumFractionDigits: 2}) + ' ₪' : String(n || '');
  const SERVICE_RATE_KEY = {combat: 'combat', support: 'combat_support', other: 'other_national_service', national: 'other_national_service'};
  const SERVICE_LABEL = {combat: 'לוחם/ת', support: 'תומך/ת לחימה', other: 'שירות אחר', national: 'שירות לאומי', combat_support: 'תומך/ת לחימה', other_national_service: 'אחר / שירות לאומי', civilian_intermediate: 'שירות אזרחי (ביניים)', civilian_split: 'שירות אזרחי (מפוצל)'};

  /* ---------- General guides (no amounts, no eligibility claims) ---------- */
  const GUIDES = {
    savingsTips: [
      'לפני שמוציאים את המענק — לכתוב רשימה של 3 מטרות (למשל: טיול, לימודים, כרית ביטחון).',
      'כדאי להשאיר כרית ביטחון לכמה חודשי מחיה לפני הוצאות גדולות.',
      'חשבון נפרד לחיסכון עוזר לא לגעת בכסף בלי לשים לב.',
      'לבדוק את הפיקדון לפני שמשלמים מכיס על לימודים, נהיגה או שכירות — ייתכן שאפשר לממן משם.',
      'תקציב חודשי פשוט: הכנסות, הוצאות קבועות, הוצאות משתנות. גם דף אחד מספיק.',
      'לא להתחייב להלוואה או לעסקה גדולה בשבועות הראשונים אחרי השחרור — אפשר לחכות ולחשוב.'
    ],
    roleTranslations: [
      {role: 'לוחם/ת', civilian: 'עבודה תחת לחץ, קבלת החלטות מהירה, אחריות, עבודת צוות, עמידה בתנאים קשים', jobs: 'אבטחה ובטיחות, תפעול ולוגיסטיקה, שירותי חירום, הדרכה, עבודת שטח'},
      {role: 'מפקד/ת צוות', civilian: 'ניהול אנשים, הובלה, תכנון ובקרה, חניכה ומשוב, אחריות על תוצאות', jobs: 'ניהול משמרת, ראש צוות, תפעול, הדרכה, ניהול פרויקטים זוטר'},
      {role: 'טכנאי/ת', civilian: 'פתרון תקלות, תחזוקה מונעת, דיוק, עבודה לפי נהלים, תיעוד', jobs: 'תמיכה טכנית, תחזוקה, הנדסאות, מעבדה, IT'},
      {role: 'נהג/ת', civilian: 'אחריות ובטיחות, עמידה בלוחות זמנים, תכנון מסלול, שירות', jobs: 'הפצה ולוגיסטיקה, תחבורה, שליחויות, תפעול צי רכב'},
      {role: 'תומך/ת לחימה', civilian: 'תיאום בין גורמים, עבודה בסביבה דינמית, אמינות, ריבוי משימות', jobs: 'תפעול, רכש ולוגיסטיקה, תיאום פרויקטים, שירות לקוחות'},
      {role: 'מש"ק/ית (משאבי אנוש, ת"ש, חינוך)', civilian: 'שירות ותמיכה באנשים, ניהול מידע, הקשבה, פתרון בעיות אישיות', jobs: 'משאבי אנוש, גיוס, רווחה, חינוך, שירות'},
      {role: 'מודיעין / ניתוח', civilian: 'ניתוח מידע ממקורות שונים, זיהוי דפוסים, כתיבה ותדרוך תמציתי', jobs: 'מחקר וניתוח, בקרה, אנליסט זוטר, ייעוץ'},
      {role: 'לוגיסטיקה / אפסנאות', civilian: 'ניהול מלאי, תכנון אספקה, דיוק ברישום, עבודה מול ספקים', jobs: 'שרשרת אספקה, מחסנים, רכש, תפעול'},
      {role: 'מדריך/ה', civilian: 'הדרכה והעברת ידע, הכנת מערכים, מתן משוב, עמידה מול קהל', jobs: 'הדרכה, חינוך, הדרכת עובדים, מכירות'}
    ],
    cvExamples: [
      {role: 'לוחם/ת', summary: 'בוגר/ת שירות קרבי עם ניסיון בעבודת צוות בתנאי לחץ ושינוי. אחראי/ת, עקבי/ת ומסוגל/ת ללמוד מהר.', bullets: ['ביצעתי משימות מורכבות בצוות תחת לחץ זמן ותנאים משתנים.', 'אחראי/ת לתקינות ציוד אישי וצוותי ולעמידה בנהלי בטיחות.', 'הדרכתי חיילים חדשים בשגרה ובתרגילים.']},
      {role: 'מפקד/ת צוות', summary: 'מוביל/ה צוות עם ניסיון בתכנון, חלוקת משימות, חניכה ומשוב, ואחריות על תוצאות.', bullets: ['הובלתי צוות של [מספר] אנשים ותיאמתי חלוקת משימות ולוחות זמנים.', 'חנכתי ופיתחתי את חברי הצוות באמצעות משוב שוטף ותחקירים.', 'תכננתי וביצעתי פעילויות מורכבות מול כמה גורמים במקביל.']},
      {role: 'טכנאי/ת', summary: 'טכנאי/ת עם ניסיון באבחון ותיקון תקלות, תחזוקה מונעת ותיעוד מסודר.', bullets: ['אבחנתי ותיקנתי תקלות במערכות ובציוד לפי נהלים.', 'ביצעתי תחזוקה מונעת ותיעדתי עבודות באופן מדויק.', 'עבדתי מול משתמשים כדי להבין את התקלה ולפתור אותה מהר.']},
      {role: 'תומך/ת לחימה / מנהלה', summary: 'בעל/ת ניסיון בתיאום, ריבוי משימות ושירות, עם אמינות ויכולת עבודה מול גורמים רבים.', bullets: ['תיאמתי בין כמה גורמים כדי לעמוד בלוחות זמנים.', 'ניהלתי רישום ומידע באופן מדויק ושמרתי על רציפות בעבודה.', 'נתתי מענה ושירות לאנשים בצורה סבלנית ומקצועית.']}
    ],
    cvNote: 'אלה דוגמאות לכיוון בלבד. כתבו רק מה שבאמת עשיתם, החליפו את [הסוגריים] בפרטים שלכם, ואל תכללו מידע מסווג, שמות או מקומות.',
    interview: {
      intro: 'בראיון לא צריך לספר הכול — צריך לתרגם. המראיין רוצה להבין מה תביא/י לעבודה.',
      tips: [
        'לתרגם מונחים צבאיים לשפה אזרחית ("חפ"ק" → "צוות פיקוד ושליטה", "שמ"פ" → "שירות מילואים").',
        'לספר סיפור קצר במבנה: מצב → האחריות שלי → מה עשיתי → מה יצא → מה למדתי.',
        'להדגיש התנהגויות שאפשר להעביר: אחריות, עבודה בצוות, למידה מהירה, התמודדות עם לחץ.',
        'לא לשתף פרטים מבצעיים או מסווגים. מותר ורצוי לומר "את הפרטים אני לא יכול לשתף, אבל..."',
        'לא חייבים לדבר על חוויות קשות. אם שואלים — אפשר לענות בקצרה ולחזור למה שרלוונטי לתפקיד.',
        'להכין 2–3 סיפורים מראש ולתרגל אותם בקול (אפשר עם המלווה).'
      ],
      examples: [
        {q: 'ספר/י על עצמך', a: 'סיימתי שירות כ[תפקיד], שבו הייתי אחראי/ת על [אחריות]. למדתי לעבוד בצוות תחת לחץ ולקחת אחריות. עכשיו אני מחפש/ת [סוג עבודה] כי [סיבה].'},
        {q: 'ספר/י על מצב קשה שהתמודדת איתו', a: 'בתקופה מסוימת [מצב כללי]. האחריות שלי הייתה [חלק שלך]. עשיתי [פעולה], והתוצאה הייתה [תוצאה]. מאז אני [מה למדת].'}
      ]
    },
    family: {
      intro: 'החזרה הביתה היא שינוי גם בשבילך וגם בשביל הקרובים אליך. הרבה מרגישים שהם "לא באותו מקום" כמו המשפחה או בן/בת הזוג.',
      points: [
        'זה בסדר להזדקק לזמן ולמרחב לפני שחוזרים לשגרה המשפחתית.',
        'אפשר להגיד לקרובים מה עוזר ומה פחות ("אני צריך קצת זמן לבד אחרי יום ארוך").',
        'לא חייבים לספר הכול על השירות. אפשר לבחור מה לשתף ומתי.',
        'זוגיות אחרי שחרור משתנה — הרבה זוגות צריכים להתרגל מחדש לזמן משותף ולהחלטות משותפות.',
        'אם הוויכוחים או הריחוק נמשכים, שיחה עם איש/אשת מקצוע יכולה לעזור לשניכם.',
        'גם הורים ואחים עוברים שינוי. לפעמים שיחה פתוחה אחת משנה הרבה.'
      ]
    },
    reservists: [
      'תחושת "תקיעות" בין סבבי מילואים נפוצה מאוד — קשה לתכנן לימודים או עבודה כשלא יודעים מתי תקראו.',
      'כדאי לבדוק בכל פעם את ההטבות המעודכנות למשרתי מילואים — הן משתנות ולעיתים מתארכות.',
      'אפשר לבנות תוכנית גמישה: צעד קטן שאפשר לעשות גם בין סבבים (קורס מקוון, שיחת ייעוץ, עדכון קורות חיים).',
      'אם החזרה מהמילואים קשה רגשית — זה מוכר ונורמלי, ויש למי לפנות.'
    ],
    timeSinceDischarge: {
      week: 'השתחררת ממש עכשיו. אין צורך להחליט הכול השבוע — מספיק לבדוק שהמענק בדרך ולנוח קצת.',
      months1to3: 'עברו כמה שבועות. זה זמן טוב לבדוק פיקדון, נקודות זיכוי ופטור ביטוח לאומי, ולחשוב על כיוון ראשון.',
      months3to12: 'עברו כמה חודשים. אם עדיין אין כיוון — זה נורמלי. שיחת ייעוץ במרכז צעירים או צעד קטן אחד יכולים להזיז דברים.',
      overYear: 'עברה יותר משנה. חלק מההטבות מוגבלות בזמן (למשל נסיעות חינם ועבודה מועדפת) — כדאי לבדוק מה עוד בתוקף.'
    },
    officialLinksInfo: [
      {key: 'agaf_keren', title: 'האגף והקרן לחיילים משוחררים', why: 'האזור האישי: מענק שחרור, פיקדון, ממדים ללימודים, עבודה מועדפת.'},
      {key: 'bituach_leumi', title: 'ביטוח לאומי', why: 'פטור זמני מתשלום, דמי אבטלה, עבודה מועדפת/נדרשת.'},
      {key: 'taxes', title: 'רשות המסים', why: 'נקודות זיכוי לחיילים משוחררים ותיאום מס (טופס 101).'}
    ],
    humanHelp: [
      {name: 'ער"ן — עזרה ראשונה נפשית', contact: '1201', tel: '1201', note: 'קו טלפוני 24/7, אנונימי. אפשר גם בצ\'אט באתר ער"ן.'},
      {name: 'מצב חירום', contact: 'מד"א 101 · משטרה 100', tel: '101', note: 'אם יש סכנה מיידית לך או למישהו אחר.'},
      {name: 'תוכנית עמית', contact: 'אפליקציה', note: 'טיפולים וסדנאות wellness לחיילים משוחררים.'},
      {name: 'אגף השיקום — משרד הביטחון', contact: 'משרד הביטחון', note: 'טיפול נפשי ותמיכה למי שנפגע בשירות.'},
      {name: 'מומנטום', contact: 'סדנאות וליווי', note: 'ליווי במעבר לאזרחות, סדנאות וקהילה.'},
      {name: 'מרכזי צעירים', contact: 'לפי אזור', note: 'ייעוץ והכוונה חינם ללימודים, עבודה וזכויות.'}
    ]
  };

  /* ---------- Rights cards built from the knowledge base ---------- */
  function rightsCards() {
    if (!KB) return [];
    const r = KB.rights_and_benefits || {}, s = KB.studies || {}, cards = [];
    const add = (id, cat, title, lines, extra) => cards.push({id, cat, title, lines: lines.filter(Boolean), ...(extra || {})});
    if (r.discharge_grant) {
      const g = r.discharge_grant;
      add('discharge_grant', 'money', g.name_he, [g.description, 'זכאות: ' + g.eligibility, 'מתי: ' + g.timing, g.notes], {
        rates: Object.entries(g.amounts_per_month_2026_oct || {}).map(([k, v]) => ({key: k, label: SERVICE_LABEL[k] || k, value: v})),
        examples: Object.values(g.examples || {}), link: 'agaf_keren'});
    }
    if (r.personal_deposit) { const d = r.personal_deposit; add('personal_deposit', 'money', d.name_he, [d.description, 'מתי: ' + d.timing, 'אחרי 5 שנים: ' + d.after_5_years, 'איך מממשים: ' + d.how_to_claim], {list: d.approved_uses, listTitle: 'שימושים מאושרים', link: 'agaf_keren'}); }
    if (r.tax_credit_points) { const tp = r.tax_credit_points; add('tax_credit_points', 'money', tp.name_he, ['משך: ' + tp.duration_months + ' חודשים', 'גברים מגיל 23 / נשים מגיל 22 (או שירות מלא): ' + tp.points.men_23plus_or_women_22plus + ' נקודות', 'שירות של 12–23 חודשים: ' + tp.points['12_to_23_months'] + ' נקודה', 'חיסכון משוער (2 נקודות): ' + tp.estimated_monthly_saving_2_points + ' לחודש', 'איך: ' + tp.how_to_claim], {link: 'taxes'}); }
    if (r.bituach_leumi_exemption) { const b = r.bituach_leumi_exemption; add('bituach_leumi_exemption', 'money', b.name_he, ['משך: ' + b.duration, 'תנאי: ' + b.condition], {link: 'bituach_leumi'}); }
    if (r.preferred_work_grant) { const p = r.preferred_work_grant; add('preferred_work_grant', 'work', p.name_he, ['סכום: ' + p.amount_2026, 'זכאות: ' + p.eligibility, 'מועד אחרון: ' + p.deadline], {list: p.sectors, listTitle: 'ענפים לדוגמה', link: 'agaf_keren'}); }
    if (r.public_transport_free) add('public_transport_free', 'daily_life', r.public_transport_free.name_he, ['משך: ' + r.public_transport_free.duration]);
    if (r.arnona) add('arnona', 'housing', r.arnona.name_he, [r.arnona.notes]);
    if (r.unemployment) add('unemployment', 'money', r.unemployment.name_he, [r.unemployment.notes], {link: 'bituach_leumi'});
    if (s.mimadim_lelimudim) { const m = s.mimadim_lelimudim; add('mimadim_lelimudim', 'studies', m.name_he, [m.description, 'משך: ' + m.duration, 'מועד: ' + m.deadline, m.notes], {list: m.eligibility, listTitle: 'מי זכאי', link: 'agaf_keren'}); }
    for (const key of ['periphery_scholarships', 'mechina_bagrut', 'practical_engineering', 'psychometric'])
      if (s[key]) add(key, 'studies', s[key].name_he, [s[key].description || s[key].notes]);
    return cards;
  }

  /* ---------- Simple Hebrew/English search over cards and FAQ ---------- */
  function norm(t) { return String(t || '').toLowerCase().replace(/["'׳״]/g, '').replace(/\s+/g, ' ').trim(); }
  function search(query) {
    const q = norm(query);
    if (!q) return {cards: rightsCards(), faq: (KB && KB.faq) || []};
    const words = q.split(' ').filter(w => w.length > 1);
    const hit = text => { const t = norm(text); return words.every(w => t.includes(w)); };
    return {
      cards: rightsCards().filter(c => hit([c.title, ...c.lines, ...(c.list || [])].join(' '))),
      faq: ((KB && KB.faq) || []).filter(f => hit(f.question + ' ' + f.answer))
    };
  }

  /* ---------- Context for the AI: only the sections relevant to the message ---------- */
  const TOPIC_PATTERNS = [
    ['money', /מענק|כסף|פיקדון|פקדון|זיכוי|מס|ביטוח לאומי|אבטלה|ארנונה|grant|deposit|money|tax|unemploy/i],
    ['studies', /לימוד|תואר|ממדים|מכינה|בגרות|פסיכומטרי|מלגה|הנדסאי|study|studies|degree|scholarship|mechina|psychometric/i],
    ['work', /עבודה|קורות חיים|ראיון|מועדפת|קריירה|משרה|job|work|cv|resume|interview|career/i],
    ['travel', /טיול|טיסה|נסיע|חו"ל|ביטוח נסיעות|travel|trip|abroad/i],
    ['emotional', /מרגיש|ריק|בלבול|לחץ|חרדה|בדיד|עצוב|קשה לי|feel|lonely|anxious|empty|stuck|sad/i],
    ['housing', /דירה|שכירות|דיור|ארנונה|apartment|rent|housing/i],
    ['special', /בודד|מילואים|שירות לאומי|עולה|lone soldier|reserv|national service|oleh|olim/i]
  ];
  function promptContext(message, opts) {
    if (!KB) return '';
    const o = opts || {}, text = String(message || '') + ' ' + (o.topic || '');
    const topics = new Set(TOPIC_PATTERNS.filter(([, re]) => re.test(text)).map(([k]) => k));
    if (o.topic === 'rights' || o.topic === 'money') topics.add('money');
    if (o.topic === 'study') topics.add('studies');
    if (['cv', 'applications', 'career'].includes(o.topic)) topics.add('work');
    if (o.topic === 'travel') topics.add('travel');
    if (o.topic === 'support' || o.topic === 'family') topics.add('emotional');
    if (!topics.size) return '';
    const parts = [];
    if (topics.has('money')) parts.push({rights_and_benefits: KB.rights_and_benefits});
    if (topics.has('studies')) parts.push({studies: KB.studies});
    if (topics.has('work')) parts.push({work_and_career: KB.work_and_career, preferred_work_grant: KB.rights_and_benefits && KB.rights_and_benefits.preferred_work_grant, skills_translation_examples: KB.skills_translation_examples});
    if (topics.has('travel')) parts.push({travel: KB.travel});
    if (topics.has('emotional')) parts.push({emotional_support: KB.emotional_support});
    if (topics.has('housing')) parts.push({housing: KB.housing});
    if (topics.has('special')) parts.push({special_groups: KB.special_groups});
    parts.push({practical_guides: KB.practical_guides, official_links: KB.official_links});
    let body = JSON.stringify(parts);
    if (body.length > (o.budget || 3800)) body = body.slice(0, o.budget || 3800);
    return 'MOMENTUM KNOWLEDGE BASE (version ' + KB.metadata.version + ', updated ' + KB.metadata.last_updated + '). ' +
      'Use it for facts about rights, benefits and studies. Amounts and conditions are approximate: whenever you mention an amount, date or eligibility, ' +
      'add that it must be verified on the official site (' + (KB.official_links && KB.official_links.agaf_keren) + ' and the relevant authority). ' +
      'Never state that this person is eligible; explain the conditions and let them check. If the data does not cover the question, say so.\n' + body;
  }

  root.MomentumKB = {
    data: KB, GUIDES, DISCLAIMER_HE, DISCLAIMER_EN, SERVICE_RATE_KEY, SERVICE_LABEL,
    rightsCards, search, promptContext, fmtMoney,
    officialLink: key => (KB && KB.official_links && KB.official_links[key]) || ''
  };
})(typeof window === 'undefined' ? globalThis : window);
