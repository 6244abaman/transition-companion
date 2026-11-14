"use strict";

/* Minimal encrypted-snapshot relay. The service stores only AES-GCM envelopes,
   never profile JSON, keys, pairing secrets, or conversation text. */
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const MAX_BODY = 8 * 1024 * 1024;
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || "https://6244abaman.github.io,http://localhost:8000,http://127.0.0.1:8000")
  .split(",").map(x => x.trim()).filter(Boolean));
const dbPath = process.env.SYNC_DB_PATH || path.join(__dirname, "data", "sync.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS sync_records (
    id TEXT PRIMARY KEY,
    token_hash BLOB NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    envelope TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sync_records_updated_at ON sync_records(updated_at);`);
db.prepare("DELETE FROM sync_records WHERE updated_at < ?").run(new Date(Date.now() - MAX_AGE_MS).toISOString());

const createLimits = new Map();
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  res.end(JSON.stringify(body));
}
function cors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (!ALLOWED_ORIGINS.has(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,If-Match");
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [], rejected = false;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        if (!rejected) reject(Object.assign(new Error("Request too large"), { status: 413 }));
        rejected = true;
        chunks = [];
        return;
      }
      if (!rejected) chunks.push(chunk);
    });
    req.on("end", () => {
      if (rejected) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}
function validEnvelope(value) {
  return value && value.version === 1 &&
    typeof value.salt === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value.salt) &&
    typeof value.iv === "string" && /^[A-Za-z0-9_-]{16,32}$/.test(value.iv) &&
    typeof value.ciphertext === "string" && /^[A-Za-z0-9_-]{16,7000000}$/.test(value.ciphertext);
}
function authorized(req, id) {
  const token = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(req.headers.authorization || "")?.[1];
  if (!token) return null;
  const row = db.prepare("SELECT id, token_hash, revision, envelope, created_at, updated_at FROM sync_records WHERE id = ?").get(id);
  if (!row || Date.now() - Date.parse(row.updated_at) > MAX_AGE_MS) return null;
  const candidate = crypto.createHash("sha256").update(token).digest();
  return crypto.timingSafeEqual(row.token_hash, candidate) ? row : null;
}
function snapshot(row) {
  return { revision: row.revision, updatedAt: row.updated_at, envelope: row.envelope ? JSON.parse(row.envelope) : null };
}
function createServer() {
  return http.createServer(async (req, res) => {
    if (!cors(req, res)) return json(res, 403, { error: "origin_not_allowed" });
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/health" && req.method === "GET") return json(res, 200, { status: "ok" });
    if (url.pathname === "/v1/sync" && req.method === "POST") {
      const clientIp = crypto.createHash("sha256").update(req.socket.remoteAddress || "unknown").digest("hex");
      const now = Date.now(), recent = (createLimits.get(clientIp) || []).filter(t => now - t < 60 * 60 * 1000);
      if (recent.length >= 5) return json(res, 429, { error: "creation_rate_limited" });
      recent.push(now); createLimits.set(clientIp, recent);
      const id = crypto.randomBytes(18).toString("base64url");
      const token = crypto.randomBytes(32).toString("base64url");
      const stamp = new Date().toISOString();
      db.prepare("INSERT INTO sync_records(id, token_hash, revision, envelope, created_at, updated_at) VALUES (?, ?, 0, NULL, ?, ?)")
        .run(id, crypto.createHash("sha256").update(token).digest(), stamp, stamp);
      return json(res, 201, { id, token, revision: 0 });
    }
    const match = /^\/v1\/sync\/([A-Za-z0-9_-]{20,40})$/.exec(url.pathname);
    if (!match) return json(res, 404, { error: "not_found" });
    const id = match[1], row = authorized(req, id);
    if (!row) return json(res, 404, { error: "not_found" });
    if (req.method === "GET") return json(res, 200, snapshot(row));
    if (req.method === "DELETE") {
      db.prepare("DELETE FROM sync_records WHERE id = ?").run(id);
      return json(res, 200, { deleted: true });
    }
    if (req.method === "PUT") {
      let expected = Number(req.headers["if-match"]);
      if (!Number.isInteger(expected) || expected < 0) return json(res, 428, { error: "if_match_required" });
      if (expected !== row.revision) return json(res, 409, { error: "revision_conflict", revision: row.revision, updatedAt: row.updated_at });
      let body;
      try { body = await readBody(req); }
      catch (error) { return json(res, error.status || 400, { error: error.status === 413 ? "payload_too_large" : "invalid_json" }); }
      if (!validEnvelope(body)) return json(res, 400, { error: "invalid_envelope" });
      const updatedAt = new Date().toISOString(), revision = row.revision + 1;
      const result = db.prepare("UPDATE sync_records SET envelope = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?")
        .run(JSON.stringify(body), revision, updatedAt, id, row.revision);
      if (Number(result.changes) !== 1) {
        const current = db.prepare("SELECT revision, updated_at FROM sync_records WHERE id = ?").get(id);
        return json(res, 409, { error: "revision_conflict", revision: current?.revision ?? row.revision, updatedAt: current?.updated_at ?? row.updated_at });
      }
      return json(res, 200, { revision, updatedAt });
    }
    return json(res, 405, { error: "method_not_allowed" });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  createServer().listen(port, "0.0.0.0", () => console.log(`Encrypted sync relay listening on ${port}`));
}
module.exports = { createServer, db, validEnvelope };
