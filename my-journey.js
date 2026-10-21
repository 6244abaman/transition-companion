/* My Journey — bilingual local-first dashboard. No API calls. */
(function () {
  "use strict";
  const Store = window.MomentumJourney;
  const Backup = window.MomentumJourneyBackup;
  const $ = id => document.getElementById(id);
  const e = (tag, cls, value) => {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    if (value !== undefined && value !== null) x.textContent = String(value);
    return x;
  };
  const initialLang = new URLSearchParams(location.search).get("lang");
  let lang = initialLang === "he" ? "he" : "en", activeTab = "overview", editType = "", editItem = null, pendingFile = null;
  const TEXT = {
    en: {
      back: "← Back to Companion", assess: "Skill assessment", language: "עברית", title: "My Journey",
      subtitle: "Thank you for your service. Keep your goals, strengths and next steps together, and choose what happens to your information.",
      local: "Your information stays in this browser on this device. It is not encrypted here or automatically synced to another phone. You control export, deletion and AI sharing.",
      overview: "Overview", skills: "Skills", goals: "Goals", cvs: "CVs",
      education: "Education", actions: "Next actions", privacy: "Privacy & backup",
      nextHeading: "Your next steps", goalsHeading: "Goals in progress", allActions: "All actions", allGoals: "All goals",
      introHeading: "A profile that grows with you",
      introBody: "Start anywhere. Record a goal, turn it into practical steps, preserve skills from service, or create a CV draft. You can return and update everything whenever life changes.",
      quickGoal: "Add a goal", quickAction: "Add a next step", quickCV: "Work on my CV",
      skillsHeading: "My skills from service", skillsSubtitle: "Self-ratings are not professional certifications. Confirm an example before using it in a CV.",
      skillEditLink: "Update assessment", goalsTitle: "My goals",
      goalsSubtitle: "Choose what matters to you and change direction anytime.", addGoal: "Add goal",
      cvsTitle: "CV and application drafts",
      cvsSubtitle: "Your working drafts stay editable. Use only examples you have approved as accurate.",
      makeCV: "Draft from my skills", addCV: "Add CV",
      educationTitle: "Education and training plans",
      educationSubtitle: "Compare paths, plan applications and record the next step.",
      addEducation: "Add plan", actionsTitle: "Follow-up actions",
      actionsSubtitle: "Small steps build momentum. Keep what is useful and mark tasks done.",
      addAction: "Add action", privacyTitle: "Privacy, sharing and backup",
      privacyIntro: "Your profile is saved locally in this browser. Browser storage is not encrypted and could be visible to others using this browser profile. Chat messages to the Companion's AI service are a separate operation.",
      shareHeading: "Allow profile context in AI conversations",
      shareWithAIText: "Share selected Journey details with the Companion's external AI when I ask for help (off by default). Turn off at any time.",
      shareSkillsText: "Confirmed skills and my examples",
      shareGoalsText: "Goal titles and status",
      shareEducationText: "Education plan titles and status",
      shareActionsText: "Pending action titles and dates",
      shareCVsText: "CV summaries and bullet excerpts (more personal; off by default)",
      previewSummary: "Preview exactly what the profile would add to an AI request",
      backupHeading: "Take your profile with you",
      backupHelp: "Export a portable backup, then import it on another device. A password-protected backup is recommended; your password is never stored or recoverable.",
      exportEncrypted: "Download password-protected backup",
      exportPlain: "Download unencrypted JSON",
      importLabel: "Import a previously exported profile", importModeLabel: "Import method",
      importMerge: "Merge with my current profile", importReplace: "Replace current Journey profile",
      importButton: "Import selected file", legacyHeading: "Suggestions from earlier Companion conversations",
      legacyHelp: "Earlier conversation directions are suggestions, not confirmed goals. Review before choosing to bring them into your Journey.",
      deleteHeading: "Erase local information",
      deleteHelp: "You can delete only My Journey, or also delete your saved skills assessment and Companion conversations. Export first if you need a copy.",
      deleteAllText: "Also erase saved skills and both Companion conversation histories",
      deleteButton: "Delete local data",
      footer: "Momentum Transition Companion · Your journey belongs to you. This is a local-first prototype, not an emergency service or secure document vault.",
      activeGoals: "Active goals", pendingActions: "Open actions", confirmedSkills: "Confirmed skill examples", savedCVs: "Saved CVs",
      emptySkills: "No skill ratings yet. The assessment will help you find them.",
      emptyGoals: "No goals yet. Add one thing you want to move toward.",
      emptyActions: "No next steps yet. Add one small action that moves you forward.",
      emptyCVs: "No CV drafts yet. You can add one or start from skills you have confirmed.",
      emptyEducation: "No education plans yet. Add a course, training program or school to explore.",
      exampleConfirmed: "Example confirmed", examplePending: "Example not confirmed for CV use",
      selfRating: "Self-rating", edit: "Edit", erase: "Delete", done: "Mark done", undo: "Reopen",
      nextActionForGoal: "Add next action", makeStep: "Create next action", downloadCV: "Download draft",
      copyCV: "Copy draft", goal: "Goal", due: "Due", target: "Target", institution: "Institution",
      field: "Program / field", nextStep: "Next step", category: "Area", targetRole: "Target role",
      languageCV: "CV language", summary: "Profile summary", bullets: "Experience bullets (one per line)",
      notes: "Private notes (not sent as Journey context to AI)", status: "Status", titleField: "Title",
      create: "Add", update: "Edit", save: "Save", cancel: "Cancel",
      noExample: "Confirm at least one real example in your skill assessment first.",
      cvTitleNew: "CV — my skills", generatedSummary: "Working draft based on my confirmed service examples. Review all statements before use.",
      draftsSaved: "Draft created. Review and edit it before sharing.",
      saved: "Saved to this browser.", deleted: "Deleted from this browser.",
      deleteConfirm: "Delete this entry?", deletionConfirm: "Delete the selected local data? This cannot be undone.",
      unencryptedConfirm: "This JSON backup contains personal details and has no password. Download anyway?",
      passwordPrompt: "Enter a password (10+ characters). You must remember it to restore your backup:",
      passwordTitleExport: "Protect your Journey backup", passwordTitleImport: "Unlock your Journey backup",
      passwordInfoExport: "Choose a strong password (10+ characters). It will not be stored and cannot be recovered.",
      passwordInfoImport: "Enter the password used when this encrypted backup was created.",
      passwordLabel: "Backup password", passwordAgainLabel: "Repeat password", passwordSubmit: "Continue", passwordCancel: "Cancel",
      passwordRepeat: "Repeat your backup password:", passwordMismatch: "Passwords do not match.",
      missingBackup: "Choose a backup file first.", importConfirm: "Replace your current Journey entries with this backup? Current Journey entries not in the backup will be lost.",
      imported: "Profile restored in this browser. AI sharing remains off until you explicitly enable it.",
      error: "Something went wrong: ", noShared: "Sharing is off. No Journey profile context will be added to AI requests.",
      importedLegacy: "Added as a goal to explore. You can edit or delete it anytime.",
      importLegacy: "Add as a possible goal", noLegacy: "No earlier career or study suggestions found on this device.",
      shareChanged: "Your sharing preference was saved.",
      dateUnknown: "Not scheduled", readOnly: "Browser storage is unavailable. Changes may not persist.",
      skillsUsed: "Only skills with a personally confirmed example were used. This is a draft, not a credential.",
      draftLabel: "Draft — verify every statement",
      daysLate: "Due date passed", noData: "Nothing recorded yet.",
      general: "General", statusExploring: "Exploring", statusActive: "Active", statusPaused: "Paused",
      statusAchieved: "Achieved", statusTodo: "To do", statusDoing: "In progress", statusDone: "Done",
      statusPreparing: "Preparing", statusApplied: "Applied", statusEnrolled: "Enrolled",
      statusCompleted: "Completed", statusDraft: "Draft", statusReady: "Ready",
      catWork: "Work / career", catEducation: "Education", catBusiness: "Business",
      catLife: "Personal life", catOther: "Other",
      checkData: "Only the selected, minimized profile details are included in an AI request when you have enabled sharing. Private notes are excluded.",
      secureOnly: "Password-protected export needs HTTPS and a modern browser.",
      noAttachment: "The file could not be read."
    },
    he: {
      back: "חזרה לעוזר המעבר ←", assess: "הערכת מיומנויות", language: "English", title: "המסע שלי",
      subtitle: "תודה על השירות שלכם. כאן אפשר לשמור מטרות, חוזקות וצעדים להמשך — ואתם מחליטים מה יקרה למידע.",
      local: "המידע נשמר בדפדפן במכשיר הזה בלבד. הוא אינו מוצפן כאן ואינו מסתנכרן אוטומטית לטלפון אחר. אתם שולטים בייצוא, במחיקה ובשיתוף עם AI.",
      overview: "תמונת מצב", skills: "מיומנויות", goals: "מטרות", cvs: "קורות חיים",
      education: "לימודים", actions: "צעדים להמשך", privacy: "פרטיות וגיבוי",
      nextHeading: "הצעדים הבאים", goalsHeading: "מטרות בתהליך", allActions: "כל הפעולות", allGoals: "כל המטרות",
      introHeading: "פרופיל שצומח איתכם",
      introBody: "אפשר להתחיל מכל מקום: להגדיר מטרה, לתכנן צעדים, לשמור מיומנויות מהשירות או להכין קורות חיים. אפשר לחזור ולעדכן עם הזמן.",
      quickGoal: "הוספת מטרה", quickAction: "הוספת צעד", quickCV: "עבודה על קורות חיים",
      skillsHeading: "מיומנויות מהשירות", skillsSubtitle: "הדירוגים הם הערכה עצמית, לא הסמכה מקצועית. יש לאשר דוגמה לפני שימוש בקורות חיים.",
      skillEditLink: "עדכון ההערכה", goalsTitle: "המטרות שלי",
      goalsSubtitle: "בחרו מה חשוב לכם. אפשר גם לשנות כיוון.", addGoal: "הוספת מטרה",
      cvsTitle: "טיוטות קורות חיים ומועמדויות",
      cvsSubtitle: "כל הטיוטות ניתנות לעריכה. משתמשים רק בדוגמאות שאישרתם כנכונות.",
      makeCV: "יצירת טיוטה מהמיומנויות", addCV: "הוספת קורות חיים",
      educationTitle: "תוכניות לימודים והכשרה",
      educationSubtitle: "השוו מסלולים, תכננו הרשמה ושמרו את הצעד הבא.",
      addEducation: "הוספת תוכנית", actionsTitle: "צעדים לביצוע",
      actionsSubtitle: "צעדים קטנים יוצרים התקדמות. סמנו פעולות שהושלמו.",
      addAction: "הוספת פעולה", privacyTitle: "פרטיות, שיתוף וגיבוי",
      privacyIntro: "הפרופיל נשמר בדפדפן, ללא הצפנה. אנשים אחרים המשתמשים באותו פרופיל דפדפן עלולים לראות אותו. שליחת הודעות לשירות ה-AI היא פעולה נפרדת.",
      shareHeading: "אישור הקשר מהפרופיל בשיחות AI",
      shareWithAIText: "אני מאשר/ת לשלוח פרטים נבחרים מהמסע שלי לשירות AI כשאני מבקש/ת עזרה (כבוי כברירת מחדל). אפשר לבטל בכל עת.",
      shareSkillsText: "מיומנויות ודוגמאות שאישרתי", shareGoalsText: "שמות המטרות ומצבן",
      shareEducationText: "שמות תוכניות לימודים ומצבן", shareActionsText: "שמות פעולות פתוחות ותאריכים",
      shareCVsText: "תקצירים וסעיפים מתוך קורות חיים (מידע אישי יותר; כבוי כברירת מחדל)",
      previewSummary: "תצוגה של הפרטים שיתווספו לבקשת AI",
      backupHeading: "קחו את הפרופיל איתכם",
      backupHelp: "אפשר לייצא גיבוי ולייבא אותו במכשיר אחר. מומלץ גיבוי מוגן בסיסמה; לא ניתן לשחזר סיסמה שנשכחה.",
      exportEncrypted: "הורדת גיבוי מוגן בסיסמה", exportPlain: "הורדת JSON לא מוצפן",
      importLabel: "ייבוא פרופיל מגיבוי", importModeLabel: "אופן הייבוא",
      importMerge: "מיזוג עם הפרופיל הקיים", importReplace: "החלפת הפרופיל הקיים",
      importButton: "ייבוא הקובץ שנבחר",
      legacyHeading: "הצעות משיחות קודמות עם העוזר",
      legacyHelp: "כיוונים שעלו בשיחות קודמות הם הצעות, לא מטרות מאושרות. בדקו כל הצעה לפני הוספתה.",
      deleteHeading: "מחיקת מידע מקומי",
      deleteHelp: "אפשר למחוק רק את 'המסע שלי', או גם את ההערכה והשיחות השמורות בדפדפן. מומלץ לייצא תחילה.",
      deleteAllText: "למחוק גם את הערכת המיומנויות ואת היסטוריות השיחה בשתי השפות",
      deleteButton: "מחיקת המידע המקומי",
      footer: "מומנטום · עוזר המעבר — המסע שייך לכם. זוהי גרסת ניסיון מקומית, ולא שירות חירום או כספת מסמכים מאובטחת.",
      activeGoals: "מטרות פעילות", pendingActions: "פעולות פתוחות", confirmedSkills: "דוגמאות מיומנות מאושרות", savedCVs: "טיוטות קורות חיים",
      emptySkills: "עדיין אין דירוגי מיומנויות. אפשר להתחיל בהערכה.",
      emptyGoals: "עדיין אין מטרות. אפשר להגדיר דבר אחד שרוצים להתקדם לקראתו.",
      emptyActions: "עדיין אין צעדים. נסו להגדיר פעולה קטנה אחת.",
      emptyCVs: "עדיין אין טיוטות. אפשר להוסיף או להתחיל ממיומנויות שאישרתם.",
      emptyEducation: "עדיין אין תוכניות לימודים. הוסיפו קורס או מסלול שרוצים לבדוק.",
      exampleConfirmed: "הדוגמה אושרה", examplePending: "הדוגמה לא אושרה לשימוש בקורות חיים",
      selfRating: "דירוג עצמי", edit: "עריכה", erase: "מחיקה", done: "בוצע", undo: "פתיחה מחדש",
      nextActionForGoal: "הוספת צעד", makeStep: "יצירת צעד", downloadCV: "הורדת טיוטה",
      copyCV: "העתקת טיוטה", goal: "מטרה", due: "עד", target: "יעד", institution: "מוסד",
      field: "מסלול / תחום", nextStep: "הצעד הבא", category: "תחום", targetRole: "תפקיד מבוקש",
      languageCV: "שפת קורות החיים", summary: "תקציר אישי", bullets: "ניסיון ויכולות (סעיף בכל שורה)",
      notes: "הערות פרטיות (אינן נשלחות כהקשר מהמסע ל-AI)", status: "מצב", titleField: "כותרת",
      create: "הוספה", update: "עריכה", save: "שמירה", cancel: "ביטול",
      noExample: "יש לאשר לפחות דוגמה אחת מהניסיון האישי בהערכת המיומנויות.",
      cvTitleNew: "קורות חיים — מיומנויות", generatedSummary: "טיוטה על בסיס דוגמאות מהשירות שאישרתי. יש לבדוק את כל הניסוחים לפני שימוש.",
      draftsSaved: "נוצרה טיוטה. בדקו וערכו אותה לפני שיתוף.",
      saved: "נשמר בדפדפן הזה.", deleted: "נמחק מהדפדפן.",
      deleteConfirm: "למחוק את הרשומה?", deletionConfirm: "למחוק את המידע המקומי שנבחר? לא ניתן לבטל פעולה זו.",
      unencryptedConfirm: "קובץ הגיבוי כולל מידע אישי ללא הגנת סיסמה. להוריד בכל זאת?",
      passwordPrompt: "בחרו סיסמה לגיבוי (לפחות 10 תווים). תצטרכו אותה לשחזור:",
      passwordTitleExport: "הגנה על גיבוי המסע", passwordTitleImport: "פתיחת גיבוי המסע",
      passwordInfoExport: "בחרו סיסמה חזקה (לפחות 10 תווים). הסיסמה לא תישמר ולא ניתן לשחזר אותה.",
      passwordInfoImport: "הזינו את הסיסמה שנבחרה בזמן יצירת הגיבוי המוצפן.",
      passwordLabel: "סיסמת גיבוי", passwordAgainLabel: "הזינו את הסיסמה שוב", passwordSubmit: "המשך", passwordCancel: "ביטול",
      passwordRepeat: "הזינו שוב את סיסמת הגיבוי:", passwordMismatch: "הסיסמאות אינן תואמות.",
      missingBackup: "בחרו תחילה קובץ גיבוי.", importConfirm: "להחליף את פרטי המסע הקיימים בנתוני הגיבוי? נתונים שאינם בגיבוי יאבדו.",
      imported: "הפרופיל שוחזר בדפדפן. השיתוף עם AI נותר כבוי עד שתפעילו אותו.",
      error: "אירעה שגיאה: ", noShared: "השיתוף כבוי. שום מידע מהמסע לא יצורף לבקשות AI.",
      importedLegacy: "נוסף כיעד לבחינה. אפשר לערוך או למחוק בכל עת.",
      importLegacy: "הוספה כמטרה אפשרית", noLegacy: "לא נמצאו הצעות קודמות בדפדפן הזה.",
      shareChanged: "העדפת השיתוף נשמרה.",
      dateUnknown: "טרם נקבע", readOnly: "אחסון הדפדפן אינו זמין. ייתכן שהשינויים לא יישמרו.",
      skillsUsed: "נעשה שימוש רק במיומנויות שיש להן דוגמה שאישרתם. זו טיוטה ולא הסמכה.",
      draftLabel: "טיוטה — יש לבדוק כל ניסוח", daysLate: "מועד היעד עבר",
      noData: "טרם נשמר מידע.", general: "כללי",
      statusExploring: "לבדיקה", statusActive: "פעיל", statusPaused: "מושהה", statusAchieved: "הושג",
      statusTodo: "לביצוע", statusDoing: "בתהליך", statusDone: "הושלם",
      statusPreparing: "בהכנה", statusApplied: "הוגשה בקשה", statusEnrolled: "נרשמתי",
      statusCompleted: "הסתיים", statusDraft: "טיוטה", statusReady: "מוכן",
      catWork: "עבודה וקריירה", catEducation: "לימודים", catBusiness: "עסק",
      catLife: "חיים אישיים", catOther: "אחר",
      checkData: "פרטי פרופיל מצומצמים ייכללו בבקשת AI רק אם אישרתם שיתוף. הערות פרטיות לא נכללות.",
      secureOnly: "גיבוי מוגן בסיסמה דורש HTTPS ודפדפן עדכני.",
      noAttachment: "לא ניתן לקרוא את הקובץ."
    }
  };
  const T = () => TEXT[lang];
  const STATUS = {
    goals: ["exploring","active","paused","achieved"],
    actions: ["todo","doing","done"],
    education: ["exploring","preparing","applied","enrolled","completed","paused"],
    cvs: ["draft","ready"]
  };
  const STATUS_LABELS = {
    exploring: "statusExploring", active: "statusActive", paused: "statusPaused",
    achieved: "statusAchieved", todo: "statusTodo", doing: "statusDoing",
    done: "statusDone", preparing: "statusPreparing", applied: "statusApplied",
    enrolled: "statusEnrolled", completed: "statusCompleted", draft: "statusDraft", ready: "statusReady"
  };
  const CATEGORY = { work:"catWork", education:"catEducation", business:"catBusiness", life:"catLife", other:"catOther" };
  let profile = null;
  function notify(text, error) {
    const el = $("status");
    el.textContent = text;
    el.style.background = error ? "#fce7e7" : "#def1e9";
    el.style.borderColor = error ? "#e3afb0" : "#9fc7ad";
    el.setAttribute("role", "alert");
  }
  function tryAction(fn) {
    try { return fn(); } catch (err) { notify(T().error + (err && err.message ? err.message : String(err)), true); return null; }
  }
  function setText(id, key) { if ($(id)) $(id).textContent = T()[key]; }
  function updateLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.title = T().title + " · Momentum";
    [
      ["homeLink","back"],["skillsLink","assess"],["language","language"],
      ["pageTitle","title"],["pageSubtitle","subtitle"],["storageNotice","local"],
      ["nextHeading","nextHeading"],["goalsHeading","goalsHeading"],["introHeading","introHeading"],
      ["introBody","introBody"],["quickGoal","quickGoal"],["quickAction","quickAction"],["quickCV","quickCV"],
      ["skillsHeading","skillsHeading"],["skillsSubtitle","skillsSubtitle"],["skillEditLink","skillEditLink"],
      ["goalsTitle","goalsTitle"],["goalsSubtitle","goalsSubtitle"],["addGoal","addGoal"],
      ["cvsTitle","cvsTitle"],["cvsSubtitle","cvsSubtitle"],["makeCV","makeCV"],["addCV","addCV"],
      ["educationTitle","educationTitle"],["educationSubtitle","educationSubtitle"],["addEducation","addEducation"],
      ["actionsTitle","actionsTitle"],["actionsSubtitle","actionsSubtitle"],["addAction","addAction"],
      ["privacyTitle","privacyTitle"],["privacyIntro","privacyIntro"],["shareHeading","shareHeading"],
      ["shareWithAIText","shareWithAIText"],["shareSkillsText","shareSkillsText"],
      ["shareGoalsText","shareGoalsText"],["shareEducationText","shareEducationText"],
      ["shareActionsText","shareActionsText"],["shareCVsText","shareCVsText"],
      ["previewSummary","previewSummary"],["backupHeading","backupHeading"],["backupHelp","backupHelp"],
      ["exportEncrypted","exportEncrypted"],["exportPlain","exportPlain"],
      ["importLabel","importLabel"],["importModeLabel","importModeLabel"],["importButton","importButton"],
      ["legacyHeading","legacyHeading"],["legacyHelp","legacyHelp"],["deleteHeading","deleteHeading"],
      ["deleteHelp","deleteHelp"],["deleteAllText","deleteAllText"],["deleteButton","deleteButton"],
      ["saveRecord","save"],["cancelRecord","cancel"],["footerText","footer"]
    ].forEach(x => setText(x[0], x[1]));
    $("homeLink").href = "./" + (lang === "he" ? "indexH.html" : "index.html");
    $("skillsLink").href = "./skills-business.html?lang=" + lang;
    $("skillEditLink").href = "./skills-business.html?lang=" + lang;
    $("importMode").options[0].textContent = T().importMerge;
    $("importMode").options[1].textContent = T().importReplace;
    document.querySelectorAll("[data-tab]").forEach(b => {
      b.textContent = T()[b.dataset.tab];
      b.setAttribute("aria-selected", String(b.dataset.tab === activeTab));
    });
    document.querySelectorAll("[data-switch]").forEach(b => {
      if (b.dataset.switch === "actions" && b.id !== "quickAction") b.textContent = b.id === "quickCV" ? T().quickCV : T().allActions;
      if (b.dataset.switch === "goals") b.textContent = T().allGoals;
    });
  }
  function view(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-view]").forEach(x => x.hidden = x.dataset.view !== tab);
    document.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", String(x.dataset.tab === tab)));
    render();
    try { history.replaceState(null, "", "#"+tab); } catch (_) {}
  }
  function pill(label, done) {
    const x = e("span", "tag" + (done ? " done" : ""), label);
    return x;
  }
  function button(label, click, cls) {
    const b = e("button", cls || "small", label);
    b.type = "button"; b.addEventListener("click", click);
    return b;
  }
  function empty(container, message) {
    container.replaceChildren(e("div","empty",message));
  }
  function byDue(a,b) { return (a.dueDate || "9999").localeCompare(b.dueDate || "9999"); }
  function meta(container, ...parts) {
    const p = e("div","muted mini",parts.filter(Boolean).join(" · "));
    container.appendChild(p);
  }
  function renderStats() {
    const items = [
      [profile.goals.filter(x=>x.status==="active"||x.status==="exploring").length,T().activeGoals],
      [profile.actions.filter(x=>x.status!=="done").length,T().pendingActions],
      [profile.skills.filter(x=>x.confirmed && x.evidence).length+profile.lifeSkills.filter(x=>x.id!==63).length,T().confirmedSkills],
      [profile.cvs.length,T().savedCVs]
    ];
    const root=$("stats");root.replaceChildren();
    items.forEach(x=>{const card=e("div","stat");card.append(e("strong",null,x[0]),e("span",null,x[1]));root.appendChild(card)});
    const actions=$("nextSnapshot");actions.replaceChildren();
    const upcoming=profile.actions.filter(x=>x.status!=="done").sort(byDue).slice(0,5);
    if(!upcoming.length)empty(actions,T().emptyActions);
    upcoming.forEach(x=>{
      const block=e("div","record");
      block.append(e("b",null,x.title));
      meta(block,x.dueDate ? T().due+": "+x.dueDate : "");
      block.append(button(T().done,()=>quickStatus(x,"done"),"small"));
      actions.appendChild(block);
    });
    const goals=$("goalsSnapshot");goals.replaceChildren();
    const live=profile.goals.filter(x=>x.status!=="achieved").slice(0,5);
    if(!live.length)empty(goals,T().emptyGoals);
    live.forEach(x=>{
      const block=e("div","record");block.append(e("b",null,x.title));
      meta(block,T()[STATUS_LABELS[x.status]],x.targetDate?T().target+": "+x.targetDate:"");
      goals.appendChild(block);
    });
  }
  function renderSkills() {
    const root=$("skillsList");root.replaceChildren();
    if(!profile.skills.length&&!profile.lifeSkills.length)return empty(root,T().emptySkills);
    if(profile.lifeSkills.length){
      root.append(e("h3",null,lang==="he"?"מיומנויות חיים — מסגרת 63 המיומנויות":"Life skills — the 63-skill framework"));
      profile.lifeSkills.forEach(x=>{
        const card=e("div","record");card.append(e("h3",null,lang==="he"?(x.he||x.en):(x.en||x.he)),e("p",null,x.evidence));
        if(x.level)card.append(e("p","muted mini",(lang==="he"?"רמת ניסיון לפי הדוגמה (1–4): ":"Experience level from the example (1–4): ")+x.level));
        card.append(button(T().erase,()=>{if(confirm(T().deleteConfirm)){Store.removeLifeSkill(x.id);render();}},"small danger"));root.append(card);
      });
    }
    if(profile.skills.length)root.append(e("h3",null,lang==="he"?"36 מיומנויות לקריירה ולעסקים — דירוג עצמי 1–7":"36 career and business skills — self-rating 1–7"));
    profile.skills.slice().sort((a,b)=>b.rating-a.rating).forEach(x=>{
      const card=e("div","record");
      const name = lang === "he" ? (x.he || x.en) : (x.en || x.he);
      const row=e("div","heading");
      row.append(e("h3",null,name),pill(T().selfRating+": "+x.rating+"/7"));
      card.appendChild(row);
      const hasEvidence=!!x.confirmed && !!x.evidence;
      card.appendChild(pill(T()[hasEvidence?"exampleConfirmed":"examplePending"],hasEvidence));
      if(hasEvidence)card.appendChild(e("p",null,x.evidence));
      root.appendChild(card);
    });
  }
  function detail(card,title,value) {
    if(!value)return;
    const p=e("p","mini");
    p.append(e("strong",null,title+": "),document.createTextNode(String(value)));
    card.appendChild(p);
  }
  function actionsFor(record, type, container) {
    const row=e("div","actions");
    row.append(button(T().edit,()=>openEditor(type,record),"small"));
    if(type==="goals")row.append(button(T().nextActionForGoal,()=>openEditor("actions",{goalId:record.id}),"small"));
    if(type==="education"&&record.nextStep)row.append(button(T().makeStep,()=>{
      const x=Store.upsert("actions",{title:record.nextStep,goalId:record.goalId||"",notes:record.title,status:"todo"});
      if(x){notify(T().saved);view("actions")}
    },"small"));
    if(type==="actions")row.append(button(record.status==="done"?T().undo:T().done,
      ()=>quickStatus(record,record.status==="done"?"todo":"done"),"small"));
    if(type==="cvs"){
      row.append(button(T().downloadCV,()=>downloadCV(record),"small"));
      row.append(button(T().copyCV,()=>copyCV(record),"small"));
    }
    row.append(button(T().erase,()=>{
      if(!confirm(T().deleteConfirm))return;
      tryAction(()=>{Store.remove(type,record.id);notify(T().deleted);render()});
    },"small danger"));
    container.appendChild(row);
  }
  function renderRecords(type) {
    const root=$(type+"List");root.replaceChildren();
    let records=profile[type].slice();
    if(type==="actions")records.sort((a,b)=>(a.status==="done")-(b.status==="done")||byDue(a,b));
    else records.reverse();
    if(!records.length)return empty(root,T()["empty"+(type==="cvs"?"CVs":type==="education"?"Education":type==="goals"?"Goals":"Actions")]);
    records.forEach(x=>{
      const card=e("div","record");
      const row=e("div","heading");row.append(e("h3",null,x.title),
        pill(T()[STATUS_LABELS[x.status]],x.status==="done"||x.status==="achieved"||x.status==="completed"));
      card.appendChild(row);
      if(type==="goals"){
        meta(card,T()[CATEGORY[x.category]]||T().catOther,x.targetDate?T().target+": "+x.targetDate:"");
        detail(card,T().notes,x.notes);
      }
      if(type==="actions"){
        const goal=profile.goals.find(y=>y.id===x.goalId);
        meta(card,goal?T().goal+": "+goal.title:"",x.dueDate?T().due+": "+x.dueDate:"");
        detail(card,T().notes,x.notes);
      }
      if(type==="education"){
        const linkedGoal=profile.goals.find(g=>g.id===x.goalId);meta(card,linkedGoal?T().goal+": "+linkedGoal.title:"",x.institution?T().institution+": "+x.institution:"",x.targetDate?T().target+": "+x.targetDate:"");
        detail(card,T().field,x.field);
        detail(card,T().nextStep,x.nextStep);
        detail(card,T().notes,x.notes);
      }
      if(type==="cvs"){
        meta(card,x.targetRole?T().targetRole+": "+x.targetRole:"",x.language==="he"?"עברית":"English");
        detail(card,T().summary,x.summary);
        x.bullets.slice(0,10).forEach(b=>card.appendChild(e("p","mini","• "+b)));
        card.appendChild(pill(T().draftLabel));
        detail(card,T().notes,x.notes);
      }
      actionsFor(x,type,card);
      root.appendChild(card);
    });
  }
  function legacyDirections() {
    const byTitle=new Map();
    for(const key of ["gtc_v2_state","gtc_H_state"]){
      try{
        const raw=JSON.parse(localStorage.getItem(key)||"null");
        ((raw && raw.profile && raw.profile.directions)||[]).forEach(d=>{
          const title=String((d&&d.title)||"").trim().slice(0,160);
          if(title && !byTitle.has(title.toLowerCase()))byTitle.set(title.toLowerCase(),title);
        });
      }catch(_){}
    }
    return [...byTitle.values()].filter(title=>!profile.goals.some(g=>g.title.toLowerCase()===title.toLowerCase())).slice(0,15);
  }
  function renderPrivacy() {
    ["shareWithAI","shareSkills","shareGoals","shareEducation","shareActions","shareCVs"].forEach(id=>{
      const box=$(id);box.checked=!!profile.privacy[id];box.disabled=id!=="shareWithAI"&&!profile.privacy.shareWithAI;
    });
    $("aiPreview").textContent=Store.aiContext(profile,lang)||T().noShared;
    const root=$("legacyList");root.replaceChildren();
    const possible=legacyDirections();
    if(!possible.length)return empty(root,T().noLegacy);
    possible.forEach(title=>{
      const row=e("div","record");
      row.append(e("strong",null,title),e("span",null," "));
      row.append(button(T().importLegacy,()=>{
        tryAction(()=>{Store.upsert("goals",{title,status:"exploring",notes:""});notify(T().importedLegacy);render()});
      },"small"));
      root.appendChild(row);
    });
  }
  function render() {
    profile=tryAction(()=>Store.read())||Store.blank();
    renderStats();renderSkills();
    ["goals","actions","education","cvs"].forEach(renderRecords);
    renderPrivacy();
  }
  const fieldDefs = {
    goals: ["title","category","status","targetDate","notes"],
    actions: ["title","goalId","status","dueDate","notes"],
    education: ["title","goalId","field","institution","status","targetDate","nextStep","notes"],
    cvs: ["title","targetRole","language","status","summary","bullets","notes"]
  };
  function labelFor(name){return {
    title:"titleField",category:"category",status:"status",targetDate:"target",
    dueDate:"due",notes:"notes",goalId:"goal",field:"field",institution:"institution",
    nextStep:"nextStep",targetRole:"targetRole",language:"languageCV",
    summary:"summary",bullets:"bullets"
  }[name]||name;}
  function selectOptions(name,type) {
    if(name==="status")return STATUS[type].map(x=>[x,T()[STATUS_LABELS[x]]]);
    if(name==="category")return Object.keys(CATEGORY).map(x=>[x,T()[CATEGORY[x]]]);
    if(name==="language")return [["en","English"],["he","עברית"]];
    if(name==="goalId")return [["",T().general]].concat(profile.goals.map(g=>[g.id,g.title]));
    return [];
  }
  function openEditor(type,item) {
    editType=type;editItem=item||{};
    const edit=!!(item&&item.id);
    $("editTitle").textContent=T()[edit?"update":"create"]+" · "+T()[type];
    const root=$("editFields");root.replaceChildren();
    fieldDefs[type].forEach(field=>{
      const container=e("div","field");
      const label=e("label",null,T()[labelFor(field)]);
      label.htmlFor="field-"+field;
      let control;
      if(["notes","summary","bullets"].includes(field))control=e("textarea");
      else if(["status","category","language","goalId"].includes(field))control=e("select");
      else { control=e("input");control.type=["targetDate","dueDate"].includes(field)?"date":"text"; }
      control.id=label.htmlFor;control.name=field;
      if(field==="title"){control.required=true;control.maxLength=160;}
      if(field==="goalId"||field==="status"||field==="category"||field==="language"){
        selectOptions(field,type).forEach(([val,txt])=>{
          const opt=e("option",null,txt);opt.value=val;control.append(opt);
        });
      }
      let val=editItem[field];
      if(field==="bullets")val=Array.isArray(val)?val.join("\n"):"";
      if(field==="language"&&val===undefined)val=lang;
      if(val!==undefined&&val!==null)control.value=String(val);
      container.append(label,control);root.append(container);
    });
    const dialog=$("editDialog");
    if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
    const first=$("field-title");if(first)first.focus();
  }
  function closeEditor(){
    const dialog=$("editDialog");
    if(typeof dialog.close==="function")dialog.close();else dialog.removeAttribute("open");
  }
  function saveEdit(ev) {
    ev.preventDefault();
    const payload={...editItem};
    fieldDefs[editType].forEach(k=>{
      const field=$("field-"+k);
      if(k==="bullets")payload[k]=field.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      else payload[k]=field.value;
    });
    if(!payload.title||!payload.title.trim()){notify(T().error+T().titleField+" required",true);$("field-title").focus();return;}
    const result=tryAction(()=>Store.upsert(editType,payload));
    if(!result)return;
    closeEditor();notify(T().saved);view(editType);
  }
  function quickStatus(item,status) {
    tryAction(()=>{Store.upsert("actions",{...item,status});notify(T().saved);render()});
  }
  function makeDraft() {
    const combined=profile.skills.filter(x=>x.confirmed&&x.evidence).sort((a,b)=>b.rating-a.rating)
      .concat(profile.lifeSkills.filter(x=>x.confirmed&&x.evidence&&x.id!==63));
    const seen=new Set();
    const good=combined.filter(x=>{const key=x.evidence.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,12);
    if(!good.length){alert(T().noExample);view("skills");return;}
    const bullets=good.map(x=>{
      const name=lang==="he"?(x.he||x.en):(x.en||x.he);
      return (lang==="he"?"דוגמה למיומנות ": "Example of ")+name+": "+x.evidence;
    });
    const result=tryAction(()=>Store.upsert("cvs",{
      title:T().cvTitleNew,language:lang,status:"draft",summary:T().generatedSummary,
      bullets,notes:T().skillsUsed
    }));
    if(!result)return;
    notify(T().draftsSaved);view("cvs");
  }
  function cvText(item){
    const lines=[item.title,item.targetRole||"",item.summary||""].filter(Boolean);
    if(item.bullets.length)lines.push("",...item.bullets.map(x=>"- "+x));
    return lines.join("\n");
  }
  function download(content,filename,type){
    const blob=new Blob([content],{type:type||"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function downloadCV(item){download(cvText(item),"my-cv-draft-"+item.language+".txt","text/plain;charset=utf-8")}
  async function copyCV(item){
    try{await navigator.clipboard.writeText(cvText(item));notify(T().saved)}
    catch(e){notify(T().error+(e.message||"Clipboard unavailable"),true)}
  }
  // Backup passwords are entered into masked fields, never plain-text prompts.
  function askPassword(isExport){
    return new Promise(resolve=>{
      const dialog=$("passwordDialog"),form=$("passwordForm"),one=$("passwordValue"),
        twice=$("passwordAgain");
      one.value="";twice.value="";
      $("passwordTitle").textContent=T()[isExport?"passwordTitleExport":"passwordTitleImport"];
      $("passwordInfo").textContent=T()[isExport?"passwordInfoExport":"passwordInfoImport"];
      $("passwordLabel").textContent=T().passwordLabel;
      $("passwordAgainLabel").textContent=T().passwordAgainLabel;
      $("passwordSubmit").textContent=T().passwordSubmit;
      $("passwordCancel").textContent=T().passwordCancel;
      $("passwordAgainWrap").hidden=!isExport;twice.required=isExport;
      one.minLength=isExport?10:1;
      let settled=false;
      const finish=value=>{
        if(settled)return;
        settled=true;
        one.value="";twice.value="";
        if(typeof dialog.close==="function")dialog.close();else dialog.removeAttribute("open");
        resolve(value);
      };
      form.onsubmit=ev=>{
        ev.preventDefault();
        const first=one.value;
        if(isExport&&first.length<10){notify(T().error+"10+ characters required",true);return;}
        if(isExport&&first!==twice.value){notify(T().passwordMismatch,true);return;}
        if(!first){notify(T().error+"Password required",true);return;}
        finish(first);
      };
      $("passwordCancel").onclick=()=>finish(null);
      dialog.oncancel=ev=>{ev.preventDefault();finish(null)};
      if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
      one.focus();
    });
  }
  async function encryptedExport(){
    if(!Backup||!window.crypto||!window.crypto.subtle)return notify(T().secureOnly,true);
    const password=await askPassword(true);
    if(password===null)return;
    try{
      const encrypted=await Backup.encrypt(profile,password);
      download(JSON.stringify(encrypted,null,2),"my-journey-protected.journey");
      notify(T().saved);
    }catch(e){notify(T().error+e.message,true)}
  }
  function plainExport(){
    if(!confirm(T().unencryptedConfirm))return;
    tryAction(()=>{download(Store.exportData(),"my-journey-profile.json");notify(T().saved)});
  }
  async function importFile(){
    const file=$("importFile").files[0];
    if(!file)return notify(T().missingBackup,true);
    if(file.size>2000000)return notify(T().error+"File too large",true);
    try{
      let data=JSON.parse(await file.text());
      if(data.format&&/^momentum-journey-encrypted/.test(data.format)){
        if(!Backup)throw new Error(T().secureOnly);
        const password=await askPassword(false);
        if(password===null)return;
        data=await Backup.decrypt(data,password);
      }
      const mode=$("importMode").value;
      if(mode==="replace"&&!confirm(T().importConfirm))return;
      Store.importData(data,mode);
      // Revoke AI sharing after restoring any backup, including merge.
      Store.updatePrivacy({shareWithAI:false});
      notify(T().imported);render();
      $("importFile").value="";
    }catch(e){notify(T().error+e.message,true)}
  }
  function deleteData(){
    if(!confirm(T().deletionConfirm))return;
    tryAction(()=>{
      const all=$("deleteAll").checked;
      if(window.MomentumJourneySync)window.MomentumJourneySync.lock();
      Store.erase({assessment:all,companion:all});
      // A partial erase should not silently seed old skills back into Journey.

      $("deleteAll").checked=false;
      notify(T().deleted);view("overview");
    });
  }
  function wire(){
    if(!Store){$("storageNotice").textContent="My Journey could not load. Please refresh.";return;}
    $("language").onclick=()=>{lang=lang==="he"?"en":"he";updateLanguage();render()};
    document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>view(b.dataset.tab));
    document.querySelectorAll("[data-switch]").forEach(b=>b.onclick=()=>view(b.dataset.switch));
    document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>openEditor(b.dataset.add));
    $("makeCV").onclick=makeDraft;
    $("editForm").addEventListener("submit",saveEdit);
    $("closeDialog").onclick=$("cancelRecord").onclick=closeEditor;
    ["shareWithAI","shareSkills","shareGoals","shareEducation","shareActions","shareCVs"].forEach(k=>{
      $(k).addEventListener("change",()=>{
        tryAction(()=>{Store.updatePrivacy({[k]:$(k).checked});notify(T().shareChanged);render()});
      });
    });
    $("exportEncrypted").onclick=encryptedExport;
    $("exportPlain").onclick=plainExport;
    $("importButton").onclick=importFile;
    $("deleteButton").onclick=deleteData;
    addEventListener("storage",ev=>{
      if(ev.key===Store.KEY||ev.key==="momentum-business-skills-v1")render();
    });
    let tab=location.hash.replace("#","");
    if(!["overview","skills","goals","cvs","education","actions","privacy"].includes(tab))tab="overview";
    updateLanguage();view(tab);
  }
  document.addEventListener("journey-updated",render);
  wire();
})();