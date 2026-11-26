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
