# Next Generation development boundary

Knowledge Desk: read ../docs/KNOWLEDGE_REVIEW_GUIDE.md and KNOWLEDGE-DESK.txt.
Preserve port 43129, staff editor/reviewer separation, bilingual atomic publication,
immutable revisions/events, no self-approval, expiry/withdrawal and snapshot durability.
Staff accounts are separate from soldier data; never store soldier activity here.
Seeds are source-checked drafts; do not invent a professional approval. Both local
apps have independent Start/Stop launchers. Test both and actual process restarts.
The companion reads only public domain/language from the desk, never sends a profile.

Read ../docs/MASTER_ARCHITECTURE.md, PRIVACY_AND_SECURITY.md and TESTING_PLAN.md
before editing this application. This branch is an explicitly isolated development
task. Do not deploy it, merge into main, retarget Render or provision paid resources
without a later instruction. Shared owner operations remain in ../APP-OPERATIONS.md.

Keep the existing app and its saved data untouched. This application owns only
ports 43128/43129, IndexedDB momentum-next-generation-v1 and next-generation/.local.
Never read or auto-migrate the legacy app's localStorage, consent or sync records.

Personal memory belongs in the browser. No central soldier IDs, profiles, chat,
goals or per-person activity events. No personal content in logs. All model requests
require an explicit preview and approval; optional context starts off. Never put
provider credentials in public files. No browser external network except deliberate
official/help links and browser speech after disclosure. Fixed gateway upstream only.

Run root npm test, npm run build:review, and npm run test:nextgen. Verify Windows
Start-Next-Generation.cmd / Stop-Next-Generation.cmd startup/reuse/stop, origin,
private asset denials and relevant browser flow. Mock APIs by default; live calls
require intentional configured access and invented test data. Keep documentation
honest about missing live tests and specialist/admin features. Update DEVELOPMENT_LOG.
