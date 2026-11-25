# Privacy and security — development design, not a policy change

## Staff workflow addition

The separate local Knowledge Desk on 43129 persists public knowledge and staff
names, role descriptions, salted scrypt password hashes and editorial actions.
These are not soldier accounts. No soldier text, profile, goal or activity reaches
that service: the companion asks only for public domain/language knowledge.
Staff sign-in uses HttpOnly/SameSite=Strict cookies, in-memory 15-minute sessions,
same-origin/Host checks, CSRF, body/rate limits and fresh role checks. Local owner
setup uses an unserved instance token; no default accounts or public enrolment.
Passwords are hidden in interactive setup and stored only as salted hashes.
Professional role descriptions are attestations, not independent credential checks.

The knowledge.snapshot file includes staff metadata/hashes and is private, not
encrypted. Protect local OS access and backups; it is excluded from git/HTTP.
Windows-safe atomic snapshot writes finish before mutations are acknowledged;
disk failure blocks further reads. Never auto-restore an old snapshot that might
reinstate withdrawn content. Named professional review remains pending for all
starter drafts. Local authentication is not hosted SSO/MFA. No production privacy
policy, new paid resource or public deployment is introduced by this workflow.

Updated 25 November 2026. No production privacy policy or provider contract was
changed. This foundation needs independent security/privacy review before a pilot.

## Data lifecycle

1. Chat starts in RAM. No soldier signup/contact form, telemetry, central dossier,
   automatic model call, external font/CDN request or automatic migration.
2. The soldier may create encrypted memory with a >=12-character passphrase.
   PBKDF2-SHA256 (600,000 iterations, random 16-byte salt) derives a non-extractable
   AES-256-GCM key. Each save uses a new random 12-byte IV. The key/passphrase are
   not persisted. Ciphertext only is saved to the app's separate IndexedDB store.
3. Lock clears active conversation, draft, access code and key references, stops
   speech and aborts outstanding UI AI requests. Pagehide also clears active state.
   Closing a page is not cryptographic erasure of OS memory. There is no automatic
   idle timeout yet: lock before leaving a shared device.
4. Export downloads an encrypted file on the soldier's action. Import decrypts
   and validates before replacing saved state; wrong passwords and tampering leave
   saved data unchanged. Revision/ciphertext checks reject competing-tab writes.
5. Delete removes this app's vault and active state. It does not delete downloaded
   backups, OS/browser backups or the older app's data, and cannot guarantee physical
   disk erasure. Browser clearing/loss can erase data. Forgotten passphrases cannot
   be recovered by Momentum.

## External AI disclosure

The gateway is disabled unless the owner configures server-only OPENAI_API_KEY,
OPENAI_MODEL and a sufficiently long access code. The app holds that access code
in session memory; the OpenAI key never reaches the browser. A short-lived
single-use ticket binds the SHA-256 digest of the exact approved personal packet.
Only digest/expiry remain in the ticket map, which is bounded and purged on issuance.
The approval endpoint itself receives the packet only after the explicit preview
approval. This is not an independently authenticated legal consent record.

Optional goals/skills/history start OFF. The preview shows exactly the personal
packet; fixed server instructions and reviewed public evidence are added separately.
No background requests, previous_response_id, Conversations API, model tools or
personal vector store. Provider requests set `store:false`.

`store:false` does not guarantee zero retention. OpenAI's current API data controls
describe abuse-monitoring retention and separately approved retention controls.
Review [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
and the organization's actual contract before any soldier pilot. Production gateway,
ingress, Render and speech-provider logging/retention also need review. Local-first
means personal persistence is local by default, not that approved AI use is offline.

## Implemented gateway boundaries

- Loopback-only Node host, exact Host and Origin checks, cross-site denial, fixed
  static allowlist, CSP without inline/third-party scripts, no .env/server/git/runtime
  paths, no request/body/header logging and no detailed upstream error forwarding.
- Constant-time access-code comparison; bounded body and ticket counts, global
  process-local rate limit, server request limits and provider timeout.
- Fixed HTTPS OpenAI Responses upstream; client cannot select URL/model/system
  instructions/tools. Validate input and output again locally; display text only.
- Parameterized knowledge queries, reviewed+approved+expiry filters, exact source
  hostname allowlist and no arbitrary server URL fetching.
- Benefits without current verified knowledge do not reach the model. Citation IDs
  must come from retrieved evidence. This does not prove claim-level accuracy.

The shared gateway access code is only a local development guard. Do not expose
this host publicly or put that code in a README, URL, compiled frontend or git.
Public hosting needs TLS, per-session authorization, abuse/budget controls and
independently tested ingress. A client abort after approved transmission cannot
retract data already sent to the backend/provider. No claim of zero provider logs.

## Threats and remaining work

| Threat | Mitigation / remaining limitation |
| --- | --- |
| Lost/shared device | Encryption at rest, explicit lock; unlocked XSS/extension/OS compromise can still read RAM |
| Stale tab / deleted vault resurrection | Transactional compare-and-swap of revision and previous ciphertext |
| Prompt injection | Fixed instructions, no tools, evidence treated as data; adversarial model evaluation still needed |
| Hallucinated rights/medical advice | Evidence gate, provenance, limitations and human support; claim fidelity not guaranteed |
| Cross-site / DNS rebinding / private file exposure | Exact origin/Host checks and public file allowlist |
| Credential/provider errors in logs | No personal logging; safe status/errors; hosting observability review pending |
| Weak/reused passphrase | Minimum length and KDF; no recovery, strength meter or independent crypto audit |
| Browser storage quota/availability | Session remains usable; save failure is visible; encrypted backup recommended |
| Voice privacy | Disclosure before each browser speech action; external provider possible, typing fallback |
| Missed crisis | Narrow cues, always-visible human help; no diagnosis, continuous monitoring or automatic notification |

Human-help data was checked through the connected local-hotline tool for Israel
(ERAN) and the official Rehabilitation Division website on 25 November 2026.
Do not add fake staff contacts or assume dialing works on every device. Real
emergency and referral protocols need qualified review; no clinician is on call.

No central aggregate analytics is enabled. Any future opt-in collection, new
personal-data category, automatic backup or changed consent/retention arrangement
requires an explicit design and governance decision, not merely a code deploy.
