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

- **Phase 1 — DONE.** The repo is published as a Docusaurus site (`website/`) with mermaid
  rendering, search, sidebar nav, the Learning Path, and a GitHub Pages deploy workflow.
- **Phase 2 — Flow Explorer — STARTED.** A working interactive step-through player ships for
  OIDC Authorization Code + PKCE (`website/static/explorer/oidc-authorization-code-pkce.html`):
  step forward/back, per-step request/response, decoded `id_token`, and a "read it in DevTools"
  callout, back-channel steps flagged. Next: drive it from a structured JSON model per flow
  (`steps[] = {actor, request, response, token, devtoolsHint}`) — the same JSON generates the
  mermaid **and** powers the player — then generate an Explorer for every hands-on flow from the
  `samples/*.har` + `devtools.md` we already have. Reuse jwt.io/jwt.ms/samltool decoders and
  link to the Auth Inspector / SAML Tracer extensions for live capture.

## A2. Embedding on your website & web-driven features

Ways to put this on your own site (pick per surface):

- **Whole knowledge base:** host the built `website/` (static output) at `docs.yourdomain.com`
  or reverse-proxy it under `yourdomain.com/diagrams` (set `url`/`baseUrl` to match). Or keep it
  on GitHub Pages and link to it.
- **Single pages / diagrams:** `<iframe>` any site page, or embed a specific Flow Explorer
  (`.../explorer/<flow>.html`) — the Explorer is a self-contained file that iframes cleanly and
  is theme-aware.
- **Diagrams inside your own CMS:** the mermaid source is portable — render it with a mermaid
  script tag, or export SVG/PNG at build time for static embedding.

Web-driven features worth adding (in rough priority):

1. **Search** — Docusaurus local search (`@easyops-cn/docusaurus-search-local`) or Algolia DocSearch.
2. **Explorer for every flow** — generate from the JSON model above; the accelerator payoff.
3. **Interactive decision wizard** — turn `reference/decision-guides/` trees into a
   click-through "answer 3 questions → recommended flow" component.
4. **Copy-as-code** — one-click copy on every `snippets.md` block; "open in Explorer" buttons.
5. **Progress & training mode** — mark diagrams reviewed/learned (localStorage), a guided
   Learning-Path track, and short end-of-stage quizzes.
6. **Threat overlay toggle** — on a flow, highlight the steps an attack abuses (links to
   `threat-defense/`).
7. **Deep links & embed snippets** — per-diagram "Embed" button that emits an `<iframe>`.
8. **Versioning** — Docusaurus docs versioning if you snapshot the catalog over time.

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
