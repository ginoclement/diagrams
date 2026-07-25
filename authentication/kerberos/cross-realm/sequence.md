---
title: "Cross-Realm Authentication — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cross-Realm Authentication — Sequence Diagram

Happy path first: a client in `REALM-A` reaches a service in `REALM-B` through a
transitive trust with one intermediate hop at the forest root. Alternates follow:
no acceptable trust path, unknown SPN, selective authentication denial, and
trust-key / skew failures.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant KDCA as KDC-A
    participant KDCR as KDC-Root
    participant KDCB as KDC-B
    participant Service as Service

    Note over Client,KDCA: Precondition - client already holds TGT krbtgt/REALM-A@REALM-A<br/>from the AS exchange in its home realm

    User->>Client: Open resource in REALM-B<br/>SPN cifs/fs01.realm-b.example
    Client->>KDCA: TGS-REQ sname=cifs/fs01.realm-b.example<br/>with home TGT + authenticator

    KDCA->>KDCA: SPN not local. Look up trust path to REALM-B<br/>next hop = REALM-ROOT
    KDCA-->>Client: TGS-REP referral ticket krbtgt/REALM-ROOT@REALM-A<br/>encrypted with A-to-ROOT inter-realm key
    Note right of KDCA: Referral TGT carries the PAC and the<br/>forwardable / renewable flags policy allows

    Client->>KDCR: TGS-REQ sname=cifs/fs01.realm-b.example<br/>with krbtgt/REALM-ROOT@REALM-A
    KDCR->>KDCR: Decrypt with inter-realm key, verify PAC signature,<br/>append REALM-A to transited field
    KDCR-->>Client: TGS-REP referral ticket krbtgt/REALM-B@REALM-ROOT

    Client->>KDCB: TGS-REQ sname=cifs/fs01.realm-b.example<br/>with krbtgt/REALM-B@REALM-ROOT
    KDCB->>KDCB: Validate transited realms, set transited-policy-checked
    KDCB->>KDCB: Apply SID filtering to the PAC,<br/>re-sign PAC with local krbtgt key
    KDCB-->>Client: TGS-REP service ticket for cifs/fs01.realm-b.example<br/>encrypted with the service account long-term key

    Client->>Service: AP-REQ service ticket + authenticator
    Service->>Service: Decrypt ticket with own key, check authenticator<br/>and replay cache, read PAC for authorization
    Service-->>Client: AP-REP mutual authentication
    Client-->>User: Access granted to the remote-realm resource

    alt No acceptable trust path
        Client->>KDCA: TGS-REQ for SPN in an untrusted realm
        KDCA-->>Client: KRB-ERROR KDC_ERR_PATH_NOT_ACCEPTED
        Note right of KDCA: No trust, transitivity disabled,<br/>or path not allowed by capaths policy
    end

    alt Transit path rejected at the far end
        KDCB->>KDCB: Transited realms not acceptable to local policy
        KDCB-->>Client: KRB-ERROR KDC_ERR_PATH_NOT_ACCEPTED
    end

    alt Unknown SPN in REALM-B
        KDCB-->>Client: KRB-ERROR KDC_ERR_S_PRINCIPAL_UNKNOWN
        Note right of KDCB: Missing or duplicate SPN registration<br/>on the service account
    end

    alt Selective authentication - principal not allowed
        KDCB->>KDCB: Check Allowed-to-authenticate right<br/>on the target computer object
        KDCB-->>Client: KRB-ERROR KDC_ERR_POLICY<br/>STATUS_AUTHENTICATION_FIREWALL_FAILED
    end

    opt Inter-realm key rotated on one side only
        KDCR-->>Client: KRB-ERROR KRB_AP_ERR_MODIFIED<br/>referral TGT cannot be decrypted
    end

    opt Clock skew between realms
        KDCB-->>Client: KRB-ERROR KRB_AP_ERR_SKEW
    end
```

Notes

- Every hop is an ordinary TGS exchange; only the ticket that comes back differs —
  a referral TGT for the next realm instead of a service ticket. See
  [TGS Exchange](../tgs-exchange/README.md).
- The client, not the KDCs, drives the chain. There is no KDC-to-KDC traffic in
  Kerberos referrals.
- SID filtering happens on the **trusting** side. For a forest trust, SIDs from
  domains outside the trusted forest are stripped before the PAC is re-signed,
  which is the control that blocks SID-history escalation across the trust.
- With a two-hop path the client ends up caching three tickets: the home TGT, one
  referral TGT per intermediate realm, and the final service ticket.
