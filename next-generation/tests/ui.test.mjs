import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { PrivateVault } from "../public/vault.mjs";
import { mountApp } from "../public/app.mjs";
const tick = () => new Promise((r) => setTimeout(r, 0));
async function waitFor(check) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await tick();
  }
  throw new Error("UI did not become ready");
}
async function setCode(f) {
  f.click("privacy");
  await waitFor(() => f.doc.querySelectorAll("#panel input").length >= 3);
  const p = f.doc.getElementById("panel-content"),
    inputs = p.querySelectorAll("input");
  inputs[inputs.length - 1].value = "private-gateway-token-with-entropy";
  [...p.querySelectorAll("button")]
    .find((b) => b.textContent.includes("שמירת קוד"))
    .click();
}
async function fixture(ai = false) {
  const dom = new JSDOM(
      await readFile(new URL("../public/index.html", import.meta.url), "utf8"),
      { url: "http://127.0.0.1:43128/" },
    ),
    calls = [];
  const w = dom.window,
    doc = w.document;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const vault = new PrivateVault({ indexedDB: new IDBFactory() });
  const app = mountApp({
    document: doc,
    window: w,
    vault,
    fetcher: async (url, opts) => {
      calls.push({ url, opts });
      return Response.json({ ai });
    },
  });
  await tick();
  const click = (id) => doc.getElementById(id).click();
  return {
    dom,
    w,
    doc,
    app,
    vault,
    calls,
    click,
    close: () => {
      vault.close();
      dom.window.close();
    },
  };
}
test("chat is home with four starters, no intake; typed HTML is text; Hebrew/English preserves one thread", async () => {
  const f = await fixture();
  try {
    assert.equal(f.doc.documentElement.dir, "rtl");
    assert.equal(f.doc.querySelectorAll(".starters button").length, 4);
    const input = f.doc.getElementById("message");
    input.value = "<img src=x onerror=alert(1)>";
    input.dispatchEvent(new f.w.Event("input"));
    assert.ok(f.doc.getElementById("starters").hidden);
    await f.app.submit();
    assert.equal(f.doc.querySelectorAll("#messages img").length, 0);
    assert.ok(f.doc.getElementById("messages").textContent.includes("<img"));
    f.click("language");
    assert.equal(f.doc.documentElement.dir, "ltr");
    assert.equal(f.app.getMemory().messages.length, 2);
    assert.deepEqual(
      f.calls.map((x) => x.url),
      ["/api/status"],
    );
    f.click("journey");
    assert.match(
      f.doc.getElementById("panel-content").textContent,
      /No saved steps/,
    );
    assert.equal(
      f.doc.querySelectorAll("input[type=email],input[type=tel]").length,
      0,
    );
  } finally {
    f.close();
  }
});
test("AI is gated behind session access code and exact request preview; cancellation sends no personal data", async () => {
  const f = await fixture(true);
  try {
    await setCode(f);
    f.doc.getElementById("message").value = "I need a job";
    await f.app.submit();
    assert.equal(f.doc.getElementById("panel").open, true);
    assert.deepEqual(
      JSON.parse(f.doc.querySelector("pre").textContent).context,
      { goals: [], strengths: [], recent: [] },
    );
    assert.equal(
      f.doc.querySelector("#panel input[type=checkbox]").checked,
      false,
    );
    f.click("close-panel");
    assert.deepEqual(
      f.calls.map((x) => x.url),
      ["/api/status"],
    );
  } finally {
    f.close();
  }
});
test("an approved AI reply cannot repopulate private memory after the user locks", async () => {
  const dom = new JSDOM(
      await readFile(new URL("../public/index.html", import.meta.url), "utf8"),
      { url: "http://127.0.0.1:43128/" },
    ),
    w = dom.window,
    doc = w.document;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const vault = new PrivateVault({ indexedDB: new IDBFactory() });
  let release,
    responding = false;
  const app = mountApp({
    document: doc,
    window: w,
    vault,
    fetcher: async (url) => {
      if (url === "/api/status") return Response.json({ ai: true });
      if (url === "/api/consent") return Response.json({ ticket: "test" });
      responding = true;
      return new Promise((resolve) => {
        release = () =>
          resolve(
            Response.json({
              reply: "OLD PRIVATE REPLY",
              suggestions: [],
              citations: [],
            }),
          );
      });
    },
  });
  const f = { doc, click: (id) => doc.getElementById(id).click() };
  try {
    await tick();
    await setCode(f);
    doc.getElementById("message").value = "I need a job";
    await app.submit();
    [...doc.querySelectorAll("#panel button")]
      .find((b) => b.textContent.includes("אישור ושליחה"))
      .click();
    await waitFor(() => responding);
    f.click("privacy");
    await waitFor(() => doc.querySelectorAll("#panel input").length >= 3);
    [...doc.querySelectorAll("#panel button")]
      .find((b) => b.textContent.includes("נעילה ויציאה"))
      .click();
    await tick();
    release();
    await tick();
    assert.equal(app.getMemory().messages.length, 0);
    assert.ok(!doc.body.textContent.includes("OLD PRIVATE REPLY"));
  } finally {
    vault.close();
    dom.window.close();
  }
});
test("help and benefits stay outside the transcript; direct dial, links and close work; no fake coordinator", async () => {
  const f = await fixture();
  try {
    f.click("help");
    const p = f.doc.getElementById("panel-content");
    assert.ok(p.querySelector('a[href^="tel:1201"]'));
    assert.ok(p.querySelector('a[href^="https://shikum.mod.gov.il"]'));
    assert.ok(!p.textContent.includes("רכז"));
    f.click("close-panel");
    assert.equal(f.doc.getElementById("panel").open, false);
    f.click("benefits");
    assert.ok(
      !f.doc.getElementById("messages").textContent.includes("25.11.2026"),
    );
    assert.equal(f.doc.querySelectorAll("#panel .source").length, 2);
  } finally {
    f.close();
  }
});
