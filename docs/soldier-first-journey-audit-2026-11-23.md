# Soldier-first full journey review — 23 November 2026

**Scope:** Current `main` source pages `index.html`, `indexH.html`, `my-journey.html`, `skills-business.html`, `README.md`, `package.json` and documented review deployment. Focus on how a soldier feels, understands, moves, completes and resumes. Visual skin (color, typography, imagery, warmth) is a distinct presentation layer and must not obscure functions.

**Evidence boundary:** This is a source-backed UX audit and executable-test plan, NOT a claim that live, mobile, microphone, AI or deployed end-to-end sessions have passed. Review Render URLs could not be loaded via the available read-only browser tool. No real soldier data collected. Deployment status and screenshots need browser/device verification.

## First five minutes — soldier's point of view

Persona A: 22-year-old regular-service combat soldier who doesn't know what comes next; Hebrew first. Persona B: regular-service soldier seeking a job/CV in English. Persona C: reservist also transitioning to civilian life. Persona D: soldier in emotional distress. Persona E: returning user with saved goals on same phone, then new phone.

**Design contract:** One unmistakable start action; short opening; optional background questions in one compact screen; user may skip; role selection must not repeat; reserve service selection exposes a distinct reserve-role question; immediate answer directly below question (not down at bottom of page); stable visible follow-up composer; ability to change topic without losing context; confidence and agency rather than interrogation.

## Scenario matrix — evidence to collect and exit criteria

Status legend: **SOURCE** = visible implementation evidence only; **DEVICE** = not verified on live device; **GAP** = documented missing/incomplete feature; **NEEDS CHECK** = no reliable result from code/documentation review.

| ID | Soldier action / journey | What a passing experience looks like | Status / note |
|---|---|---|---|
| S01 | Open a fresh Hebrew link on Android Chrome | Clear, fast welcome, working layout, single primary CTA; no stale cached page | DEVICE |
| S02 | Open English version; switch HE ↔ EN | Consistent questions, working language link, real RTL mirroring, no lost progress | DEVICE; source has separate entry pages |
| S03 | Begin, decline external AI consent | No external request before agree; useful safe alternative; cancel is unambiguous | DEVICE |
| S04 | Agree; send first message | Success or clear live-service error; Practice Mode conspicuously labeled | DEVICE; fallback configured in source |
| S05 | Give phone/email or skip | Contact fields optional and clearly explained; skip continues | NEEDS CHECK |
| S06 | State service unit and role | Single question per step, no repeated selection loop | NEEDS CHECK |
| S07 | Indicate reserve service | Additional reserve role question only when relevant, preserving regular service role | NEEDS CHECK |
| S08 | Ask 'I have no idea what to do' | Empathetic short clarification, real options, no forced destination | DEVICE |
| S09 | Select career/work | Explore civilian equivalents of personally evidenced skills and realistic options | DEVICE |
| S10 | Complete 36-skill assessment | Previous/next/not applicable work; 1–7 ratings persist without implying verification | SOURCE page and tests; DEVICE |
| S11 | Draft and revise CV | Only confirmed examples; clearly marked draft; save into My Journey | SOURCE; DEVICE |
| S12 | Study/training | Ask interest, prerequisites, costs, timelines and action; save plan | SOURCE Journey education tab; DEVICE |
| S13 | Rights/benefits | Show trustworthy dated official source, eligibility, deadline, checklist, next step; avoid false promises | NEEDS CHECK |
| S14 | Money/finances | Concrete budgeting/action options without collecting needless sensitive details | DEVICE |
| S15 | Travel | Answer with logistics, cost considerations and next actionable comparison | DEVICE |
| S16 | Housing | Ask what decision is at stake, costs, eligibility and practical options | DEVICE |
| S17 | Relationships | Listen, ask one question at a time, respect privacy | DEVICE |
| S18 | Mental wellbeing | Supportive, appropriate safety advice; working human handoff | DEVICE; Momentum coordinator number blank in CONFIG |
| S19 | Reservist livelihoods or repeated call-ups | Recognize reserve-specific constraints; link to applicable help where actually available | DEVICE |
| S20 | Change from career to travel and back | Context remains coherent; no restart or forced repeated intake | DEVICE |
| S21 | Ask follow-up or correct an answer | Edit course; show answer beside or below question, not far down | DEVICE |
| S22 | Enter unusually long, mixed HE/EN or invalid input | No crash, safe errors, readable UI | DEVICE |
| S23 | Refuse mic permission; type instead | Text always works, no broken overlays | DEVICE |
| S24 | Speak and play response, on mobile | Working voice or unambiguous unavailable messaging | DEVICE; browser voice unsupported on some environments |
| S25 | Disconnect network / AI proxy error | Transparent connection state, no mock reply misrepresented as live AI | DEVICE |
| S26 | Reload / close and reopen same origin | Local text state and Journey records survive as documented | SOURCE; DEVICE |
| S27 | Open on different phone/browser | Explain that data will NOT automatically follow; offer protected export/import | GAP: no seamless account-backed history sync in README |
| S28 | Save goal, due date, follow-up action | Record survives reload; edit/delete with confirmation | SOURCE; DEVICE |
| S29 | Expect automatic reminder | Tell user if unavailable; do not falsely imply a notification was scheduled | GAP: README explicitly says no automated reminders |
| S30 | Export encrypted backup; restore | Correct passphrase required; correct data restores; clear security warnings | SOURCE/test coverage; DEVICE |
| S31 | Delete user records | Explicit scope and successful deletion incl. language transcript choices | SOURCE/test coverage; DEVICE |
| S32 | Request human Momentum coordinator | A **working** contact method, not an empty button/phone value | GAP: empty `tel` |
| S33 | Verify navigation links | Companion → Skills → Journey → Companion, both languages, no 404 | SOURCE relative links; DEVICE |
| S34 | Check small Android/iPhone displays, keyboard open | Buttons not cut off, composer visible, no horizontal overflow | DEVICE |
| S35 | Version + cache visibility | Deployed build ID visible so tester can distinguish updates from stale cache | NEEDS CHECK |
| S36 | Analytics privacy review | Aggregate opt-in/legally reviewed diagnostics; no messages/names/roles in events | GAP: no verified organization dashboard |
| S37 | Report an error or ask for help | User can send a bug report without exposing personal conversation by default | NEEDS CHECK |

