---
title: "IdP Reference Architecture — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP Reference Architecture — Sequence Diagram

A representative runtime flow: an interactive login that traverses the IdP's internal
components — edge, authentication service, directory, factor service, session store,
token service, and audit. `alt`/`opt` blocks cover seamless SSO, MFA step-up, and
inbound federation to an upstream IdP.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Browser / App
    participant Edge as Edge / TLS Gateway
    participant Auth as Authentication Service
    participant Dir as User Directory
    participant MFA as Factor / MFA Service
    participant Sess as Session Store
    participant Tok as Token / Assertion Service
    participant HSM as Signing Key Store (HSM)
    participant Audit as Audit / Logging

    User->>App: Start sign-in to relying party
    App->>Edge: HTTPS authorize request (TLS, WAF, rate limit)
    Edge->>Auth: Forward authorize request (internal mTLS)
    Auth->>Sess: Look up existing IdP SSO session

    alt Seamless SSO (valid session cookie)
        Sess-->>Auth: Active session found
        Auth->>Audit: Log SSO reuse (no prompt)
    else Interactive login required
        Auth-->>App: Present login page
        User->>App: Submit primary credentials
        App->>Edge: POST credentials
        Edge->>Auth: Forward credentials
        Auth->>Dir: Verify identity + credential hash
        alt Credentials valid
            Dir-->>Auth: User record + group / role claims
            opt Policy requires a second factor
                Auth->>MFA: Request factor challenge
                MFA-->>App: Challenge (push, TOTP, or WebAuthn)
                User->>App: Complete factor
                App->>MFA: Factor response
                MFA-->>Auth: Factor verified
            end
            Auth->>Sess: Create IdP SSO session
            Auth->>Audit: Log successful authentication
        else Credentials invalid
            Dir-->>Auth: No match
            Auth->>Audit: Log failed attempt (increment lockout counter)
            Auth-->>App: Re-prompt or lock account
        end
    end

    opt Inbound federation (home realm is an upstream IdP)
        Auth->>Auth: Home-realm discovery selects external IdP
        Note over Auth: Redirect to upstream IdP, then map<br/>the returned assertion to a local identity
    end

    Auth->>Tok: Request token / assertion for the relying party
    Tok->>HSM: Sign JWT or SAML assertion with private key
    HSM-->>Tok: Signature
    Tok->>Audit: Log token issuance (subject, audience, scopes)
    Tok-->>Edge: Signed token / assertion
    Edge-->>App: Redirect to relying party with credential
    App-->>User: Signed in to the application
```

Notes

- The Edge is the only internet-facing hop, steps 2-3, everything after it is on the
  internal network reached over mutually authenticated TLS.
- Signing keys never leave the HSM boundary, steps 20-21, the Token Service asks the HSM
  to sign and only receives the signature back.
- The Session Store powers seamless SSO and is the object revoked on single logout, it is
  distinct from the short-lived token the Token Service mints.
- Every branch writes to Audit so both success and failure are independently reviewable.
