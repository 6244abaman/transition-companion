# Transition Companion Next — Architecture

## Governing direction

**Personal intelligence flows inward to the soldier's Companion. Reviewed knowledge flows outward from Momentum.**

### On device
- conversations
- Personal Map / structured memory
- current situation
- detailed service and reserve experience
- exact discharge date
- confirmed Skills & Experience Profile
- goals, decisions and commitments
- reviewed-knowledge metadata/cache
- local relevance filtering for banners

### Central, when later implemented
- reviewed and versioned knowledge packages
- bilingual banners/announcements
- broad targeting tags in published messages
- no routine named dossier of conversations or private life

A message can be broadcast with a group/cohort tag and filtered locally on each phone. The central publisher therefore does not need a named list of soldiers merely to target a group.

## System prompt

The reviewable governing runtime prompt is `config/system-prompt.txt`. The app fetches it at startup and falls back to the embedded copy if the file is unavailable.

## AI routing

1. Deterministic local safety pre-check.
2. Small on-device LLM when loaded.
3. Practice/degraded mode when local AI is unavailable.
4. Optional external AI only when the user has enabled it and approves the exact outgoing packet.

The external packet is deliberately smaller than the local Personal Map. Career/education/skills requests may include relevant service facts and confirmed skills; unrelated sensitive history and full conversation history are not automatically included.

## 63 Skills

The 63-item library is a discovery/validation framework, not the soldier's permanent interface. Service context may produce a short candidate set. Only user-confirmed skills with evidence are saved. Once confirmed, later reasoning should primarily use the individualized Skills & Experience Profile.

## Updates

The app checks the published knowledge manifest and banner feed when online. The service worker uses network-first caching so the newest successful copy can remain available offline. Banners support publish/expiry dates, versions, group tags and local matching.

No rights, benefits, deadlines or emergency resources are treated as verified merely because a placeholder exists. Stage 3 will add the reviewed RAG ingestion and resource-governance layer.

## Voice

Voice input uses browser speech recognition when supported. Manual read-aloud uses browser speech synthesis and selects a voice matching the current language when one is available. Raw audio is not intentionally stored by this application.

## Current deployment

The /next/ GitHub Pages build serves the tested application directly from `next/index.html`. The original root application remains separate and unchanged.
