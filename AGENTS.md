# Windows local use

Read [APP-OPERATIONS.md](APP-OPERATIONS.md) before changing or delivering this
app. It is the shared source/deployment workflow for Codex and Claude Code.

Keep Start.cmd, Start-English.cmd, Stop.cmd, their PowerShell helpers and
windows/server.cjs working when changing the app. Read OPEN-ME.txt for the
user's normal opening path. Use port 43127 and 127.0.0.1 consistently so browser
data remains at the same origin. Daily use needs only Node.js 24; jsdom/npm
dependencies are for development tests. The local host must stay loopback-only
and must not serve source-control files, server files or .local runtime data.

Preserve persistent external AI consent and withdrawal controls and the existing backend configuration.
After changes, run npm test plus the Windows startup/reuse/stop checks.
Keep OPEN-ME.txt and the README Windows section accurate. When adding frontend
assets, update the host's public asset list and check their HTTP responses.

The Render review site uses scripts/build-review.cjs to publish only public
frontend assets in dist/app. Preserve its Hebrew root entry, existing /app/
paths and AI consent controls. When adding assets, update that build list too.
Run npm test (which includes test:review) and npm run build:review before
updating the hosted branch. Keep HOSTING.txt accurate and do not change the
existing AI proxy or activate sync merely to publish the static frontend.
