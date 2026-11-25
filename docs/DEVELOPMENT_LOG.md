# Development log

## 25 November 2026 — Phase 1 foundation

- Read the provided architecture request and attached app review; examined source,
  operational guidance, storage/AI/deployment boundaries, branch and PR history.
- Created `development/next-generation` from current working review a45bf75,
  preserving older main and deployed review branch. Inspected previous OpenAI and
  knowledge prototypes rather than merging their unrelated rollback diffs.
- Installed pinned development dependencies and established a passing root baseline.
- Added an isolated bilingual shell, encrypted private memory with explicit backup/
  restore/lock/delete, shared local goals, coordinator routing and education/work
  specialist instructions with a clearly labeled local guided fallback.
- Added server-only OpenAI gateway with exact-packet approval, bounded single-use
  consent tickets, auth/origin/Host controls, structured output and safe failure paths.
- Added public-knowledge PostgreSQL schema/read adapter with approved/date/source
  filters; no soldier tables, analytics or unverified benefit seed content.
- Added separate Windows Start/Stop launchers on 43128, owner-token process checks,
  loopback/static boundaries and plain opening instructions. Tested actual lifecycle.
- Added independent foundation tests and Ubuntu/Windows CI. Initial tests exposed
  a Windows PowerShell quote issue and two test-harness timing/header issues; fixed
  them and reran successfully. Strengthened stale-tab delete/recreate protection,
  large encrypted backup encoding and lock-during-request handling.
- Ran responsive browser checks of conversation, Journey, bilingual layout, support,
  source panels and voice disclosure. Physical devices and real audio are outstanding.
- Added the required architecture/schema/agent/privacy/roadmap/testing documents;
  shared GitHub/Claude operations explicitly preserve the existing hosted service.
- Final foundation suite: 18/18 passing, including large-backup encoding,
  citation enforcement and a delayed reply after lock. Existing root regressions
  and static review build pass. Full dependency audit reports zero vulnerabilities.
- Confirmed the Render review is still live at base a45bf75, auto-deploying only
  complete/continuity-and-followup; Next Generation has no hosted deployment.

No production deployment, Render retargeting, paid provisioning, privacy-policy
change, live model call, central personal storage or old-data migration occurred.
See TESTING_PLAN for evidence and limits, DEVELOPMENT_ROADMAP for remaining stages.
