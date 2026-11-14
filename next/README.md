# Transition Companion Next

Separate development build of the Guided Transition Companion. The existing app in the repository root remains unchanged.

## Current build

- Persistent transition choices panel for CVs, job applications, work and career, skills, studies, rights and benefits, money, travel, relationships and emotional support.
- Local-first personal memory in the browser; Hebrew and English with RTL support.
- Service Experience Profile for service family, unit/group, role, rank, responsibilities, training, discharge date, reserve status/group and service periods.
- Momentum's 63-skill library is used for discovery. Service context suggests possibilities only; a skill is saved as confirmed only when the soldier provides a concrete example.
- The existing 36 business/career skill assessment is connected to My Information. Its 1–7 self-rating stays separate from the 63-skill evidence framework; only explicitly confirmed examples enter AI context.
- Local Llama 3.2 3B and 1B WebLLM options; the model downloads only after the user requests it. External AI is off by default and requires approval of the exact outgoing packet.
- Structured memory includes current situation, goals, decisions, commitments, corrections and confirmed skills. Users can inspect, correct, export and delete information.
- Reviewed Hebrew/English rights answers are dated, expire, and require a matching manifest and official Israeli government source URLs. The current pack covers the discharge grant/personal deposit and preferred-work grant. Check the cited authority for current personal eligibility and amounts.
- Group announcements are matched on device using broad tags. Publish/expiry dates and version-aware dismissal are supported. The service worker uses network-first updates and retains the last successful files for offline use.
- Optional cross-device sync encrypts the profile snapshot in the browser using AES-GCM before upload. Pairing codes contain the decryption key and must be kept private. Local browser storage remains unencrypted. The relay stores ciphertext only, but no service endpoint is deployed or configured by default.
- Voice input uses browser speech recognition when supported. Read-aloud uses browser speech synthesis. The app discloses that speech processing may happen outside the device.
- A bilingual human-support panel provides ERAN's general and soldier/family lines and Israeli emergency numbers. Recheck availability and suitability before any real-world pilot.

## Reviewable behavior

The runtime system prompt is in `next/config/system-prompt.txt`; the HTML contains an offline fallback copy. Rights packages include source URLs, review dates and validity dates.

## Privacy architecture

Detailed personal information stays on device by default. The sync relay is optional and receives only encrypted envelopes. Momentum's update service is intended for reviewed knowledge and group messages, not a named personal dossier.

## Sync relay setup

Requires Node.js 22.5 or newer for `node:sqlite`. Run `node sync-service/server.js` behind HTTPS, set `SYNC_DB_PATH` to a durable private disk, and set `ALLOWED_ORIGINS` to the exact browser origin, for example `https://6244abaman.github.io`. The UI remains disconnected until a user enters the relay URL and explicitly opts in. See `sync-service/README.md`.

The relay has local automated tests, but it has not had an independent security review, deployment review, backup/restore test or abuse/rate-limit assessment. Do not use it for a real-soldier pilot until those steps are complete.

## Development status

This is an early Stage-2 development build, not a pilot-ready or production-secure system. `npm test` runs Journey-profile, business-skills, reviewed-knowledge, and encrypted-sync suites. Real-device tests are still required for WebGPU download and Hebrew quality, latency, heat, battery, microphone, speech output, PWA installation and accessibility. A psychological/safety review, natural-Hebrew review, privacy review and independent security review are still required before a pilot.

The app remains separate from the root Pages entry point and has not replaced the established English/Hebrew homepages.

## Preview

GitHub Pages: `/transition-companion/next/`
