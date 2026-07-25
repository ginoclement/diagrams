---
title: "Service Account Impersonation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Service Account Impersonation — Decision Flowchart

Token Creator checks, delegation, and token-type selection with explicit error terminals.

```mermaid
flowchart TD
    Start(["Caller wants to act as target SA"]) --> Type{"Which credential<br/>is needed?"}
    Type -->|"Access token"| Del{"Delegation<br/>chain used?"}
    Type -->|"OIDC ID token"| Del

    Del -->|"No - direct"| Direct{"Caller has Token Creator<br/>on target SA?"}
    Del -->|"Yes - via delegates"| Chain{"Every edge in delegates[]<br/>grants Token Creator?"}

    Direct -->|No| E1(["403 PERMISSION_DENIED"])
    Chain -->|"No - broken hop"| E2(["403: delegation chain broken"])
    Direct -->|Yes| Mint
    Chain -->|Yes| Mint

    Mint{"Access token<br/>or ID token?"}
    Mint -->|"Access token"| AT["generateAccessToken<br/>scope + lifetime <= 1h"]
    Mint -->|"ID token"| IT["generateIdToken<br/>audience = backend URL"]

    AT --> Life{"lifetime > 1h<br/>requested?"}
    Life -->|"Yes, org policy allows"| ATok(["Short-lived access token, up to 12h"])
    Life -->|"Yes, policy disallows"| E3(["400: lifetime too long"])
    Life -->|"No"| ATok

    IT --> ITok(["Signed OIDC ID token for backend"])
    ATok --> Use(["Call API acting as target SA"])
    ITok --> Use
```

Notes

- The Token Creator check is per-edge: direct impersonation checks one edge, a delegation chain
  ANDs every hop, and any missing grant terminates the flow.
- Access-token lifetimes above one hour require the
  `iam.allowServiceAccountCredentialLifetimeExtension` org constraint; otherwise the request is
  rejected.
- Regardless of type, the resulting call is authorized against the target SA's IAM policy — see
  [IAM Policy Evaluation](../iam-policy-evaluation/README.md).
