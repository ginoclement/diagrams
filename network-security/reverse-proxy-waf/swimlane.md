# Reverse Proxy and WAF — Swimlane

Zones: the untrusted client, the DMZ edge (proxy + WAF + rate limiter), and the internal
origin. TLS is terminated in the DMZ and re-originated on the internal hop.

```mermaid
flowchart TD
    subgraph Internet["Internet (untrusted)"]
        CL["Client / bot"]
    end

    subgraph DMZ["DMZ edge"]
        RP1["Terminate TLS,<br/>strip client identity headers"]
        RL{"Within rate /<br/>bot budget?"}
        CH["Serve challenge<br/>(JS / CAPTCHA / 429)"]
        WAF{"WAF verdict<br/>(OWASP CRS)?"}
        BLK(["403 - blocked,<br/>not forwarded"])
        INJ["Authenticate + inject<br/>trusted identity header"]
        RE["Re-encrypt: new TLS<br/>(optionally mTLS) to origin"]
    end

    subgraph Internal["Internal / Trusted"]
        OR["Origin / app server<br/>(accepts identity header<br/>ONLY from proxy)"]
    end

    CL -->|HTTPS| RP1 --> RL
    RL -->|no| CH
    CH --> RL
    RL -->|yes| WAF
    WAF -->|block| BLK
    WAF -->|pass| INJ --> RE --> OR
    OR -->|response| RP1
    RP1 -->|HTTPS + HSTS/CSP| CL
```
