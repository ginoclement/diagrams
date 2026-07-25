---
title: "Diagram Conventions"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Diagram Conventions

All diagrams in this repository follow these conventions so they stay consistent,
renderable on GitHub, and easy to cross-reference.

## Folder layout

Each diagram lives in its own folder under a category directory:

```
<category>/
  README.md                 # category index: one line per diagram + link
  <diagram-name>/
    README.md               # what the flow is, when it's used, actors, alternates, related diagrams
    sequence.md             # mermaid sequenceDiagram
    swimlane.md             # mermaid flowchart with subgraphs used as swimlanes (one lane per actor)
    flowchart.md            # mermaid flowchart focused on decision logic and error paths
```

Folder names are `kebab-case`.

## Diagram rules

1. **Mermaid only**, in fenced ` ```mermaid ` blocks inside Markdown files, so GitHub renders them inline.
2. **Sequence diagrams** (`sequence.md`) show the happy path first and use `alt` / `opt` / `par`
   blocks for alternate and error scenarios (e.g. invalid credentials, expired assertion, MFA step-up).
3. **Swimlanes** (`swimlane.md`) are `flowchart TD` (or `LR`) diagrams where each **subgraph is a lane**
   named after an actor/system (User, Browser, SP, IdP, Directory, ...). Steps live in the lane of
   the actor performing them; arrows cross lanes to show handoffs.
4. **Flowcharts** (`flowchart.md`) emphasize branching: decisions as `{diamonds}`, terminal states as
   rounded nodes, error/deny paths explicitly drawn.
5. **Alternate scenarios**: include them in-diagram when small; when a variant is big enough to be its
   own diagram, link to it from the README instead of duplicating (e.g. SP-initiated SSO links to
   IdP-initiated SSO rather than re-drawing it).
6. **Cross-references** are relative Markdown links to the other diagram's folder README,
   e.g. `[Authorization Code + PKCE](oidc/authorization-code-pkce/README.md)`.

## Mermaid syntax safety

To keep diagrams rendering on GitHub and in mermaid-cli:

- Quote any node label containing parentheses, colons, commas, slashes, or other special characters:
  `A["Token endpoint (POST /token)"]`.
- Do not use `(`, `)`, `[`, `]`, `{`, `}` unquoted inside node labels or edge labels.
- In sequence diagrams, keep participant aliases short (`participant SP as Service Provider`).
- Use `%%` for comments inside mermaid blocks.
- Prefer `-->` and `-->|label|` edge syntax in flowcharts; `->>` / `-->>` in sequence diagrams.
- Avoid HTML tags in labels except `<br/>` for line breaks.

## Naming actors consistently

| Actor | Preferred name |
|---|---|
| End user (human) | `User` |
| User agent | `Browser` (or `App` for native clients) |
| OAuth2/OIDC client / SAML SP | `Client` / `SP` |
| Authorization server / IdP | `IdP` (or product name in platform-specific diagrams) |
| Resource/API server | `API` |
| Directory / user store | `Directory` |
| Kerberos KDC components | `AS`, `TGS`, `KDC` |

## Status and deprecation callouts

This repository is meant to be a catalog of **every option**, including obsolete ones —
so each diagram's status must be explicit. Every diagram folder's `README.md` starts with
a **Status line** immediately under the H1 title, using one of:

- `**Status:** ✅ Current` — recommended / in active use
- `**Status:** 🟡 Legacy` — still deployed and valid, but newer options are preferred
- `**Status:** ⛔ Deprecated` — actively discouraged; MUST include a **"Why deprecated"**
  note and a **"Use instead"** link to the recommended alternative
- `**Status:** 🔵 Emerging` — newer standard, not yet ubiquitous

Deprecated diagrams are kept (not deleted) for reference, and are listed in the root
[`DEPRECATED.md`](DEPRECATED.md) index. Examples already in the repo that should carry
`⛔ Deprecated`: OIDC Implicit flow, ROPC, SAML (vs OIDC for new greenfield), NTLM,
unconstrained Kerberos delegation, SMS/voice OTP as a primary factor.

## Decision-guide diagrams

The `decision-guides/` category answers "**which mechanism should I choose?**" Its
diagrams are `flowchart` decision trees whose leaves are rounded nodes linking to the
chosen flow's folder (e.g. a leaf `["Use Authorization Code + PKCE"]` sits next to a
Markdown link to that diagram). Selection criteria (client type, trust boundary,
interactivity, compliance) are the decision `{diamonds}`. Deprecated options appear as
leaves too, marked `⛔` with the recommended replacement.

## Persona variants

Personas are defined once in [`personas/README.md`](personas/README.md) with a
persona × flow variance matrix. A flow gets its own persona-specific diagram folder
**only when the flow materially forks** by persona; otherwise the variance is captured
as a note in the base diagram and a row in the matrix. Persona names are consistent:
`Workforce`, `Contractor`, `Partner/B2B`, `Consumer`, `Privileged`, `Guest`,
`Workload`, `Device`, `Break-glass`, `Developer`.
