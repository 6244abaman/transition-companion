import { createServer } from "node:http";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { EditorialError, PublishedKnowledgeRepository } from "./editorial.mjs";
const hash = (s) => createHash("sha256").update(s).digest("hex");
const equal = (a, b) => {
  const x = Buffer.from(a || ""),
    y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
};
async function body(req) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json")
    throw new EditorialError(415, "JSON required");
  let length = 0;
  const parts = [];
  for await (const p of req) {
    length += p.length;
    if (length > 30000) throw new EditorialError(413, "Request too large");
    parts.push(p);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch {
    throw new EditorialError(400, "Invalid JSON");
  }
}
const assets = new Map([
  ["/", ["staff/index.html", "text/html; charset=utf-8"]],
  ["/staff/", ["staff/index.html", "text/html; charset=utf-8"]],
  ["/staff/app.mjs", ["staff/app.mjs", "text/javascript; charset=utf-8"]],
  ["/staff/style.css", ["staff/style.css", "text/css; charset=utf-8"]],
  ["/staff/heebo.ttf", ["public/fonts/heebo.ttf", "font/ttf"]],
]);
export function createDesk({
  store,
  managementToken = "",
  clock = Date.now,
  sessionTtl = 15 * 60000,
  loginLimit = 15,
  seedSummary = [],
} = {}) {
  const sessions = new Map();
  let loginWindow = { start: clock(), count: 0 },
    apiWindow = { start: clock(), count: 0 };
  const published = new PublishedKnowledgeRepository(store.db);
  const server = createServer(async (req, res) => {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    };
    const reply = (
      status,
      value,
      type = "application/json; charset=utf-8",
      extra = {},
    ) => {
      res.writeHead(status, { ...headers, ...extra, "Content-Type": type });
      res.end(
        type.startsWith("application/json") ? JSON.stringify(value) : value,
      );
    };
    try {
      const origin = `http://127.0.0.1:${server.address().port}`,
        url = new URL(req.url, origin);
      if (
        req.headers.host !== new URL(origin).host ||
        (req.headers.origin && req.headers.origin !== origin) ||
        req.headers["sec-fetch-site"] === "cross-site"
      )
        return reply(403, { error: "Origin rejected" });
      if (!["GET", "POST", "HEAD"].includes(req.method))
        return reply(405, { error: "Method not supported" });
      if (
        req.method === "POST" &&
        req.headers.origin !== origin &&
        !url.pathname.startsWith("/__")
      )
        return reply(403, { error: "Same-origin request required" });
      if (req.url === "/healthz" && req.method === "GET")
        return reply(200, {
          service: "momentum-knowledge-desk",
          version: "0.2.0",
        });
      if (url.pathname.startsWith("/__")) {
        if (
          !managementToken ||
          !equal(req.headers.authorization, `Bearer ${managementToken}`)
        )
          return reply(403, { error: "Owner access required" });
        if (req.url === "/__owner" && req.method === "GET")
          return reply(200, { service: "momentum-knowledge-desk" });
        if (req.url === "/__shutdown" && req.method === "POST") {
          reply(200, { ok: true });
          server.close();
          server.closeIdleConnections();
          return;
        }
        if (req.url === "/__staff" && req.method === "POST") {
          const value = await body(req);
          if (value.action === "add")
            return reply(201, await store.addStaff(value));
          if (
            value.action === "disable" &&
            typeof value.username === "string"
          ) {
            await store.disableStaff(value.username);
            return reply(200, { ok: true });
          }
          return reply(400, { error: "Use add or disable" });
        }
        return reply(404, { error: "Not found" });
      }
      if (url.pathname === "/knowledge" && req.method === "GET") {
        if ([...url.searchParams.keys()].sort().join() !== "domain,language")
          return reply(400, { error: "Only domain and language are accepted" });
        return reply(200, {
          items: await published.retrieve({
            domain: url.searchParams.get("domain"),
            language: url.searchParams.get("language"),
            now: new Date(clock()),
          }),
        });
      }
      if (req.url === "/staff/preview" && req.method === "GET")
        return reply(200, {
          status: "pending-professional-review",
          items: seedSummary,
        });
      if (url.pathname.startsWith("/staff/api/")) {
        if (clock() - apiWindow.start >= 60000)
          apiWindow = { start: clock(), count: 0 };
        if (++apiWindow.count > 180)
          return reply(429, { error: "Please wait before retrying" });
        if (req.url === "/staff/api/login" && req.method === "POST") {
          if (clock() - loginWindow.start >= 5 * 60000)
            loginWindow = { start: clock(), count: 0 };
          for (const [id, s] of sessions)
            if (s.expires <= clock()) sessions.delete(id);
          if (++loginWindow.count > loginLimit || sessions.size >= 128)
            return reply(429, { error: "Please wait before signing in again" });
          const value = await body(req),
            staff = await store.login(value.username, value.password);
          const token = randomBytes(32).toString("hex"),
            csrf = randomBytes(32).toString("hex");
          sessions.set(hash(token), {
            staffId: staff.id,
            csrf,
            expires: clock() + sessionTtl,
          });
          return reply(
            200,
            { staff, csrf },
            "application/json; charset=utf-8",
            {
              "Set-Cookie": `momentum_staff=${token}; HttpOnly; SameSite=Strict; Path=/staff; Max-Age=${Math.floor(sessionTtl / 1000)}`,
            },
          );
        }
        const token = /\bmomentum_staff=([a-f0-9]{64})(?:;|$)/.exec(
          req.headers.cookie || "",
        )?.[1];
        const key = token && hash(token),
          session = key && sessions.get(key);
        if (!session || session.expires <= clock()) {
          if (key) sessions.delete(key);
          return reply(401, { error: "Staff sign-in required" });
        }
        const actor = await store.staff(session.staffId);
        if (!actor?.active) {
          sessions.delete(key);
          return reply(401, { error: "Staff sign-in required" });
        }
        if (
          req.method === "POST" &&
          !equal(req.headers["x-csrf-token"], session.csrf)
        )
          return reply(403, {
            error: "Refresh this staff session before saving",
          });
        if (req.url === "/staff/api/me" && req.method === "GET")
          return reply(200, { staff: actor, csrf: session.csrf });
        if (req.url === "/staff/api/logout" && req.method === "POST") {
          sessions.delete(key);
          return reply(200, { ok: true }, "application/json; charset=utf-8", {
            "Set-Cookie":
              "momentum_staff=; HttpOnly; SameSite=Strict; Path=/staff; Max-Age=0",
          });
        }
        if (req.url === "/staff/api/revisions" && req.method === "GET")
          return reply(200, { items: await store.list() });
        if (req.url === "/staff/api/revisions" && req.method === "POST")
          return reply(201, await store.create(actor, await body(req)));
        const match =
          /^\/staff\/api\/revisions\/([a-f0-9-]{36})(?:\/(save|submit|approve|reject|withdraw|revise))?$/.exec(
            url.pathname,
          );
        if (match && !url.search && req.method === "GET" && !match[2])
          return reply(200, await store.detail(match[1]));
        if (match?.[2] && !url.search && req.method === "POST")
          return reply(
            200,
            await store.act(actor, match[1], match[2], await body(req)),
          );
        return reply(404, { error: "Not found" });
      }
      const asset = assets.get(req.url);
      if (!asset || !["GET", "HEAD"].includes(req.method))
        return reply(404, { error: "Not found" });
      const data = await readFile(new URL("../" + asset[0], import.meta.url));
      reply(200, req.method === "HEAD" ? "" : data, asset[1]);
    } catch (e) {
      reply(e.status || 500, {
        error: e.status
          ? e.message
          : "The knowledge desk could not complete this action",
      });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
