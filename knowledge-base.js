/* Momentum knowledge base helpers.
 * Data: knowledge-base-full.json (via the generated knowledge-base-data.js).
 * Guides below are general guidance written for the Companion. They are NOT official
 * sources and never state amounts. Amounts come only from the knowledge base file and
 * are always shown with the "verify on the official site" disclaimer.
 * No network calls, no personal data. */
(function (root) {
  'use strict';
  const KB_HE = root.MOMENTUM_KB_DATA || null, KB_EN = root.MOMENTUM_KB_DATA_EN || null;
  // Current app language: the Companion's S.lang, else the page language.
  function lang() {
    try { if (typeof S !== 'undefined' && S && S.lang) return S.lang; } catch (_) {}
    try { return String(root.document && root.document.documentElement.lang || 'he').slice(0, 2); } catch (_) { return 'he'; }
  }
  const isEn = () => lang() === 'en' && !!KB_EN;
  const D = () => isEn() ? KB_EN : KB_HE;
  const L = (he, en) => isEn() ? en : he;
  const DISCLAIMER_HE = 'הסכומים והתנאים משתנים — יש לאמת תמיד באתר הרשמי לפני שמחליטים.';
  const DISCLAIMER_EN = 'Amounts and conditions change. Always verify on the official site before deciding.';

  const fmtMoney = n => typeof n === 'number' ? n.toLocaleString('he-IL', {maximumFractionDigits: 2}) + ' ₪' : String(n || '');
  const SERVICE_RATE_KEY = {combat: 'combat', support: 'combat_support', other: 'other_national_service', national: 'other_national_service', civ_mid: 'civilian_intermediate', civ_split: 'civilian_split'};
  const SERVICE_LABEL_HE = {combat: 'לוחם/ת', support: 'תומך/ת לחימה', other: 'שירות אחר', national: 'שירות לאומי', civ_mid: 'מסלול אזרחי ביניים', civ_split: 'מסלול אזרחי מפוצל', combat_support: 'תומך/ת לחימה', other_national_service: 'אחר / שירות לאומי', civilian_intermediate: 'שירות אזרחי (ביניים)', civilian_split: 'שירות אזרחי (מפוצל)'};

  /* ---------- General guides (no amounts, no eligibility claims) ---------- */
  const GUIDES_HE = {
    savingsTips: [
      'לפני שמוציאים את המענק — לכתוב רשימה של 3 מטרות (למשל: טיול, לימודים, כרית ביטחון).',
      'כדאי להשאיר כרית ביטחון לכמה חודשי מחיה לפני הוצאות גדולות.',
      'חשבון נפרד לחיסכון עוזר לא לגעת בכסף בלי לשים לב.',
      'לבדוק את הפיקדון לפני שמשלמים מכיס על לימודים, קורס או לימודי נהיגה — ייתכן שאפשר לממן משם.',
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
      {key: 'taxes', title: 'רשות המסים', why: 'נקודות זיכוי לחיילים משוחררים ותיאום מס (טופס 101).'},
      {key: 'transport', title: 'נסיעות חינם בתחבורה ציבורית', why: 'איך מעדכנים פרופיל "משוחרר" ברב-קו.'},
      {key: 'preferred_work', title: 'עבודה מועדפת — ביטוח לאומי', why: 'תנאים, הגשת בקשה ורשימת העבודות המוכרות.'},
      {key: 'mimadim', title: 'ממדים ללימודים', why: 'תנאי הזכאות והרשמה למימון שכר הלימוד.'}
    ],
    humanHelp: [
      {name: 'ער"ן — עזרה ראשונה נפשית', contact: '1201', tel: '1201', note: 'קו טלפוני 24/7, אנונימי. אפשר גם בצ\'אט באתר ער"ן.'},
      {name: 'נט"ל — קו סיוע לטראומה', contact: '1-800-363-363', tel: '1800363363', note: 'קו סיוע חינמי לנפגעי טראומה על רקע לאומי.'},
      {name: '"נפש אחת" — קו תמיכה ללוחמים ומשוחררים', contact: '*8944', tel: '*8944', note: '24/7, של משרד הביטחון בשיתוף נט"ל.'},
      {name: 'מצב חירום', contact: 'מד"א 101 · משטרה 100', tel: '101', note: 'אם יש סכנה מיידית לך או למישהו אחר.'},
      {name: 'תוכנית עמית', contact: 'אפליקציה', note: 'טיפולים וסדנאות wellness לחיילים משוחררים.'},
      {name: 'אגף השיקום — משרד הביטחון', contact: 'משרד הביטחון', note: 'טיפול נפשי ותמיכה למי שנפגע בשירות.'},
      {name: 'מומנטום', contact: 'סדנאות וליווי', note: 'ליווי במעבר לאזרחות, סדנאות וקהילה.'},
      {name: 'מרכזי צעירים', contact: 'לפי אזור', note: 'ייעוץ והכוונה חינם ללימודים, עבודה וזכויות.'}
    ]
  };

  const SERVICE_LABEL_EN = {combat: 'Combat', support: 'Combat support', other: 'Other service', national: 'National service', civ_mid: 'Civilian track (intermediate)', civ_split: 'Civilian track (split)', combat_support: 'Combat support', other_national_service: 'Other / national service', civilian_intermediate: 'Civilian service (intermediate)', civilian_split: 'Civilian service (split)'};
  const GUIDES_EN = {
    savingsTips: [
      'Before spending the grant, write down 3 goals (for example: a trip, studies, a safety cushion).',
      'Keep a safety cushion for a few months of living costs before big expenses.',
      'A separate savings account helps you not touch the money without noticing.',
      'Check the deposit before paying out of pocket for studies, a course or driving lessons — it may be possible to fund it from there.',
      'A simple monthly budget: income, fixed costs, variable costs. One page is enough.',
      'Do not commit to a loan or a big deal in the first weeks after discharge — you can wait and think.'
    ],
    roleTranslations: [
      {role: 'Combat soldier', civilian: 'Working under pressure, fast decision-making, responsibility, teamwork, coping with hard conditions', jobs: 'Security and safety, operations and logistics, emergency services, training, field work'},
      {role: 'Team commander', civilian: 'Managing people, leadership, planning and control, mentoring and feedback, ownership of results', jobs: 'Shift manager, team lead, operations, training, junior project management'},
      {role: 'Technician', civilian: 'Troubleshooting, preventive maintenance, precision, working by procedures, documentation', jobs: 'Technical support, maintenance, practical engineering, lab work, IT'},
      {role: 'Driver', civilian: 'Responsibility and safety, meeting schedules, route planning, service', jobs: 'Distribution and logistics, transport, delivery, fleet operations'},
      {role: 'Combat support', civilian: 'Coordinating between parties, working in a dynamic environment, reliability, multitasking', jobs: 'Operations, purchasing and logistics, project coordination, customer service'},
      {role: 'NCO (HR, welfare, education)', civilian: 'Supporting people, managing information, listening, solving personal problems', jobs: 'Human resources, recruitment, welfare, education, service'},
      {role: 'Intelligence / analysis', civilian: 'Analysing information from many sources, recognising patterns, concise writing and briefing', jobs: 'Research and analysis, auditing, junior analyst, consulting'},
      {role: 'Logistics / quartermaster', civilian: 'Inventory management, supply planning, accurate records, working with suppliers', jobs: 'Supply chain, warehouses, purchasing, operations'},
      {role: 'Instructor', civilian: 'Training and knowledge transfer, preparing lesson plans, giving feedback, presenting to groups', jobs: 'Training, education, employee onboarding, sales'}
    ],
    cvExamples: [
      {role: 'Combat soldier', summary: 'Combat service graduate with experience working in teams under pressure and change. Responsible, consistent and a fast learner.', bullets: ['Carried out complex team tasks under time pressure and changing conditions.', 'Responsible for personal and team equipment and for following safety procedures.', 'Trained new soldiers in routine work and exercises.']},
      {role: 'Team commander', summary: 'Team leader experienced in planning, task allocation, mentoring and feedback, with ownership of results.', bullets: ['Led a team of [number] people and coordinated tasks and schedules.', 'Mentored and developed team members through ongoing feedback and debriefs.', 'Planned and carried out complex activities with several parties at once.']},
      {role: 'Technician', summary: 'Technician experienced in diagnosing and fixing faults, preventive maintenance and orderly documentation.', bullets: ['Diagnosed and repaired faults in systems and equipment according to procedures.', 'Performed preventive maintenance and documented work accurately.', 'Worked with users to understand problems and solve them quickly.']},
      {role: 'Combat support / administration', summary: 'Experienced in coordination, multitasking and service, reliable and able to work with many parties.', bullets: ['Coordinated between several parties to meet deadlines.', 'Managed records and information accurately and kept work continuous.', 'Provided patient, professional service to people.']}
    ],
    cvNote: 'These are examples for direction only. Write only what you really did, replace the [brackets] with your details, and do not include classified information, names or places.',
    interview: {
      intro: 'In an interview you do not need to tell everything — you need to translate. The interviewer wants to understand what you will bring to the job.',
      tips: [
        'Translate military terms into civilian language (say "command and control team", not unit jargon).',
        'Tell a short story: situation → my responsibility → what I did → the result → what I learned.',
        'Highlight transferable behaviour: responsibility, teamwork, fast learning, handling pressure.',
        'Do not share operational or classified details. It is fine to say "I cannot share the details, but…"',
        'You do not have to talk about hard experiences. If asked, answer briefly and return to what is relevant to the job.',
        'Prepare 2–3 stories in advance and practise them out loud (you can practise with the Companion).'
      ],
      examples: [
        {q: 'Tell me about yourself', a: 'I finished my service as a [role], where I was responsible for [responsibility]. I learned to work in a team under pressure and to take ownership. Now I am looking for [type of work] because [reason].'},
        {q: 'Tell me about a difficult situation you handled', a: 'At one point [general situation]. My responsibility was [your part]. I did [action], and the result was [result]. Since then I [what you learned].'}
      ]
    },
    family: {
      intro: 'Coming home is a change for you and for the people close to you. Many feel they are "not in the same place" as their family or partner.',
      points: [
        'It is okay to need time and space before returning to family routine.',
        'You can tell the people close to you what helps and what does not ("I need some time alone after a long day").',
        'You do not have to tell everything about your service. You can choose what to share and when.',
        'Relationships change after discharge — many couples need to get used to shared time and shared decisions again.',
        'If arguments or distance continue, talking with a professional can help both of you.',
        'Parents and siblings go through a change too. Sometimes one open conversation changes a lot.'
      ]
    },
    reservists: [
      'Feeling "stuck" between reserve rotations is very common — it is hard to plan studies or work when you do not know when you will be called.',
      'Check the updated benefits for reservists each time — they change and are sometimes extended.',
      'You can build a flexible plan: a small step you can take between rotations (an online course, a counseling talk, updating your CV).',
      'If coming back from reserve duty is emotionally hard — that is familiar and normal, and there is someone to turn to.'
    ],
    timeSinceDischarge: {
      week: 'You have just been discharged. You do not need to decide everything this week — it is enough to check that the grant is on its way and rest a little.',
      months1to3: 'A few weeks have passed. This is a good time to check the deposit, tax credit points and the National Insurance exemption, and to think about a first direction.',
      months3to12: 'A few months have passed. If you still have no direction — that is normal. A counseling talk at a youth center or one small step can move things.',
      overYear: 'More than a year has passed. Some benefits are time-limited (for example free transport and preferred work) — check what is still valid.'
    },
    officialLinksInfo: [
      {key: 'agaf_keren', title: 'Discharged Soldiers Department and Fund', why: 'Personal area: discharge grant, deposit, Mimadim LeLimudim, preferred work.'},
      {key: 'bituach_leumi', title: 'National Insurance (Bituach Leumi)', why: 'Temporary payment exemption, unemployment benefit, preferred/required work.'},
      {key: 'taxes', title: 'Israel Tax Authority', why: 'Tax credit points for discharged soldiers and tax coordination (Form 101).'},
      {key: 'transport', title: 'Free public transport', why: 'How to set the "discharged soldier" profile on Rav-Kav.'},
      {key: 'preferred_work', title: 'Preferred work — National Insurance', why: 'Conditions, applying and the list of approved jobs.'},
      {key: 'mimadim', title: 'Mimadim LeLimudim', why: 'Eligibility and registration for tuition funding.'}
    ],
    humanHelp: [
      {name: 'ERAN — emotional first aid', contact: '1201', tel: '1201', note: '24/7 phone line, anonymous. There is also a chat on the ERAN website.'},
      {name: 'NATAL — trauma helpline', contact: '1-800-363-363', tel: '1800363363', note: 'Free helpline for trauma related to national events.'},
      {name: '"Nefesh Achat" — support line for veterans', contact: '*8944', tel: '*8944', note: '24/7, by the Defense Ministry with NATAL.'},
      {name: 'Emergency', contact: 'MDA 101 · Police 100', tel: '101', note: 'If you or someone else is in immediate danger.'},
      {name: 'Amit program', contact: 'App', note: 'Therapy and wellness workshops for discharged soldiers.'},
      {name: 'Rehabilitation Department — Ministry of Defense', contact: 'Ministry of Defense', note: 'Mental health treatment and support for those injured in service.'},
      {name: 'Momentum', contact: 'Workshops and guidance', note: 'Support in the transition to civilian life, workshops and community.'},
      {name: 'Youth centers', contact: 'By region', note: 'Free counseling and guidance for studies, work and rights.'}
    ]
  };

  /* ---------- Rights cards built from the knowledge base ---------- */
  function rightsCards() {
    if (!D()) return [];
    const r = D().rights_and_benefits || {}, s = D().studies || {}, cards = [];
    const add = (id, cat, title, lines, extra) => cards.push({id, cat, title, lines: lines.filter(Boolean), ...(extra || {})});
    if (r.discharge_grant) {
      const g = r.discharge_grant;
      add('discharge_grant', 'money', g.name_he, [g.description, L('זכאות: ','Eligibility: ') + g.eligibility, L('מתי: ','When: ') + g.timing, g.notes, g.appeal], {
        rates: Object.entries(g.amounts_per_month_2026_oct || {}).map(([k, v]) => ({key: k, label: (isEn() ? SERVICE_LABEL_EN : SERVICE_LABEL_HE)[k] || k, value: v})),
        examples: Object.values(g.examples || {}), link: 'agaf_keren'});
    }
    if (r.personal_deposit) { const d = r.personal_deposit; add('personal_deposit', 'money', d.name_he, [d.description, L('מתי: ','When: ') + d.timing, L('אחרי 5 שנים: ','After 5 years: ') + d.after_5_years, L('איך מממשים: ','How to use it: ') + d.how_to_claim, d.notes, d.appeal], {list: d.approved_uses, listTitle: L('שימושים מאושרים','Approved uses'), link: 'agaf_keren',
      rates: Object.entries(d.amounts_per_month_2026_oct || {}).map(([k, v]) => ({key: k, label: (isEn() ? SERVICE_LABEL_EN : SERVICE_LABEL_HE)[k] || k, value: v})), warning: d.scam_warning}); }
    if (r.tax_credit_points) { const tp = r.tax_credit_points; add('tax_credit_points', 'money', tp.name_he, [L('משך: ','Duration: ') + tp.duration_months + L(' חודשים מהשחרור',' months from discharge'), L('שירות של 23 חודשים ומעלה (גברים) / 22 ומעלה (נשים): ','Service of 23+ months (men) / 22+ (women): ') + tp.points.men_23plus_or_women_22plus + L(' נקודות',' points'), L('שירות של 12 חודשים ועד מתחת לסף הזה: ','Service of 12 months up to that threshold: ') + tp.points['12_to_23_months'] + L(' נקודה',' point'), tp.point_value_2026_monthly ? L('שווי נקודה ב-2026: כ-','Value of one point in 2026: about ') + tp.point_value_2026_monthly + L(' ₪ לחודש',' ₪ a month') : '', L('חיסכון משוער (2 נקודות): ','Estimated saving (2 points): ') + tp.estimated_monthly_saving_2_points + L(' לחודש',' a month'), L('איך: ','How: ') + tp.how_to_claim, tp.not_automatic, tp.refund], {link: 'taxes'}); }
    if (r.bituach_leumi_exemption) { const b = r.bituach_leumi_exemption; add('bituach_leumi_exemption', 'money', b.name_he, [L('משך: ','Duration: ') + b.duration, L('תנאי: ','Condition: ') + b.condition], {link: 'bituach_leumi'}); }
    if (r.preferred_work_grant) { const p = r.preferred_work_grant; add('preferred_work_grant', 'work', p.name_he, [p.description, L('סכום: ','Amount: ') + p.amount_2026, p.work_period ? L('תקופת עבודה: ','Work period: ') + p.work_period : '', L('זכאות: ','Eligibility: ') + p.eligibility, L('מועד אחרון: ','Deadline: ') + p.deadline], {list: p.sectors, listTitle: L('ענפים','Sectors'), extraLinks: p.extra_links || []}); }
    if (r.public_transport_free) { const t = r.public_transport_free; add('public_transport_free', 'daily_life', t.name_he, [L('משך: ','Duration: ') + t.duration, t.how ? L('איך: ','How: ') + t.how : '', t.important ? L('חשוב: ','Important: ') + t.important : '']); }
    if (r.arnona) add('arnona', 'housing', r.arnona.name_he, [r.arnona.notes]);
    if (r.unemployment) add('unemployment', 'money', r.unemployment.name_he, [r.unemployment.notes], {link: 'bituach_leumi'});
    if (s.mimadim_lelimudim) { const m = s.mimadim_lelimudim; add('mimadim_lelimudim', 'studies', m.name_he, [m.description, L('משך: ','Duration: ') + m.duration, L('מועד: ','Deadline: ') + m.deadline, m.notes], {list: m.eligibility, listTitle: L('מי זכאי','Who is eligible'), link: 'agaf_keren'}); }
    const lone = D().special_groups && D().special_groups.lone_soldiers;
    if (lone) add('lone_soldiers_extra', 'special', L('חיילים בודדים — הטבות נוספות', 'Lone soldiers — extra benefits'), [lone.official_note ? L('איפה: ', 'Where: ') + lone.official_note : ''], {list: lone.extra, listTitle: L('מה מגיע', 'What you may get'), url: lone.official_url});
    for (const key of ['periphery_scholarships', 'mechina_bagrut', 'practical_engineering', 'psychometric'])
      if (s[key]) add(key, 'studies', s[key].name_he, [s[key].description || s[key].notes]);
    const own = {discharge_grant: r.discharge_grant, personal_deposit: r.personal_deposit, tax_credit_points: r.tax_credit_points, bituach_leumi_exemption: r.bituach_leumi_exemption,
      preferred_work_grant: r.preferred_work_grant, public_transport_free: r.public_transport_free, unemployment: r.unemployment, arnona: r.arnona, mimadim_lelimudim: s.mimadim_lelimudim};
    cards.forEach(c => { const src = own[c.id]; if (src && src.official_url) c.url = src.official_url; });
    const meta = D().metadata || {};
    cards.forEach(c => { if (c.cat === 'money' || c.cat === 'work') c.source = {asOf: meta.amounts_as_of || meta.last_updated, by: meta.source || ''}; });
    return cards;
  }

  /* ---------- Estimate: rates × months of service (approximate, never a promise) ---------- */
  function estimate(service, months, gender) {
    if (!D()) return null;
    const r = D().rights_and_benefits, key = SERVICE_RATE_KEY[service];
    const g = r.discharge_grant, d = r.personal_deposit;
    const m = Number(months);
    const grantRates = g.amounts_per_month_2026_oct || {}, depRates = (d && d.amounts_per_month_2026_oct) || {};
    const grantRate = key && grantRates[key];
    const depositRate = key && depRates[key];
    const pointValue = r.tax_credit_points.point_value_2026_monthly || 0;
    const valid = Number.isFinite(m) && m > 0 && m <= 60;
    // Official rules (hachvana, Oct 2026): months count up to 32 (men) / 24 (women); combat soldiers' first 4
    // training months are paid at the combat-support rate, combat support's first 2 at the "other" rate.
    const cap = gender === 'f' ? 24 : 32;
    const counted = valid ? Math.min(m, cap) : 0;
    const train = (g.training_months || {})[key] || 0;
    const lower = key === 'combat' ? 'combat_support' : key === 'combat_support' ? 'other_national_service' : null;
    const calc = rates => {
      const top = rates[key]; if (!top) return null;
      const t = lower && rates[lower] ? Math.min(train, counted) : 0;
      return Math.round((counted - t) * top + t * (lower ? rates[lower] : 0));
    };
    // 23+ months (men) / 22+ (women) → 2 points; 12+ → 1 point.
    const two = gender === 'f' ? 22 : gender === 'm' ? 23 : null;
    const points = !valid ? null : two ? (m >= two ? [2, 2] : m >= 12 ? [1, 1] : [0, 0]) : (m >= 23 ? [2, 2] : m >= 22 ? [1, 2] : m >= 12 ? [1, 1] : [0, 0]);
    return {
      grantRate, depositRate, pointValue, countedMonths: counted, capped: valid && m > cap, trainingMonths: lower ? Math.min(train, counted) : 0,
      grant: valid && grantRate && m >= 12 ? calc(grantRates) : null,
      deposit: valid && depositRate && m >= 12 ? calc(depRates) : null,
      points, taxMonthly: points ? [points[0] * pointValue, points[1] * pointValue] : null,
      asOf: (D().metadata && (D().metadata.amounts_as_of || D().metadata.last_updated)) || '', source: (D().metadata && D().metadata.source) || ''
    };
  }

  /* ---------- Simple Hebrew/English search over cards and FAQ ---------- */
  function norm(t) { return String(t || '').toLowerCase().replace(/["'׳״]/g, '').replace(/\s+/g, ' ').trim(); }
  function search(query) {
    const q = norm(query);
    if (!q) return {cards: rightsCards(), faq: (D() && D().faq) || []};
    const words = q.split(' ').filter(w => w.length > 1);
    const hit = text => { const t = norm(text); return words.every(w => t.includes(w)); };
    return {
      cards: rightsCards().filter(c => hit([c.title, ...c.lines, ...(c.list || [])].join(' '))),
      faq: ((D() && D().faq) || []).filter(f => hit(f.question + ' ' + f.answer))
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
    if (!D()) return '';
    const o = opts || {}, text = String(message || '') + ' ' + (o.topic || '');
    const topics = new Set(TOPIC_PATTERNS.filter(([, re]) => re.test(text)).map(([k]) => k));
    if (o.topic === 'rights' || o.topic === 'money') topics.add('money');
    if (o.topic === 'study') topics.add('studies');
    if (['cv', 'applications', 'career'].includes(o.topic)) topics.add('work');
    if (o.topic === 'travel') topics.add('travel');
    if (o.topic === 'support' || o.topic === 'family') topics.add('emotional');
    if (!topics.size) return '';
    const parts = [];
    if (topics.has('money')) parts.push({rights_and_benefits: D().rights_and_benefits});
    if (topics.has('studies')) parts.push({studies: D().studies});
    if (topics.has('work')) parts.push({work_and_career: D().work_and_career, preferred_work_grant: D().rights_and_benefits && D().rights_and_benefits.preferred_work_grant, skills_translation_examples: D().skills_translation_examples});
    if (topics.has('travel')) parts.push({travel: D().travel});
    if (topics.has('emotional')) parts.push({emotional_support: D().emotional_support});
    if (topics.has('housing')) parts.push({housing: D().housing});
    if (topics.has('special')) parts.push({special_groups: D().special_groups});
    parts.push({practical_guides: D().practical_guides, official_links: D().official_links});
    let body = JSON.stringify(parts);
    if (body.length > (o.budget || 3800)) body = body.slice(0, o.budget || 3800);
    return 'MOMENTUM KNOWLEDGE BASE (version ' + D().metadata.version + ', updated ' + D().metadata.last_updated + '). ' +
      'Use it for facts about rights, benefits and studies. Amounts and conditions are approximate: whenever you mention an amount, date or eligibility, ' +
      'add that it must be verified on the official site (' + (D().official_links && D().official_links.agaf_keren) + ' and the relevant authority). ' +
      'Never state that this person is eligible; explain the conditions and let them check. If the data does not cover the question, say so.\n' + body;
  }

  root.MomentumKB = {
    get data() { return D(); }, get GUIDES() { return isEn() ? GUIDES_EN : GUIDES_HE; }, get SERVICE_LABEL() { return isEn() ? SERVICE_LABEL_EN : SERVICE_LABEL_HE; },
    DISCLAIMER_HE, DISCLAIMER_EN, SERVICE_RATE_KEY, lang,
    rightsCards, search, promptContext, fmtMoney, estimate,
    officialLink: key => (D() && D().official_links && D().official_links[key]) || ''
  };
})(typeof window === 'undefined' ? globalThis : window);
