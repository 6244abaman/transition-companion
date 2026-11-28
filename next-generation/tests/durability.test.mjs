import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openDeskDatabase } from "../server/desk-database.mjs";
const exec = promisify(execFile);
async function removeTestDirectory(dir) {
  assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
  assert.ok(/^momentum-(durable-|storage-failure-)/.test(basename(dir)));
  await rm(dir, { recursive: true, force: true });
}
test("separate Node processes reopen the same durable knowledge and staff accounts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "momentum-durable-"));
  try {
    const worker = fileURLToPath(
        new URL("./helpers/durable-worker.mjs", import.meta.url),
      ),
      path = join(dir, "knowledge.snapshot");
    for (const action of ["create", "read", "read"]) {
      const result = await exec(process.execPath, [worker, path, action], {
        timeout: 30000,
      });
      assert.match(result.stdout, /DURABLE_OK/);
    }
  } finally {
    await removeTestDirectory(dir);
  }
});
test("durable storage failures leave the previous snapshot intact and fail subsequent reads closed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "momentum-storage-failure-"));
  const path = join(dir, "knowledge.snapshot");
  let db;
  try {
    db = await openDeskDatabase(path);
    await db.exec("CREATE TABLE sample (id integer)");
    await db.transaction((tx) => tx.query("INSERT INTO sample VALUES(1)"));
    const before = await readFile(path);
    // A directory at the final target makes atomic replacement fail deterministically.
    const blocked = join(dir, "blocked.snapshot");
    await writeFile(join(dir, "dummy"), "x");
    const other = await openDeskDatabase(blocked);
    await other.exec("CREATE TABLE sample (id integer)");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(blocked);
    await assert.rejects(
      other.transaction((tx) => tx.query("INSERT INTO sample VALUES(2)")),
    );
    await assert.rejects(other.query("SELECT * FROM sample"), /unavailable/);
    await other.close();
    assert.deepEqual(await readFile(path), before);
  } finally {
    await db?.close();
    await removeTestDirectory(dir);
  }
});
