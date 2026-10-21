/* Client-side AES-GCM backup helper for My Journey.
   Protects the exported file, not browser localStorage. No network calls. */
(function (root) {
  "use strict";
  const FORMAT = "momentum-journey-encrypted-v1";
  const ITERATIONS = 250000;
  function cryptoApi() {
    const c = root.crypto;
    if (!c || !c.subtle || !c.getRandomValues) throw new Error("Secure backup requires HTTPS and Web Crypto support.");
    return c;
  }
  function b64(arr) {
    let chars = "";
    for (let i = 0; i < arr.length; i += 8192) {
      chars += String.fromCharCode.apply(null, arr.slice(i, i + 8192));
    }
    return root.btoa(chars);
  }
  function unb64(s) {
    if (typeof s !== "string" || s.length > 1500000) throw new Error("Invalid backup encoding");
    const chars = root.atob(s);
    return Uint8Array.from(chars, c => c.charCodeAt(0));
  }
  async function key(password, salt, iterations) {
    const c = cryptoApi();
    const encoder = new TextEncoder();
    const base = await c.subtle.importKey("raw", encoder.encode(password),
      "PBKDF2", false, ["deriveKey"]);
    return c.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encrypt(profile, password) {
    const c = cryptoApi();
    if (typeof password !== "string" || password.length < 10) throw new Error("Use a password of at least 10 characters");
    const salt = c.getRandomValues(new Uint8Array(16));
    const iv = c.getRandomValues(new Uint8Array(12));
    const material = await key(password, salt, ITERATIONS);
    const data = new TextEncoder().encode(JSON.stringify(profile));
    const ciphertext = new Uint8Array(await c.subtle.encrypt({ name: "AES-GCM", iv }, material, data));
    return { format: FORMAT, version: 1, algorithm: "AES-256-GCM", kdf: "PBKDF2-SHA256",
      iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), ciphertext: b64(ciphertext) };
  }
  async function decrypt(backup, password) {
    if (!backup || backup.format !== FORMAT || backup.version !== 1 ||
      backup.algorithm !== "AES-256-GCM" || backup.kdf !== "PBKDF2-SHA256" ||
      backup.iterations !== ITERATIONS) throw new Error("Unsupported encrypted backup");
    if (typeof password !== "string" || !password) throw new Error("Password required");
    const c = cryptoApi();
    const salt = unb64(backup.salt), iv = unb64(backup.iv), ciphertext = unb64(backup.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || !ciphertext.length) throw new Error("Invalid backup data");
    const material = await key(password, salt, ITERATIONS);
    const plain = await c.subtle.decrypt({ name: "AES-GCM", iv }, material, ciphertext);
    return JSON.parse(new TextDecoder().decode(plain));
  }
  root.MomentumJourneyBackup = { FORMAT, encrypt, decrypt };
})(window);