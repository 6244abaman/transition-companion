"use strict";
const assert = require("node:assert/strict");
const Knowledge = require("../next/knowledge-store.js");

const pack = {
  schema: "momentum-reviewed-knowledge-v1", id: "rights", version: "1.0", status: "approved",
  reviewedAt: "2026-10-22", validUntil: "2027-01-20",
  items: [{ id: "deposit", topics: ["rights", "finance"], question: { en: "Deposit?", he: "פיקדון?" },
    answer: { en: "Check official amount.", he: "בדקו את הסכום הרשמי." }, sources: [
      { authority: "Ministry of Defense", title: { en: "Source", he: "מקור" }, url: "https://www.hachvana.mod.gov.il/example", checkedAt: "2026-10-22" }
    ] }]
};
const meta = { id: "rights", version: "1.0", status: "approved", reviewedAt: "2026-10-22", validUntil: "2027-01-20", path: "./data/knowledge/rights.json" };
assert.equal(Knowledge.validPackage(pack, meta), true);
assert.equal(Knowledge.active(meta, "2026-10-22"), true);
assert.equal(Knowledge.active(meta, "2027-01-21"), false, "expired packs are inactive");
assert.equal(Knowledge.officialSource({ url: "http://www.gov.il/source" }), false);
assert.equal(Knowledge.officialSource({ url: "https://example.com/source" }), false);
assert.equal(Knowledge.validPackage({ ...pack, items: [{ ...pack.items[0], sources: [{ url: "https://example.com" }] }] }, meta), false);

(async () => {
  const fetched = await Knowledge.loadApproved({ packages: [meta, { ...meta, id: "bad", path: "./data/knowledge/../secret.json" }] }, async path => {
    assert.equal(path, meta.path);
    return pack;
  }, "2026-10-22");
  assert.equal(fetched.length, 1, "only approved, in-date packs within the knowledge folder load");
  assert.equal(Knowledge.matching(fetched, "rights", "he")[0].question, "פיקדון?");
  console.log("Reviewed knowledge tests passed: 7 assertions");
})().catch(error => { console.error(error); process.exitCode = 1; });