## Priority findings and implementation recommendations

**P0 (before exposing as dependable assistance):** prove external-AI consent gating; distinguish live AI and Practice Mode; verify wellbeing escalation and human handoff; verify benefits sources and review dates; inspect any proxy authorization/security separately. Do not send private user content into management analytics.

**P1 (blocked or confusing journeys):** compact single welcome/start; consolidate optional intake; prevent repeated role prompts; conditionally ask reserve role; answer immediately under question; reliable topic switching; HE/EN and mobile parity; verify all return links and broken pages; add accessible error states.

**P2 (continuity, follow-up):** make My Journey discoverable as a living plan, mark recorded actions as 'saved' not 'reminded', optional encrypted export/import tutorial, honest cross-device expectations; implement reminders only with explicit consent and actual notification delivery.

**P3 (management effectiveness):** independent privacy-safe operations dashboard, metrics from real events only, not inferred from private chat. Segments: deployment build/health, English/Hebrew, broad topic categories where safe, task action completion, error rate, AI success/fallback/latency, broken link checks, return sessions. Avoid fine-grained service unit/mental health analytics or small cohort reidentification. Define session counting, retention, consent and incident response before instrumentation.

## Dashboard acceptance criteria

1. Shows current deployed version, source commit, deployment timestamp, last successful Android/iOS test, and AI proxy status.
2. Shows only observed aggregate counts: sessions, journeys started, meaningful next-step saves, error/timeout rates, opt-in coarse topic counts; undefined metrics display 'Not measured'.
3. Includes trends, funnel drop-off between start → topic → next step, and a prioritized technical fault list.
4. Separately displays test results from real usage statistics.
5. No stored raw prompts, names, contact info, service unit or other sensitive attributes; suppression of small cells and retention limits.
6. Dashboard access restricted to designated Momentum staff; privacy/security review before collection.

## Execution protocol

A. Run existing `npm test` and capture commit SHA, failures and logs. Do not extrapolate tests to actual voice/UI.
B. Use Playwright/browser automation with fresh isolated storage: HE and EN, Android viewport and desktop. Save screenshots only with synthetic data. Test each S01–S37 path.
C. Repeat microphone/voice and actual AI on Android Chrome and iPhone Safari on deployed review build; capture release identifiers.
D. File separate issues for every reproduced failure, attach redacted steps, expected/actual, severity and version.
E. Fix on review branch and require repeatable regressions; open PR for owner review; deploy and retest explicitly.
F. Run short soldier usability sessions with consent; note confusion/friction, number of unnecessary questions and whether people leave with a useful next step.

## Open design input

A separate front-end visual styling reference was mentioned but no actual new file/image was present in this request. Preserve the existing brand/content until that exact reference is supplied; apply visual flavor consistently to both language pages without regressing interaction design.
