---
title: "Future Enhancements Roadmap"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Future Enhancements Roadmap

Ideas captured for later. Implemented now (see the repo): **sample captures**, **`devtools.md`
walkthroughs**, and **client snippets** for the network-observable authentication flows.

## A. Interactive website

- **Phase 1 — publish the repo as a site.** Docusaurus (`@docusaurus/theme-mermaid`) or MkDocs
  Material on GitHub Pages. Renders the existing mermaid, adds search and navigation, and
  surfaces `LEARNING-PATH.md`. Low effort, high value.
- **Phase 2 — "Flow Explorer".** An interactive step-through player driven by a structured
  JSON model per flow (`steps[] = {actor, request, response, token, devtoolsHint}`). The same
  JSON generates the mermaid **and** powers the player: each step highlights the diagram node,
  shows the sanitized request/response, decodes the token inline, and gives the "find this in
  DevTools" callout. Reuse existing decoders (jwt.io/jwt.ms/samltool) and link out to the
  Auth Inspector / SAML Tracer extensions for live capture rather than rebuilding them.

## B. Runnable lab (idea 2)

A `docker-compose` stack — Keycloak (or another mock OIDC/SAML IdP) plus a demo relying party
— so learners actually *perform* each flow and watch it live in DevTools. Pair each lab
scenario with the matching diagram and its `devtools.md`.

## C. Threat overlays (idea 4)

Cross-link each step of a flow to the `threat-defense/` attack that abuses it (step → how it
is abused → mitigation), and add a reverse index from each attack back to the exact step.

## D. Decision-guide wizard (idea 5)

Turn the `reference/decision-guides/` trees into a clickable "answer 3 questions → recommended
flow" wizard, with each leaf linking to the chosen diagram.

## E. Study aids (idea 7)

- Per-domain **cheat-sheets / one-pagers** (printable).
- An **Anki deck** and short **quizzes** generated from the diagrams.

## F. Extend sample captures / devtools / snippets to more flows

Currently applied to the browser/HTTP-observable authentication flows (OIDC, SAML, tokenless).
Extend to:
- `platforms/cloud-iam/*` HTTP token flows (STS, token endpoints, IMDS).
- `workload-identity/*` where an HTTP exchange exists (federation, k8s token exchange).
- `authentication/kerberos/*` — no browser Network tab, but add a "capture with Wireshark /
  klist" companion instead of a `devtools.md`.
- `identity-lifecycle/*` provisioning (SCIM) HTTP calls.

## G. Diagrams-as-data

Define each flow once as structured JSON (the Phase-2 model) and **generate** the mermaid from
it, making the JSON the single source of truth for diagrams, the player, and the snippets.

## H. Housekeeping

- Normalize a few legacy mechanisms currently marked `✅` with prose caveats (ADFS federation,
  XACML, AWS AssumeRoleWithSAML) to `🟡 Legacy` for consistency with the `deprecated` metadata.
- Auto-generate `README.md` / `STATUS.md` / `DEPRECATED.md` in CI (the generators exist; wire
  them into the workflow so indexes never drift).
