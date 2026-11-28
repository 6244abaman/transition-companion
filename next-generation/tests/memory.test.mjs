import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { PrivateVault } from "../public/vault.mjs";
import {
  emptyMemory,
  addGoal,
  completeGoal,
  makePacket,
  validatePacket,
  coordinate,
  localReply,
  needsHuman,
} from "../shared/memory.mjs";
const pass = "a long private passphrase";
function fixture() {
  const indexedDB = new IDBFactory();
  return () => new PrivateVault({ indexedDB });
}
test("encrypted memory survives closing; disk and backup contain no plaintext; wrong password preserves it", async () => {
  const create = fixture(),
    v = create(),
    state = emptyMemory();
  state.messages.push({ role: "user", text: "PERSONAL SENTINEL" });
  await v.create(pass, state);
  const backup = await v.exportBackup();
  assert.ok(!backup.includes("SENTINEL"));
  v.close();
  const next = create();
  await assert.rejects(next.unlock("wrong but long passphrase"));
  assert.equal(await next.exportBackup(), backup);
  assert.deepEqual(await next.unlock(pass), state);
  next.lock();
  await assert.rejects(next.save(state), /locked/);
  next.close();
});
test("backup restores into a fresh browser; tampering and invalid data never replace saved memory", async () => {
  const a = fixture()(),
    b = fixture()();
  await a.create(
    pass,
    addGoal(emptyMemory("en"), { title: "Compare two courses" }, "g1"),
  );
  const raw = await a.exportBackup();
  await b.importBackup(raw, pass);
  assert.equal((await b.unlock(pass)).goals[0].title, "Compare two courses");
  const changed = JSON.parse(raw);
  changed.ciphertext = "AAAA" + changed.ciphertext.slice(4);
  const before = await b.exportBackup();
  await assert.rejects(b.importBackup(JSON.stringify(changed), pass));
  assert.equal(await b.exportBackup(), before);
  await assert.rejects(b.importBackup(raw, "invalid password"));
  assert.equal(await b.exportBackup(), before);
  a.close();
  b.close();
});
test("large valid private conversations can be saved without encoding stack overflow", async () => {
  const v = fixture()(),
    state = emptyMemory();
  state.messages = Array.from({ length: 40 }, () => ({
    role: "user",
    text: "מידע פרטי ".repeat(200),
  }));
  await v.create(pass, state);
  assert.deepEqual(await v.unlock(pass), state);
  v.close();
});
test("concurrent tabs cannot overwrite changes or resurrect data after delete and recreation", async () => {
  const create = fixture(),
    a = create(),
    b = create();
  await a.create(pass, emptyMemory());
  await b.unlock(pass);
  await a.save(addGoal(emptyMemory(), { title: "One small step" }, "g1"));
  await assert.rejects(b.save(emptyMemory()), /another tab/);
  await b.unlock(pass);
  await a.deleteAll();
  assert.equal(await a.exists(), false);
  await a.create(pass, emptyMemory());
  await assert.rejects(b.save(emptyMemory()), /another tab/);
  await a.deleteAll();
  await assert.rejects(a.unlock(pass), /No saved/);
  a.close();
  b.close();
});
test("goals require user supplied titles; completion and bilingual domain continuity share one memory", () => {
  let m = addGoal(
    emptyMemory(),
    {
      title: "Talk to a course graduate",
      domain: "education",
      due: "2026-12-01",
    },
    "1",
  );
  m = completeGoal(m, "1");
  assert.equal(m.goals[0].status, "done");
  assert.throws(() => addGoal(m, { title: " " }));
  m.messages.push({ role: "user", text: "אני רוצה לימודים" });
  assert.equal(coordinate("ומה עכשיו?", m), "education");
  assert.equal(coordinate("I need a job", m), "employment");
  assert.equal(coordinate("Just talk", m), "general");
  assert.match(localReply("I need a job", { ...m, language: "en" }), /task/);
  assert.match(localReply("לימודים", m), /להשוות/);
});
test("context is absent by default, bounded and explicit when selected; benefit spoof is rejected", () => {
  const m = addGoal(emptyMemory("en"), { title: "Private plan" }, "1");
  m.strengths.push("Private evidence");
  m.messages.push({ role: "user", text: "Private history" });
  const packet = makePacket("I need a job", m);
  assert.deepEqual(packet.context, { goals: [], strengths: [], recent: [] });
  validatePacket(packet);
  const full = makePacket("I need a job", m, true);
  assert.equal(full.context.goals[0].title, "Private plan");
  assert.equal(full.context.recent.length, 1);
  assert.throws(() =>
    validatePacket({ ...packet, message: "benefits", domain: "employment" }),
  );
  assert.ok(needsHuman("I want to kill myself"));
  assert.ok(needsHuman("אני רוצה למות"));
  assert.ok(!needsHuman("I want to study"));
});
