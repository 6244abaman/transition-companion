"use strict";
const assert = require("node:assert/strict");
const { randomBytes, webcrypto } = require("node:crypto");
globalThis.crypto ||= webcrypto;
const Sync = require("../next/sync-client.js");

(async () => {
  assert.equal(Sync.validEndpoint("https://sync.example"), true);
  assert.equal(Sync.validEndpoint("http://sync.example"), false);
  assert.equal(Sync.validEndpoint("https://user:pass@sync.example"), false);
  const secret = randomBytes(32).toString("base64url");
  const snapshot = { version: 1, profile: { goal: "study" }, messages: [{ role: "user", text: "private" }] };
  const envelope = await Sync.encryptSnapshot(snapshot, secret);
  assert.equal(envelope.version, 1);
  assert.deepEqual(await Sync.decryptSnapshot(envelope, secret), snapshot);
  await assert.rejects(() => Sync.decryptSnapshot(envelope, randomBytes(32).toString("base64url")));
  const tampered = { ...envelope, ciphertext: (envelope.ciphertext[0] === "A" ? "B" : "A") + envelope.ciphertext.slice(1) };
  await assert.rejects(() => Sync.decryptSnapshot(tampered, secret), "AES-GCM authentication rejects tampering");
  const credentials = { endpoint: "https://sync.example", id: randomBytes(18).toString("base64url"), token: randomBytes(32).toString("base64url"), secret, revision: 1, fingerprint: "abc" };
  const code = Sync.pairingCode(credentials);
  const parsed = Sync.parsePairingCode(code);
  assert.equal(parsed.endpoint, credentials.endpoint);
  assert.equal(parsed.id, credentials.id);
  assert.equal(parsed.secret, credentials.secret);
  assert.equal(await Sync.fingerprint(snapshot), await Sync.fingerprint(snapshot));
  console.log("Encrypted sync client tests passed: 11 assertions");
})().catch(error => { console.error(error); process.exitCode = 1; });
