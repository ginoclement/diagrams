---
title: "Network Segmentation and the DMZ — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Network Segmentation and the DMZ — Sequence Diagram

Happy path: a legitimate north-south request traverses the tiers. Alternates: blocked
lateral movement from a compromised DMZ host, and brokered jump-host admin access.

```mermaid
sequenceDiagram
    autonumber
    participant Cl as Client (Internet)
    participant EF as Edge firewall
    participant RP as Reverse proxy / WAF (DMZ)
    participant IF as Internal firewall
    participant App as App server (App tier)
    participant DB as Database (Data tier)

    %% ----- happy path: north-south request -----
    Cl->>EF: HTTPS request to published service (443)
    EF->>EF: Allow only 80/443 to DMZ, drop everything else
    EF->>RP: Forward to reverse proxy
    RP->>RP: Terminate TLS, WAF inspection, route
    RP->>IF: Proxy request to app tier (defined port)
    IF->>IF: Permit DMZ to App-tier on this flow only
    IF->>App: Forward request
    App->>IF: Query for data (DB port)
    IF->>DB: Permit App-tier to Data-tier on DB port only
    DB-->>App: Result set
    App-->>RP: Response
    RP-->>Cl: HTTPS response
    Note over Cl,DB: North-south path - each boundary opens exactly one flow

    %% ----- blocked lateral movement -----
    alt Compromised DMZ host pivots inward
        RP->>IF: Attempt direct connection to Data tier (DB port)
        IF->>IF: No rule permits DMZ to Data tier
        IF-->>RP: DROP (silent) - lateral movement blocked
        Note over IF,DB: Even a fully compromised DMZ host has no route<br/>to the database - default deny at the boundary
    end

    alt East-west pivot between peers
        App->>IF: Try to reach another app server's admin port
        IF->>IF: East-west policy denies peer-to-peer on that port
        IF-->>App: DROP - no lateral movement within the tier
    end

    %% ----- jump-host admin access -----
    alt Administrator maintenance
        Note over Cl,DB: Admins never connect straight to servers
        Cl->>EF: Connect to bastion / jump host (via VPN)
        EF->>RP: Only bastion IP allowed to management zone
        RP->>App: Bastion opens brokered SSH/RDP (MFA, session recorded)
        Note over RP,App: Jump host is the only source permitted to reach<br/>management ports on internal hosts
    end
```
