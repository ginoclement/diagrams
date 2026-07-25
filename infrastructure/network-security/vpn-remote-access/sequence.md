---
title: "Remote Access VPN — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Remote Access VPN — Sequence Diagram

Happy path: IKEv2/IPsec-style negotiation with MFA and a passing posture check, then
tunnel establishment. Alternates: posture failure to quarantine, certificate auth, and
full vs split tunnel routing.

```mermaid
sequenceDiagram
    autonumber
    participant Cl as VPN client
    participant PA as Posture agent
    participant GW as VPN gateway
    participant IdP as IdP / MFA (RADIUS/SAML)
    participant Int as Internal resources

    %% ----- happy path -----
    Cl->>GW: IKE_SA_INIT (propose crypto, DH key exchange)
    GW-->>Cl: IKE_SA_INIT response (DH share, nonce)
    Note over Cl,GW: Shared IKE keys established - IKE_AUTH now encrypted
    Cl->>GW: IKE_AUTH (user identity + credentials)
    GW->>IdP: Authenticate user
    IdP-->>GW: Primary auth OK - MFA required
    GW-->>Cl: Request second factor
    Cl->>GW: MFA response (push approved / OTP / passkey)
    GW->>IdP: Verify second factor
    IdP-->>GW: MFA verified
    GW->>PA: Request device posture
    PA-->>GW: Disk encrypted, patched, EDR running
    GW->>GW: Posture compliant - authorize tunnel
    GW-->>Cl: IKE_AUTH success - push config (IP, routes, DNS)
    Note over Cl,GW: Tunnel established (Child SA / IPsec ESP)
    Cl->>GW: Traffic for corporate subnets over tunnel
    GW->>Int: Forward (still subject to internal firewalls)
    Int-->>Cl: Response over encrypted tunnel

    %% ----- split vs full tunnel -----
    alt Split tunnel
        Note over Cl: Only corporate subnets routed via tunnel,<br/>internet traffic egresses locally (faster, uninspected)
    else Full tunnel
        Note over Cl: All traffic routed via gateway -<br/>corporate egress inspects it (DLP/IPS), higher latency
    end

    %% ----- posture failure -----
    alt Posture check fails
        GW->>PA: Request device posture
        PA-->>GW: EDR missing / OS out of date / encryption off
        GW-->>Cl: Assign quarantine VLAN (remediation only)
        Note over Cl,GW: Client can reach patch/remediation services only,<br/>re-check after remediation to gain full access
    end

    %% ----- certificate auth (always-on device tunnel) -----
    alt Certificate authentication
        Cl->>GW: IKE_AUTH with machine/user certificate
        GW->>GW: Validate cert chain, EKU, revocation
        Note over Cl,GW: Common for always-on tunnels that come up<br/>automatically off the trusted network
    end
```
