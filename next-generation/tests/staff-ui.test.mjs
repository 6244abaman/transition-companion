import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import { mountDesk } from "../staff/app.mjs";
const seed = JSON.parse(
  await readFile(
    new URL("../knowledge/starter-set.json", import.meta.url),
    "utf8",
  ),
);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function fixture(role = "editor") {
  const dom = new JSDOM(
      await readFile(new URL("../staff/index.html", import.meta.url), "utf8"),
      { url: "http://127.0.0.1:43129/staff/" },
    ),
    doc = dom.window.document,
    calls = [];
  const staff = {
    id: "test-" + role,
    role,
    display_name: "Test " + role,
    professional_role: "Test-only role",
  };
  const content = structuredClone(seed.items[0]);
  content.title.he = "<img src=x onerror=alert(1)> Test";
  const row = {
    id: "00000000-0000-0000-0000-000000000001",
    topic_id: content.topicId,
    content,
    version: 1,
    lock_version: 1,
    status: role === "editor" ? "draft" : "in_review",
    events: [],
  };
  const app = mountDesk({
    document: doc,
    fetcher: async (url, opts = {}) => {
      calls.push({ url, opts });
      if (url === "/staff/preview") return Response.json({ items: seed.items });
      if (url.endsWith("/me"))
        return Response.json({ error: "login required" }, { status: 401 });
      if (url.endsWith("/login"))
        return Response.json({ staff, csrf: "test-csrf" });
      if (url.endsWith("/revisions")) return Response.json({ items: [row] });
      if (url.endsWith("/" + row.id)) return Response.json(row);
      return Response.json({ id: row.id });
    },
  });
  await tick();
  doc.getElementById("username").value = "test-" + role;
  doc.getElementById("password").value = "TEST ONLY passphrase";
  doc
    .getElementById("login")
    .dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
  await tick();
  return { dom, doc, app, calls, row, close: () => dom.window.close() };
}
test("staff interface switches Hebrew/English, escapes content and keeps imported drafts clearly pending", async () => {
  const f = await fixture();
  try {
    assert.equal(f.doc.documentElement.dir, "rtl");
    assert.equal(f.doc.querySelectorAll("#preview .card").length, 4);
    assert.equal(f.doc.getElementById("workspace").hidden, false);
    assert.equal(f.doc.getElementById("password").value, "");
    await f.app.select(f.row.id);
    assert.equal(f.doc.querySelectorAll("img").length, 0);
    f.doc.getElementById("language").click();
    await tick();
    assert.equal(f.doc.documentElement.dir, "ltr");
    assert.equal(f.doc.querySelectorAll("#detail button").length, 2);
    assert.equal(
      f.doc.getElementById("detail").textContent.includes("Approve both"),
      false,
    );
    const submit = [...f.doc.querySelectorAll("#detail button")].find(
      (b) => b.textContent === "Submit for review",
    );
    submit.click();
    await tick();
    assert.ok(f.calls.some((x) => x.url.endsWith("/submit")));
    assert.ok(
      f.calls.find((x) => x.url.endsWith("/submit")).opts.headers[
        "X-CSRF-Token"
      ],
    );
  } finally {
    f.close();
  }
});
test("reviewer sees paired translations and four explicit review checks; editor fields are absent", async () => {
  const f = await fixture("reviewer");
  try {
    await f.app.select(f.row.id);
    assert.equal(
      f.doc.querySelectorAll("#detail .bilingual section").length,
      2,
    );
    const checks = f.doc.querySelectorAll("#detail input[type=checkbox]");
    assert.equal(checks.length, 4);
    assert.ok([...checks].every((x) => !x.checked));
    assert.equal(
      f.doc.querySelectorAll("#detail .bilingual textarea").length,
      0,
    );
    assert.equal(f.doc.getElementById("new").hidden, true);
    assert.equal(
      f.doc.querySelectorAll(
        '#detail a[href^="https://www.hachvana.mod.gov.il/"]',
      ).length,
      1,
    );
  } finally {
    f.close();
  }
});
