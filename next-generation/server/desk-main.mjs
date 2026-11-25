import { openDeskDatabase } from "./desk-database.mjs";
import { mkdir, readFile, open, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createDesk } from "./desk-server.mjs";
import { EditorialStore, migrateEditorial } from "./editorial.mjs";
const root = new URL("../.local/", import.meta.url);
await mkdir(root, { recursive: true });
const lockPath = new URL("knowledge.lock", root);
let lock;
try {
  lock = await open(lockPath, "wx");
  await lock.writeFile(String(process.pid));
} catch {
  console.error(
    "Knowledge database is already open or has a stale lock. See KNOWLEDGE-DESK.txt.",
  );
  process.exit(1);
}
let db, server;
async function cleanup() {
  await db?.close();
  await lock?.close();
  await unlink(lockPath).catch(() => {});
}
try {
  db = await openDeskDatabase(
    fileURLToPath(new URL("knowledge.snapshot", root)),
  );
  await migrateEditorial(db);
  const store = new EditorialStore(db);
  const seed = JSON.parse(
    await readFile(
      new URL("../knowledge/starter-set.json", import.meta.url),
      "utf8",
    ),
  );
  await store.importSeed(seed.items);
  server = createDesk({
    store,
    managementToken: process.env.NEXTGEN_MANAGEMENT_TOKEN || "",
    seedSummary: seed.items,
  });
  server.on("close", cleanup);
  server.on("error", async () => {
    console.error("Knowledge desk could not start. Check port 43129.");
    await cleanup();
    process.exitCode = 1;
  });
  server.listen(43129, "127.0.0.1", () =>
    console.log("Momentum Knowledge Desk: http://127.0.0.1:43129/staff/"),
  );
  for (const sig of ["SIGINT", "SIGTERM"])
    process.on(sig, () => {
      server.close();
      server.closeIdleConnections();
    });
} catch {
  console.error(
    "Knowledge desk setup failed. No source content or credentials were logged.",
  );
  await cleanup();
  process.exitCode = 1;
}
