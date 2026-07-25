# Federated vs Managed Authentication — Sequence Diagram

Happy path first (managed cloud authentication), then the federated redirect-to-ADFS path,
plus federated failure modes: expired signing certificate and unreachable on-prem IdP.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Cloud as Cloud (Entra ID)
    participant IdP as On-prem IdP (ADFS)
    participant Dir as Directory (AD)

    User->>Browser: Navigate to cloud app, enter UPN
    Browser->>Cloud: GET sign-in, submit UPN
    Cloud->>Cloud: Home-realm discovery on domain<br/>(Managed or Federated?)

    alt Managed authentication (recommended)
        Note over Cloud,Dir: Credential validated cloud-side (PHS) or via PTA agent
        User->>Browser: Enter password
        Browser->>Cloud: POST password
        Cloud->>Cloud: Validate hash (PHS) OR relay to PTA agent
        Cloud-->>Browser: Token + session issued by cloud
        Browser-->>User: Signed in
    else Federated authentication (ADFS, Legacy)
        Cloud-->>Browser: 302 to on-prem IdP<br/>WS-Fed / SAML request
        Browser->>IdP: GET /adfs/ls with request
        IdP-->>Browser: Login page (or Windows integrated auth)
        User->>Browser: Enter credentials
        Browser->>IdP: POST credentials
        IdP->>Dir: Validate against Active Directory
        Dir-->>IdP: Success + claims
        IdP-->>Browser: Signed SAML/JWT token, auto-POST to cloud
        Browser->>Cloud: POST token to cloud endpoint
        Cloud->>Cloud: Verify token signature vs<br/>federation trust certificate
        Cloud-->>Browser: Cloud session issued
        Browser-->>User: Signed in
    end

    alt Federated: signing certificate expired or mismatched
        IdP-->>Browser: Signed token (old / rotated cert)
        Browser->>Cloud: POST token
        Cloud->>Cloud: Signature does not match trusted cert
        Cloud-->>Browser: Sign-in failed, trust broken
    end

    alt Federated: on-prem IdP unreachable
        Cloud-->>Browser: 302 to ADFS
        Browser->>IdP: GET /adfs/ls (times out)
        Browser-->>User: Cannot reach sign-in service
    end
```

Notes

- The branch is chosen by the domain's authentication setting during home-realm discovery,
  the same user can be managed on one domain and federated on another.
- On the managed path the cloud always mints the token, PTA only reaches on-prem for the
  password check, PHS never leaves the cloud at all.
- On the federated path the on-prem IdP mints a signed token and the cloud only verifies its
  signature, so a certificate drift or an IdP outage breaks every sign-in with no cloud fallback.
