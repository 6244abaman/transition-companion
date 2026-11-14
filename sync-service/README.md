# Encrypted sync relay

Minimal Node HTTP relay for user-initiated encrypted Companion snapshots. Requires Node.js 22.5 or newer for `node:sqlite`.

## Run

```sh
ALLOWED_ORIGINS=https://6244abaman.github.io \
SYNC_DB_PATH=/var/lib/transition-companion/sync.sqlite \
PORT=8787 node sync-service/server.js
```

Set `SYNC_DB_PATH` to a durable, private disk. Put the service behind HTTPS and allow only the exact browser origin hosting the app. `/health` provides a basic health check.

The database stores an opaque ID, a hash of the bearer token, revision metadata and an AES-GCM envelope. It does not store the key or plaintext profile. Pairing codes carry both the token and decryption key; users must protect them. Records are removed after 365 days without an update. The in-memory creation throttle is best-effort and resets when the process restarts.

The relay has automated local tests but has not had an independent security review, deployment review, backup/restore test or abuse/rate-limit assessment. Do not use it for a real-soldier pilot until those steps are complete.
