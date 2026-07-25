# Hybrid Identity Sync — Decision Flowchart

Choosing and executing a sign-in method, with per-method failure terminals.

```mermaid
flowchart TD
    Start(["User signs in to a cloud app"]) --> Sso{"Domain-joined device<br/>with Seamless SSO?"}
    Sso -->|Yes| Kerb["Silent Kerberos sign-in<br/>(AZUREADSSOACC ticket)"] --> Ok
    Sso -->|No| Method{"Configured sign-in<br/>method for the domain?"}

    Method -->|PHS| Phs{"Password matches<br/>synced hash-of-hash?"}
    Phs -->|No| ErrPhs(["Sign-in failed: bad password"])
    Phs -->|Yes| Ok

    Method -->|PTA| Reach{"PTA agent online<br/>and AD reachable?"}
    Reach -->|No| ErrPta(["Sign-in failed:<br/>no agent / AD unreachable"])
    Reach -->|Yes| Pta{"AD validates password?"}
    Pta -->|No| ErrPtaPwd(["Sign-in failed: bad password"])
    Pta -->|Yes| Ok

    Method -->|"Federation (legacy)"| Fed{"AD FS farm reachable<br/>and healthy?"}
    Fed -->|No| ErrFed(["Sign-in failed: AD FS down"])
    Fed -->|Yes| FedAuth{"AD FS authenticates user?"}
    FedAuth -->|No| ErrFedAuth(["Sign-in failed at AD FS"])
    FedAuth -->|Yes| Ok

    Ok(["Entra issues tokens"])
```

Notes

- The PHS branch has no on-prem dependency at sign-in, so it has no reachability terminal — its
  key resilience advantage.
- PTA and Federation each add an availability gate (`Reach`, `Fed`) that PHS avoids.
- Seamless SSO short-circuits the whole method decision on eligible devices.
