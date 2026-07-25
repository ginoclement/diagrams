---
title: "Cognito User Pool Sign-In — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cognito User Pool Sign-In — Swimlane Diagram

One lane per actor. The Hosted UI fronts the user pool's OAuth2 endpoints; the app
exchanges the code for pool JWTs and calls the API.

```mermaid
flowchart TD
    subgraph User
        U1["Open app, tap Sign in"]
        U2["Enter username + password"]
        U3["Enter MFA code<br/>(only if challenged)"]
        U4(["Signed in, using app"])
    end

    subgraph App["App (public client)"]
        A1["Generate PKCE verifier + challenge"]
        A2["Open /oauth2/authorize"]
        A3["Exchange code at /oauth2/token"]
        A4["Validate id_token via JWKS"]
        A5["Call API with access_token"]
    end

    subgraph UI["Cognito Hosted UI"]
        H1["Render login page"]
        H2["Redirect back with code"]
        H3["Issue id/access/refresh tokens"]
    end

    subgraph Pool["User Pool"]
        P1["Verify SRP password proof"]
        P2{"MFA required?"}
        P3["Validate MFA challenge"]
    end

    subgraph API["Resource API"]
        R1["Verify access_token<br/>(JWKS, iss, aud, exp, scopes)"]
        R2["Return data"]
    end

    U1 --> A1 --> A2 --> H1 --> U2 --> P1 --> P2
    P2 -->|Yes| U3 --> P3 --> H2
    P2 -->|No| H2
    H2 --> A3 --> H3 --> A4 --> A5 --> R1 --> R2 --> U4
```

Notes

- The Hosted UI lane is Cognito's OAuth2 surface; the user pool lane holds the actual
  credential and MFA verification.
- Federation replaces the `P1` password step with an external-IdP exchange, but the pool
  still mints its own tokens at `H3` — see [sequence.md](sequence.md).
- Turning these tokens into AWS credentials happens in a separate
  [identity pool](../cognito-identity-pool/README.md) exchange.
