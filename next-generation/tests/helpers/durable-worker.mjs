import { openDeskDatabase } from "../../server/desk-database.mjs";
import { migrateEditorial, EditorialStore } from "../../server/editorial.mjs";
import { readFile } from "node:fs/promises";
const db = await openDeskDatabase(process.argv[2]);
try {
  await migrateEditorial(db);
  const store = new EditorialStore(db, {
    clock: () => new Date("2026-11-25T20:00:00Z"),
  });
  if (process.argv[3] === "create") {
    await store.importSeed(
      JSON.parse(
        await readFile(
          new URL("../../knowledge/starter-set.json", import.meta.url),
          "utf8",
        ),
      ).items,
    );
    await store.addStaff({
      username: "test-durable",
      displayName: "Test Durable",
      professionalRole: "Test-only editor",
      role: "editor",
      password: "TEST ONLY durable passphrase 123",
    });
  } else {
    if ((await store.list()).length !== 4)
      throw new Error("Drafts did not survive a new process");
    if (
      !(await store.login("test-durable", "TEST ONLY durable passphrase 123"))
        .active
    )
      throw new Error("Staff login did not survive");
  }
  console.log("DURABLE_OK");
} finally {
  await db.close();
}
