# Repository assessment — 25 November 2026

Assessed base: `complete/continuity-and-followup` at
`a45bf753045682e6afdd8c998ab5bf00eca6126b`. Default main is older:
`61c615d8580beb904cdb0b9c9da3459ce585cab5`. PR #2 is an open draft carrying the
current review work toward main. Next Generation deliberately builds on the working
review; its draft PR does not change main or the deployed branch.

## Existing functionality to preserve

- Root Hebrew/English guided dialogue, language switching, local conversation
  resumption/history, optional external Claude proxy, persistent consent withdrawal.
- Evidence-based skills mapping, 36-skill assessment, civilian pathways and CV drafts.
- My Journey goals, next actions, course comparisons, rights, reminders and backups.
- Dated bilingual benefits data with official-source provenance and cautions.
- Narrow local safety cues, voice and direct human-support entry points.
- Optional ciphertext sync with capability access, revision checking, invitations,
  deletion tombstones; separate legacy sync service and WebLLM prototype.
- Tested Windows static host, fixed local origin, allowlisted assets and Render
  static review build, stable public links and build information.

None of these app source paths, stores, launchers, proxy endpoints, source data,
service worker or deployment metadata are modified by Next Generation.

## Evidence inspected

Root AGENTS/CLAUDE/APP-OPERATIONS/README/HOSTING and package scripts; recursive
source tree; multilingual HTML entry points; AI consent, response schema and safety
modules; journey store/backup/sync/reminders; benefits data flow; both sync servers;
Windows host and launchers; static review builder; CI and existing tests. Listed
GitHub branches and recent/open/closed PRs before choosing a base.

Relevant existing branches include `review/openai-companion` (8c53a02),
`review/momentum-knowledge-companion` (06dbb0e),
`prototype/adaptive-companion-2026-11-23`, private chat resumption, proxy security,
compact chat, intake fixes and the merged home-followthrough work. Inspected the
OpenAI server prototype and reviewed knowledge loader directly. The OpenAI branch
uses a separate basic-auth test gateway and legacy-compatible Chat Completions;
the knowledge branch adds reviewed-pack work. Their diffs also remove newer home
and regression work, so neither was blindly merged or used to roll back the base.

## Weaknesses and implications

| Finding | Implication | Phase 1 response |
| --- | --- | --- |
| Large parallel HTML pages: ~197KB English, ~510KB Hebrew and ~459KB CompanionH at base, plus archived variants | Difficult fixes, drift, repeated prompts/UI logic | New small shared bilingual shell; old paths kept intact |
| Root localStorage conversation/Journey storage is plaintext | Shared/lost devices and XSS can expose private records; encrypted sync alone does not fix local storage | Separate encrypted-at-rest memory with session-first mode |
| Multiple sync/gateway/next prototypes | Unclear ownership and incompatible contracts | Explicit Next Generation boundary and common contracts |
| External AI receives recent context under persistent legacy consent | Data minimization and withdrawal races require care | Per-request preview, context off by default, single-use approval |
| Existing backend/model proxy is a separate service | Cannot establish its production implementation or logging policy from this repo alone | Do not alter it; implement a separately tested gateway; production audit remains |
| Reviewed JSON metadata is a trust assertion, not a full editorial system | Official domains and dates do not prove semantic accuracy | PostgreSQL approval/expiry/source filters, staff workflow design, human review gate |
| Browser voice may use third-party speech services | Local UI does not imply local audio processing | Explicit per-action disclosure, text fallback |
| Optional sync centrally retains ciphertext metadata | Different privacy lifecycle from strictly device-only memory | No sync or automatic migration in Next Generation |
| Existing layout review identifies tiny chat, tall composer/cards and nested scrolling | Mobile conversation becomes unusable | Dedicated transcript area, compact composer and separate panels |
| Narrow regex safety cues | Missed crises and false positives are possible | Keep human help visible; document non-monitoring and evaluation gaps |

No secret values were copied into documentation. Credential stores were not sought.
The repository assessment is not an independent penetration test or an audit of
the external proxy, Render platform logs, legal compliance or historical git secrets.

## Baseline

`npm ci --ignore-scripts --no-audit --no-fund` and full root `npm test` passed
before implementation. Root npm test covers legacy flow/path/journey/voice scripts,
63 integration cases, reviewed knowledge/business skills/sync assertion suites,
4 review-build cases and 4 home-pathway cases. A jsdom navigation-not-implemented
message occurs in the existing reset-path script; that baseline suite still exits
zero. It is recorded rather than hidden or represented as a production failure.
The same unchanged functionality is rechecked after the foundation changes.
