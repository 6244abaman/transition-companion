import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { KnowledgeRepository, approvedUrl } from "../server/knowledge.mjs";
test("real PostgreSQL engine migration and retrieval exclude drafts, expired, future and unapproved sources", async () => {
  const db = new PGlite();
  try {
    const sql = await readFile(
      new URL("../server/schema.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.query(
      "INSERT INTO knowledge_sources VALUES ('official','https://www.hachvana.mod.gov.il/','Official',true),('evil','https://www.hachvana.mod.gov.il.evil.test/','Spoof',true),('unapproved','https://www.gov.il/','Pending',false)",
    );
    for (const [id, source, status, start, end] of [
      ["valid", "official", "approved", "2026-11-20", "2026-12-20"],
      ["draft", "official", "draft", null, null],
      ["expired", "official", "approved", "2026-01-01", "2026-02-01"],
      ["future", "official", "approved", "2026-12-01", "2026-12-20"],
      ["spoof", "evil", "approved", "2026-11-20", "2026-12-20"],
      ["pending", "unapproved", "approved", "2026-11-20", "2026-12-20"],
    ])
      await db.query(
        "INSERT INTO knowledge_items (id,source_id,domain,language,title,body,status,reviewed_at,expires_at,reviewed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          id,
          source,
          "benefits",
          "he",
          "TEST FIXTURE ONLY",
          "Not a real benefit",
          status,
          start,
          end,
          "test-staff",
        ],
      );
    const repo = new KnowledgeRepository(db),
      records = await repo.retrieve({
        domain: "benefits",
        language: "he",
        now: new Date("2026-11-25T12:00:00Z"),
      });
    assert.deepEqual(
      records.map((r) => r.id),
      ["valid"],
    );
    assert.equal(
      (await repo.retrieve({ domain: "benefits", language: "en" })).length,
      0,
    );
    await assert.rejects(
      repo.retrieve({
        domain: "benefits'; DROP TABLE knowledge_items;--",
        language: "he",
      }),
    );
    const tables = (
      await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
      )
    ).rows.map((x) => x.table_name);
    assert.deepEqual(tables, [
      "knowledge_admin_audit",
      "knowledge_items",
      "knowledge_sources",
    ]);
  } finally {
    await db.close();
  }
});
test("knowledge is fail closed with no database; URLs cannot impersonate official sources", async () => {
  assert.deepEqual(
    await new KnowledgeRepository().retrieve({
      domain: "benefits",
      language: "he",
    }),
    [],
  );
  for (const url of [
    "http://www.gov.il/",
    "https://gov.il.evil.test/",
    "https://user:pass@www.gov.il/",
    "https://www.gov.il:444/",
    "javascript:alert(1)",
  ])
    assert.equal(approvedUrl(url), false);
  assert.equal(approvedUrl("https://shikum.mod.gov.il/"), true);
});
