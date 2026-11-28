import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { createApp } from "../server/gateway.mjs";
import { makePacket, emptyMemory } from "../shared/memory.mjs";
const env = {
  OPENAI_API_KEY: "provider-secret",
  OPENAI_MODEL: "test-model",
  GATEWAY_ACCESS_TOKEN: "private-gateway-token-with-entropy",
};
const packet = () => makePacket("I would like to study", emptyMemory("en"));
async function fixture(options = {}) {
  let calls = [];
  const app = createApp({
    env,
    send: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  reply: "Which subject interests you?",
                  suggestions: ["Compare two courses"],
                  citationIds: [],
                  needsHuman: false,
                }),
              },
            ],
          },
        ],
      });
    },
    ...options,
  });
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  const base = `http://127.0.0.1:${app.address().port}`;
  const post = (path, data, headers = {}) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GATEWAY_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });
  return {
    base,
    post,
    calls,
    close: async () => {
      app.close();
      app.closeAllConnections();
      await once(app, "close");
    },
  };
}
async function consent(f, p = packet()) {
  const r = await f.post("/api/consent", {
    packet: p,
    scope: "openai-request-v1",
  });
  assert.equal(r.status, 200);
  return (await r.json()).ticket;
}
test("no provider traffic before consent; request is single use, minimized and store:false; secrets are not served", async () => {
  const f = await fixture();
  try {
    assert.equal((await fetch(f.base + "/api/status")).status, 200);
    assert.equal(f.calls.length, 0);
    assert.equal(
      (await f.post("/api/respond", { packet: packet(), ticket: "invented" }))
        .status,
      403,
    );
    const ticket = await consent(f);
    assert.equal(f.calls.length, 0);
    const r = await f.post("/api/respond", { packet: packet(), ticket });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).mode, "openai");
    assert.equal(f.calls.length, 1);
    const payload = JSON.parse(f.calls[0].init.body);
    assert.equal(payload.store, false);
    assert.equal(payload.model, "test-model");
    assert.equal(payload.text.format.type, "json_schema");
    assert.equal(payload.tools, undefined);
    assert.equal(payload.previous_response_id, undefined);
    assert.equal(f.calls[0].url, "https://api.openai.com/v1/responses");
    assert.equal(
      (await f.post("/api/respond", { packet: packet(), ticket })).status,
      403,
    );
    for (const path of [
      "/.env",
      "/server/main.mjs",
      "/.git/config",
      "/../package.json",
      "/.local/owner.json",
    ])
      assert.equal((await fetch(f.base + path)).status, 404);
    const health = await (await fetch(f.base + "/healthz")).text();
    assert.ok(!health.includes("secret"));
  } finally {
    await f.close();
  }
});
test("authentication, origin, DNS rebinding, payload bounds, consent expiry and tampering are enforced", async () => {
  let now = 1;
  const f = await fixture({ clock: () => now, ticketTtl: 100 });
  try {
    assert.equal(
      (await f.post("/api/consent", {}, { Authorization: "" })).status,
      401,
    );
    assert.equal(
      (await f.post("/api/consent", {}, { Origin: "https://evil.test" }))
        .status,
      403,
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
    assert.equal(
      (await f.post("/api/consent", { packet: packet(), scope: "old" })).status,
      400,
    );
    assert.equal(
      (await f.post("/api/consent", { oversize: "x".repeat(41000) })).status,
      413,
    );
    let ticket = await consent(f);
    now = 102;
    assert.equal(
      (await f.post("/api/respond", { packet: packet(), ticket })).status,
      403,
    );
    ticket = await consent(f);
    assert.equal(
      (
        await f.post("/api/respond", {
          packet: { ...packet(), message: "another course" },
          ticket,
        })
      ).status,
      403,
    );
    assert.equal(f.calls.length, 0);
  } finally {
    await f.close();
  }
});
test("benefits without reviewed evidence and safety signals cannot reach the provider", async () => {
  const f = await fixture();
  try {
    for (const message of [
      "What benefits can I get?",
      "I want to kill myself",
    ]) {
      const p = makePacket(message, emptyMemory("en")),
        ticket = await consent(f, p),
        r = await f.post("/api/respond", { packet: p, ticket });
      assert.equal(r.status, 200);
      assert.notEqual((await r.json()).mode, "openai");
    }
    assert.equal(f.calls.length, 0);
  } finally {
    await f.close();
  }
});
test("refusals, malformed output, uncited benefits, provider errors and timeouts fail safely", async () => {
  for (const send of [
    async () => Response.json({ status: "incomplete", output: [] }),
    async () =>
      Response.json({
        status: "completed",
        output: [
          { type: "message", content: [{ type: "refusal", refusal: "no" }] },
        ],
      }),
    async () =>
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: '{"reply":"incomplete"}' }],
          },
        ],
      }),
    async () => Response.json({ error: "provider-secret" }, { status: 500 }),
    async (_url, init) => {
      await new Promise((resolve, reject) => {
        init.signal.addEventListener(
          "abort",
          () => reject(new Error("secret timeout")),
          { once: true },
        );
      });
    },
  ]) {
    const f = await fixture({ send, providerTimeout: 20 });
    try {
      const ticket = await consent(f);
      const r = await f.post("/api/respond", { packet: packet(), ticket });
      assert.equal(r.status, 502);
      assert.ok(!(await r.text()).includes("secret"));
    } finally {
      await f.close();
    }
  }
});
test("rate limiting and disabled mode reject provider requests", async () => {
  const f = await fixture({ rateLimit: 1 });
  try {
    await consent(f);
    assert.equal(
      (
        await f.post("/api/consent", {
          packet: packet(),
          scope: "openai-request-v1",
        })
      ).status,
      429,
    );
  } finally {
    await f.close();
  }
  const off = await fixture({ env: {} });
  try {
    assert.equal((await off.post("/api/respond", {})).status, 503);
    assert.equal(off.calls.length, 0);
  } finally {
    await off.close();
  }
});
test("benefits answers require retrieved citation IDs; only server provenance is returned", async () => {
  for (const ids of [[], ["invented"], ["reviewed"]]) {
    const knowledge = {
      retrieve: async () => [
        {
          id: "reviewed",
          title: "TEST FIXTURE ONLY",
          body: "Not an actual benefit",
          url: "https://www.gov.il/",
          reviewed_at: "2026-11-25",
          expires_at: "2026-12-25",
        },
      ],
    };
    const f = await fixture({
      knowledge,
      send: async () =>
        Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    reply: "Consult the reviewed source.",
                    suggestions: [],
                    needsHuman: false,
                    citationIds: ids,
                  }),
                },
              ],
            },
          ],
        }),
    });
    try {
      const p = makePacket("benefits", emptyMemory("en")),
        ticket = await consent(f, p),
        r = await f.post("/api/respond", { packet: p, ticket });
      assert.equal(r.status, ids[0] === "reviewed" ? 200 : 502);
      if (r.status === 200) {
        const a = await r.json();
        assert.equal(a.citations[0].url, "https://www.gov.il/");
        assert.equal(a.citations[0].reviewedAt, "2026-11-25");
      }
    } finally {
      await f.close();
    }
  }
});
