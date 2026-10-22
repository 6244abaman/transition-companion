/* Read the existing same-origin 36-skill assessment without merging its 1–7
   self-rating scale into the separate 63-skill evidence profile. */
(function (root) {
  "use strict";
  const KEY = "momentum-business-skills-v1";

  function read(storage = root.localStorage, labels = root.MomentumJourney?.assessmentLabels?.() || {}) {
    try {
      const saved = JSON.parse(storage?.getItem(KEY) || "null");
      const answers = saved?.answers;
      if (!answers || typeof answers !== "object" || Array.isArray(answers)) return [];
      return Object.entries(answers).map(([rawId, answer]) => {
        const id = Number(rawId);
        const rating = Number(answer?.rating);
        if (!Number.isInteger(id) || id < 1 || id > 36 || !Number.isInteger(rating) || rating < 1 || rating > 7) return null;
        const label = labels[id] || {};
        const evidence = typeof answer.evidence === "string" ? answer.evidence.trim().slice(0, 1500) : "";
        return {
          id,
          en: typeof label.en === "string" ? label.en : "",
          he: typeof label.he === "string" ? label.he : "",
          rating,
          evidence,
          confirmed: answer.confirmed === true && evidence.length > 0,
          role: saved.role === "commander" ? "commander" : "soldier",
          focus: ["general", "people", "tech", "ops"].includes(saved.focus) ? saved.focus : "general"
        };
      }).filter(Boolean).sort((a, b) => a.id - b.id);
    } catch (_) {
      return [];
    }
  }

  function confirmedContext(skills) {
    return (Array.isArray(skills) ? skills : [])
      .filter(skill => skill && skill.confirmed === true && typeof skill.evidence === "string" && skill.evidence.trim())
      .slice(0, 36)
      .map(({ id, en, he, rating, evidence, role }) => ({ id, en, he, rating, evidence, role }));
  }

  const api = { read, confirmedContext };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MomentumBusinessSkills = api;
})(typeof window === "undefined" ? globalThis : window);
