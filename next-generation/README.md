# Momentum Next Generation — Phase 1

Isolated development foundation on `development/next-generation`, based on the
working review commit `a45bf753045682e6afdd8c998ab5bf00eca6126b`.
**This is a local development app, not a replacement deployment.**

Double-click **Start-Next-Generation.cmd** in the repository root. Open
**http://127.0.0.1:43128/**. Stop with **Stop-Next-Generation.cmd**.
Install Node.js 24 once. Read [OPEN-ME.txt](OPEN-ME.txt) for normal use,
private memory, optional AI setup, voice and backup instructions.

The older app still opens with `Start.cmd` on port 43127. Its deployed review is
[here](https://transition-companion-review.onrender.com/companion-v2/indexH.html).
No existing data, proxy configuration, deployment branch or public URL was changed.

## Working foundations

The [Knowledge Desk](../docs/KNOWLEDGE_REVIEW_GUIDE.md) now adds the local staff
workflow: Start-Knowledge-Desk.cmd → http://127.0.0.1:43129/staff/. Separate editor
and reviewer accounts, bilingual drafts, submit/review/approve/reject, versioned
replacement, expiry, withdrawal and immutable audit are implemented. Four source-checked
topics are loaded as drafts; a real Momentum professional must sign off before
they enter answers. See [KNOWLEDGE-DESK.txt](KNOWLEDGE-DESK.txt) for setup and use.

- A direct bilingual conversation, Hebrew RTL / English LTR, four starter topics,
  compact composer, optional voice with disclosure, and separate help/benefits panels.
- Temporary conversation by default; optional AES-GCM encrypted IndexedDB memory,
  passphrase unlock, encrypted export/import, lock and deletion. No automatic sync.
- One local goal store, explicit save/completion, and shared education/employment
  routing. Local replies are deliberately labeled guided mode, not live intelligence.
- A server-only OpenAI Responses gateway with bearer access, origin/host controls,
  size/rate/time limits, exact-packet single-use approval and validated structured replies.
- A PostgreSQL knowledge adapter and schema. Only approved, reviewed, unexpired
  official-source records can be retrieved. Starter claims remain **unpublished drafts**
  until independent professional approval. Published items are available in the
  companion source panel without an AI key when the local desk is running.

## Develop

```powershell
cd next-generation
npm ci --ignore-scripts
npm test
npm start
```

Root `npm test` runs the preserved legacy suites. `npm run test:nextgen` runs this
foundation separately; GitHub CI runs both. Tests mock OpenAI and use PGlite, an
embedded PostgreSQL engine, for migration/retrieval. They need no paid API or database.

For an independently managed development PostgreSQL, set `DATABASE_URL` in this
directory's `.env`, install dependencies and run `npm run db:migrate`. Migrations
are explicit, not run on startup. The adapter uses verified TLS by default. No
database or paid service is provisioned. See [database design](../docs/DATABASE_SCHEMA.md).

For AI, set `.env` values described in [OPEN-ME.txt](OPEN-ME.txt). The OpenAI key
stays on the server. Use an access code in the app, approve a preview for every
request, and include private context only when you choose. `store:false` is set;
it is not a promise of zero provider retention. No live provider test was performed.

## Limits

This is a tested foundation, not a completed soldier pilot. Administration SSO/MFA,
real professional content approval, additional specialist implementations, real phone/assistive
technology testing, hardened public authentication, privacy review and deployment
remain separate work. No central analytics or individual activity collection is
enabled. No automatic migration of old personal data. No promises of complete
crisis detection, legal eligibility, admissions, jobs or clinical care.

See [architecture](../docs/MASTER_ARCHITECTURE.md),
[assessment](../docs/REPOSITORY_ASSESSMENT.md),
[roadmap](../docs/DEVELOPMENT_ROADMAP.md) and
[verification](../docs/TESTING_PLAN.md) for implementation status and release gates.
