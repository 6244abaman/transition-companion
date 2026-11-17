# Soldier Transition Companion — continuity and follow-up

**[Open and share the review app](https://transition-companion-review.onrender.com/)**
· [Render dashboard](https://dashboard.render.com/static/srv-dbsb37jl550s73fvm5t0)
· [Permanent links to both apps](https://github.com/6244abaman/transition-companion/blob/main/LIVE-APPS.md)

## Share the hosted review build

The Render review site serves this development branch independently of Aba's
computer and Codex. See [HOSTING.txt](HOSTING.txt) for the Render dashboard,
sharing, automatic updates and manual deployment instructions. `npm run
build:review` packages only the public frontend into `dist`; the existing AI
backend remains separate. Hosting does not activate cross-device sync.

## Open on Windows

Double-click `Start.cmd` for Hebrew or `Start-English.cmd` for English. Use
`Stop.cmd` to stop the background server. Install Node.js 24 once if needed;
daily use needs no development commands or open Codex session.
The fixed local address is `http://127.0.0.1:43127/`.

See [OPEN-ME.txt](OPEN-ME.txt) for opening, backup, internet requirements and
updates. Keep the launcher files with the app when updating this repository.
Live AI uses the existing external backend with the app's sharing controls.

The existing Hebrew and English Companion now connects the soldier-owned Journey profile to both the original Momentum 63 life skills and the separate 36 business skills. Goals, CV drafts, education and actions remain editable in the same local profile.

## Current entry points

- `index.html` / `indexH.html`: dialogue, optional browser voice, persistent external AI consent with Settings withdrawal, and offline safety cues.
- `my-journey.html` / `?lang=he`: goals, actions, CVs, education, confirmed skills, application preparation, reminders, backup and optional encrypted synchronization.
- `skills-business.html`: the 36-skill, 1–7 self-assessment. This is a self-report scale, distinct from evidence-based experience levels.
- `server/sync-server.js`: ciphertext-only continuity service, separately deployed. See [deployment and participant instructions](server/README.md).

## What is implemented

- Explicit consent before the first external AI request, remembered until withdrawal or a provider/sharing-scope change. Cancel sends nothing. Recent conversation context and separately enabled Journey categories are disclosed before agreement. Settings stops future sharing, including background requests. A non-blocking reminder appears every 100 user messages sent. Requests retain timeouts, schema-constrained output, local validation and retry controls.
- Canonical 63-skill English names and the research role/rank matrix are extracted from the supplied mapping workbook. Source #63 duplicates Professionalism (#55); it remains documented and is not counted as a separate CV skill. Hebrew labels are interface translations pending human review. Role and rank prioritize a few evidence questions; they never award a skill or proficiency score.
- Soldiers explicitly confirm a non-sensitive example to save a life skill. Saved examples can be reused in editable CV drafts alongside confirmed 36-skill examples. Existing chat-derived strengths need a separate user confirmation before entering Journey.
- Password-encrypted, invitation-gated online snapshots with private connection codes, two-device download/review, opt-in synchronization while unlocked, atomic conflict detection, tombstones on online deletion and local export/reset controls. Conversations and documents are excluded from this service.
- Generic opt-in browser reminders while Journey is open; calendar export provides alarms when the app is closed after the soldier imports the file. Calendar titles/notes are omitted unless selected. Calendar providers may receive exported data.
- Three dated official-source guides for personal deposit, discharge grant and reserve compensation claim routes. They prepare local checklists and drafts; they do not calculate or determine eligibility, fill a signed official form, or submit anything. Source summaries expire for review and link to the responsible authority. Program-owner/language review is still pending.
- On-device urgent safety cue handling before external AI, text access to human support, and an explicit statement that the app has not notified anyone and is not monitored. This is a narrow safeguard, not a clinical assessment.

## Verification

`npm ci && npm test` runs offline regression and HTTP integration tests on Node 24. `npm run test:live` is a separate, explicit network smoke test against the configured AI service with invented Hebrew/English scenarios. It incurs small provider usage; it never loads real soldier data. GitHub Actions runs the offline suite on pull requests and main.

See [the current verification report](TEST_REPORT.md) for measured results and remaining deployment checks.

## Release limits

This is not yet a production-approved soldier deployment. The sync service must be deployed to the confirmed Render workspace with persistent storage, an exact origin allowlist and a privately configured enrollment invitation. The existing AI proxy remains separate. Its production access controls, credential handling and retention/logging need review.

Browser-local profiles and conversations remain in unencrypted localStorage; encrypted exports and online snapshots do not encrypt that local store. The two language editions still retain their older separate chat histories, while Journey shares selected reusable facts. This update does not provide encrypted document storage, identity/account recovery, closed-app push scheduling, clinical monitoring or an authenticated Momentum staff dashboard. Physical microphone/playback, offline installation, accessibility, Hebrew quality, clinical safety and independent security review remain required before a soldier pilot. Human contact routing still needs a real Momentum coordinator destination.

---

# Historical V2 documentation

A dialogue-first companion for Israelis finishing IDF service. Bilingual Hebrew/English,
voice in and out, runs as a single HTML file with no build step.

**V2 replaces V1's questionnaire-and-menu approach with a conversation.** There is no intake
form and no module list. What the person needs emerges from what they say.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The app. This is what GitHub Pages serves. |
| `guided-transition-companion-v2.html` | Identical copy, kept under its real name for clarity. |
| `tests/` | Automated tests. No API key or internet needed. |

> Historical prototypes differ from the current live English/Hebrew pages. Use `index.html` and `indexH.html` as current entry points and do not overwrite them with archived copies.

---

## Running it

**On your phone or anywhere:** open the GitHub Pages URL (see Setup below).

**On your own machine:** double-clicking the file works for typing, but **voice will not work
from `file://`** — Chrome blocks microphone access on local files. Use the Pages URL for voice.

Browser support: Chrome works fully. Safari and Firefox support typing but not speech recognition.

---

## Configuration

Everything you may need to change is at the top of the HTML, in the `CONFIG` block:

- `API_URL` — your Render proxy endpoint
- `MODEL` — which model the proxy forwards to
- `HISTORY_TURNS` — how many past turns get sent each call (lower = cheaper)
- `MAX_TOKENS` — max length of each reply
- `SUPPORT` — the human support contacts shown in the app

### If the AI isn't responding

Open the app and tap **"Check connection to the AI service"** under the Start button. It
distinguishes: wrong path (404), missing API key (401/403), proxy crash (500), server asleep
or CORS, and wrong reply shape. Costs ~16 tokens to run.

**Practice Mode:** if the proxy can't be reached, the app says so and falls back to a built-in
script so the whole flow stays testable with zero API cost.

---

## Seeing how it works

Tap the title **"Transition Companion"** three times to open the inspector. It shows, for the
last turn: whether the reply came from the live API or Practice Mode, which behavioral rules
fired, whether the model's JSON parsed cleanly, estimated token cost, current conversation
state, the profile so far, and the raw model output. There's a "Copy all of this" button for
reporting problems.

The inspector is hidden behind a triple-tap so that someone using the app never stumbles into it.

---

## Tests

```bash
npm install     # once
npm test        # runs the full suite
```

The regression suite runs the shipped HTML plus the shared Journey profile store.
No API calls, so tests are free and work offline.

- `tests/flow.test.js` — conversation flow, skill discovery, evidence-gated profile, the
  once-only behavioral rules, support drawer
- `tests/paths.test.js` — English flow, mid-conversation language switch, reload persistence,
  crisis escalation, delete
- `tests/inspector.test.js` — prints the inspector's live output (diagnostic, not pass/fail)

**Re-run `npm test` after any edit to the HTML.** It has already caught real bugs: a missing
Hebrew keyword, a missing tank/armor skill mapping, and a misleading cost readout.

What the tests **cannot** cover: the live API path and actual voice input/output. Those need a
real browser, a microphone, and a working proxy.

---

## Design principles (do not break these)

1. **No flattery.** Never praise a role or a unit. Strengths require the person's own evidence.
2. **Role is a hypothesis, never a conclusion.** Two people in the same job built different things.
3. **Service is both sacrifice and growth.** Hold both; don't resolve the tension early.
4. **Analysis never stops.** Generate real alternatives, state trade-offs honestly, recommend
   when justified, disagree when warranted. Don't just agree.
5. **Escalation adds, never replaces.** A human is always reachable, and the AI keeps helping.
6. **Privacy language must match the implementation.** No absolute claims the architecture
   doesn't guarantee.

---

## Privacy, as actually implemented

Conversation histories and Journey records are saved in the browser's localStorage only. Message text is sent to the AI
service to generate replies. Speech is handled by the browser, which on most browsers means
audio goes to the browser vendor's servers. The application cannot establish the external service or provider's retention policy; that policy must be reviewed before deployment. Clearing browser
data deletes everything. On a shared device, others using that browser can open it.

---

## Open questions

1. The framework has 63 identified skills; the original brief said 65. Are two missing?
2. Is `API_URL` correct, and does the proxy return Anthropic's standard `content` array?
3. Should the growth profile be exportable — for a Momentum coordinator, or for the person's CV?
4. Who is the Momentum contact in `CONFIG.SUPPORT`, and is it a phone number or a form?
5. Automatic cross-device continuity remains a future decision: secure account and encrypted sync, user consent, conflict handling and independent security review are prerequisites.

## Updated Information and Benefits

Open the separate sidebar topic or [open directly in English](https://transition-companion-review.onrender.com/app/index.html?lang=en&section=updates). Government rights remain under Rights and benefits; My Journey includes application preparation. The updates section adds a dated public feed for rights, shows, discounts, career events, training and private/nonprofit offers. The chat receives these source notes for relevant questions only while external AI consent is active. A scheduled research task checks sources and publishes an edition every three days. Stale reviews and restricted sources are clearly labelled. See [BENEFITS-UPDATES.md](BENEFITS-UPDATES.md) for the publishing workflow and limitations.

## External AI consent

Before the first provider request, Agree and continue enables sharing of messages, recent conversation context, system instructions and separately enabled Journey categories with Anthropic (Claude). Cancel sends no request. Consent is remembered in this browser until withdrawn, or until the configured provider/endpoint or data-sharing scope changes. Settings → Withdraw consent blocks future chat and background AI requests and aborts in-flight fetches; it cannot undo transfers already made. Every 100 user messages dispatched shows a non-blocking reminder with Manage consent. History messages, lines, diagnostics and background calls do not increment this counter.

All new AI request paths must use `MomentumAIConsent.request`. Background calls must omit `interactive` and `userMessageId`; they fail closed without matching consent. Interactive user sends provide a stable unique message ID. Provider changes must update the `provider` option, and changes to shared data categories must update the scope version in `ai-consent.js`. Consent is local to the browser/origin; unavailable browser storage makes it session-only.
