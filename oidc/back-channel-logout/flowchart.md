---
title: "Back-Channel Logout — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Back-Channel Logout — Decision Flowchart

Two decision chains: the IdP's delivery/retry loop, and the RP's logout token
validation gauntlet with explicit rejection terminals.

```mermaid
flowchart TD
    S([SSO session terminated at IdP]) --> A{"RPs registered with<br/>backchannel_logout_uri?"}
    A -->|no| Z([No back-channel propagation])
    A -->|yes| B["Mint logout_token per RP<br/>POST to backchannel_logout_uri"]
    B --> C{"HTTP response?"}
    C -->|"200 OK"| D([RP confirmed logout])
    C -->|"400 Bad Request"| E(["RP rejected token -<br/>alert / investigate config"])
    C -->|"timeout / 5xx"| F{"Retry budget left?"}
    F -->|yes| G["Backoff, requeue delivery"] --> B
    F -->|no| H(["Delivery failed -<br/>RP session survives until expiry;<br/>rely on short token lifetimes"])

    subgraph RPV["RP validation of received logout_token"]
        V1{"Signature valid via jwks_uri<br/>and alg allowed?"} -->|no| X1([400 - reject])
        V1 -->|yes| V2{"iss, aud, iat, exp valid?"}
        V2 -->|no| X2([400 - reject])
        V2 -->|yes| V3{"events contains<br/>backchannel-logout event?"}
        V3 -->|no| X3([400 - reject])
        V3 -->|yes| V4{"nonce claim absent?"}
        V4 -->|"no - nonce present"| X4(["400 - reject<br/>(ID token replay attempt)"])
        V4 -->|yes| V5{"sub and/or sid present<br/>(sid if session_required)?"}
        V5 -->|no| X5([400 - reject])
        V5 -->|yes| V6{"jti seen before?"}
        V6 -->|yes| X6([400 - replay rejected])
        V6 -->|no| V7{"Matching session found?"}
        V7 -->|"by sid"| W1["Destroy that session,<br/>revoke its refresh tokens"]
        V7 -->|"by sub only"| W2["Destroy ALL user sessions<br/>at this RP"]
        V7 -->|none| W3["Nothing to do (idempotent)"]
        W1 --> OK([200 OK])
        W2 --> OK
        W3 --> OK
    end

    B -. "request body - logout_token JWT" .-> V1
```

Notes

- Every rejection terminal returns 400 without touching sessions — acting on an
  unvalidated logout token would let attackers force-logout users.
- The IdP-side failure terminal is why short access-token lifetimes remain necessary
  even with back-channel logout deployed.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
