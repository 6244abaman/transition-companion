// Only explicitly reviewed public sources. No arbitrary URL fetch or web browsing.
const ALLOWED = new Set([
  "www.hachvana.mod.gov.il",
  "hachvana.mod.gov.il",
  "www.gov.il",
  "gov.il",
  "shikum.mod.gov.il",
]);
export function approvedUrl(value) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      ALLOWED.has(u.hostname)
    );
  } catch {
    return false;
  }
}
export class KnowledgeRepository {
  constructor(db) {
    this.db = db;
  }
  async retrieve({ domain, language, now = new Date() }) {
    if (!this.db) return [];
    if (
      !["benefits", "education", "employment", "general"].includes(domain) ||
      !["he", "en"].includes(language)
    )
      throw new Error("Invalid knowledge query");
    const { rows } = await this.db.query(
      `
      SELECT i.id, i.title, i.body, i.version, i.reviewed_at, i.expires_at, s.url, s.publisher
      FROM knowledge_items i JOIN knowledge_sources s ON s.id = i.source_id
      WHERE i.domain = $1 AND i.language = $2 AND i.status = 'approved' AND s.approved = true
        AND i.reviewed_at <= $3 AND i.expires_at > $3
      ORDER BY i.reviewed_at DESC, i.id LIMIT 8`,
      [domain, language, now.toISOString()],
    );
    return rows
      .filter((r) => approvedUrl(r.url))
      .map((r) => ({
        ...r,
        body: r.body.slice(0, 6000),
        title: r.title.slice(0, 300),
      }));
  }
}
