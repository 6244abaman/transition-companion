# Windows local use

Keep Start.cmd, Start-English.cmd, Stop.cmd, their PowerShell helpers and
windows/server.cjs working when changing the app. Read OPEN-ME.txt for the
user's normal opening path. Use port 43127 and 127.0.0.1 consistently so browser
data remains at the same origin. Daily use needs only Node.js 24; jsdom/npm
dependencies are for development tests. The local host must stay loopback-only
and must not serve source-control files, server files or .local runtime data.

Preserve per-request AI consent and the existing backend configuration.
After changes, run npm test plus the Windows startup/reuse/stop checks.
Keep OPEN-ME.txt and the README Windows section accurate. When adding frontend
assets, update the host's public asset list and check their HTTP responses.
