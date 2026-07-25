# Continuous Access Evaluation — Sequence Diagram

Happy path first (long-lived CAE token used normally), then a critical event triggering a
claims challenge, an IP-location challenge, and a non-CAE-aware client fallback.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant Entra as Entra
    participant Res as Resource
    participant Admin as Admin

    User->>Client: Sign in
    Client->>Entra: Authorize + token request (CAE capable)
    Entra-->>Client: CAE access_token (long-lived, revocable)
    Client->>Res: Call API with token
    Res->>Res: Validate token + evaluate CAE claims
    Res-->>Client: 200 data
    Client-->>User: Content shown

    alt Critical event - user disabled / sessions revoked
        Admin->>Entra: Disable account / revoke sessions
        Entra->>Res: Publish critical event (near real time)
        Client->>Res: Next call with existing token
        Res-->>Client: 401 claims challenge<br/>error=insufficient_claims, claims=...
        Client->>Entra: Re-request token with claims challenge
        Entra-->>Client: Deny - account disabled, no token
        Client-->>User: Signed out / access revoked
    else IP location outside allowed range
        Client->>Res: Call from non-allowed IP
        Res-->>Client: 401 claims challenge (location)
        Client->>Entra: Re-authorize; CA location policy re-evaluated
        Entra-->>Client: Block (or new token if now compliant)
    else CA policy changed mid-session
        Admin->>Entra: Tighten CA policy
        Res-->>Client: 401 claims challenge on next call
        Client->>Entra: Fresh token reflecting new policy
        Entra-->>Client: Token issued if new controls satisfied
    else Client not CAE-aware
        Note over Client,Res: Client cannot parse the claims challenge,<br/>it just waits for normal token expiry,<br/>revocation is delayed to standard lifetime
    end
```

Notes

- The claims challenge is an HTTP 401 with `WWW-Authenticate: Bearer` carrying an encoded
  `claims` parameter, the client must re-request a token that satisfies it.
- Long-lived CAE tokens are safe precisely because critical events can revoke them, without
  CAE a long lifetime would be dangerous.
- A non-CAE-aware client degrades gracefully to normal (shorter) token-expiry behavior.
