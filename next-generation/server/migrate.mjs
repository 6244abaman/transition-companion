import pg from "pg";
import { migrateEditorial } from "./editorial.mjs";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL for a dedicated knowledge database");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true },
  max: 2,
});
try {
  await migrateEditorial(pool);
  console.log("Knowledge schema ready. No soldier data tables.");
} finally {
  await pool.end();
}
