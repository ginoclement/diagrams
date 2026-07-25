---
title: "Constrained Delegation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Constrained Delegation — Sequence Diagram

Happy path: a front end authenticates the user by a non-Kerberos method, performs
**S4U2Self** to obtain a forwardable ticket in the user's name, then **S4U2Proxy**
to obtain a ticket for an allowlisted back-end SPN. Alternates cover a target SPN
that is not allowed, a non-forwardable evidence ticket, protocol transition
disabled, and a protected user.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant Frontend as Frontend
    participant KDC as KDC
    participant Backend as Backend

    Note over Frontend,KDC: Preconditions - Frontend holds its own TGT,<br/>msDS-AllowedToDelegateTo lists MSSQLSvc/db01.realm.example,<br/>TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION is set

    User->>Client: Sign in to the application
    Client->>Frontend: POST credentials, or SAML assertion, or client certificate
    Frontend->>Frontend: Authenticate the user by non-Kerberos means,<br/>map to the AD principal user@REALM

    rect rgb(240, 245, 250)
        Note over Frontend,KDC: S4U2Self - protocol transition
        Frontend->>KDC: TGS-REQ sname=HTTP/frontend.realm.example<br/>padata PA-FOR-USER naming user@REALM<br/>checksum keyed with the Frontend account key
        KDC->>KDC: Verify PA-FOR-USER checksum, build the user's PAC,<br/>check the user is not NOT_DELEGATED or protected
        KDC-->>Frontend: TGS-REP ticket to Frontend in the user's name<br/>forwardable flag set because protocol transition is allowed
    end

    rect rgb(240, 245, 250)
        Note over Frontend,KDC: S4U2Proxy - delegation to an allowlisted SPN
        Frontend->>KDC: TGS-REQ sname=MSSQLSvc/db01.realm.example<br/>own TGT + evidence ticket in additional-tickets
        KDC->>KDC: Evidence ticket forwardable? Yes<br/>Requested SPN on msDS-AllowedToDelegateTo? Yes
        KDC->>KDC: Copy the user's PAC, record the chain<br/>in S4U_DELEGATION_INFO
        KDC-->>Frontend: TGS-REP ticket for MSSQLSvc/db01 with cname=user<br/>encrypted with the Backend account key
    end

    Frontend->>Backend: AP-REQ service ticket + authenticator
    Backend->>Backend: Decrypt with own key, validate authenticator,<br/>authorize from the user's PAC
    Backend-->>Frontend: Data returned for the impersonated user
    Frontend-->>Client: Application response
    Client-->>User: Page rendered with the user's own back-end access

    alt Target SPN not on msDS-AllowedToDelegateTo
        Frontend->>KDC: S4U2Proxy TGS-REQ sname=cifs/fileserver.realm.example
        KDC->>KDC: SPN missing from the allowlist
        KDC-->>Frontend: KRB-ERROR KDC_ERR_BADOPTION
        Frontend-->>Client: Back-end call fails - delegation not permitted
    end

    alt Evidence ticket is not forwardable
        Note right of KDC: Protocol transition disabled,<br/>so S4U2Self returned a non-forwardable ticket
        Frontend->>KDC: S4U2Proxy TGS-REQ with that ticket
        KDC-->>Frontend: KRB-ERROR KDC_ERR_BADOPTION
    end

    alt Protocol transition disabled - Kerberos only mode
        Client->>Frontend: SPNEGO AP-REQ, real Kerberos authentication
        Frontend->>Frontend: Use the user's forwardable service ticket<br/>as the evidence ticket, no S4U2Self needed
        Frontend->>KDC: S4U2Proxy TGS-REQ with that evidence ticket
        KDC-->>Frontend: TGS-REP ticket for the allowlisted SPN
    end

    alt User is sensitive or in Protected Users
        Frontend->>KDC: S4U2Self TGS-REQ naming the protected user
        KDC-->>Frontend: Non-forwardable ticket, or KRB-ERROR<br/>delegation refused for this account
        Frontend-->>Client: Identity established but no delegation possible
    end
```

Notes

- Both S4U calls are ordinary **TGS exchanges**; only the padata and the
  `additional-tickets` field distinguish them. See
  [TGS Exchange](../tgs-exchange/README.md).
- The `PA-FOR-USER` checksum is keyed with the front end's own long-term key, so
  only that account can request tickets naming other users — the trust boundary
  is the service account secret.
- The ticket that reaches the back end is indistinguishable from a normal user
  ticket apart from `S4U_DELEGATION_INFO` in the PAC; back-end authorization is
  unchanged.
- In *Kerberos only* mode the front end never uses S4U2Self for delegation — the
  user must have authenticated with Kerberos so a real forwardable service ticket
  exists to use as evidence.
