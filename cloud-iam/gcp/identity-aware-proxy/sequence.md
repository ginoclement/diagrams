---
title: "Identity-Aware Proxy — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Identity-Aware Proxy — Sequence Diagram

Happy path first (authenticated, authorized, access level passes), then alternates: not signed
in, missing accessor role, failing access level, and programmatic ID-token access.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IAP as IAP
    participant Google as Google Sign-In
    participant ACM as Access Context Manager
    participant Backend as Backend app

    User->>Browser: Navigate to protected app URL
    Browser->>IAP: GET app (via HTTPS load balancer)
    IAP->>IAP: Check IAP session cookie

    alt Authenticated, authorized, context OK (happy path)
        IAP->>IAP: Valid session, resolve identity
        IAP->>IAP: IAM: identity has roles/iap.httpsResourceAccessor?
        IAP->>ACM: Evaluate required access levels<br/>(device, IP, region)
        ACM-->>IAP: Access levels satisfied
        IAP->>Backend: Forward request +<br/>x-goog-iap-jwt-assertion (signed JWT)
        Backend->>Backend: Verify JWT (iss, aud, exp)<br/>against IAP public keys
        Backend-->>Browser: 200 app response
        Browser-->>User: Application page
    else Not signed in
        IAP-->>Browser: 302 redirect to Google Sign-In
        Browser->>Google: Authenticate + consent (IAP OAuth client)
        Google-->>Browser: Redirect back with identity, set IAP session
        Browser->>IAP: Retry request with session cookie
    else Signed in but lacks accessor role
        IAP->>IAP: IAM check fails
        IAP-->>Browser: 403 Forbidden (backend never contacted)
    else Access level fails
        IAP->>ACM: Evaluate access levels
        ACM-->>IAP: Denied - unmanaged device / disallowed region
        IAP-->>Browser: 403 Forbidden (context-aware access)
    else Programmatic access with OIDC ID token
        Browser->>IAP: Request with Bearer OIDC ID token<br/>(aud = IAP OAuth client ID)
        IAP->>IAP: Verify token audience + identity, then IAM + access levels
        IAP->>Backend: Forward if allowed
    end
```

Notes

- IAP enforces both authentication and authorization before the backend is ever reached; a
  failed check returns 403 from IAP itself.
- The backend must independently verify `x-goog-iap-jwt-assertion`; it must not trust the header
  blindly and must be unreachable except through IAP.
- Programmatic clients skip the browser cookie by presenting an OIDC ID token whose `aud` is the
  IAP OAuth client ID, often obtained via
  [service account impersonation](../service-account-impersonation/README.md) `generateIdToken`.
