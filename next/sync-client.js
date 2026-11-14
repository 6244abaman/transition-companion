/* User-triggered, end-to-end encrypted snapshot synchronization. */
(function (root) {
  "use strict";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const b64url = bytes => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const unb64url = value => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)), c => c.charCodeAt(0));
  const random = n => { const bytes = new Uint8Array(n); root.crypto.getRandomValues(bytes); return bytes; };
  const fromHex = hex => Uint8Array.from(hex.match(/.{2}/g) || [], x => parseInt(x, 16));

  function validEndpoint(value) {
    try {
      const u = new URL(value);
      return (u.protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) && !u.username && !u.password && !u.search && !u.hash;
    } catch (_) { return false; }
  }
  function endpoint(value) {
    if (!validEndpoint(value)) throw new Error("Use a trusted HTTPS sync service URL.");
    return new URL(value).origin + new URL(value).pathname.replace(/\/+$/, "");
  }
  async function encryptSnapshot(snapshot, secret) {
    const keyBytes = unb64url(secret);
    if (keyBytes.length !== 32) throw new Error("The sync encryption secret is invalid.");
    const salt = random(16), iv = random(12);
    const material = await root.crypto.subtle.importKey("raw", keyBytes, "HKDF", false, ["deriveKey"]);
    const key = await root.crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("Momentum Companion encrypted sync v1") }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const ciphertext = await root.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(snapshot)));
    return { version: 1, salt: b64url(salt), iv: b64url(iv), ciphertext: b64url(new Uint8Array(ciphertext)) };
  }
  async function decryptSnapshot(envelope, secret) {
    if (!envelope || envelope.version !== 1) throw new Error("Unsupported encrypted snapshot.");
    const keyBytes = unb64url(secret);
    if (keyBytes.length !== 32) throw new Error("The sync encryption secret is invalid.");
    const material = await root.crypto.subtle.importKey("raw", keyBytes, "HKDF", false, ["deriveKey"]);
    const key = await root.crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: unb64url(envelope.salt), info: encoder.encode("Momentum Companion encrypted sync v1") }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const plaintext = await root.crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64url(envelope.iv) }, key, unb64url(envelope.ciphertext));
    return JSON.parse(decoder.decode(plaintext));
  }
  async function fingerprint(snapshot) {
    return [...new Uint8Array(await root.crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(snapshot))))]
      .map(x => x.toString(16).padStart(2, "0")).join("");
  }
  async function create(endpointUrl) {
    const base = endpoint(endpointUrl);
    const res = await fetch(base + "/v1/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
    if (!res.ok) throw new Error("Could not create an encrypted sync space (HTTP " + res.status + ").");
    const data = await res.json();
    return { endpoint: base, id: data.id, token: data.token, secret: b64url(random(32)), revision: data.revision, fingerprint: "" };
  }
  function pairingCode(credentials) {
    const payload = JSON.stringify({ version: 1, endpoint: credentials.endpoint, id: credentials.id, token: credentials.token, secret: credentials.secret });
    return b64url(encoder.encode(payload));
  }
  function parsePairingCode(code) {
    let value;
    try { value = JSON.parse(decoder.decode(unb64url(String(code || "").trim()))); }
    catch (_) { throw new Error("That pairing code is invalid or incomplete."); }
    if (value?.version !== 1 || !validEndpoint(value.endpoint) || !/^[A-Za-z0-9_-]{20,40}$/.test(value.id || "") || !/^[A-Za-z0-9_-]{40,100}$/.test(value.token || "") || unb64url(value.secret || "").length !== 32) throw new Error("That pairing code is invalid or incomplete.");
    return { ...value, endpoint: endpoint(value.endpoint), revision: null, fingerprint: "" };
  }
  async function request(credentials, method = "GET", body, revision) {
    const headers = { Authorization: "Bearer " + credentials.token };
    if (body) headers["Content-Type"] = "application/json";
    if (revision !== undefined) headers["If-Match"] = String(revision);
    const res = await fetch(credentials.endpoint + "/v1/sync/" + encodeURIComponent(credentials.id), { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error === "revision_conflict" ? "Another device has updated this profile." : "Encrypted sync failed (HTTP " + res.status + ").");
      error.status = res.status; error.data = data; throw error;
    }
    return data;
  }
  async function upload(credentials, snapshot, revision) {
    const envelope = await encryptSnapshot(snapshot, credentials.secret);
    return request(credentials, "PUT", envelope, revision);
  }
  async function download(credentials) {
    const remote = await request(credentials);
    return { ...remote, snapshot: remote.envelope ? await decryptSnapshot(remote.envelope, credentials.secret) : null };
  }
  async function remove(credentials) { return request(credentials, "DELETE"); }

  const api = { validEndpoint, encryptSnapshot, decryptSnapshot, fingerprint, create, pairingCode, parsePairingCode, upload, download, remove };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MomentumSync = api;
})(typeof window === "undefined" ? globalThis : window);
