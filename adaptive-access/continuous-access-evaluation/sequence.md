# Continuous Access Evaluation — Sequence Diagram

Happy path first (CAE-capable token issued, honoured while valid), then a critical event
that forces a claims challenge and re-evaluation, and the revoked-user deny branch.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant API as API
    participant IdP as IdP
    participant Sig as Signal sources

    User->>Client: Sign in
    Client->>IdP: Authorization request<br/>(advertise CAE capability)
    IdP-->>Client: Long-lived CAE-capable access_token
    Client->>API: Call with access_token
    API->>API: Validate token, session meets policy
    API-->>Client: 200 data (honoured until a critical event)

    Note over Sig,IdP: Later - a critical event occurs
    Sig->>IdP: Critical event<br/>(user disabled / password reset /<br/>MFA revoked / elevated risk / IP change)
    IdP->>IdP: Mark session for re-evaluation

    Client->>API: Next call with same token
    API->>API: Session flagged - token no longer sufficient

    alt Critical event - challenge then re-issue
        API-->>Client: 401 WWW-Authenticate:<br/>claims challenge (re-evaluation needed)
        Client->>IdP: Reauthorize with claims challenge
        IdP->>IdP: Re-evaluate conditions against current state
        IdP-->>Client: Fresh access_token (conditions still satisfied)
        Client->>API: Retry with fresh token
        API-->>Client: 200 data
    else User revoked / disabled
        API-->>Client: 401 claims challenge
        Client->>IdP: Reauthorize with claims challenge
        IdP->>IdP: Account disabled - conditions fail
        IdP-->>Client: Deny (no new token)
        Client-->>User: Access revoked - sign in again
    else Client not CAE-capable
        Note over Client,API: RP cannot rely on challenge handling,<br/>falls back to short token lifetime,<br/>revocation waits for expiry.
    end
```

Notes

- The token is honoured with **no extra round trips** until a critical event fires — CAE adds
  latency only when something actually changed.
- The `claims` challenge is what pulls the client back to the IdP, a client that merely
  retries the same token would loop, so CAE-capability is negotiated up front.
- Propagation from `Sig` to the IdP is fast but not instantaneous — CAE narrows the
  revocation window to seconds, it does not make it zero.
