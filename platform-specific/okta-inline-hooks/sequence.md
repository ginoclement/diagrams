---
title: "Okta Inline Hooks — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Okta Inline Hooks — Sequence Diagram

Happy path (token inline hook): a token is about to be issued via the standard
[OIDC Authorization Code flow](../../oidc/authorization-code/README.md); Okta pauses,
calls the external Hook Service synchronously, applies the returned `commands`, then
issues the customized token. The registration, SAML assertion, and password import
hooks follow the same pause-callout-commands pattern. Alternates: timeout fallback,
error/deny.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant Okta as Okta (org)
    participant Hook as Hook Service (your endpoint)

    %% ----- happy path: token inline hook -----
    User->>App: Sign in and authorize
    App->>Okta: Authenticate + request token (standard OIDC)
    Okta->>Okta: Build token, then PAUSE for token inline hook
    Okta->>Hook: POST hook payload (data.token claims, context)<br/>with auth header / secret
    Note over Okta,Hook: Synchronous, blocking call within request timeout
    Hook->>Hook: Look up external data, decide claims
    Hook-->>Okta: 200 commands: com.okta.access.patch<br/>(add/replace claims)
    Okta->>Okta: Apply commands, finalize + sign token
    Okta-->>App: Customized access / id token
    App-->>User: Signed in with enriched claims

    %% ----- registration inline hook -----
    opt Registration inline hook
        User->>Okta: Self-service registration submit
        Okta->>Hook: POST profile data (pre-registration)
        Hook-->>Okta: commands: com.okta.identity.patch<br/>(normalize attributes) or DENY
        Okta->>Okta: Apply patch, create user (or reject)
    end

    %% ----- SAML assertion inline hook -----
    opt SAML assertion inline hook
        App->>Okta: SAML SSO (SP-initiated)
        Okta->>Okta: Build assertion, PAUSE before signing
        Okta->>Hook: POST assertion attribute statements
        Hook-->>Okta: commands: com.okta.assertion.patch<br/>(add/replace attributes)
        Okta->>Okta: Apply patch, SIGN assertion, POST to SP
    end

    %% ----- password import inline hook -----
    opt Password import inline hook (legacy migration)
        User->>Okta: First sign-in with legacy password
        Okta->>Hook: POST candidate credential
        Hook->>Hook: Verify against legacy store
        Hook-->>Okta: commands: com.okta.action.update<br/>credential VERIFIED or UNVERIFIED
        Okta->>Okta: If VERIFIED, store hash + sign in
    end

    %% ----- alternates -----
    alt Hook timeout or transport failure
        Okta->>Hook: POST hook payload
        Hook--xOkta: No response within timeout / 5xx
        alt Configured fail-open
            Okta->>Okta: Proceed with flow unmodified
        else Configured fail-close
            Okta-->>App: Flow aborted - hook unavailable
        end
    end

    alt Hook returns error / deny
        Okta->>Hook: POST hook payload
        Hook-->>Okta: 200 with error object (or deny command)
        Okta-->>App: Flow halted - user-facing failure message
    end
```
