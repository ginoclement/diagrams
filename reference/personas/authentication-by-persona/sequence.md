---
title: "Authentication by Persona — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authentication by Persona — Sequence Diagram

The persona is resolved first, then each `alt` branch shows how that persona authenticates.
Branches reference their base flow rather than redrawing the full handshake.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client / RP
    participant IdP as Local IdP
    participant PartnerIdP as Partner IdP
    participant PIM as PIM / JIT
    participant Workload as Workload

    Note over Client,IdP: Resolve persona from realm, client type, or identifier

    alt Workforce (corporate SSO + MFA)
        User->>Client: Access protected app
        Client->>IdP: Redirect AuthnRequest (see saml or oidc base flow)
        IdP->>User: Credential prompt if no session
        User->>IdP: Password plus MFA factor
        IdP->>IdP: Evaluate risk, step-up if high risk
        IdP-->>Client: Assertion / token (amr includes mfa)
        Client-->>User: Signed-in
    else Consumer (social / passwordless)
        User->>Client: Sign in
        alt Social login
            Client->>IdP: Federated login to social IdP
        else Passwordless
            Client->>IdP: Passkey or magic-link (see tokenless base flow)
        end
        IdP-->>Client: Token (MFA optional)
        opt Sensitive action later
            Client->>IdP: Step-up request
            IdP->>User: Additional factor
        end
        Client-->>User: Signed-in
    else Partner / B2B (invitation-federation)
        opt First time only
            User->>Client: Redeem invitation link
            Client->>IdP: Create external-user shell, link home realm
        end
        User->>Client: Sign in
        Client->>IdP: Home-realm discovery
        IdP->>PartnerIdP: Federate authentication
        PartnerIdP-->>IdP: Assertion (partner-side MFA claim)
        IdP-->>Client: Local token mapped from partner identity
        Client-->>User: Signed-in as external user
    else Privileged (step-up + PIM)
        User->>Client: Access admin console
        Client->>IdP: Authenticate base session
        IdP->>User: Phishing-resistant step-up (hardware key)
        User->>IdP: Present hardware key
        Client->>PIM: Request JIT elevation (role, justification)
        PIM->>PIM: Check approval / SoD, set expiry
        PIM-->>Client: Time-boxed admin role granted
        Client-->>User: Elevated session (auto-expires)
    else Workload (client-credentials / mTLS)
        Workload->>IdP: Client assertion or mTLS handshake (no user)
        IdP->>IdP: Validate client cert / secret, scopes
        IdP-->>Workload: Short-lived access token
        Workload->>Client: Call API with token (see oidc client-credentials)
    end
```

Notes

- The `amr` / `AuthnContextClassRef` claim is what lets the Client tell a genuine MFA login
  from an unauthenticated one — persona name alone proves nothing.
- Privileged is deliberately two steps: a normal authenticated session, then a **separate**
  just-in-time elevation with its own expiry, so standing admin never exists.
- The Workload branch has no `User` actor and no MFA — that absence is the whole point of the fork.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
