# Full improvement brief — implementation notes (26 Nov 2026)

Branch: `feature/full-brief-20261126` (based on `fix/severe-bugs-20261126`, which is based on
`development/next-generation`). Backup of the starting point: `backup/before-improvements-20261126`.
`main` and `complete/continuity-and-followup` were not touched.

## Where things live

| File | What it does |
|---|---|
| `knowledge-base-full.json` | The knowledge base from the brief (single source of truth). |
| `scripts/build-knowledge.cjs` | Regenerates `knowledge-base-data.js` from the JSON. **Run it after editing the JSON.** |
| `knowledge-base.js` | Rights cards, search, AI context, plus general guides (CV examples, interview, family, role translations, human help). Guides never state amounts. |
| `companion-plus.js` / `.css` | Home (4 buttons), bottom navigation, onboarding, all info pages, help/settings, chat modes and tools, save-to-Journey, listen, offline message, display preferences. |
| `journey-plus.js` / `.css` | My Journey: progress bar, calendar, saved links, manual skills, PDF/print, share with counselor, Skills → CV. |
| `chat-history.js` | Added conversation search, delete one conversation, short summaries. |
| `journey-store.js` | Added optional `links` and `manualSkills` fields (backward compatible). |

## Decisions

- **Edit, don't rebuild.** The new layer sits on top of the existing app (`S`, `pushMsg`, `prepareTopic`,
  `sendUser`, `MomentumJourney`). The legacy hub links and tester panel are kept under "More options".
- **Landing screen is Home** on every visit (brief 1.1). `tests/home-pathways.test.js` was updated
  accordingly. Onboarding (3 skippable questions) is shown only to brand-new users; returning users can
  fill it from Help → "My details".
- **Privacy.** Preferences live in `localStorage["momentum-companion-plus-v1"]` and are erased with
  "delete everything". The knowledge base is always sent to the AI when relevant (it is public data).
  Onboarding answers (service type, months since discharge, lone soldier, reservist) are added to the
  AI prompt **only** when Journey AI sharing is turned on.
- **Amounts.** Every page showing amounts shows the "verify on the official site" disclaimer and the
  knowledge-base date. The AI is instructed to do the same and never to declare eligibility.
- **Distress.** Calm wording, human help first (1201, 101/100, Amit, Rehabilitation Dept., Momentum, youth
  centers). The existing on-device safety check also normalizes iPhone curly apostrophes now.
- **English edition.** UI chrome is bilingual; knowledge-base content is Hebrew only and English pages say so.
- **Not changed:** `next/` (Next Generation) UI, duplicate legacy files, Render settings.

## Testing done

- Real Chrome (Playwright), mobile 390×844 and desktop: 50 end-to-end checks (onboarding, home, all pages,
  search, not-relevant, save to Journey, today step, mood, distress, chat modes, AI context gating, dark
  mode, text size, info-only, history search/delete, offline, My Journey widgets, English edition).
- `npm run test:next` and `npm run build:review` pass. jsdom-based suites could not run in this environment
  (package install blocked) — run `npm test` locally. Safari was not tested.

## Implementation package additions (26 Nov 2026, evening)

- Backup branch also created under the package's name: `backup/before-full-improvements-20261126`
  (same commit as `backup/before-improvements-20261126`). Work continued on `feature/full-brief-20261126`.
- **Practice mode:** "Try the real AI again" now drops the scripted reply and immediately re-asks the live AI
  for the last question; the failure reason is shown in plain words ("the server may be waking up…").
  Same-text double taps within 600 ms are ignored and the send button is disabled while a reply is pending.
  `tests/integration-ui.test.js` was updated for the new retry behavior.
- **Strict `confirmed === true`** in `journey-store.js` (same rule as `next/business-skills.js`).
- **Knowledge base v2.1:** deposit rates per month of service, tax point value (242 ₪), "not automatic" + refund,
  preferred work period (6 months / 150 days), extra sectors, scam warning, important warnings,
  normalization sentences, grant-vs-deposit explanation, extra checklist items and a first-year list, 3 FAQ.
  Kept from v2.0: the deposit's 7 listed uses (the package lists 6; "rent, in some cases" was kept — verify).
- **UX:** estimate (grant, deposit, tax points) on Home from service type + optional months served,
  calculator on the Money page, "last updated + source" on every money card, scam warning, large Skip,
  ready-made step options, quick-answer cards, "Talk with the Companion" button, privacy line on every screen.
- **Privacy line wording:** the package's "everything you write stays only on this device" is not accurate
  when the soldier chooses to use the AI, so it reads: "Everything you write is saved only on this device.
  A message goes to the AI only after you approve."
