# Agent contracts and implementation status

All agents are internal roles behind **one soldier-facing companion**. They share
one local memory and the same user-approved gateway packet. No agent receives
unrestricted IndexedDB access, credentials, personal database, tool execution or
permission to contact anyone. Phase 1 uses one model call with selected specialist
instructions, not multiple autonomous LLM processes.

## Coordinator — implemented routing foundation

`shared/memory.mjs`: coordinate, route, makePacket, validatePacket. Recognizes Hebrew
and English education, work and benefits language, retains recent explicit domain
for a general follow-up, and allows an explicit switch. Safety cues run first in
the UI and again at the gateway. This is deliberately bounded heuristic routing;
ambiguous mixed-domain questions and long-term planning need later evaluations.

The coordinator builds `{version, language, domain, message, context}`. Optional
context starts empty and is limited to five open goal summaries, five confirmed
strength strings and four prior messages when selected. It never uploads the whole
vault, a password, identifier, browser storage or previous-response ID. The server
rechecks schema/domain and owns all instructions. Agent suggestions need explicit
soldier save before modifying local goals.

## Education and employment — scoped instruction foundations

Education explores interests, time constraints, learning options and small comparisons.
It must distinguish an exploration plan from admissions, tuition, scholarship or
eligibility claims. Consequential facts need current official evidence or an honest
verification limitation. One useful question per reply; no expensive commitment.

Employment translates user-confirmed examples into civilian skills. It does not infer
competence from military-unit prestige, invent experience, guarantee jobs or create
a CV from missing evidence. It proposes a low-risk experiment, comparison or contact
that the soldier may choose to save. Local guided replies request an example rather
than pretending a full model conversation occurred.

The implemented specialist definitions are `specialistSpecs` and fixed gateway
instructions. Routing and local replies are tested. Live OpenAI educational/career
reasoning, comparative quality and evidence fidelity have not been tested.

## Follow-through — implemented local core

`addGoal` and `completeGoal` validate one shared goal list. UI explicitly adds a
title/date and marks done/reopens. AI suggestions are temporary proposals until
the soldier chooses Save a step and confirms it in Journey. No automatic calendar,
notifications, deadlines, external messages or progress surveillance.

## Verified benefits — retrieval guard, not entitlement engine

Only approved, reviewed, unexpired public knowledge from explicitly allowed sources
may enter the gateway. Missing knowledge returns one clear limitation without a
provider call for benefits requests. The server accepts citation IDs only from its
retrieved records; the UI creates links from provenance, never generated HTML.
This checks structure/provenance, not whether a model faithfully used a source.

## Remaining specialist specifications — design only

| Role | Shared input / expected behavior | Additional boundary |
| --- | --- | --- |
| Money/navigation | Approved public information, soldier-selected constraints; planning questions | No financial eligibility, lending, investments or personalized financial decisions |
| Housing | Location preferences and verified public resources | No automatic application or sharing contact/financial details |
| Health/support navigation | Volunteered concern, public human-help resources | No diagnosis, clinical treatment or monitoring claims |
| Social/community | User interests and public opportunities | No contacting others or exposing a soldier's location |
| Entrepreneurship | Confirmed skills, chosen experiment and constraints | No invented grants or business promises |
| Family/community | Soldier-chosen priorities and boundaries | Minimize third-party information; no independent family profile |

All later roles return the same bounded response: reply, up to three suggested
steps, citation identifiers, and a human-help flag. The schema validator rejects
unknown citations, malformed/incomplete output and refusals. No tool-call response
is executed. Model output and retrieved sources remain untrusted text.
