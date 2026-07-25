---
title: "Unconstrained Delegation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# Unconstrained Delegation — Swimlane Diagram

Lanes follow the credential: it starts in the KDC, passes through the client, and
ends up sitting in the front end's memory where it can be reused without limit.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in with password or smart card"]
        U2["Open the front-end application"]
        U3(["Sees data the user is entitled to"])
    end

    subgraph Client
        C1["AS-REQ, receive forwardable TGT"]
        C2["TGS-REQ for HTTP/frontend SPN"]
        C3{"ok-as-delegate set<br/>and local policy allows<br/>credential delegation?"}
        C4["TGS-REQ for krbtgt with the FORWARDED option"]
        C5["Wrap forwarded TGT in KRB-CRED,<br/>encrypt with the AP-REQ subsession key"]
        C6["AP-REQ with service ticket, authenticator and KRB-CRED"]
        C7["AP-REQ with no delegated credential"]
    end

    subgraph KDC
        K1{"Account NOT_DELEGATED<br/>or in Protected Users?"}
        K2["Issue TGT without forwardable flag"]
        K3["Issue forwardable TGT"]
        K4{"Frontend account has<br/>TRUSTED_FOR_DELEGATION?"}
        K5["Service ticket with ok-as-delegate"]
        K6["Service ticket without ok-as-delegate"]
        K7["Issue TGT with forwarded flag"]
        K8["Issue service ticket for ANY requested SPN<br/>in the user's name"]
    end

    subgraph Frontend
        F1["Decrypt service ticket with own account key,<br/>read the user's PAC"]
        F2["Extract forwarded TGT into the LSA credential cache"]
        F3["Request a ticket for any back-end SPN as the user"]
        F4["Call back end using the service account identity only"]
    end

    subgraph Backend
        B1["Validate ticket and authenticator"]
        B2["Authorize from the user's PAC<br/>indistinguishable from a direct logon"]
        B3["Return data"]
    end

    U1 --> C1 --> K1
    K1 -->|Yes| K2 --> C7
    K1 -->|No| K3 --> U2 --> C2 --> K4
    K4 -->|No| K6 --> C7 --> F4
    K4 -->|Yes| K5 --> C3
    C3 -->|No| C7
    C3 -->|Yes| C4 --> K7 --> C5 --> C6 --> F1 --> F2 --> F3 --> K8 --> B1 --> B2 --> B3 --> U3
```

Notes

- The `Frontend` lane keeps the credential after the request completes; the TGT
  outlives the transaction, which is what separates this model from
  [constrained delegation](../constrained-delegation/README.md).
- Two independent gates stop delegation: the KDC gate `K1` (account flags) and the
  client gate `C3` (`ok-as-delegate` plus local policy). Either one closing routes
  to `C7`, where the front end can only act as itself.
- `K8` accepts any SPN. There is no allowlist in this model — that is the entire
  difference from the S4U-based models.
