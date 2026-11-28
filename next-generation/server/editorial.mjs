import {
  randomUUID,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { approvedUrl } from "./knowledge.mjs";
const scrypt = promisify(scryptCallback);
export class EditorialError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new EditorialError(status, message);
};
const text = (v, max, min = 1) =>
  typeof v === "string" && v.trim().length >= min && v.length <= max;
const exact = (v, keys) =>
  v &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === keys.split(",").sort().join();
const realDate = (value) => {
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};
export function validateContent(c, now = new Date()) {
  if (
    !exact(c, "topicId,domain,title,body,scope,source") ||
    !/^[a-z][a-z0-9-]{2,79}$/.test(c.topicId) ||
    !["benefits", "education", "employment", "general"].includes(c.domain) ||
    !exact(c.source, "url,publisher,checkedAt,evidence") ||
    !approvedUrl(c.source.url) ||
    c.source.url.length > 1000 ||
    !text(c.source.publisher, 200) ||
    !text(c.source.evidence, 1200, 10) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(c.source.checkedAt) ||
    !realDate(c.source.checkedAt) ||
    c.source.checkedAt > now.toISOString().slice(0, 10)
  )
    fail(400, "Supply a valid official source and a real check date");
  for (const [key, max] of [
    ["title", 200],
    ["body", 3000],
    ["scope", 1000],
  ]) {
    if (
      !exact(c[key], "he,en") ||
      !text(c[key].he, max) ||
      !text(c[key].en, max)
    )
      fail(400, "Both Hebrew and English are required");
  }
  return structuredClone(c);
}
export async function transaction(db, work) {
  if (typeof db.transaction === "function") return db.transaction(work);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function migrateEditorial(db) {
  for (const path of ["./schema.sql", "./migrations/002-editorial.sql"]) {
    const sql = await readFile(new URL(path, import.meta.url), "utf8");
    if (typeof db.exec === "function") await db.exec(sql);
    else await db.query(sql);
  }
}
export async function hashPassword(password) {
  if (!text(password, 256, 14))
    fail(400, "Use a passphrase of 14 to 256 characters");
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt-v1:${salt}:${derived.toString("hex")}`;
}
export async function checkPassword(password, hash) {
  if (typeof password !== "string" || password.length > 256) return false;
  const [format, salt, digest] = String(hash).split(":");
  if (
    format !== "scrypt-v1" ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(digest)
  )
    return false;
  const value = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(value, Buffer.from(digest, "hex"));
}
export class EditorialStore {
  constructor(db, { clock = () => new Date() } = {}) {
    this.db = db;
    this.clock = clock;
  }
  async addStaff({ username, displayName, professionalRole, role, password }) {
    if (
      !/^[a-z][a-z0-9._-]{2,49}$/.test(username) ||
      !text(displayName, 100) ||
      !text(professionalRole, 150, 3) ||
      !["editor", "reviewer"].includes(role)
    )
      fail(
        400,
        "Supply username, name, professional role and editor/reviewer role",
      );
    const hash = await hashPassword(password);
    try {
      const { rows } = await transaction(this.db, (tx) =>
        tx.query(
          "INSERT INTO knowledge_staff(id,username,display_name,professional_role,role,password_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,username,display_name,professional_role,role,active",
          [randomUUID(), username, displayName, professionalRole, role, hash],
        ),
      );
      return rows[0];
    } catch (e) {
      if (e.code === "23505") fail(409, "Username already exists");
      throw e;
    }
  }
  async staff(id) {
    return (
      await this.db.query(
        "SELECT id,username,display_name,professional_role,role,active FROM knowledge_staff WHERE id=$1",
        [id],
      )
    ).rows[0];
  }
  async disableStaff(username) {
    await transaction(this.db, (tx) =>
      tx.query("UPDATE knowledge_staff SET active=false WHERE username=$1", [
        username,
      ]),
    );
  }
  async authorizeTransaction(tx, actor, role) {
    const current = (
      await tx.query(
        "SELECT active,role FROM knowledge_staff WHERE id=$1 FOR SHARE",
        [actor.id],
      )
    ).rows[0];
    if (!current?.active || current.role !== role)
      fail(403, "This staff account cannot perform the action");
  }
  async login(username, password) {
    const account = (
      await this.db.query("SELECT * FROM knowledge_staff WHERE username=$1", [
        typeof username === "string" ? username.slice(0, 50) : "",
      ])
    ).rows[0];
    // Same KDF work for an unknown account; no user enumeration in API responses.
    const dummy =
      "scrypt-v1:00000000000000000000000000000000:" + "0".repeat(128);
    const valid = await checkPassword(
      password,
      account?.password_hash || dummy,
    );
    if (!account?.active || !valid) fail(401, "Sign-in failed");
    return this.staff(account.id);
  }
  async require(actor, role) {
    const current = actor?.id && (await this.staff(actor.id));
    if (!current?.active || current.role !== role)
      fail(403, "This action requires the appropriate staff role");
    return current;
  }
  async event(tx, id, actor, action, note = "") {
    await tx.query(
      "INSERT INTO knowledge_review_events(revision_id,staff_subject,action,note,occurred_at) VALUES($1,$2,$3,$4,$5)",
      [id, actor, action, note, this.clock().toISOString()],
    );
  }
  async importSeed(entries) {
    return transaction(this.db, async (tx) => {
      let imported = 0;
      for (const raw of entries) {
        const c = validateContent(raw, this.clock());
        const inserted = await tx.query(
          "INSERT INTO knowledge_topics(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
          [c.topicId],
        );
        if (!inserted.rows.length) continue; // Never replace an edited, rejected or published topic on restart.
        const id = randomUUID();
        await tx.query(
          "INSERT INTO knowledge_revisions(id,topic_id,version,status,content,authored_by,contributors) VALUES($1,$2,1,'draft',$3,'source-import',ARRAY['source-import'])",
          [id, c.topicId, JSON.stringify(c)],
        );
        await this.event(
          tx,
          id,
          "source-import",
          "import",
          "Source-checked draft. Independent professional sign-off is pending.",
        );
        imported++;
      }
      return imported;
    });
  }
  async list() {
    return (
      await this.db.query(
        "SELECT id,topic_id,version,lock_version,status,content,authored_by,contributors,reviewed_at,expires_at FROM knowledge_revisions ORDER BY topic_id,version DESC LIMIT 200",
      )
    ).rows;
  }
  async detail(id) {
    const row = (
      await this.db.query("SELECT * FROM knowledge_revisions WHERE id=$1", [id])
    ).rows[0];
    if (!row) fail(404, "Revision not found");
    const events = (
      await this.db.query(
        "SELECT e.id,e.action,e.note,e.occurred_at,e.staff_subject,s.display_name,s.professional_role FROM knowledge_review_events e LEFT JOIN knowledge_staff s ON s.id=e.staff_subject WHERE e.revision_id=$1 ORDER BY e.id",
        [id],
      )
    ).rows;
    return { ...row, events };
  }
  async create(actor, raw) {
    actor = await this.require(actor, "editor");
    const c = validateContent(raw, this.clock());
    try {
      return await transaction(this.db, async (tx) => {
        await this.authorizeTransaction(tx, actor, "editor");
        await tx.query("INSERT INTO knowledge_topics(id) VALUES($1)", [
          c.topicId,
        ]);
        const id = randomUUID();
        await tx.query(
          "INSERT INTO knowledge_revisions(id,topic_id,version,status,content,authored_by,contributors) VALUES($1,$2,1,'draft',$3,$4,ARRAY[$4])",
          [id, c.topicId, JSON.stringify(c), actor.id],
        );
        await this.event(tx, id, actor.id, "create");
        return { id };
      });
    } catch (e) {
      if (e.code === "23505")
        fail(409, "Topic already exists; create a revision instead");
      throw e;
    }
  }
  async act(actor, id, action, data) {
    const role = ["approve", "reject", "withdraw"].includes(action)
      ? "reviewer"
      : "editor";
    actor = await this.require(actor, role);
    if (!Number.isSafeInteger(data?.expectedVersion))
      fail(400, "Supply the revision version you reviewed");
    try {
      return await transaction(this.db, async (tx) => {
        await this.authorizeTransaction(tx, actor, role);
        const r = (
          await tx.query(
            "SELECT * FROM knowledge_revisions WHERE id=$1 FOR UPDATE",
            [id],
          )
        ).rows[0];
        if (!r) fail(404, "Revision not found");
        if (r.lock_version !== data.expectedVersion)
          fail(409, "Revision changed. Reload and review it again.");
        const note = typeof data.note === "string" ? data.note.trim() : "";
        if (note.length > 1200) fail(400, "Review note is too long");
        let changed;
        if (action === "save") {
          if (r.status !== "draft") fail(409, "Only drafts can be edited");
          const c = validateContent(data.content, this.clock());
          if (c.topicId !== r.topic_id) fail(400, "Topic ID cannot change");
          const contributors = [...new Set([...r.contributors, actor.id])];
          changed = await tx.query(
            "UPDATE knowledge_revisions SET content=$1,contributors=$2,lock_version=lock_version+1 WHERE id=$3 RETURNING id",
            [JSON.stringify(c), contributors, id],
          );
        } else if (action === "submit") {
          if (r.status !== "draft") fail(409, "Only a draft can be submitted");
          validateContent(r.content, this.clock());
          if (!r.contributors.includes(actor.id))
            fail(
              403,
              "Save and check both languages before submitting this imported draft",
            );
          changed = await tx.query(
            "UPDATE knowledge_revisions SET status='in_review',lock_version=lock_version+1 WHERE id=$1 RETURNING id",
            [id],
          );
        } else if (action === "approve") {
          if (r.status !== "in_review")
            fail(409, "Only a submitted revision can be approved");
          if (r.contributors.includes(actor.id))
            fail(403, "A contributor cannot approve their own revision");
          const c = validateContent(r.content, this.clock()),
            now = this.clock();
          if (
            !exact(
              data.checks,
              "sourceRead,hebrewChecked,englishChecked,scopeChecked",
            ) ||
            !Object.values(data.checks).every((x) => x === true)
          )
            fail(
              400,
              "Confirm source, both languages and scope before approval",
            );
          const expiry = new Date(data.expiresAt),
            checked = new Date(c.source.checkedAt + "T00:00:00Z");
          if (
            !Number.isFinite(expiry.getTime()) ||
            expiry <= now ||
            expiry - now > 90 * 86400000 ||
            now - checked > 30 * 86400000
          )
            fail(
              400,
              "Use a future expiry within 90 days and a source checked within 30 days",
            );
          if (note.length < 10)
            fail(400, "Record a meaningful professional review note");
          const old = (
            await tx.query(
              "SELECT id FROM knowledge_revisions WHERE topic_id=$1 AND status='approved' FOR UPDATE",
              [r.topic_id],
            )
          ).rows;
          for (const prior of old) {
            await tx.query(
              "UPDATE knowledge_revisions SET status='superseded',lock_version=lock_version+1 WHERE id=$1",
              [prior.id],
            );
            await this.event(
              tx,
              prior.id,
              actor.id,
              "supersede",
              `Replaced by revision ${r.version}`,
            );
          }
          const attest = {
            ...data.checks,
            professionalRole: actor.professional_role,
          };
          await tx.query(
            "UPDATE knowledge_revisions SET status='approved',reviewed_by=$1,reviewed_at=$2,expires_at=$3,review_note=$4,attestation=$5,lock_version=lock_version+1 WHERE id=$6",
            [
              actor.id,
              now.toISOString(),
              expiry.toISOString(),
              note,
              JSON.stringify(attest),
              id,
            ],
          );
          const sourceId =
            "src-" +
            createHash("sha256")
              .update(c.source.url + "\n" + c.source.publisher)
              .digest("hex")
              .slice(0, 24);
          await tx.query(
            "INSERT INTO knowledge_sources(id,url,publisher,approved) VALUES($1,$2,$3,true) ON CONFLICT(id) DO NOTHING",
            [sourceId, c.source.url, c.source.publisher],
          );
          for (const language of ["he", "en"])
            await tx.query(
              `INSERT INTO knowledge_items(id,source_id,domain,language,title,body,status,reviewed_at,expires_at,reviewed_by,version,revision_id)
          VALUES($1,$2,$3,$4,$5,$6,'approved',$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET source_id=EXCLUDED.source_id,domain=EXCLUDED.domain,title=EXCLUDED.title,body=EXCLUDED.body,status='approved',reviewed_at=EXCLUDED.reviewed_at,expires_at=EXCLUDED.expires_at,reviewed_by=EXCLUDED.reviewed_by,version=EXCLUDED.version,revision_id=EXCLUDED.revision_id`,
              [
                r.topic_id + "-" + language,
                sourceId,
                c.domain,
                language,
                c.title[language],
                c.body[language] + "\n\n" + c.scope[language],
                now.toISOString(),
                expiry.toISOString(),
                actor.id,
                r.version,
                id,
              ],
            );
        } else if (action === "reject") {
          if (r.status !== "in_review" || r.contributors.includes(actor.id))
            fail(
              409,
              "An independent reviewer must reject a submitted revision",
            );
          if (note.length < 10) fail(400, "Explain the changes needed");
          await tx.query(
            "UPDATE knowledge_revisions SET status='rejected',review_note=$1,lock_version=lock_version+1 WHERE id=$2",
            [note, id],
          );
        } else if (action === "withdraw") {
          if (r.status !== "approved")
            fail(409, "Only a currently approved revision can be withdrawn");
          if (note.length < 10) fail(400, "Record why the item is withdrawn");
          await tx.query(
            "UPDATE knowledge_revisions SET status='withdrawn',review_note=$1,lock_version=lock_version+1 WHERE id=$2",
            [note, id],
          );
          await tx.query(
            "UPDATE knowledge_items SET status='withdrawn' WHERE revision_id=$1",
            [id],
          );
        } else if (action === "revise") {
          if (
            !["approved", "rejected", "withdrawn", "superseded"].includes(
              r.status,
            )
          )
            fail(409, "Finish the current draft or review first");
          await tx.query(
            "SELECT id FROM knowledge_topics WHERE id=$1 FOR UPDATE",
            [r.topic_id],
          );
          const version =
            Number(
              (
                await tx.query(
                  "SELECT max(version) AS latest FROM knowledge_revisions WHERE topic_id=$1",
                  [r.topic_id],
                )
              ).rows[0].latest,
            ) + 1;
          const nextId = randomUUID();
          await tx.query(
            "INSERT INTO knowledge_revisions(id,topic_id,version,status,content,authored_by,contributors) VALUES($1,$2,$3,'draft',$4,$5,ARRAY[$5])",
            [nextId, r.topic_id, version, JSON.stringify(r.content), actor.id],
          );
          await this.event(
            tx,
            nextId,
            actor.id,
            "revise",
            `Based on revision ${r.version}`,
          );
          return { id: nextId };
        } else fail(400, "Unknown editorial action");
        await this.event(tx, id, actor.id, action, note);
        return { id: changed?.rows[0]?.id || id };
      });
    } catch (e) {
      if (e.code === "23505")
        fail(409, "Another draft or review already exists for this topic");
      throw e;
    }
  }
}
export class PublishedKnowledgeRepository {
  constructor(db) {
    this.db = db;
  }
  async retrieve({ domain, language, now = new Date() }) {
    if (
      !["benefits", "education", "employment", "general"].includes(domain) ||
      !["he", "en"].includes(language)
    )
      fail(400, "Invalid knowledge query");
    const { rows } = await this.db.query(
      `SELECT i.id,i.title,i.body,i.version,i.reviewed_at,i.expires_at,s.url,s.publisher
      FROM published_knowledge i JOIN knowledge_sources s ON s.id=i.source_id
      WHERE i.domain=$1 AND i.language=$2 AND s.approved=true AND i.reviewed_at<=$3 AND i.expires_at>$3 ORDER BY i.id LIMIT 8`,
      [domain, language, now.toISOString()],
    );
    return rows.filter((r) => approvedUrl(r.url));
  }
}
