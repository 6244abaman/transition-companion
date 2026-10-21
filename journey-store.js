/* Momentum Soldier Transition Companion — local-first, soldier-owned Journey Profile (v1)
 * Same-origin storage shared by the English, Hebrew and Skills pages.
 * No uploads, accounts, telemetry or AI calls. This is browser storage, NOT encryption.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MomentumJourney = api;
})(typeof window === "undefined" ? globalThis : window, function (root) {
  "use strict";
  const KEY = "momentum-soldier-journey-v1";
  const SKILLS_KEY = "momentum-business-skills-v1";
  const SCHEMA = "momentum-soldier-journey";
  const VERSION = 1;
  const TYPES = ["goals", "actions", "education", "cvs"];
  const LIMIT = { goals: 250, actions: 750, education: 200, cvs: 60, skills: 36 };
  const STATUS = {
    goals: ["exploring", "active", "paused", "achieved"],
    actions: ["todo", "doing", "done"],
    education: ["exploring", "preparing", "applied", "enrolled", "completed", "paused"],
    cvs: ["draft", "ready"]
  };
  function iso() { return new Date().toISOString(); }
  function str(v, max) { return typeof v === "string" ? v.trim().slice(0, max || 2000) : ""; }
  function date(v) { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ""; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function id() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID();
    return "item-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function blank() {
    const t = iso();
    return { schema: SCHEMA, version: VERSION, createdAt: t, updatedAt: t,
      goals: [], actions: [], education: [], cvs: [], skills: [], lifeSkills: [],
      privacy: { shareWithAI: false, shareSkills: true, shareGoals: true,
        shareEducation: true, shareActions: true, shareCVs: false },
      meta: { skillsImported: false } };
  }
  function cleanSkill(v) {
    const rating = Number(v && v.rating);
    if (!v || !Number.isInteger(Number(v.id)) || Number(v.id) < 1 ||
        Number(v.id) > 36 || !Number.isInteger(rating) || rating < 1 || rating > 7) return null;
    const evidence = str(v.evidence, 1500);
    return { id: Number(v.id), en: str(v.en, 120), he: str(v.he, 120),
      rating, evidence, confirmed: !!v.confirmed && !!evidence };
  }
  function cleanItem(type, v) {
    if (!v || typeof v !== "object") return null;
    const common = { id: str(v.id, 90) || id(), title: str(v.title, 160),
      status: STATUS[type].includes(v.status) ? v.status : STATUS[type][0],
      notes: str(v.notes, 3000),
      createdAt: str(v.createdAt, 40) || iso(), updatedAt: str(v.updatedAt, 40) || iso() };
    if (!common.title) return null;
    if (type === "goals") return { ...common, category: ["work", "education", "business", "life", "other"].includes(v.category) ? v.category : "other", targetDate: date(v.targetDate) };
    if (type === "actions") return { ...common, goalId: str(v.goalId, 90), dueDate: date(v.dueDate),
      completedAt: common.status === "done" ? str(v.completedAt, 40) || iso() : "" };
    if (type === "education") return { ...common, goalId: str(v.goalId, 90), field: str(v.field, 180), institution: str(v.institution, 180),
      targetDate: date(v.targetDate), nextStep: str(v.nextStep, 400) };
    return { ...common, targetRole: str(v.targetRole, 180),
      language: v.language === "he" ? "he" : "en", summary: str(v.summary, 4000),
      bullets: arr(v.bullets).slice(0, 50).map(x => str(x, 1000)).filter(Boolean) };
  }
  function cleanLifeSkill(v) {
    if(!v || !Number.isInteger(Number(v.id)) || Number(v.id)<1 || Number(v.id)>63)return null;
    const evidence=str(v.evidence,1500);
    if(!evidence || v.confirmed!==true)return null;
    return {id:Number(v.id),en:str(v.en,120),he:str(v.he,120),evidence,confirmed:true,
      level:Number.isInteger(Number(v.level)) && Number(v.level)>=1 && Number(v.level)<=4 ? Number(v.level):0};
  }
  function normalize(raw) {
    if (!raw || raw.schema !== SCHEMA || raw.version !== VERSION) throw new Error("Unsupported Journey profile format");
    const result = blank();
    result.createdAt = str(raw.createdAt, 40) || result.createdAt;
    result.updatedAt = str(raw.updatedAt, 40) || result.updatedAt;
    TYPES.forEach(type => {
      const seen = new Set();
      result[type] = arr(raw[type]).slice(0, LIMIT[type]).map(v => cleanItem(type, v))
        .filter(v => { if (!v || seen.has(v.id)) return false; seen.add(v.id); return true; });
    });
    const seenSkills = new Set();
    result.skills = arr(raw.skills).slice(0, LIMIT.skills).map(cleanSkill)
      .filter(v => { if (!v || seenSkills.has(v.id)) return false; seenSkills.add(v.id); return true; });
    const seenLife = new Set();
    result.lifeSkills=arr(raw.lifeSkills).slice(0,63).map(cleanLifeSkill).filter(v=>{
      if(!v||seenLife.has(v.id))return false;seenLife.add(v.id);return true;
    });
    const p = raw.privacy || {};
    result.privacy = {
      shareWithAI: p.shareWithAI === true,
      shareSkills: p.shareSkills !== false,
      shareGoals: p.shareGoals !== false,
      shareEducation: p.shareEducation !== false,
      shareActions: p.shareActions !== false,
      shareCVs: p.shareCVs === true
    };
    result.meta = { skillsImported: !!(raw.meta && raw.meta.skillsImported) };
    return result;
  }
  function storage() {
    try { return root.localStorage || null; }
    catch (_) { return null; }
  }
  function getRaw(key) {
    try { const v = storage() && storage().getItem(key); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }
  function persist(profile) {
    const ls = storage();
    if (!ls) throw new Error("Browser storage is unavailable");
    const record = normalize({ ...profile, updatedAt: iso() });
    ls.setItem(KEY, JSON.stringify(record));
    return record;
  }
  function fromAssessment(assessment) {
    if (!assessment || !assessment.answers || typeof assessment.answers !== "object") return [];
    const labels = assessmentLabels();
    return Object.keys(assessment.answers).map(key => {
      const skillId = Number(key), data = labels[skillId] || {};
      return cleanSkill({ id: skillId, en: data.en || "", he: data.he || "",
        rating: assessment.answers[key] && assessment.answers[key].rating,
        evidence: assessment.answers[key] && assessment.answers[key].evidence,
        confirmed: assessment.answers[key] && assessment.answers[key].confirmed });
    }).filter(Boolean).sort((a, b) => a.id - b.id);
  }
  // Exact stable labels for the assessment: used as a fallback for older saved files.
  const LABELS_EN = [
    "Finishing the Job","Working Under Pressure","Planning","Time Management","Improvisation",
    "Technological Know-How","Prioritization","Calculated Risk-Taking","Leading Processes","Operating Independently",
    "Leadership","Teamwork","Leading People","Teaching Skills","Working with Different People","Service Orientation",
    "Organizing & Managing","Discipline","Resilience","Emotional Regulation","Learning from Failure","Managing Uncertainty",
    "Decision-Making","Problem-Solving","Thinking Outside the Box","Recognizing Opportunities","Pattern Recognition",
    "Adapting to Change","Thinking Big","Flexibility","Trustworthiness","Work Ethic / Integrity",
    "Responsibility","Professionalism","Communication & Expression","Creativity"
  ];
  const LABELS_HE = [
    "התמדה עד השלמת המשימה","תפקוד תחת לחץ","תכנון","ניהול זמן","אלתור","יכולת טכנולוגית",
    "קביעת סדרי עדיפויות","נטילת סיכונים מחושבת","הובלת תהליכים","עבודה עצמאית",
    "מנהיגות","עבודת צוות","הובלת אנשים","הדרכת מיומנויות","עבודה עם אנשים שונים",
    "תודעת שירות","ארגון וניהול","משמעת","חוסן והתאוששות","ויסות רגשי","למידה מכישלון",
    "התמודדות עם אי-ודאות","קבלת החלטות","פתרון בעיות","חשיבה מחוץ לקופסה",
    "זיהוי הזדמנויות","זיהוי דפוסים","הסתגלות לשינויים","חשיבה רחבה","גמישות",
    "אמינות","מוסר עבודה ויושרה","אחריות","מקצועיות","תקשורת והבעה","יצירתיות"
  ];
  function assessmentLabels() {
    const out = {};
    LABELS_EN.forEach((en, i) => { out[i + 1] = { en, he: LABELS_HE[i] }; });
    return out;
  }
  function read() {
    const saved = getRaw(KEY);
    if (saved) return normalize(saved);
    const fresh = blank();
    const ass = getRaw(SKILLS_KEY);
    if (ass) {
      fresh.skills = fromAssessment(ass);
      fresh.meta.skillsImported = true;
    } else {
      // Legacy bridge: do not conflate the 63-skill confirmed-proficiency scale
      // with the separate 36-skill self-rating scale.
      for (const key of ["gtc_v2_state", "gtc_H_state"]) {
        const legacy = getRaw(key);
        if (legacy && legacy.profile && arr(legacy.profile.businessSkills).length) {
          fresh.skills = arr(legacy.profile.businessSkills).map(cleanSkill).filter(Boolean);
          fresh.meta.skillsImported = true;
          break;
        }
      }
    }
    try { return persist(fresh); } catch (_) { return fresh; }
  }
  function write(change) {
    const current = read();
    const next = typeof change === "function" ? change(current) : { ...current, ...change };
    return persist(next);
  }
  function upsert(type, value) {
    if (!TYPES.includes(type)) throw new Error("Unknown Journey record type");
    const v = cleanItem(type, { ...value, updatedAt: iso() });
    if (!v) throw new Error("A title is required");
    return write(p => {
      const idx = p[type].findIndex(x => x.id === v.id);
      if (idx >= 0) p[type][idx] = { ...p[type][idx], ...v, createdAt: p[type][idx].createdAt };
      else {
        if (p[type].length >= LIMIT[type]) throw new Error("Too many records");
        p[type].push(v);
      }
      return p;
    });
  }
  function remove(type, recordId) {
    if (!TYPES.includes(type)) throw new Error("Unknown Journey record type");
    return write(p => {
      p[type] = p[type].filter(x => x.id !== recordId);
      if (type === "goals") ["actions","education"].forEach(t=>p[t].forEach(a => { if (a.goalId === recordId) a.goalId = ""; }));
      return p;
    });
  }
  function updatePrivacy(fields) {
    const allowed = ["shareWithAI", "shareSkills", "shareGoals", "shareEducation", "shareActions", "shareCVs"];
    return write(p => {
      allowed.forEach(k => { if (Object.prototype.hasOwnProperty.call(fields, k)) p.privacy[k] = fields[k] === true; });
      return p;
    });
  }
  function saveLifeSkills(values) {
    return write(p=>{
      const map=new Map(p.lifeSkills.map(x=>[x.id,x]));
      arr(values).map(cleanLifeSkill).filter(Boolean).forEach(x=>map.set(x.id,x));
      p.lifeSkills=[...map.values()];return p;
    });
  }
  function removeLifeSkill(id){return write(p=>{p.lifeSkills=p.lifeSkills.filter(x=>x.id!==Number(id));return p;});}
  function syncAssessment() {
    const assessment = getRaw(SKILLS_KEY);
    if (!assessment) return read();
    const skills = fromAssessment(assessment);
    return write(p => { p.skills = skills; p.meta.skillsImported = true; return p; });
  }
  function aiContext(profile, lang) {
    const p = profile || read();
    if (!p.privacy || !p.privacy.shareWithAI) return "";
    const he = lang === "he", lines = [];
    if (p.privacy.shareSkills) {
      p.skills.filter(x => x.confirmed && x.evidence).sort((a, b) => b.rating - a.rating).slice(0, 8)
        .forEach(x => lines.push("Skill (soldier-confirmed example, self-rated " + x.rating + "/7): " +
          (he ? (x.he || x.en) : (x.en || x.he)) + " — " + str(x.evidence, 260)));
    }
    if(p.privacy.shareSkills) arr(p.lifeSkills).filter(x=>x.confirmed&&x.evidence&&x.id!==63).slice(0,8)
      .forEach(x=>lines.push("Life skill (soldier-confirmed example): "+(he?(x.he||x.en):(x.en||x.he))+" — "+str(x.evidence,260)));
    if (p.privacy.shareGoals) p.goals.filter(x => x.status !== "achieved").slice(0, 6)
      .forEach(x => lines.push("Goal: " + x.title + " [" + x.status + "]" +
        (x.targetDate ? " target " + x.targetDate : "")));
    if (p.privacy.shareEducation) p.education.slice(0, 4)
      .forEach(x => lines.push("Education plan: " + x.title + " [" + x.status + "]" +
        (x.targetDate ? " target " + x.targetDate : "")));
    if (p.privacy.shareActions) p.actions.filter(x => x.status !== "done").slice(0, 7)
      .forEach(x => lines.push("Next action: " + x.title + " [" + x.status + "]" +
        (x.dueDate ? " due " + x.dueDate : "")));
    if (p.privacy.shareCVs) p.cvs.slice(0, 2)
      .forEach(x => lines.push("Saved CV: " + x.title + (x.targetRole ? " for " + x.targetRole : "") +
        "; summary: " + str(x.summary, 300) + "; bullet outlines: " +
        x.bullets.slice(0, 3).map(v => str(v, 160)).join(" / ")));
    if (!lines.length) return "";
    return ("SOLDIER-OWNED JOURNEY — EXPLICITLY OPTED-IN CONTEXT. " +
      "Use only these facts; never invent achievements, eligibility or outcomes. " +
      "Do not treat a self-rating as a verified proficiency.\n" + lines.join("\n")).slice(0, 3600);
  }
  function exportData() { return JSON.stringify(read(), null, 2); }
  function importData(raw, mode) {
    if (JSON.stringify(raw).length > 1048576) throw new Error("Backup exceeds 1 MB");
    const incoming = normalize(raw);
    if (mode !== "merge" && mode !== "replace") throw new Error("Choose merge or replace");
    if (mode === "replace") { incoming.privacy.shareWithAI = false; return persist(incoming); }
    return write(current => {
      TYPES.forEach(type => {
        const map = new Map(current[type].map(x => [x.id, x]));
        incoming[type].forEach(x => map.set(x.id, x));
        current[type] = [...map.values()].slice(0, LIMIT[type]);
      });
      const skills = new Map(current.skills.map(x => [x.id, x]));
      incoming.skills.forEach(x => skills.set(x.id, x));
      current.skills = [...skills.values()].slice(0, 36);
      const lifeSkills=new Map(current.lifeSkills.map(x=>[x.id,x]));
      incoming.lifeSkills.forEach(x=>lifeSkills.set(x.id,x));current.lifeSkills=[...lifeSkills.values()].slice(0,63);
      // Never implicitly enable AI sharing through a merged backup.
      return current;
    });
  }
  function erase(options) {
    const ls = storage();
    if (!ls) throw new Error("Browser storage unavailable");
    if (options && options.assessment) ls.removeItem(SKILLS_KEY);
    // Partial reset must stay reset, not automatically restore legacy skills on the next read.
    if (options && !options.assessment && !options.companion) {
      const fresh = blank(); fresh.meta.skillsImported = true; persist(fresh);
    } else ls.removeItem(KEY);
    if (options && options.companion) {
      ls.removeItem("momentum-ai-disclosures-v1");
      ls.removeItem("momentum-reminder-settings-v1");
      ls.removeItem("gtc_v2_state");
      ls.removeItem("gtc_H_state");
    }
  }
  return { KEY, VERSION, read, write, upsert, remove, updatePrivacy, syncAssessment,
    aiContext, exportData, importData, erase, normalize, blank, assessmentLabels, saveLifeSkills, removeLifeSkill };
});
