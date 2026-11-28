# Updated Information and Benefits

The live review app has two complementary topics:

- **Rights and benefits**: discuss personal circumstances and next steps. My Journey also has Rights and application preparation checklists.
- **Updated Information and Benefits**: browse dated government rights, shows, discounts, career fairs/jobs, training/scholarships and private/nonprofit offers. The same public edition is available to the chat for relevant questions through its existing consent gate.

English direct entry: https://transition-companion-review.onrender.com/app/index.html?lang=en&section=updates
Hebrew direct entry: https://transition-companion-review.onrender.com/app/indexH.html?section=updates

## Scheduled research and publishing

An enabled ChatGPT automation, **Companion Benefits Updates**, was created on 16 November 2026. It runs every three days at 09:00 Asia/Jerusalem, beginning 19 November 2026. Its task is to research original sources and publish `benefits-updates.json` to the existing `complete/continuity-and-followup` review branch, then verify the Render deployment. This is a scheduled research task, not a browser background timer or a new paid Render service. The initial edition was researched and deployed manually in the implementing session. Future runs require the connected GitHub and web tools to remain available; failures must be reported, not presented as successful updates.

The frontend requests the latest published edition when opened, on reconnect, and when the visible page returns to the foreground (one-minute download throttle). A long-running visible page checks again after 72 hours. **Downloading JSON does not re-verify external sources.** Every edition and item retains its actual source-review date. Overdue reviews are visibly flagged, including offline, and stale summaries are excluded from AI context. No soldier profile is involved in downloading this public file.

## Research rules

1. Read original authority or provider pages. Discover new offerings as well as rechecking existing routes. Search in Hebrew and English. Keep discharged-soldier eligibility distinct from reservist-only offers.
2. Include a verified direct source and bilingual original summaries of eligibility and next action. Use `government`, `provider` or `nonprofit` source types. The presence of a source link is not an eligibility determination.
3. Distinguish an ongoing directory from an actual dated event. `upcoming` requires `eventAt`; `open` requires `validUntil`. Supply timezone-aware event/deadline/expiry timestamps. Never infer a deadline from a publication date or a previous year's event.
4. For inaccessible member offers, use `restricted`. Do not request passwords or imply tickets/prices were checked. For an unannounced next event use `watch`; for ended/closed events use the corresponding status. The UI also derives expired/ended status from dates.
5. Do not advance an item's `checkedAt` unless its source claims were actually checked. Preserve older dates for failed checks. Record a failed check in `reviewNotes` if useful. Review timestamps must not be in the future.
6. `reviewedAt` records a completed research pass; `nextReviewDue` is no more than 72 hours later. A successful HTTP fetch, model generation, or unchanged hyperlink is not a completed review. Do not reset dates on a wholly failed research run.
7. Keep up to 100 concise records. Existing categories: `rights`, `shows`, `discounts`, `career`, `training`, `private`. Required localized fields in both `en` and `he`: `title`, `summary`, `eligibility`, `nextStep`. Include location, cost and limitations in the summary when verified. Optional `actionUrl`, `eventAt`, `deadline`, `validUntil` must be accurate.
8. Run `node --test tests/benefits-updates.test.js`, `npm test` and `npm run build:review`. Publish with an expected-head check to avoid overwriting concurrent edits. Do not merge into main or change the AI backend, privacy or sync settings for this work.
9. Verify `/build-info.json` identifies the published commit and `/app/benefits-updates.json` serves the intended edition. Report inaccessible sources or deployment failures to Aba.

The app provides dated discovery and preparation, not comprehensive legal entitlement advice, real-time inventory, booking, purchase, enrollment or submission. The initial edition explicitly labels the ended discharge conference and the inaccessible Behatsdaa inventory instead of inventing upcoming events.
