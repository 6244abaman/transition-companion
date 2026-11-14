"use strict";
const assert = require("node:assert/strict");
const BusinessSkills = require("../next/business-skills.js");

function storage(value) {
  return { getItem(key) { return key === "momentum-business-skills-v1" ? JSON.stringify(value) : null; } };
}
const labels = { 1: { en: "Planning", he: "תכנון" }, 2: { en: "Teamwork", he: "עבודת צוות" } };

const imported = BusinessSkills.read(storage({
  role: "commander", focus: "people", answers: {
    1: { rating: 7, evidence: "Planned a team schedule", confirmed: true },
    2: { rating: 5, evidence: "Worked with a team", confirmed: false },
    37: { rating: 7, evidence: "invalid id", confirmed: true },
    3: { rating: 9, evidence: "invalid rating", confirmed: true },
    4: { rating: 4, evidence: "", confirmed: true }
  }
}), labels);
assert.equal(imported.length, 3, "only valid 1–36 assessment ratings are imported");
assert.equal(imported[0].en, "Planning");
assert.equal(imported[0].role, "commander");
assert.equal(imported[0].confirmed, true);
assert.equal(imported[1].confirmed, false, "self-ratings without explicit confirmation remain unconfirmed");
assert.equal(imported[2].confirmed, false, "confirmation without an example is not evidence");

const context = BusinessSkills.confirmedContext(imported);
assert.equal(context.length, 1, "only explicitly confirmed examples enter the context");
assert.equal(context[0].evidence, "Planned a team schedule");
assert.deepEqual(BusinessSkills.read(storage(null), labels), []);
assert.deepEqual(BusinessSkills.read({ getItem() { throw new Error("storage denied"); } }, labels), []);
console.log("Business skills integration tests passed: 9 assertions");
