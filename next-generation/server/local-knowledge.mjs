import { approvedUrl } from "./knowledge.mjs";
export class LocalKnowledgeClient {
  constructor({ send = fetch } = {}) {
    this.send = send;
  }
  async retrieve({ domain, language, now = new Date() }) {
    if (
      !["benefits", "education", "employment", "general"].includes(domain) ||
      !["he", "en"].includes(language)
    )
      return [];
    try {
      // Public topic/language only. No soldier packet, history, credentials or IDs.
      const r = await this.send(
        `http://127.0.0.1:43129/knowledge?domain=${domain}&language=${language}`,
        { signal: AbortSignal.timeout(1500), redirect: "error" },
      );
      if (!r.ok) return [];
      let size = 0;
      const parts = [];
      for await (const p of r.body) {
        size += p.length;
        if (size > 100000) return [];
        parts.push(p);
      }
      const data = JSON.parse(Buffer.concat(parts).toString("utf8"));
      if (!Array.isArray(data.items) || data.items.length > 8) return [];
      return data.items.filter(
        (x) =>
          typeof x.id === "string" &&
          typeof x.title === "string" &&
          x.title.length <= 200 &&
          typeof x.body === "string" &&
          x.body.length <= 4500 &&
          approvedUrl(x.url) &&
          new Date(x.reviewed_at) <= now &&
          new Date(x.expires_at) > now,
      );
    } catch {
      return [];
    }
  }
}
