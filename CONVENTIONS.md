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
