# Data and schema boundary

Current workflow migration: `next-generation/server/migrations/002-editorial.sql`.
`db:migrate` applies both migrations. The local Knowledge Desk applies them to its
own embedded PostgreSQL and imports four draft topics, without external provisioning.
New tables: knowledge_staff (named staff roles/salted hashes), knowledge_topics,
knowledge_revisions (paired bilingual JSON, contributors, state, lock version,
reviewer/attestation/expiry), and knowledge_review_events (immutable audit).
knowledge_items.revision_id links each public language row to the approved revision.
The published_knowledge view rejects records whose content, source or review metadata
differs from that immutable revision. Staff identity is excluded from public reads.

The central database contains Momentum knowledge, not identifiable soldiers.
Executable migration: `next-generation/server/schema.sql`. Apply explicitly with
`npm run db:migrate` from next-generation after configuring a dedicated development
DATABASE_URL. Startup does not create tables or seed data. No service is provisioned.

| Table | Fields / constraints | Ownership |
| --- | --- | --- |
| knowledge_sources | id, HTTPS URL, publisher, approved=false by default | Public editorial sources |
| knowledge_items | id, source FK, domain, language, title/body, status, reviewed_at/expires_at, reviewed_by, positive version | Public bilingual claims, one language per row |
| knowledge_admin_audit | generated ID, item FK, staff_subject, action enum, occurred_at | Staff operational audit only |

Approved records require a reviewer and a review-to-expiry interval. Runtime
retrieval additionally checks source approval, exact official hostname allowlist,
review date <= now, expiry > now, domain and language. SQL parameters are bound,
never interpolated. Return at most eight records with bounded text and provenance.
No URL is fetched by the gateway. Broad gov.il suffix matching is deliberately
avoided. Expiry removes a record from retrieval without deleting editorial history.

The editorial schema and application enforce paired translations, versioned immutable
reviewed content/events, editor/reviewer separation and atomic approval+audit writes.
A contributor cannot approve their revision. Local account enrolment does not verify
professional qualifications. Organizational SSO/MFA and database grants remain. Do not expose SQL
credentials or administrative writes to the soldier app. Runtime should receive a
SELECT-only role; migration/editor roles must be separate before hosted deployment.

No soldiers, profiles, conversations, personal goals, embeddings of personal text,
device IDs, IP events or individual consent history tables exist. No analytics table
is installed. Future aggregates require a new explicit privacy/governance decision.

## Staff workbench persistence

The desk stores a compressed PostgreSQL snapshot at .local/knowledge.snapshot,
including staff names, role descriptions and salted password hashes. No plaintext
password, soldier record or session cookie is persisted. Each mutation runs through
a serialized transaction and flush/atomic rename before acknowledgement. The file
is private, excluded from git and not served. Stop before making a private backup;
restore deliberately, considering old approval/withdrawal states. See the review guide.

## Private device schema

IndexedDB database `momentum-next-generation-v1`, store `vault`, key `memory` holds
only an encrypted envelope: format, fixed KDF iterations, salt, IV, ciphertext and
revision. AES-GCM uses the versioned format as authenticated additional data.
The passphrase-derived key is non-extractable and remains in RAM. Backup is the
same encrypted envelope, independently decryptable with the passphrase.

Decrypted schema v1 lives only in active memory: language; bounded user/assistant
messages; confirmed strength strings; unified goals (id, title, domain, due date,
open/done). It has no account, military identity number or mandatory contact data.
The current UI saves goals; richer skills capture remains a later feature. All
domains use this one schema. Compare-and-swap on revision and previous ciphertext
prevents stale tabs overwriting or resurrecting a deleted/recreated vault.

There is no automatic conversion from legacy localStorage or encrypted sync. A
future schema change requires explicit migration tests and backup compatibility.

## Verification and limits

Tests apply the real SQL migration twice in PGlite (embedded PostgreSQL), insert
test-only fixtures, and test review/status/date/source filters and table boundaries.
The pg driver configuration is included, with verified TLS enabled by default;
a remotely hosted PostgreSQL instance, role grants, backups, restore and network
failure recovery have **not** been exercised. DATABASE_SSL=false is only appropriate
for an explicitly trusted local development database, never a convenient TLS bypass.
