import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  EditorialStore,
  migrateEditorial,
  PublishedKnowledgeRepository,
  validateContent,
} from "../server/editorial.mjs";
const seed = JSON.parse(
  await readFile(
    new URL("../knowledge/starter-set.json", import.meta.url),
    "utf8",
  ),
);
const NOW = new Date("2026-11-25T20:00:00Z"),
  password = "test-only strong passphrase 123";
export const checks = {
  sourceRead: true,
  hebrewChecked: true,
  englishChecked: true,
  scopeChecked: true,
};
export async function fixture() {
  const db = new PGlite();
  await migrateEditorial(db);
  const store = new EditorialStore(db, { clock: () => NOW });
  const editor = await store.addStaff({
    username: "test-editor",
    displayName: "Test Editor",
    professionalRole: "Test content editor",
    role: "editor",
    password,
  });
  const reviewer = await store.addStaff({
    username: "test-reviewer",
    displayName: "Test Reviewer",
    professionalRole: "Test-only review role",
    role: "reviewer",
    password,
  });
  return {
    db,
    store,
    editor,
    reviewer,
    repo: new PublishedKnowledgeRepository(db),
    close: () => db.close(),
  };
}
export async function submit(f, content = structuredClone(seed.items[3])) {
  const created = await f.store.create(f.editor, content),
    r = await f.store.detail(created.id);
  await f.store.act(f.editor, r.id, "submit", {
    expectedVersion: r.lock_version,
  });
  return f.store.detail(r.id);
}
const approval = (r) => ({
  expectedVersion: r.lock_version,
  checks,
  expiresAt: "2026-12-20T23:59:59Z",
  note: "TEST ONLY: checked both translations and the source.",
});
test("migration is repeatable; starter set loads as four bilingual drafts and never self-approves", async () => {
  const f = await fixture();
  try {
    await migrateEditorial(f.db);
    assert.equal(await f.store.importSeed(seed.items), 4);
    assert.equal(await f.store.importSeed(seed.items), 0);
    const rows = await f.store.list();
    assert.equal(rows.length, 4);
    assert.ok(
      rows.every(
        (x) => x.status === "draft" && x.content.title.he && x.content.title.en,
      ),
    );
    assert.deepEqual(
      await f.repo.retrieve({ domain: "benefits", language: "he", now: NOW }),
      [],
    );
    assert.equal(
      (await f.db.query("SELECT count(*)::int AS n FROM knowledge_items"))
        .rows[0].n,
      0,
    );
    const row = rows[0],
      edited = structuredClone(row.content);
    edited.body.en += " Test change.";
    await f.store.act(f.editor, row.id, "save", {
      expectedVersion: row.lock_version,
      content: edited,
    });
    await f.store.importSeed(seed.items);
    assert.equal(
      (await f.store.detail(row.id)).content.body.en,
      edited.body.en,
    );
  } finally {
    await f.close();
  }
});
test("independent approval publishes Hebrew and English together with source dates and append-only audit", async () => {
  const f = await fixture();
  try {
    const r = await submit(f);
    await assert.rejects(f.store.act(f.editor, r.id, "approve", approval(r)), {
      status: 403,
    });
    await assert.rejects(
      f.store.act(
        { ...f.editor, role: "reviewer" },
        r.id,
        "approve",
        approval(r),
      ),
      { status: 403 },
    );
    await f.store.act(f.reviewer, r.id, "approve", approval(r));
    for (const language of ["he", "en"]) {
      const rows = await f.repo.retrieve({
        domain: "benefits",
        language,
        now: NOW,
      });
      assert.equal(rows.length, 1);
      assert.ok(rows[0].body.includes(r.content.scope[language]));
      assert.equal(rows[0].version, 1);
    }
    const reviewed = await f.store.detail(r.id);
    assert.equal(reviewed.reviewed_by, f.reviewer.id);
    assert.equal(
      reviewed.attestation.professionalRole,
      "Test-only review role",
    );
    assert.deepEqual(
      reviewed.events.map((x) => x.action),
      ["create", "submit", "approve"],
    );
    await assert.rejects(
      f.db.query(
        "UPDATE knowledge_review_events SET note='changed' WHERE revision_id=$1",
        [r.id],
      ),
      /append only/,
    );
    await assert.rejects(
      f.db.query("DELETE FROM knowledge_revisions WHERE id=$1", [r.id]),
      /history/,
    );
    await assert.rejects(
      f.db.query(
        'UPDATE knowledge_revisions SET content=content || \'{"domain":"general"}\'::jsonb WHERE id=$1',
        [r.id],
      ),
      /immutable/,
    );
  } finally {
    await f.close();
  }
});
test("approval requires complete checks, fresh source, meaningful note, expiry and latest version", async () => {
  const f = await fixture();
  try {
    const r = await submit(f);
    for (const data of [
      { ...approval(r), checks: { ...checks, englishChecked: false } },
      { ...approval(r), note: "ok" },
      { ...approval(r), expiresAt: "2026-11-01" },
      { ...approval(r), expiresAt: "2028-01-01" },
      { ...approval(r), expectedVersion: 1 },
    ])
      await assert.rejects(f.store.act(f.reviewer, r.id, "approve", data));
    assert.equal((await f.store.detail(r.id)).status, "in_review");
    assert.deepEqual(
      await f.repo.retrieve({ domain: "benefits", language: "en", now: NOW }),
      [],
    );
    await f.db.query("UPDATE knowledge_staff SET role='reviewer' WHERE id=$1", [
      f.editor.id,
    ]);
    await assert.rejects(f.store.act(f.editor, r.id, "approve", approval(r)), {
      status: 403,
    });
  } finally {
    await f.close();
  }
});
test("draft conflicts, rejected revisions and source/translation validation preserve history", async () => {
  const f = await fixture();
  try {
    for (const change of [
      (c) => (c.title.en = ""),
      (c) => (c.source.url = "https://www.gov.il.evil.test/"),
      (c) => (c.source.checkedAt = "2026-02-31"),
      (c) => (c.source.checkedAt = "2027-01-01"),
      (c) => (c.body.he = "a".repeat(3001)),
    ]) {
      const c = structuredClone(seed.items[0]);
      change(c);
      assert.throws(() => validateContent(c, NOW), { status: 400 });
    }
    const r = await submit(f);
    await f.store.act(f.reviewer, r.id, "reject", {
      expectedVersion: r.lock_version,
      note: "TEST: revise the translation for clarity.",
    });
    const rejected = await f.store.detail(r.id);
    await assert.rejects(
      f.store.act(f.editor, r.id, "save", {
        expectedVersion: rejected.lock_version,
        content: r.content,
      }),
      { status: 409 },
    );
    const next = await f.store.act(f.editor, r.id, "revise", {
      expectedVersion: rejected.lock_version,
    });
    const draft = await f.store.detail(next.id);
    assert.equal(draft.version, 2);
    await f.store.act(f.editor, draft.id, "save", {
      expectedVersion: 1,
      content: draft.content,
    });
    await assert.rejects(
      f.store.act(f.editor, draft.id, "save", {
        expectedVersion: 1,
        content: draft.content,
      }),
      { status: 409 },
    );
    await assert.rejects(
      f.store.act(f.editor, r.id, "revise", {
        expectedVersion: rejected.lock_version,
      }),
      { status: 409 },
    );
  } finally {
    await f.close();
  }
});
test("replacement preserves the old publication until approval; withdrawal and expiry immediately hide both languages", async () => {
  const f = await fixture();
  try {
    const r = await submit(f);
    await f.store.act(f.reviewer, r.id, "approve", approval(r));
    const approved = await f.store.detail(r.id);
    const next = await f.store.act(f.editor, r.id, "revise", {
      expectedVersion: approved.lock_version,
    });
    let draft = await f.store.detail(next.id);
    assert.equal(
      (
        await f.repo.retrieve({ domain: "benefits", language: "he", now: NOW })
      )[0].version,
      1,
    );
    draft.content.body.en += " TEST revised.";
    await f.store.act(f.editor, draft.id, "save", {
      expectedVersion: draft.lock_version,
      content: draft.content,
    });
    draft = await f.store.detail(draft.id);
    await f.store.act(f.editor, draft.id, "submit", {
      expectedVersion: draft.lock_version,
    });
    draft = await f.store.detail(draft.id);
    await f.store.act(f.reviewer, draft.id, "approve", approval(draft));
    assert.equal(
      (
        await f.repo.retrieve({ domain: "benefits", language: "en", now: NOW })
      )[0].version,
      2,
    );
    assert.equal((await f.store.detail(r.id)).status, "superseded");
    assert.deepEqual(
      await f.repo.retrieve({
        domain: "benefits",
        language: "he",
        now: new Date("2027-01-01"),
      }),
      [],
    );
    const current = await f.store.detail(draft.id);
    await f.store.act(f.reviewer, current.id, "withdraw", {
      expectedVersion: current.lock_version,
      note: "TEST: source changed; remove until rechecked.",
    });
    for (const language of ["he", "en"])
      assert.deepEqual(
        await f.repo.retrieve({ domain: "benefits", language, now: NOW }),
        [],
      );
  } finally {
    await f.close();
  }
});
test("failed publication rolls back review state, audit and both language records", async () => {
  const f = await fixture();
  try {
    const r = await submit(f);
    await f.db.exec(
      "CREATE FUNCTION fail_english() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.language='en' THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fail_english BEFORE INSERT ON knowledge_items FOR EACH ROW EXECUTE FUNCTION fail_english();",
    );
    await assert.rejects(
      f.store.act(f.reviewer, r.id, "approve", approval(r)),
      /test failure/,
    );
    assert.equal((await f.store.detail(r.id)).status, "in_review");
    assert.equal(
      (await f.db.query("SELECT count(*)::int AS n FROM knowledge_items"))
        .rows[0].n,
      0,
    );
    assert.ok(
      !(await f.store.detail(r.id)).events.some((x) => x.action === "approve"),
    );
  } finally {
    await f.close();
  }
});
test("published view excludes direct table edits that differ from the approved revision", async () => {
  const f = await fixture();
  try {
    const r = await submit(f);
    await f.store.act(f.reviewer, r.id, "approve", approval(r));
    await f.db.query(
      "UPDATE knowledge_items SET body='Unreviewed changed content' WHERE language='en'",
    );
    assert.deepEqual(
      await f.repo.retrieve({ domain: "benefits", language: "en", now: NOW }),
      [],
    );
  } finally {
    await f.close();
  }
});
test("embedded knowledge persists across a clean process-level database close and reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "momentum-knowledge-"));
  let db;
  try {
    db = await PGlite.create(directory);
    await migrateEditorial(db);
    const store = new EditorialStore(db, { clock: () => NOW });
    await store.importSeed(seed.items);
    await db.close();
    db = await PGlite.create(directory);
    assert.equal((await new EditorialStore(db).list()).length, 4);
  } finally {
    await db?.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith("momentum-knowledge-"));
    await rm(directory, { recursive: true, force: true });
  }
});
