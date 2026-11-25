import { validateMemory } from "../shared/memory.mjs";
const FORMAT = "momentum-private-memory-v1",
  ITERATIONS = 600000;
const enc = new TextEncoder(),
  dec = new TextDecoder();
const b64 = (b) => {
  const a = new Uint8Array(b);
  let s = "";
  for (let i = 0; i < a.length; i += 4096)
    s += String.fromCharCode(...a.subarray(i, i + 4096));
  return btoa(s);
};
const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function keyFor(passphrase, salt, cryptoApi) {
  if (
    typeof passphrase !== "string" ||
    passphrase.length < 12 ||
    passphrase.length > 1024
  )
    throw new Error("Use at least 12 characters");
  const base = await cryptoApi.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return cryptoApi.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
function validEnvelope(e) {
  if (
    !e ||
    e.format !== FORMAT ||
    e.iterations !== ITERATIONS ||
    typeof e.salt !== "string" ||
    e.salt.length !== 24 ||
    typeof e.iv !== "string" ||
    e.iv.length !== 16 ||
    typeof e.ciphertext !== "string" ||
    e.ciphertext.length > 1500000 ||
    !Number.isSafeInteger(e.revision) ||
    e.revision < 1
  )
    throw new Error("Invalid encrypted backup");
  if (bytes(e.salt).length !== 16 || bytes(e.iv).length !== 12)
    throw new Error("Invalid encryption parameters");
  return e;
}
export class PrivateVault {
  #key;
  #salt;
  #revision = 0;
  #expectedCiphertext;
  #db;
  constructor({
    indexedDB = globalThis.indexedDB,
    crypto = globalThis.crypto,
    name = "momentum-next-generation-v1",
  } = {}) {
    this.indexedDB = indexedDB;
    this.crypto = crypto;
    this.name = name;
  }
  async open() {
    if (this.#db) return;
    this.#db = await new Promise((resolve, reject) => {
      const r = this.indexedDB.open(this.name, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("vault");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async #read() {
    await this.open();
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction("vault")
        .objectStore("vault")
        .get("memory");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async exists() {
    return !!(await this.#read());
  }
  async create(passphrase, memory) {
    if (await this.exists())
      throw new Error("Unlock the existing memory first");
    this.#salt = this.crypto.getRandomValues(new Uint8Array(16));
    this.#key = await keyFor(passphrase, this.#salt, this.crypto);
    this.#revision = 0;
    this.#expectedCiphertext = undefined;
    try {
      await this.save(memory);
    } catch (e) {
      this.lock();
      throw e;
    }
  }
  async #decrypt(e, passphrase) {
    validEnvelope(e);
    const key = await keyFor(passphrase, bytes(e.salt), this.crypto);
    const raw = await this.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes(e.iv), additionalData: enc.encode(FORMAT) },
      key,
      bytes(e.ciphertext),
    );
    return { memory: validateMemory(JSON.parse(dec.decode(raw))), key };
  }
  async unlock(passphrase) {
    const e = await this.#read();
    if (!e) throw new Error("No saved memory");
    const result = await this.#decrypt(e, passphrase);
    this.#key = result.key;
    this.#salt = bytes(e.salt);
    this.#revision = e.revision;
    this.#expectedCiphertext = e.ciphertext;
    return result.memory;
  }
  async save(memory) {
    if (!this.#key) throw new Error("Memory is locked");
    validateMemory(memory);
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await this.crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: enc.encode(FORMAT) },
      this.#key,
      enc.encode(JSON.stringify(memory)),
    );
    const e = {
      format: FORMAT,
      iterations: ITERATIONS,
      salt: b64(this.#salt),
      iv: b64(iv),
      ciphertext: b64(ciphertext),
      revision: this.#revision + 1,
    };
    validEnvelope(e); // Never persist a vault that its own backup reader cannot accept.
    await this.open();
    await new Promise((resolve, reject) => {
      const tx = this.#db.transaction("vault", "readwrite"),
        store = tx.objectStore("vault"),
        r = store.get("memory");
      let conflict = false;
      r.onsuccess = () => {
        if (
          (r.result?.revision || 0) !== this.#revision ||
          r.result?.ciphertext !== this.#expectedCiphertext
        ) {
          conflict = true;
          tx.abort();
        } else store.put(e, "memory");
      };
      tx.oncomplete = resolve;
      tx.onabort = () =>
        reject(
          new Error(
            conflict
              ? "Memory changed in another tab. Unlock again."
              : "Could not save memory",
          ),
        );
      tx.onerror = () => reject(tx.error);
    });
    this.#revision = e.revision;
    this.#expectedCiphertext = e.ciphertext;
  }
  get unlocked() {
    return !!this.#key;
  }
  lock() {
    this.#key = undefined;
    this.#salt = undefined;
    this.#revision = 0;
    this.#expectedCiphertext = undefined;
  }
  async exportBackup() {
    const e = await this.#read();
    if (!e) throw new Error("No saved memory");
    return JSON.stringify(e);
  }
  async importBackup(raw, passphrase) {
    if (raw.length > 1600000) throw new Error("Backup too large");
    const e = validEnvelope(JSON.parse(raw)),
      result = await this.#decrypt(e, passphrase);
    // Decrypt and validate before replacing anything. Keep the existing revision for compare-and-swap.
    const current = await this.#read();
    this.#key = result.key;
    this.#salt = bytes(e.salt);
    this.#revision = current?.revision || 0;
    this.#expectedCiphertext = current?.ciphertext;
    try {
      await this.save(result.memory);
      return result.memory;
    } catch (error) {
      this.lock();
      throw error;
    }
  }
  async deleteAll() {
    await this.open();
    await new Promise((resolve, reject) => {
      const tx = this.#db.transaction("vault", "readwrite");
      tx.objectStore("vault").delete("memory");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    this.lock();
  }
  close() {
    this.lock();
    this.#db?.close();
    this.#db = undefined;
  }
}
