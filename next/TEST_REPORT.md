# Transition Companion Next — Retest Report

**Date:** 4 October 2026

The current Next build was re-tested after the safety, memory, update and voice corrections.

## Automated logic checks

24/24 checks passed:

- exactly 63 skills, IDs 1 through 63
- ordinary transition-stress examples do not trigger emergency classification
- historical suicidality examples do not automatically trigger current emergency classification
- significant self-harm / harm concerns classify at the intended review level
- explicit near-term self-harm examples classify as immediate danger
- ambiguous angry threat language produces a lower-level check-in rather than immediate-danger classification
- career, education, relationship and skills routing
- local group, reserve-group, language and discharge-cohort targeting tags
- all-tag versus any-tag banner matching
- future banners hidden before publish time
- expired banners hidden
- version-aware banner dismissal key
- current-situation memory
- reserve-period memory
- commitment status update without duplication
- evidence-gated confirmed skills
- corrected goals replace old values
- current-situation corrections
- external-AI context excludes unit/group by default
- external-AI context uses discharge month rather than exact date
- no duplicate HTML IDs
- no missing DOM references
- manifest link present
- read-aloud control present

## Remaining real-device tests

These cannot be proven by static/logic tests alone:

- actual 3B and 1B WebGPU model download on target Android phones
- Hebrew quality from the local models
- response latency, heat, battery and memory pressure
- microphone permission and browser speech recognition
- Hebrew text-to-speech voice quality
- PWA installation behavior on target devices
- external Render proxy availability and its production privacy/security configuration

This is still a development build and is not approved for a real-soldier pilot.
