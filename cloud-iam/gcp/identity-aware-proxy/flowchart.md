# Identity-Aware Proxy — Decision Flowchart

The authentication, IAM, access-level, and backend-verification gates. Every denial terminates
explicitly.

```mermaid
flowchart TD
    Start(["Request arrives at IAP via load balancer"]) --> Auth{"Valid IAP session<br/>or valid ID token?"}
    Auth -->|"No"| Login["Redirect to Google Sign-In<br/>(browser) or reject (programmatic)"]
    Login --> Signed{"Authentication<br/>completed?"}
    Signed -->|No| EAuth(["DENY: not authenticated"])
    Signed -->|Yes| Role
    Auth -->|Yes| Role{"Identity has<br/>iap.httpsResourceAccessor?"}

    Role -->|No| ERole(["403: not authorized for resource"])
    Role -->|Yes| Level{"Required access<br/>levels present?"}

    Level -->|"No access level bound"| Fwd
    Level -->|"Yes"| Eval{"Device / IP / region<br/>satisfy access level?"}
    Eval -->|No| ELevel(["403: context-aware access denied"])
    Eval -->|Yes| Fwd["Forward to backend with<br/>x-goog-iap-jwt-assertion"]

    Fwd --> Verify{"Backend verifies JWT<br/>iss, aud, exp?"}
    Verify -->|No| EJwt(["Backend rejects: invalid IAP JWT"])
    Verify -->|Yes| OK(["Serve protected resource"])
```

Notes

- The gates are ordered authentication → authorization → context; a failure at any gate returns
  403 from IAP and the backend is never contacted.
- Access levels are optional per resource; when bound via IAM Conditions they become mandatory
  and encode device posture, IP CIDR, and region.
- Backend verification is the last line of defense and assumes the app is reachable only through
  IAP — a directly reachable backend would bypass all upstream gates.
