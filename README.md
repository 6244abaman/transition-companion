# Soldier Transition Companion — Continuous Journey Profile (October 2026)

The Companion offers dialogue-first support in Hebrew and English. **My Journey** now adds a soldier-owned, continuous local profile across service skills, personal goals, CV drafts, education or training plans, and follow-up actions.

## Try the current pages

- **English Companion**: `index.html`
- **Hebrew Companion**: `indexH.html`
- **My Journey**: `my-journey.html` (switch languages or use `?lang=he`)
- **36 career and business skills**: `skills-business.html`
- **Shared local data model**: `journey-store.js`
- **Optional protected backup**: `journey-backup.js`
- **Dashboard interface**: `my-journey.js`

The homepages, assessment and dashboard share `localStorage` **on the same browser and site origin**. The two older conversation transcripts are still separate; My Journey unifies the reusable plans and skill records, not their entire chat histories.

## How the ongoing profile works

1. The soldier rates one of the 36 career skills and supplies a non-sensitive personal example. A rating of 1–7 is **self-reported**, not a confirmed proficiency score. Examples are used in CV drafts only when the soldier ticks the confirmation box.
2. A goal can be added and linked to education plans and to concrete actions. Actions can be marked in progress or completed. Goal or study dates help the soldier plan next steps; **no automated reminders are currently sent**.
3. A CV can be written or edited in My Journey or generated as a **draft** from confirmed skill examples. A CV produced during a Companion conversation can be saved after an explicit click. The soldier must check every sentence before sending it to an employer.
4. The Companion can reuse Journey information in later conversations, but **profile-context sharing with its external AI is off by default**. The Privacy & backup tab lets the soldier choose which categories to share and preview the short text that would be added to AI requests. Private notes are excluded from this context. A live chat question and recent conversation messages may still be sent to the configured AI service as part of the existing chat operation.
5. **Export and import**: download a password-protected AES-GCM backup and import it on another device. The backup passphrase is neither stored nor recoverable. An unencrypted JSON export is also available with an explicit warning. Restoring a backup never automatically enables AI-profile sharing.
6. Soldier-controlled deletion: erase only My Journey, or explicitly choose also to erase the assessment and both language-edition conversation histories. Browser clearing/private browsing can also remove saved information.

**Limitations:** Browser `localStorage` is not an encrypted personal vault. Other people using the same browser profile could access it, and a browser reset can erase it. Encrypted export protects the *backup file*, not browser storage. The current implementation does **not** provide an account, automatic cross-device synchronization, cloud backup, emergency monitoring or a secure personal document repository. Future production service requires independent privacy/security review, authenticated encrypted synchronization with conflict handling, device security testing, Hebrew review and accessibility testing before use with soldiers.

The Service Worker precaches the core pages for offline access once the site is loaded online. Live AI replies remain dependent on network/server availability.

## Testing

Run `npm install && npm test`. The Journey regression suite is `npm run test:journey`. It tests local profile persistence, skills migration, CV edits, linked goals and actions, privacy defaults, backup imports, deletion, valid inline JS and encrypted backup round-trips. Physical device, voice, browser-permission and production AI tests are still necessary.

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
audio goes to the browser vendor's servers. Nothing is stored on our server. Clearing browser
data deletes everything. On a shared device, others using that browser can open it.

---

## Open questions

1. The framework has 63 identified skills; the original brief said 65. Are two missing?
2. Is `API_URL` correct, and does the proxy return Anthropic's standard `content` array?
3. Should the growth profile be exportable — for a Momentum coordinator, or for the person's CV?
4. Who is the Momentum contact in `CONFIG.SUPPORT`, and is it a phone number or a form?
5. Automatic cross-device continuity remains a future decision: secure account and encrypted sync, user consent, conflict handling and independent security review are prerequisites.
