import { createApp } from "./gateway.mjs";
import { KnowledgeRepository } from "./knowledge.mjs";
let pool;
if (process.env.DATABASE_URL) {
  const { default: pg } = await import("pg");
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: true },
  });
  pool.on("error", () => console.error("Knowledge database unavailable")); // No connection URL or query data.
}
const server = createApp({
  env: process.env,
  knowledge: new KnowledgeRepository(pool),
  managementToken: process.env.NEXTGEN_MANAGEMENT_TOKEN || "",
});
server.listen(Number(process.env.PORT || 43128), "127.0.0.1", () =>
  console.log(
    `Momentum Next Generation: http://127.0.0.1:${server.address().port}/`,
  ),
);
server.on("error", () => {
  console.error(
    "Could not start Next Generation. Check whether port 43128 is in use.",
  );
  process.exitCode = 1;
});
server.on("close", async () => {
  await pool?.end();
});
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, () => {
    server.close();
    server.closeIdleConnections();
  });
