import { PGlite } from "@electric-sql/pglite";
import { readFile, open, rename, mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

// Keep PostgreSQL in memory; Node owns an atomic durable snapshot. This avoids
// native POSIX lock-file permission assumptions on Windows filesystems.
export async function openDeskDatabase(snapshotPath) {
  let data;
  try {
    data = await readFile(snapshotPath);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const engine = await PGlite.create(
    data ? { loadDataDir: new Blob([data]) } : {},
  );
  let queue = Promise.resolve(),
    failed = false;
  const check = () => {
    if (failed)
      throw new Error(
        "Knowledge storage is unavailable. Restart after checking local disk access.",
      );
  };
  async function persist() {
    const blob = await engine.dumpDataDir("gzip"),
      bytes = Buffer.from(await blob.arrayBuffer());
    await mkdir(dirname(snapshotPath), { recursive: true });
    const temp = snapshotPath + "." + randomUUID() + ".tmp";
    let handle;
    try {
      handle = await open(temp, "wx", 0o600);
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();
      handle = undefined;
      await rename(temp, snapshotPath);
    } catch (e) {
      await handle?.close();
      await unlink(temp).catch(() => {});
      failed = true;
      throw e;
    }
  }
  return {
    query: async (...args) => {
      await queue;
      check();
      return engine.query(...args);
    },
    exec: async (...args) => {
      await queue;
      check();
      return engine.exec(...args);
    },
    transaction(work) {
      const result = queue.then(async () => {
        check();
        const value = await engine.transaction(work);
        await persist();
        return value;
      });
      queue = result.catch(() => {});
      return result;
    },
    async close() {
      await queue;
      await engine.close();
    },
  };
}
