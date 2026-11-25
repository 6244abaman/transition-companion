# Development roadmap

Updated 25 November 2026. Only Phase 1 foundations below have been implemented.

| Stage | Deliverable | Status / release gate |
| --- | --- | --- |
| 1A | Baseline, branch, assessment, architecture, shared operating guidance | Implemented; existing regression suite passes |
| 1B | Session/encrypted device memory, backup/export/import/delete, local goal store | Implemented and tested; independent crypto review still required |
| 1C | Secure gateway, minimized approval packet, bilingual router, education/work instructions | Implemented with mock-provider tests; live provider behavior not tested |
| 1D | Public-knowledge SQL schema and filtered read interface | Implemented/tested in embedded PostgreSQL; no hosted DB or live corpus |
| 1E | Mobile-first standalone chat shell, Windows launchers and CI | Implemented; desktop responsive browser and local Windows checks; physical phones/AT pending |
| 2 | Editorial admin portal: staff SSO/MFA, roles, two-person approval, bilingual records, expiry queues | Design only; dedicated development DB and content owners needed |
| 3 | Live end-to-end AI and verified retrieval pilot | Needs authorized credentials/model, reviewed bilingual content, invented-data evaluations and privacy review |
| 4 | More specialists and richer follow-through | Design contracts exist; add one domain at a time, no new independent memory |
| 5 | Accessible mobile/voice pilot and optional local reminders | Physical iOS/Android, Hebrew voice, keyboard/AT testing; explicit permissions |
| 6 | Optional aggregate insight | Disabled; opt-in, small-cohort suppression, privacy budget and governance required |
| Release | Isolated hosted reviewer pilot, then separate production release | Explicit authorization, hardened public auth, threat review, rollback plan and owner access |

## Recommended next task

Build the **knowledge administration vertical slice** on this same development
branch: staff-only draft/review/approve/withdraw workflow, a small professionally
reviewed bilingual source set, and claim-level retrieval/answer tests. Connect it
to a dedicated local development PostgreSQL before proposing hosting. This makes
the companion useful with verified facts without uploading soldier histories.

In parallel with later live-AI authorization, evaluate education and employment
conversations with invented examples: abrupt topic changes, returning goals,
uncertain experience, no confirmed skills, Hebrew slang, English/Hebrew switching,
prompt injection in retrieved evidence, and distress. Passing JSON validation is
not a quality or safety evaluation.

Do not silently migrate the old app or remove its working CV, rights, history,
skills and sync features. Plan any later migration as a soldier-controlled preview,
encrypted backup and explicit import, with rollback to the old app available.
