---
title: "Reverse Proxy and WAF — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Reverse Proxy and WAF — Sequence Diagram

Happy path: TLS termination, WAF inspection, rate check, re-encrypted routing to origin,
identity-header injection. Alternates: WAF block, bot / rate-limit challenge.

```mermaid
sequenceDiagram
    autonumber
    participant Cl as Client
    participant RP as Reverse proxy
    participant WAF as WAF (OWASP CRS)
    participant RL as Rate limiter / bot mgr
    participant Or as Origin / app server

    %% ----- happy path -----
    Cl->>RP: HTTPS request
    RP->>RP: Terminate TLS, normalize/canonicalize request
    RP->>RP: Strip any client-supplied X-Forwarded-User header
    RP->>RL: Check request budget for IP / account
    RL-->>RP: Within limits
    RP->>WAF: Inspect request against CRS
    WAF->>WAF: Score SQLi, XSS, traversal, RCE, protocol anomalies
    WAF-->>RP: Anomaly score below threshold - pass
    RP->>RP: Authenticate caller, inject trusted identity header
    RP->>Or: Forward over NEW TLS session (re-encrypt to origin)
    Note over RP,Or: Internal hop is encrypted, not plaintext -<br/>optionally mTLS so only the proxy can reach the origin
    Or-->>RP: Response
    RP-->>Cl: Response + security headers (HSTS, CSP)

    %% ----- WAF blocks a malicious request -----
    alt Malicious payload
        Cl->>RP: HTTPS request with SQLi payload
        RP->>WAF: Inspect against CRS
        WAF-->>RP: Rule match - anomaly score over threshold
        RP-->>Cl: 403 Forbidden - never forwarded to origin
        Note over RP,Or: Origin never sees the malicious request
    end

    %% ----- bot / rate-limit challenge -----
    alt Volume over threshold or bot-scored
        Cl->>RP: Burst of requests
        RP->>RL: Check budget
        RL-->>RP: Over limit / automated pattern
        alt Hard limit
            RP-->>Cl: 429 Too Many Requests (Retry-After)
        else Ambiguous - challenge
            RP-->>Cl: Interactive challenge (JS / CAPTCHA)
            Cl->>RP: Challenge solved
            RP->>WAF: Continue inspection
        end
    end
```
