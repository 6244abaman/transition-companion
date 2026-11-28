# Testing plan and verification record

## Knowledge Desk update — 25 November 2026

All 34 foundation tests passed (the original 18 plus 16 knowledge workflow,
staff HTTP/UI and durability tests). They cover two-person role checks, contributor
rejection, bilingual/source/date validation, stale edits, immutable revisions/events,
atomic two-language publication and rollback, replacement, withdrawal/expiry,
publication-view integrity, staff login/CSRF/logout/disable/session expiry/rates,
private asset boundaries, companion public retrieval and safe local client failure.
Durability tests use separate Node processes to reopen knowledge and staff login;
disk replacement failure blocks reads. Existing suite results below describe Phase 1.

Real Windows desk startup/reuse/stop/restart has been verified after correcting a
native PostgreSQL filesystem permission issue. The desk now uses atomic snapshots.
Browser verified the real four-draft preview in Hebrew and English at 390px width,
without horizontal overflow or console errors. Staff editing/approval is covered by
HTTP and DOM tests using isolated test accounts, not fake professional approvals
in the owner's actual database. Real staff enrolment/sign-off is an owner action.
The full original root regression suite and npm run build:review also passed after
the change. npm audit reports zero vulnerabilities for the new dependency tree.

25 November 2026. Node.js 24.15.0 on Aba's Windows computer.

## Required regression commands

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run build:review
cd next-generation
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

The original npm test command still runs its original legacy, integration, next
prototype, review and home suites. `npm run test:nextgen` is an additional root
shortcut, not a replacement for existing tests. GitHub's existing PR workflow
runs legacy regressions; the new workflow runs the foundation on Ubuntu and the
launcher lifecycle on Windows. No paid provider/database credentials in CI.

## Executed results

- **Baseline and final legacy regressions:** passed. This includes 63 integration
  cases, 4 review-build cases, 4 home-pathway cases and the legacy flow/path/journey/
  voice, business-skills, knowledge and encrypted sync script assertions. Existing
  jsdom reload/navigation warning is recorded in REPOSITORY_ASSESSMENT, not hidden.
- **Foundation:** 18 tests passed. Encryption persistence,
  lock, wrong password, backup portability/tampering, stale tabs, delete/recreate,
  goals, routing and bounded opt-in context; actual local HTTP gateway auth/origin/
  Host/body limits, one-use/tampered/expired consent, disabled mode, provider failure/
  refusal/incomplete output/timeout, evidence and safety gates; UI language/XSS/
  consent cancellation and separate help/benefits; real SQL migration and retrieval.
- **PostgreSQL:** migration applied twice and queries executed in PGlite, the
  embedded PostgreSQL engine, with test-only fixtures. Draft, expired, future,
  wrong-language, unapproved and spoof-source records excluded. No soldier tables.
- **Dependencies:** npm audit (including development dependencies) and
  npm audit --omit=dev both reported zero vulnerabilities at verification.
  This is not a security certification.
- **Windows:** real hidden background startup, repeated start reuses the process,
  stop exits the owned service, repeated stop is harmless. Fixed loopback origin
  127.0.0.1:43128; legacy port/service remains separate.
- **Browser responsive checks:** local app on in-app browser; Hebrew/English
  switching preserves thread; local work prompt replies; create/complete a temporary
  Journey step; benefits/help outside chat; direct help links; Escape closes dialog;
  voice disclosure appears and can be cancelled. No browser console errors observed.
  At 390x844 chat height ~602px; at 360x740 ~498px, both >60% viewport and >300px;
  header 56px; no horizontal overflow. Viewport reset after checking.

## Explicitly not tested or completed

- Live OpenAI model or billing, model-specific schema support/quality, provider
  retention, claim-level groundedness, adversarial prompt injection evaluations.
- Hosted PostgreSQL/TLS/grants, actual staff approval process, backup/restore of
  server knowledge, production load/distributed rate limits or independent pentest.
- Physical iOS/Android devices, virtual keyboard behavior, real microphone capture,
  Hebrew speech recognition/synthesis, actual calls or human chat response.
- Screen-reader/assistive technology audits, broad accessibility conformance,
  measured real-device speed under slow networks or weak-device crypto performance.
- Clinical/legal/benefits expert approval, complete crisis detection, privacy/legal
  compliance, aggregate analytics or production deployment.

Before any pilot, run invented-data live gateway tests deliberately, review
request packets and safe logs, test actual phones and assistive tools, validate
official facts with content owners, and exercise rollback. Passing unit tests or a
responsive viewport does not mean the application is ready for vulnerable users.
