# Transition Companion Next

Separate development build of the Guided Transition Companion. The existing app in the repository root is intentionally unchanged.

## Current build

- Local-first personal memory in the browser.
- English/Hebrew with RTL support.
- Service Experience Profile: service family, unit/group, role, rank, responsibilities, training, regular-service discharge date, reserve status/group, reserve-duty periods and reserve-service summary.
- Momentum 63 Skills library used internally for discovery. Unit/role/rank suggest possibilities only; a skill is saved only after the user confirms it with concrete evidence.
- Small on-device LLM is the preferred engine:
  - Llama 3.2 3B WebLLM profile (~2.3 GB GPU-memory estimate).
  - Llama 3.2 1B lighter fallback (~0.9 GB GPU-memory estimate).
  - Automatic mode falls back from 3B to 1B if the larger model cannot load.
- The model is downloaded only when the user asks to start local AI.
- External AI fallback is OFF by default. If enabled, the exact outgoing question and selected context are shown for approval before transmission. Conversation history is not silently forwarded.
- Structured memory includes current situation, goals, decisions, commitments, corrections and confirmed skills.
- "My information" shows remembered information and supports per-item deletion, export and delete-all.
- Reviewed-knowledge and group-banner update structures are included. Banner matching happens on the device using broad tags such as group, reserve group, language and discharge cohort.
- Banners support publish/expiry dates and version-aware dismissal. The service worker keeps the last successful update files available for offline use while checking the network first when online.
- Voice input uses browser speech recognition when supported. A read-aloud button uses browser text-to-speech.
- No volatile Israeli rights/benefits/emergency facts are activated until verified.

## Privacy architecture

Detailed personal information stays local wherever practical. Momentum's future central service is intended primarily for reviewed knowledge updates and group/cohort messages, not a named personal dossier.

A group message can be published to all devices with a tag such as `group:givati-03`; only matching phones display it. This means group messaging does not inherently require a central list of named soldiers.

## Development status

This is an early Stage-2 development build, not a pilot-ready or production-secure system. Automated logic tests pass for skills, routing, memory corrections, group targeting, banner date controls and safety examples. Real-device testing is still required for WebGPU model download, Hebrew response quality, latency, battery/thermal behavior, browser microphone and speech output.

## Open

GitHub Pages: /transition-companion/next/
