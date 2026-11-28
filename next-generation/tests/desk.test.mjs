import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createDesk } from "../server/desk-server.mjs";
import { EditorialStore, migrateEditorial } from "../server/editorial.mjs";
import { LocalKnowledgeClient } from "../server/local-knowledge.mjs";
import { createApp } from "../server/gateway.mjs";
const seed = JSON.parse(
  await readFile(
    new URL("../knowledge/starter-set.json", import.meta.url),
    "utf8",
  ),
);
const NOW = new Date("2026-11-25T20:00:00Z"),
  password = "TEST ONLY long passphrase 12345";
async function fixture(options = {}) {
  const db = new PGlite();
  await migrateEditorial(db);
  const store = new EditorialStore(db, { clock: () => NOW });
  await store.importSeed(seed.items);
  const accounts = {};
  for (const role of ["editor", "reviewer"])
    accounts[role] = await store.addStaff({
      username: "test-" + role,
      displayName: "Test " + role,
      professionalRole: "Test-only staff role",
      role,
      password,
    });
  const app = createDesk({
    store,
    clock: () => NOW.getTime(),
    seedSummary: seed.items,
    managementToken: "test-owner-token",
    ...options,
  });
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  const base = `http://127.0.0.1:${app.address().port}`;
  const post = (path, data, auth = {}, extra = {}) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        Origin: base,
        "Content-Type": "application/json",
        ...(auth.cookie
          ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf }
          : {}),
        ...extra,
      },
      body: JSON.stringify(data),
    });
  const login = async (role) => {
    const r = await post("/staff/api/login", {
      username: "test-" + role,
      password,
    });
    assert.equal(r.status, 200);
    const data = await r.json();
    return {
      ...data,
      cookie: r.headers.get("set-cookie").split(";")[0],
      rawCookie: r.headers.get("set-cookie"),
    };
  };
  return {
    db,
    store,
    app,
    base,
    post,
    login,
    accounts,
    close: async () => {
      app.close();
      app.closeAllConnections();
      await once(app, "close");
      await db.close();
    },
  };
}
test("staff HTTP sessions enforce auth, exact origin, CSRF, role, logout and disabled accounts", async () => {
  const f = await fixture();
  try {
    assert.equal((await fetch(f.base + "/staff/api/revisions")).status, 401);
    assert.equal(
      (
        await f.post("/staff/api/login", {
          username: "test-editor",
          password: "wrong",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await f.post("/staff/api/login", {
          username: "unknown-user",
          password: "wrong",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await f.post(
          "/staff/api/login",
          {},
          {},
          { Origin: "https://evil.test" },
        )
      ).status,
      403,
    );
    const editor = await f.login("editor");
    assert.match(editor.rawCookie, /HttpOnly/);
    assert.match(editor.rawCookie, /SameSite=Strict/);
    assert.match(editor.rawCookie, /Path=\/staff/);
    const row = (await f.store.list())[0];
    assert.equal(
      (
        await f.post(
          `/staff/api/revisions/${row.id}/save`,
          { expectedVersion: 1, content: row.content },
          { ...editor, csrf: "wrong" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.post(
          `/staff/api/revisions/${row.id}/approve`,
          { expectedVersion: 1 },
          editor,
        )
      ).status,
      403,
    );
    await f.db.query("UPDATE knowledge_staff SET active=false WHERE id=$1", [
      f.accounts.editor.id,
    ]);
    assert.equal(
      (
        await fetch(f.base + "/staff/api/me", {
          headers: { Cookie: editor.cookie },
        })
      ).status,
      401,
    );
    const reviewer = await f.login("reviewer");
    assert.equal((await f.post("/staff/api/logout", {}, reviewer)).status, 200);
    assert.equal(
      (
        await fetch(f.base + "/staff/api/me", {
          headers: { Cookie: reviewer.cookie },
        })
      ).status,
      401,
    );
  } finally {
    await f.close();
  }
});
test("editor and reviewer can complete the real HTTP workflow; only approved facts reach the companion", async () => {
  const f = await fixture();
  let companion;
  try {
    const editor = await f.login("editor"),
      reviewer = await f.login("reviewer");
    const row = (await f.store.list()).find(
      (x) => x.content.domain === "benefits",
    );
    assert.deepEqual(
      (
        await (
          await fetch(f.base + "/knowledge?domain=benefits&language=he")
        ).json()
      ).items,
      [],
    );
    const saved = await f.post(
      `/staff/api/revisions/${row.id}/save`,
      { expectedVersion: row.lock_version, content: row.content },
      editor,
    );
    assert.equal(saved.status, 200);
    let current = await f.store.detail(row.id);
    assert.equal(
      (
        await f.post(
          `/staff/api/revisions/${row.id}/submit`,
          { expectedVersion: current.lock_version },
          editor,
        )
      ).status,
      200,
    );
    current = await f.store.detail(row.id);
    assert.equal(
      (
        await f.post(
          `/staff/api/revisions/${row.id}/approve`,
          {
            expectedVersion: current.lock_version,
            expiresAt: "2026-12-20",
            note: "TEST: complete source and translation review.",
            checks: {
              sourceRead: true,
              hebrewChecked: true,
              englishChecked: true,
              scopeChecked: true,
            },
          },
          reviewer,
        )
      ).status,
      200,
    );
    const local = new LocalKnowledgeClient({
      send: (_url, opts) =>
        fetch(f.base + "/knowledge?domain=benefits&language=he", opts),
    });
    assert.equal(
      (await local.retrieve({ domain: "benefits", language: "he", now: NOW }))
        .length,
      1,
    );
    companion = createApp({ knowledge: local });
    companion.listen(0, "127.0.0.1");
    await once(companion, "listening");
    const base = `http://127.0.0.1:${companion.address().port}`,
      result = await fetch(base + "/api/knowledge?domain=benefits&language=he");
    assert.equal(result.status, 200);
    const data = await result.json();
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].title, row.content.title.he);
    assert.ok(!JSON.stringify(data).includes("password_hash"));
    assert.ok(!JSON.stringify(data).includes("test-reviewer"));
    assert.equal(
      (
        await fetch(
          base + "/api/knowledge?domain=benefits&language=he&message=private",
        )
      ).status,
      400,
    );
    current = await f.store.detail(row.id);
    assert.equal(
      (
        await f.post(
          `/staff/api/revisions/${row.id}/withdraw`,
          {
            expectedVersion: current.lock_version,
            note: "TEST: source must be rechecked.",
          },
          reviewer,
        )
      ).status,
      200,
    );
    assert.deepEqual(
      (
        await (
          await fetch(base + "/api/knowledge?domain=benefits&language=he")
        ).json()
      ).items,
      [],
    );
  } finally {
    if (companion) {
      companion.close();
      companion.closeAllConnections();
      await once(companion, "close");
    }
    await f.close();
  }
});
test("desk protects private assets, owner commands, payload bounds and login expiry/rate limits", async () => {
  let now = NOW.getTime();
  const f = await fixture({ clock: () => now, sessionTtl: 100, loginLimit: 3 });
  try {
    for (const path of [
      "/.env",
      "/.local/knowledge-owner.json",
      "/server/editorial.mjs",
      "/.git/config",
    ])
      assert.equal((await fetch(f.base + path)).status, 404);
    assert.equal((await f.post("/__staff", { action: "add" })).status, 403);
    assert.equal(
      (await f.post("/staff/api/login", { large: "a".repeat(31000) })).status,
      413,
    );
    const rebinding = await new Promise((resolve) => {
      const r = request(
        f.base + "/healthz",
        { headers: { Host: "evil.test" } },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      r.end();
    });
    assert.equal(rebinding, 403);
    const session = await f.login("reviewer");
    now += 101;
    assert.equal(
      (
        await fetch(f.base + "/staff/api/me", {
          headers: { Cookie: session.cookie },
        })
      ).status,
      401,
    );
    await f.post("/staff/api/login", { username: "none", password: "wrong" });
    assert.equal(
      (
        await f.post("/staff/api/login", {
          username: "none",
          password: "wrong",
        })
      ).status,
      429,
    );
    const preview = await (await fetch(f.base + "/staff/preview")).json();
    assert.equal(preview.status, "pending-professional-review");
    assert.equal(preview.items.length, 4);
  } finally {
    await f.close();
  }
});
test("local knowledge client fails closed for downtime, oversized responses, expiry and source spoofing", async () => {
  for (const send of [
    async () => {
      throw new Error("offline");
    },
    async () =>
      Response.json({
        items: [
          {
            id: "x",
            title: "x",
            body: "x",
            url: "https://www.gov.il.evil.test/",
            reviewed_at: "2026-11-01",
            expires_at: "2026-12-01",
          },
        ],
      }),
    async () =>
      Response.json({
        items: [
          {
            id: "x",
            title: "x",
            body: "x",
            url: "https://www.gov.il/",
            reviewed_at: "2026-11-01",
            expires_at: "2026-11-02",
          },
        ],
      }),
    async () => new Response("x".repeat(100001)),
  ]) {
    assert.deepEqual(
      await new LocalKnowledgeClient({ send }).retrieve({
        domain: "benefits",
        language: "he",
        now: NOW,
      }),
      [],
    );
  }
});
