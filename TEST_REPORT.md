# Verification report — 22 October 2026

## Observed results

- Existing dialogue regression: 11/11 checks passed against the shipped `index.html`, rather than the archived V2 file.
- Existing English/Hebrew navigation, content boundaries, persistence, support and deletion: 18/18 checks passed.
- Journey persistence, opt-in sharing, backup/import, reset and inline syntax: 14/14 checks passed.
- Mocked voice checks passed for Hebrew playback, microphone permission/network errors, preserving an unsent draft, text transcription and the language switch. These are not physical microphone tests.
- New integration suite (24 checks): HTTP encrypted round-trip, wrong-password rejection, stale-device conflicts, concurrent creation, online deletion tombstones, invitation access, allowed origins, isolated vaults, auto-sync, private reminder defaults, calendar escaping, rights expiry, source fidelity, bilingual loaded UI, CV from confirmed evidence, AI cancellation/exact request preview, offline safety and degraded-mode retry.
- Live provider checks: the existing proxy responded HTTP 200. Synthetic English and Hebrew scenarios returned schema-constrained JSON with the expected language and allowed the GitHub Pages frontend origin. A prior unconstrained run produced plain text rather than the requested JSON; provider-enforced schema output and local validation were added to correct that failure.
- `git diff --check` is part of final local validation. No provider API credentials were added to the client.

## Boundaries of the evidence

The new server runs in integration tests with real HTTP and separate device contexts; it has not been deployed to a hosted persistent disk in this change. UI interaction tests use jsdom, including all shipped external scripts. A Chromium binary was unavailable, and its attempted download returned an invalid archive. No visual browser/device, real microphone or mobile operating-system notification claim is made.

The live provider checks establish connectivity, origin access, response format and language presence for two invented scenarios. They do not establish clinical quality, general reliability, legal accuracy or broad Hebrew quality. Official rights sources were inspected on 22 October 2026; their summaries are not individual eligibility decisions.

## Remaining release work

1. Confirm the intended Render workspace, provision persistent storage and the enrollment invitation, deploy the reviewed sync branch, then verify its hosted lifecycle, TLS, origin rejection and a two-device round-trip.
2. Review and harden the existing AI proxy. Its current source exposes a partial provider-key prefix in `/health` and has broad CORS/request forwarding. Do not expose credentials in diagnostic endpoints; protect provider spend/access and minimize logs.
3. Complete the production design for encrypted local memory/documents, optional conversation continuity and device access controls. Current localStorage is plaintext.
4. Test actual Android/iOS/browser voice, offline installation, calendar imports and accessibility. Review Hebrew/English meanings and the skills mapping with the program owner.
5. Complete privacy/security and qualified psychological safety review; configure a real human coordinator destination before a supervised pilot.
