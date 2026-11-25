# Development roadmap

Updated 25 November 2026. Phase 1 and a local staff workflow are implemented.

| Stage | Deliverable | Status / release gate |
| --- | --- | --- |
| 1A | Baseline, branch, assessment, architecture, shared operating guidance | Implemented; existing regression suite passes |
| 1B | Session/encrypted device memory, backup/export/import/delete, local goal store | Implemented and tested; independent crypto review still required |
| 1C | Secure gateway, minimized approval packet, bilingual router, education/work instructions | Implemented with mock-provider tests; live provider behavior not tested |
| 1D | Public-knowledge SQL schema and filtered read interface | Implemented/tested in embedded PostgreSQL; no hosted DB or live corpus |
| 1E | Mobile-first standalone chat shell, Windows launchers and CI | Implemented; desktop responsive browser and local Windows checks; physical phones/AT pending |
| 2 | Local editorial desk: staff roles, independent approval, paired revisions, expiry/withdrawal/audit | Implemented and tested locally; real professional sign-off, organizational SSO/MFA and hosted roles remain |
| 3 | Live end-to-end AI and verified retrieval pilot | Needs authorized credentials/model, reviewed bilingual content, invented-data evaluations and privacy review |
| 4 | More specialists and richer follow-through | Design contracts exist; add one domain at a time, no new independent memory |
| 5 | Accessible mobile/voice pilot and optional local reminders | Physical iOS/Android, Hebrew voice, keyboard/AT testing; explicit permissions |
| 6 | Optional aggregate insight | Disabled; opt-in, small-cohort suppression, privacy budget and governance required |
| Release | Isolated hosted reviewer pilot, then separate production release | Explicit authorization, hardened public auth, threat review, rollback plan and owner access |

## Recommended next task

Enrol a named Momentum editor and independent professional reviewer in the local
Knowledge Desk, then review and approve the four source-checked bilingual topics.
The workflow and embedded PostgreSQL are ready; human professional approval has
not been supplied. Next evaluate claim-level retrieval and answers with invented
soldier examples, then plan organizational SSO/MFA and a dedicated hosted review
environment before proposing public access. Do not describe source checks as
independent professional sign-off.

In parallel with later live-AI authorization, evaluate education and employment
conversations with invented examples: abrupt topic changes, returning goals,
uncertain experience, no confirmed skills, Hebrew slang, English/Hebrew switching,
prompt injection in retrieved evidence, and distress. Passing JSON validation is
not a quality or safety evaluation.

Do not silently migrate the old app or remove its working CV, rights, history,
skills and sync features. Plan any later migration as a soldier-controlled preview,
encrypted backup and explicit import, with rollback to the old app available.
