/* Loads only dated, bilingual reviewed packs with HTTPS sources on official
   Israeli government domains. Stale or mismatched packages stay inactive. */
(function (root) {
  "use strict";
  const DAY_MS = 86400000;
  function isDate(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")); }
  function active(meta, today) {
    return meta && meta.status === "approved" && isDate(meta.reviewedAt) && isDate(meta.validUntil) &&
      meta.reviewedAt <= today && meta.validUntil >= today;
  }
  function officialSource(source) {
    try {
      const url = new URL(source.url);
      return url.protocol === "https:" && (url.hostname === "gov.il" || url.hostname.endsWith(".gov.il"));
    } catch (_) { return false; }
  }
  function validPackage(pack, meta) {
    return pack && pack.schema === "momentum-reviewed-knowledge-v1" && pack.status === "approved" &&
      pack.id === meta.id && pack.version === meta.version && pack.reviewedAt === meta.reviewedAt &&
      pack.validUntil === meta.validUntil && Array.isArray(pack.items) && pack.items.length > 0 &&
      pack.items.every(item => item && item.id && Array.isArray(item.topics) &&
        item.question?.en && item.question?.he && item.answer?.en && item.answer?.he &&
        Array.isArray(item.sources) && item.sources.length > 0 && item.sources.every(officialSource));
  }
  async function loadApproved(manifest, fetchJson, today = new Date().toISOString().slice(0, 10)) {
    if (!manifest || !Array.isArray(manifest.packages)) return [];
    const loaded = [];
    for (const meta of manifest.packages) {
      if (!active(meta, today) || typeof meta.path !== "string" || !meta.path.startsWith("./data/knowledge/") || meta.path.includes("..")) continue;
      try {
        const pack = await fetchJson(meta.path);
        if (validPackage(pack, meta)) loaded.push({ ...pack, title: meta.title || pack.id });
      } catch (_) { /* one unavailable package must not hide other reviewed packs */ }
    }
    return loaded;
  }
  function activePackages(packages, today = new Date().toISOString().slice(0, 10)) {
    return (Array.isArray(packages) ? packages : []).filter(pack => active(pack, today));
  }
  function matching(packages, route, lang = "en", query = "", today) {
    const needles = String(query || "").toLowerCase();
    return activePackages(packages, today).flatMap(pack => pack.items
      .filter(item => item.topics.includes(route) || route === "rights" && item.topics.some(x => ["rights", "finance", "jobs"].includes(x)))
      .map(item => ({
        id: item.id,
        question: item.question[lang] || item.question.en,
        answer: item.answer[lang] || item.answer.en,
        nextSteps: item.nextSteps?.[lang] || item.nextSteps?.en || [],
        topics: item.topics,
        reviewedAt: pack.reviewedAt,
        sources: item.sources.map(s => ({ authority:s.authority, title:s.title?.[lang] || s.title?.en || s.authority, url:s.url, checkedAt:s.checkedAt }))
      }))
      .filter(item => !needles || (item.question + " " + item.answer + " " + item.topics.join(" ")).toLowerCase().includes(needles)));
  }
  const api = { active, officialSource, validPackage, loadApproved, activePackages, matching };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MomentumKnowledge = api;
})(typeof window === "undefined" ? globalThis : window);
