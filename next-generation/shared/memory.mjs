export const emptyMemory = (language = "he") => ({
  schemaVersion: 1,
  language,
  messages: [],
  strengths: [],
  goals: [],
});
const bounded = (s, max) => typeof s === "string" && s.length <= max;
export function validateMemory(s) {
  if (
    !s ||
    Object.keys(s).sort().join() !==
      "goals,language,messages,schemaVersion,strengths" ||
    s.schemaVersion !== 1 ||
    !["he", "en"].includes(s.language) ||
    !Array.isArray(s.messages) ||
    s.messages.length > 200 ||
    !s.messages.every(
      (m) =>
        m && ["user", "assistant"].includes(m.role) && bounded(m.text, 6000),
    ) ||
    !Array.isArray(s.strengths) ||
    s.strengths.length > 100 ||
    !s.strengths.every((x) => bounded(x, 300)) ||
    !Array.isArray(s.goals) ||
    s.goals.length > 100 ||
    !s.goals.every(
      (g) =>
        g &&
        bounded(g.id, 80) &&
        bounded(g.title, 300) &&
        ["education", "employment", "general"].includes(g.domain) &&
        ["open", "done"].includes(g.status) &&
        (g.due === "" || /^\d{4}-\d{2}-\d{2}$/.test(g.due)),
    )
  )
    throw new Error("Invalid private memory");
  if (new Set(s.goals.map((g) => g.id)).size !== s.goals.length)
    throw new Error("Duplicate goal");
  return s;
}
export function addGoal(
  memory,
  { title, domain = "general", due = "" },
  id = crypto.randomUUID(),
) {
  const next = structuredClone(memory);
  next.goals.push({ id, title: title.trim(), domain, due, status: "open" });
  if (!next.goals.at(-1).title) throw new Error("A next step needs a title");
  return validateMemory(next);
}
export function completeGoal(memory, id) {
  const next = structuredClone(memory),
    goal = next.goals.find((g) => g.id === id);
  if (!goal) throw new Error("Unknown goal");
  goal.status = goal.status === "open" ? "done" : "open";
  return validateMemory(next);
}
export function route(text) {
  if (/benefit|grant|deposit|זכויות|מענק|פיקדון|הטבות/i.test(text))
    return "benefits";
  if (/stud|college|educat|course|לימוד|קורס|מכללה|אוניברסיט/i.test(text))
    return "education";
  if (
    /work|job|career|interview|resume|\bcv\b|עבודה|קרייר|משרה|ראיון|קורות/i.test(
      text,
    )
  )
    return "employment";
  return "general";
}
// A conservative aid, not a risk assessment or reliable crisis detector.
export function needsHuman(text) {
  return /suicid|kill myself|hurt myself|end my life|want to die|להתאבד|אובדנ|לפגוע בעצמי|רוצה למות/i.test(
    text,
  );
}
export const specialistSpecs = Object.freeze({
  education: {
    purpose:
      "Explore learning options, constraints and low-risk comparisons; no admissions or funding promises.",
  },
  employment: {
    purpose:
      "Translate user-confirmed evidence into civilian skills and a small work experiment; never invent experience.",
  },
  general: {
    purpose:
      "Listen, clarify the priority, connect one small next step across domains.",
  },
  benefits: {
    purpose:
      "Use only currently approved knowledge; no eligibility determination or unverified amounts.",
  },
});
export function coordinate(message, memory) {
  const explicit = route(message);
  if (explicit !== "general" || /just talk|פשוט לדבר/i.test(message))
    return explicit;
  for (const m of memory.messages.slice(-12).reverse()) {
    if (m.role === "user" && route(m.text) !== "general") return route(m.text);
  }
  return "general";
}
export function localReply(text, memory) {
  const he = memory.language === "he",
    domain = coordinate(text, memory);
  if (needsHuman(text))
    return he
      ? "כדאי לפנות עכשיו לאדם שיוכל להיות איתך. אפשר לפתוח את העזרה האנושית למעלה. אין כאן ניטור או הזעקת עזרה אוטומטית."
      : "Please reach out to someone who can be with you now. Human help is available above. This app does not monitor you or summon help.";
  if (domain === "benefits")
    return he
      ? "אין כאן כרגע מידע מאומת ועדכני על זכאות. אפשר לפתוח את מקורות הזכויות ולבדוק מול הגוף הרשמי לפני החלטה."
      : "No current verified eligibility information is available here. Open Benefits sources and check with the official body before deciding.";
  if (domain === "education")
    return he
      ? "אפשר להשוות שתי אפשרויות לפי העניין שלך, הזמן הפנוי והעלות שתאמת מול המוסד. מה היית רוצה לבדוק קודם?"
      : "We can compare two learning options by your interests, available time and costs you verify with the institution. What would you like to explore first?";
  if (domain === "employment")
    return he
      ? "נוכל להתחיל ממשימה שביצעת היטב, ולתרגם אותה למיומנות אזרחית בלי להמציא ניסיון. איזו דוגמה עולה לך?"
      : "We can start with a task you handled well and translate it into a civilian skill without inventing experience. What example comes to mind?";
  const open = memory.goals.filter((g) => g.status === "open");
  return he
    ? open.length
      ? `יש לך ${open.length} צעדים פתוחים במסע. במה תרצה להתמקד עכשיו?`
      : "אפשר לחשוב יחד על הצעד הקרוב, או פשוט לדבר. מה הכי מעסיק אותך היום?"
    : open.length
      ? `You have ${open.length} open steps in your Journey. What would you like to focus on now?`
      : "We can think through a next step, or just talk. What is on your mind today?";
}
export function makePacket(message, memory, includeContext = false) {
  return {
    version: 1,
    language: memory.language,
    domain: coordinate(message, memory),
    message,
    context: includeContext
      ? {
          goals: memory.goals
            .filter((g) => g.status === "open")
            .slice(0, 5)
            .map(({ title, domain }) => ({ title, domain })),
          strengths: memory.strengths.slice(0, 5),
          recent: (memory.messages.at(-1)?.text === message
            ? memory.messages.slice(0, -1)
            : memory.messages
          )
            .slice(-4)
            .map(({ role, text }) => ({ role, text })),
        }
      : { goals: [], strengths: [], recent: [] },
  };
}
export function validatePacket(p) {
  if (
    !p ||
    Object.keys(p).sort().join() !==
      "context,domain,language,message,version" ||
    p.version !== 1 ||
    !["he", "en"].includes(p.language) ||
    !Object.hasOwn(specialistSpecs, p.domain) ||
    !bounded(p.message, 3000) ||
    !p.message.trim() ||
    !p.context ||
    Object.keys(p.context).sort().join() !== "goals,recent,strengths" ||
    !Array.isArray(p.context.goals) ||
    p.context.goals.length > 5 ||
    !p.context.goals.every(
      (g) =>
        g &&
        bounded(g.title, 300) &&
        ["education", "employment", "general"].includes(g.domain),
    ) ||
    !Array.isArray(p.context.strengths) ||
    p.context.strengths.length > 5 ||
    !p.context.strengths.every((x) => bounded(x, 300)) ||
    !Array.isArray(p.context.recent) ||
    p.context.recent.length > 4 ||
    !p.context.recent.every(
      (m) =>
        m && ["user", "assistant"].includes(m.role) && bounded(m.text, 6000),
    )
  )
    throw new Error("Invalid request");
  // Domain is derived again on the server. A caller cannot bypass the benefits guard.
  if (route(p.message) !== "general" && p.domain !== route(p.message))
    throw new Error("Domain mismatch");
  return p;
}
