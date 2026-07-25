---
title: "Contributing"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Contributing

Thanks for adding to the diagram library. The goal is a consistent, renderable, catalog of
**every option** — so consistency matters as much as content.

## Where a new diagram goes

Diagrams live at `<domain>/<category>/<diagram-name>/`, kebab-case. The nine domains are:

`authentication` · `authorization` · `identity-lifecycle` · `privileged-access` ·
`workload-identity` · `platforms` · `infrastructure` · `threat-defense` · `reference`

Single-category domains (e.g. `authorization/`, `privileged-access/`) hold diagram folders
directly; multi-category domains (e.g. `authentication/oidc/…`) nest one level deeper.

## How to add one

1. Copy the template folder [`docs/diagram-template/`](docs/diagram-template/) to your new
   diagram path and rename it.
2. Fill in each file. Every folder has `README.md`, `sequence.md`, `swimlane.md`, and
   `flowchart.md` (decision guides use `flowchart.md` + `comparison-table.md` instead).
3. Set the **frontmatter** at the very top of every file (see below) and the **Status** line
   under the README's H1.
4. Follow [`CONVENTIONS.md`](CONVENTIONS.md) — especially the mermaid safety rules (quote any
   label with `()`, `:`, `,`, `/`, `;`; use `<br/>` for breaks; commas not semicolons in
   notes; no unquoted brackets in labels).
5. Reference, don't redraw: link to existing flows rather than duplicating them.
6. Validate locally, then open a PR.

## Frontmatter (first lines of every file)

```yaml
---
title: "Human-Readable Title"
creation: 2026-01-01
lastUpdate: 2026-01-01
reviewed: false
deprecated: false      # true only when Status is ⛔ Deprecated
rfc: "RFC 1234"        # omit when no defining RFC applies
---
```

New diagrams start `reviewed: false`. A maintainer flips it to `true` after a technical
review; the [review dashboard](STATUS.md) tracks progress.

## Validate before you push

```bash
npm install --prefix tools
node tools/validate.mjs
```

This parses every mermaid block and checks every relative link. CI runs the same check on
each push and pull request (see `.github/workflows/validate.yml`). The generated indexes
(`README.md`, `STATUS.md`, `DEPRECATED.md`) are produced from frontmatter and Status lines —
if you add a diagram, regenerate them or a maintainer will.

## Status & deprecation

Use the badges defined in [`GLOSSARY.md`](GLOSSARY.md). A `⛔ Deprecated` diagram must include
a "Why deprecated" note and a "Use instead" link, and set `deprecated: true` in frontmatter.
