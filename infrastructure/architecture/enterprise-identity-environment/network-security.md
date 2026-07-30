---
title: "Enterprise Identity Environment — Network Security View"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Enterprise Identity Environment — Network Security View

The same environment as [`flowchart.md`](flowchart.md), re-drawn as **network zones** separated
by firewalls, with every link labelled by the **port and protocol** it uses. Use it to reason
about segmentation and firewall rules. Ports are the common defaults — confirm against your own
build. All hostnames/addresses are illustrative.

```mermaid
flowchart TB
    subgraph inet["Internet / remote"]
        Remote["Remote users<br/>(browser + endpoint agent)"]
        SaaS["SaaS apps<br/>(Salesforce, M365)"]
    end

    subgraph cloud["Cloud identity (SaaS)"]
        Okta["Okta<br/>(SSO / IdP + MFA)"]
        Entra["Microsoft Entra ID"]
    end

    FWp{{"Perimeter firewall<br/>+ WAF / reverse proxy"}}

    subgraph corp["Corporate network (internal)"]
        Endpoints["Managed endpoints"]
        ADAgent["Okta AD Agent /<br/>Entra Connect"]
        VPN["VPN + RADIUS<br/>(network access)"]
    end

    FWi{{"Internal firewall<br/>(segmentation)"}}

    subgraph idz["Identity tier (restricted VLAN)"]
        AD["Active Directory<br/>domain controllers"]
        SailPoint["SailPoint<br/>(IdentityIQ / IDN connector)"]
        CyberArk["CyberArk<br/>(vault + PSM)"]
    end

    subgraph data["Data / app tier"]
        OnPrem["On-prem apps"]
        DB[("Directory / app<br/>databases")]
    end

    Remote -->|"HTTPS 443 (SSO)"| FWp
    SaaS -->|"HTTPS 443 (SAML / OIDC)"| Okta
    FWp -->|"HTTPS 443"| Okta
    FWp -->|"HTTPS 443"| Entra
    Remote -->|"IPsec IKE 500 / 4500,<br/>or TLS 443"| FWp
    FWp -->|"to VPN concentrator"| VPN
    VPN -->|"RADIUS 1812 / 1813"| Okta

    Okta -->|"outbound HTTPS 443<br/>(agent polls cloud)"| ADAgent
    Entra -->|"outbound HTTPS 443"| ADAgent
    ADAgent -->|"LDAP 389 / LDAPS 636,<br/>Kerberos 88"| AD

    Endpoints -->|"Kerberos 88, LDAP 389 / 636,<br/>SMB 445, DNS 53"| FWi
    FWi -->|"to domain controllers"| AD

    SailPoint -->|"LDAPS 636, GC 3269"| AD
    SailPoint -->|"SQL 1433 (TDS)"| DB
    SailPoint -->|"SCIM / HTTPS 443"| FWp
    CyberArk -->|"LDAPS 636"| AD
    CyberArk -->|"SSH 22 / RDP 3389<br/>(brokered sessions)"| OnPrem
    AD -->|"LDAP replication,<br/>DB 1433"| DB

    AD -->|"OCSP / CRL 80,<br/>NTP 123"| FWp
    SailPoint -->|"SMTP 587 (notifications)"| FWp

    classDef net fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d;
    classDef cloudc fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a;
    classDef corpc fill:#dcfce7,stroke:#15803d,color:#14532d;
    classDef idc fill:#e0e7ff,stroke:#4338ca,color:#312e81;
    classDef datac fill:#f1f5f9,stroke:#475569,color:#0f172a;
    class FWp,FWi net;
    class Okta,Entra,SaaS,Remote cloudc;
    class Endpoints,ADAgent,VPN corpc;
    class AD,SailPoint,CyberArk idc;
    class OnPrem,DB datac;
```

## Port / protocol reference

| Link | Port(s) | Protocol / purpose |
|---|---|---|
| Browser → Okta / Entra / SaaS | 443 | HTTPS — SSO (SAML, OIDC/OAuth) |
| Remote access VPN | 500, 4500 (IPsec) or 443 (TLS) | Encrypted tunnel into corp |
| VPN / NAS → Okta | 1812, 1813 | RADIUS auth + accounting (MFA) |
| Okta AD Agent / Entra Connect → cloud | 443 outbound | Agent-initiated, no inbound firewall hole |
| Agent / apps → Active Directory | 389 / 636, 3269, 88, 445, 53 | LDAP / LDAPS, Global Catalog, Kerberos, SMB, DNS |
| SailPoint → AD | 636, 3269 | LDAPS, Global Catalog over TLS |
| SailPoint / AD → database | 1433 | SQL Server (TDS); 5432 for PostgreSQL |
| CyberArk → targets | 22, 3389 | SSH / RDP via brokered (PSM) sessions |
| Notifications | 587 (or 25) | SMTP submission |
| Certificate / time | 80, 123 | OCSP / CRL, NTP |

Notes

- **Agents dial out.** Okta's AD Agent and Entra Connect make **outbound 443** to the cloud, so
  no inbound port needs opening to the identity tier — a key reason cloud IdP integrations are
  firewall-friendly.
- **Segment the identity tier.** Domain controllers, the IGA server, and the PAM vault sit behind
  an internal firewall on a restricted VLAN; only the specific ports above are permitted, and
  privileged protocols (SSH/RDP) reach hosts **only** through CyberArk.
- **Prefer LDAPS (636) over LDAP (389)** and disable anonymous binds; 389 is shown only where
  legacy integrations still require it.
- Pair this with [Network segmentation and DMZ](../../network-security/network-segmentation-dmz/README.md),
  [Zero-trust architecture](../zero-trust-architecture/README.md), and
  [Kerberos exchanges](../../../authentication/kerberos/as-exchange/README.md).
