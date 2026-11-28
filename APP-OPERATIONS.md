# App delivery and stable access

## Next Generation isolation (25 November 2026)

The local Knowledge Desk uses port 43129 and its own Start/Stop-Knowledge-Desk.cmd
launchers. Setup-Knowledge-Staff.cmd enrols named editor/reviewer accounts. Read
docs/KNOWLEDGE_REVIEW_GUIDE.md for approval, durability and privacy boundaries.
The four source-checked bilingual topics stay draft until real professional review.
This task does not authorize a hosted staff portal or retargeting the current review.

`development/next-generation` is an explicitly separate Phase 1 foundation.
Its local app and Start/Stop-Next-Generation launchers use port 43128. Do not
retarget the existing Render review service, change the model proxy, merge this
work or provision new services as part of this development task. Root `CLAUDE.md`
imports these shared instructions. Next Generation has no public deployed URL;
the public owner directory and current review link continue to describe the
working app. A later authorized review deployment should use an isolated service
and explicit authentication/retention review before receiving personal data.

Read `app-deployment.json` when present for the actual public URL, Render
service/workspace, deployment branch and build settings. `HOSTING.txt` is the
plain owner guide. Keep the live link near the top of the public README so the
owner can find it from a phone or another computer; Render's service page also
shows that same link. Never store credentials or deploy-hook URLs in metadata.
The public owner directory is
https://github.com/6244abaman/transition-companion/blob/main/LIVE-APPS.md.
Keep it accurate when an app's public access information intentionally changes.

## Changes requested by Aba

Unless the request is explicitly local-only or draft-only, completing an update
includes testing the source, saving it to GitHub, updating the established
review deployment branch and verifying that the same Render URL serves the
new commit. Reuse the existing service; keep separate production releases
explicit. Preserve the Windows Start/Stop files and their fixed local origin.

The current review deployment follows `complete/continuity-and-followup` in
`6244abaman/transition-companion`. Keep this branch available while Render
tracks it. If moving the service to `main` after review, update Render's Branch,
the checked-in metadata and owner guide together, and verify the same URL.

## Build and deployment

- Node.js 24. Run `npm ci --ignore-scripts`, `npm test`, and
  `npm run build:review` for the hosted build.
- Render Static Site publishes `dist`; its Hebrew root entry opens
  `/app/indexH.html`, with English at `/app/index.html`. Keep these paths stable.
- `scripts/build-review.cjs` includes only public frontend files. Add new
  frontend assets to that list and the Windows host list as appropriate.
- Render's build command runs the regression tests before publishing. A failed
  build must leave the previous successful review build available.
- Verify a deploy reaches `live`, `/build-info.json` reports the intended
  commit, and the changed user path works. A queued deploy is incomplete.
- GitHub is the source of truth. If service settings are intentionally changed,
  update the checked-in metadata and instructions in the same task.

## Existing app boundaries

The external Claude connection remains in `momentum-proxy`, a separate Render
service in the confirmed Momentum Claude workspace. Preserve persistent external AI consent and withdrawal controls. Test with invented examples. The review site uses browser-local data;
hosting it does not enable device sync, accounts or a central personal dossier.
Read README.md and TEST_REPORT.md for the remaining review/pilot limitations.

## Handoff

End app-update replies with the stable review link, actual deployment result
and a short Render usage tip. Everyday access needs only the app URL; owners
can use the service dashboard's Manual Deploy > Deploy latest commit when
needed, without starting Claude or Codex.
