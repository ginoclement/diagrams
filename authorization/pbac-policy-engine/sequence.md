---
title: "PBAC Policy Engine (OPA / Cedar) — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PBAC Policy Engine (OPA / Cedar) — Sequence Diagram

Happy path first (allow decision from a local engine), then alternates: default-deny, forbid
overriding an allow, an out-of-band bundle update, and a failed/invalid bundle pull. Decision
logging runs alongside.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (PEP)
    participant PE as Policy Engine (PDP)
    participant Bundle as Bundle Server (PAP)
    participant Log as Decision Log

    Note over PE,Bundle: Startup - engine pulls signed policy + data bundle
    PE->>Bundle: GET /bundles/authz (ETag)
    Bundle-->>PE: 200 signed bundle (policies + entity data)
    PE->>PE: Verify signature, activate bundle

    User->>App: Action write on resource doc-42
    App->>App: Build input { principal, action=write,<br/>resource=doc-42, context }
    App->>PE: POST decision request (input)
    PE->>PE: Evaluate policy against input + data
    PE-->>App: { decision: allow }
    PE->>Log: Record input + decision + policy version
    App-->>User: 200 OK

    alt Default deny (no allow / no matching permit)
        App->>PE: POST input for action delete
        PE->>PE: No allow rule (OPA) / no permit (Cedar)
        PE-->>App: { decision: deny }
        App-->>User: 403 Forbidden
    else Explicit forbid overrides allow
        App->>PE: POST input (principal on deny-list)
        PE->>PE: A permit matches BUT a forbid also matches<br/>forbid-overrides
        PE-->>App: { decision: deny }
        App-->>User: 403 Forbidden
    else Bundle update (policy change, no redeploy)
        Bundle-->>PE: New bundle version available
        PE->>Bundle: GET /bundles/authz
        Bundle-->>PE: 200 new signed bundle
        PE->>PE: Verify + hot-swap active policy
    else Bundle pull fails or signature invalid
        PE->>Bundle: GET /bundles/authz
        Bundle-->>PE: 500 / tampered bundle
        PE->>PE: Reject - keep last-good bundle
        Note over App,PE: If engine is unreachable, PEP fails closed -> deny
    end
```

Notes

- The engine is typically a **sidecar** or embedded library, so the decision call is a localhost
  round trip (sub-millisecond) — not a network hop per request.
- **Decision logs** capture `input`, `decision`, and policy version for every call: the audit trail
  and the primary debugging tool for "why was this denied?".
- Bundles are **pulled** by the engine and **signature-verified** before activation; a bad or
  unreachable bundle leaves the last-good policy in place, and an unreachable engine makes the PEP
  deny.
