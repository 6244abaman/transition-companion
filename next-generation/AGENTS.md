# Next Generation development boundary

Read ../docs/MASTER_ARCHITECTURE.md, PRIVACY_AND_SECURITY.md and TESTING_PLAN.md
before editing this application. This branch is an explicitly isolated development
task. Do not deploy it, merge into main, retarget Render or provision paid resources
without a later instruction. Shared owner operations remain in ../APP-OPERATIONS.md.

Keep the existing app and its saved data untouched. This application owns only
port 43128, IndexedDB momentum-next-generation-v1 and next-generation/.local.
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
