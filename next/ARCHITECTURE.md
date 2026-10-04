# Transition Companion Next — Architecture

## Governing direction

**Personal intelligence flows inward to the soldier's Companion. Reviewed knowledge flows outward from Momentum.**

### On device
- conversations
- Personal Map / structured memory
- detailed service and reserve experience
- exact discharge date
- confirmed Skills & Experience Profile
- goals, decisions and commitments
- local reviewed knowledge cache
- local relevance filtering for banners

### Central, when later implemented
- reviewed and versioned knowledge packages
- bilingual banners/announcements
- broad pseudonymous targeting tags where needed
- no routine named dossier of conversations or private life

## AI routing

1. Deterministic local safety pre-check.
2. Small on-device LLM when loaded.
3. Practice/degraded mode when local AI is unavailable.
4. Optional external AI only when the user has enabled it and approves the exact outgoing packet.

The external packet is deliberately smaller than the local Personal Map. Career/education/skills requests may include relevant service facts and confirmed skills; unrelated sensitive history is not automatically included.

## 63 Skills

The 63-item library is a discovery/validation framework, not the soldier's permanent interface. Service context may produce a short candidate set. Only user-confirmed skills with evidence are saved. Once confirmed, later reasoning should primarily use the individualized Skills & Experience Profile.

## Updates

The knowledge manifest supports versioned packages. Banners use broad tags that can be matched locally. No rights, benefits, deadlines or emergency resources are treated as verified merely because a placeholder exists.

## Current deployment

The /next/ GitHub Pages build is a self-contained development bundle loaded from repository-local chunks so it can coexist with the existing root app without replacing it.
