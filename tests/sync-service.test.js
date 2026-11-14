"use strict";
const assert = require("node:assert/strict");
process.env.SYNC_DB_PATH = ":memory:";
process.env.ALLOWED_ORIGINS = "https://hub.example,http://localhost:8000";
const { createServer } = require("../sync-service/server.js");

(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Origin: "https://hub.example", "Content-Type": "application/json" };
  try {
    const health = await fetch(base + "/health");
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, "ok");
    const created = await fetch(base + "/v1/sync", { method: "POST", headers, body: "{}" });
    assert.equal(created.status, 201);
    assert.equal(created.headers.get("access-control-allow-origin"), "https://hub.example");
    const credentials = await created.json();
    const resource = base + "/v1/sync/" + credentials.id;
    const auth = { ...headers, Authorization: `Bearer ${credentials.token}` };
    assert.equal((await fetch(resource, { headers })).status, 404, "records are private without the bearer secret");
    assert.equal((await fetch(resource, { headers: { ...auth, Origin: "https://attacker.example" } })).status, 403, "unknown browser origins are blocked");
    const envelope = { version: 1, salt: "abcdefghijklmnop", iv: "abcdefghijklmnop", ciphertext: "abcdefghijklmnop" };
    assert.equal((await fetch(resource, { method: "PUT", headers: auth, body: JSON.stringify(envelope) })).status, 428, "writes require an expected revision");
    const saved = await fetch(resource, { method: "PUT", headers: { ...auth, "If-Match": "0" }, body: JSON.stringify(envelope) });
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).revision, 1);
    const loaded = await fetch(resource, { headers: auth });
    const snapshot = await loaded.json();
    assert.equal(snapshot.envelope.ciphertext, envelope.ciphertext);
    const race = await Promise.all([1, 2].map(() => fetch(resource, { method: "PUT", headers: { ...auth, "If-Match": "1" }, body: JSON.stringify(envelope) })));
    assert.deepEqual(race.map(response => response.status).sort(), [200, 409], "simultaneous writes cannot both claim success");
    assert.equal((await fetch(resource, { method: "PUT", headers: { ...auth, "If-Match": "0" }, body: JSON.stringify(envelope) })).status, 409, "stale devices cannot silently overwrite newer data");
    assert.equal((await fetch(resource, { method: "DELETE", headers: auth })).status, 200);
    assert.equal((await fetch(resource, { headers: auth })).status, 404);
    console.log("Encrypted sync service tests passed: 13 assertions");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
