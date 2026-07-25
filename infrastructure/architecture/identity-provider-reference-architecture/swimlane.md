---
title: "IdP Reference Architecture — Component / Zone Topology"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP Reference Architecture — Component / Zone Topology

Components placed in their trust zone. Arrows show the only allowed flows across each
boundary: public traffic enters solely through the edge, application-tier services reach
data stores over an internal network, and the management plane is isolated.

```mermaid
flowchart TD
    subgraph Public["Public / Untrusted"]
        User["User (Browser / App)"]
        RP["Relying Party (RP / SP)"]
        Ext["External / Upstream IdPs<br/>(social, enterprise)"]
    end

    subgraph DMZ["Edge / DMZ"]
        Edge["Edge / TLS Gateway<br/>(TLS termination, WAF, rate limit)"]
    end

    subgraph App["Application Tier (Control Plane)"]
        Auth["Authentication Service"]
        MFA["Factor / MFA Service"]
        Tok["Token / Assertion Service"]
        Fed["Federation / Home-Realm Discovery"]
    end

    subgraph Data["Data Tier"]
        Dir[("User Directory<br/>identities + credential hashes")]
        Sess[("Session Store<br/>IdP SSO sessions")]
        HSM[("Signing Key Store / HSM")]
        Log[("Audit / Logging store<br/>append-only")]
    end

    subgraph Mgmt["Management Plane"]
        Admin["Admin Console"]
        Policy["Policy Engine<br/>(authenticators, MFA rules, app assignments)"]
    end

    User -->|HTTPS| Edge
    RP -->|"token / assertion exchange"| Edge
    Edge -->|internal mTLS| Auth
    Auth --> MFA
    Auth --> Fed
    Fed -->|inbound federation| Ext
    Auth --> Tok

    Auth -->|verify credentials| Dir
    Auth -->|read / write session| Sess
    MFA -->|factor secrets| Dir
    Tok -->|sign| HSM
    Auth -->|events| Log
    Tok -->|events| Log

    Admin --> Policy
    Policy -->|config| Auth
    Policy -->|config| MFA
    Policy -->|config| Tok
    Admin -->|admin events| Log
```

Notes

- The **Public** zone can reach only the **Edge** — no direct path exists to any
  application-tier service or data store.
- The **Data Tier** holds every long-lived secret: credential hashes and factor secrets
  in the Directory, session state in the Session Store, and private keys in the HSM. Only
  named application-tier services may reach each store.
- The **Management Plane** pushes configuration down into the control plane and writes its
  own audit trail, but never sits in the request path of an end-user login.
- Inbound federation is the one sanctioned outbound path from the app tier to the public
  zone — it is drawn fully in the [Federation topology](../federation-topology/README.md) diagram.
