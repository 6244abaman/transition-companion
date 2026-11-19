# Encrypted continuity service

Node 24 service for the root Companion. It receives only AES-GCM ciphertext for the soldier's My Journey records. It does not proxy AI, accept identity documents, send notifications, store a decryption password, or offer account recovery.

## Run

Set environment variables outside source control:

- `ALLOWED_ORIGINS`: comma-separated exact frontend origins. For the current frontend this is `https://6244abaman.github.io` (an origin does not include `/transition-companion/`). No wildcard is accepted by the origin check.
- `SYNC_ENROLLMENT_CODE`: a privately generated invitation of at least 24 characters. Give it only to authorized participants for their first online save. Do not put this invitation in public HTML, GitHub or logs.
- `SYNC_DATA_DIR`: an absolute directory on persistent storage. The default `sync-data` is suitable for local tests only, not an ephemeral hosting filesystem.
- `PORT`: the host's assigned port, default 3000.

Run `npm start`. `/healthz` returns service identity and version; it exposes no credential material. Termination signals close SQLite cleanly. SQLite is intentionally a single-instance database; do not scale multiple replicas with separate files. Back up the persistent disk and configure host retention separately. SQLite's WAL and atomic revision comparison protect concurrent writes in this process/database.

Terminate TLS at the hosting platform. The frontend refuses HTTP except loopback development. Set the deployed HTTPS base address in My Journey → Privacy & backup → Connect my devices. No service address is invented or silently activated.

## Participant flow

1. Generate a private 256-bit connection code in My Journey. Choose a separate strong encryption password. Store both safely; Momentum cannot recover them.
2. Enter the service address and invitation. Explicitly unlock the connection and save the encrypted profile.
3. On a second device enter the same service address, private code and encryption password. Download, review and apply the profile. An invitation is not required to read an existing copy.
4. Optional automatic sync works while My Journey is open and unlocked, following an initial save or reviewed download. It uploads local changes or applies newer remote snapshots only when local records are unchanged. Simultaneous changes stop with a conflict instead of overwriting either device.
5. Resolve a conflict by downloading and reviewing the other copy, then explicitly merge or replace. In merge mode the downloaded record wins for matching IDs, and missing records are retained. To propagate deletions during conflict resolution, explicitly choose replacement after review and preserve a backup as needed.
6. Locking removes secrets from application memory and aborts outstanding requests. The next request/UI check locks after ten minutes of inactivity. Closing the page locks the session. Browser-local profile storage is still plaintext.
7. Delete the online copy separately. A revisioned tombstone prevents a stale device from resurrecting it automatically. Local copies and host backups have their own lifecycles. Participants with the private code can access the encrypted object and its metadata; treat the code as a credential.

The server hashes the capability code before using it as a database key. It never logs request headers/bodies/IDs. Requests are size-limited, cross-origin requests require an exact allowlisted origin, new vaults need an invitation, and writes/deletes require a matching revision. Process-local rate/capacity limits are a basic guard; production hosting still needs ingress rate limiting, incident response, monitoring without personal content, backup/retention policy, and independent security assessment.

`npm run test:integration` exercises the real HTTP service with isolated simulated devices. Automated checks do not certify production security or browser/device behavior.
