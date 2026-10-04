# Transition Companion Next

Separate development build of the Guided Transition Companion. The existing app in the repository root is intentionally unchanged.

## Current build

- Local-first personal memory in the browser.
- English/Hebrew with RTL support.
- Service Experience Profile: service family, unit/group, role, rank, responsibilities, regular-service discharge date, reserve status/group and reserve-service summary.
- Momentum 63 Skills library used internally for discovery. Unit/role/rank suggest possibilities only; a skill is saved only after the user confirms it with concrete evidence.
- Small on-device LLM is the preferred engine:
  - Llama 3.2 3B WebLLM profile (~2.3 GB GPU-memory estimate).
  - Llama 3.2 1B lighter fallback (~0.9 GB GPU-memory estimate).
- The model is downloaded only when the user asks to start local AI.
- External AI fallback is OFF by default. If enabled, the exact outgoing question and selected context are shown for approval before transmission.
- Reviewed-knowledge and group-banner update structures are included, but no volatile Israeli rights/benefits/emergency facts are activated until verified.
- Export and delete-all controls are available.
- Voice input uses browser speech recognition when supported.

## Privacy architecture

Detailed personal information stays local wherever practical. Momentum's future central service is intended primarily for reviewed knowledge updates and group/cohort messages, not a named personal dossier. The phone can locally match broad tags such as unit/group code, language, reserve status and discharge cohort.

## Development status

This is an early Stage-2 development build, not a pilot-ready or production-secure system. Real-device testing of WebGPU model download, Hebrew quality, speed, battery/thermal behavior and browser voice is still required.

Local source tests passed before this build was published.

## Open

GitHub Pages: /transition-companion/next/
