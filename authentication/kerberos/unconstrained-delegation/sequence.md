---
title: "Unconstrained Delegation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# Unconstrained Delegation — Sequence Diagram

Happy path: the user authenticates to a front-end service that is flagged
`TRUSTED_FOR_DELEGATION`, the client forwards a TGT, and the front end reuses it to
reach an arbitrary back end as the user. Alternates cover the sensitive-account
flag, Protected Users, a front end that is not trusted for delegation, and TGT
expiry.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant KDC as KDC
    participant Frontend as Frontend
    participant Backend as Backend

    User->>Client: Sign in
    Client->>KDC: AS-REQ with pre-authentication
    KDC-->>Client: AS-REP TGT krbtgt/REALM with forwardable flag
    Note right of KDC: forwardable is set because the account is not<br/>NOT_DELEGATED and not in Protected Users

    User->>Client: Open the front-end application
    Client->>KDC: TGS-REQ sname=HTTP/frontend.realm.example
    KDC->>KDC: Frontend account has TRUSTED_FOR_DELEGATION<br/>set ok-as-delegate in the service ticket
    KDC-->>Client: TGS-REP service ticket with ok-as-delegate<br/>encrypted with the Frontend account key

    Client->>Client: ok-as-delegate seen and local policy allows<br/>credential delegation to this SPN
    Client->>KDC: TGS-REQ for krbtgt/REALM with the FORWARDED option
    KDC-->>Client: TGS-REP TGT with forwarded flag<br/>plus a fresh TGT session key

    Client->>Client: Package forwarded TGT and session key into KRB-CRED,<br/>encrypt with the AP-REQ subsession key
    Client->>Frontend: AP-REQ service ticket + authenticator + KRB-CRED
    Frontend->>Frontend: Decrypt ticket with own key, read PAC,<br/>extract forwarded TGT into the LSA credential cache
    Frontend-->>Client: AP-REP mutual authentication

    Note over Frontend,KDC: The front end now holds a full user TGT<br/>and may request a ticket for ANY SPN

    Frontend->>KDC: TGS-REQ sname=cifs/backend.realm.example<br/>using the user's forwarded TGT
    KDC-->>Frontend: TGS-REP service ticket for cifs/backend<br/>issued to the USER principal
    Frontend->>Backend: AP-REQ as the user
    Backend->>Backend: Validate ticket and authenticator,<br/>authorize from the user's PAC
    Backend-->>Frontend: Data returned for the impersonated user
    Frontend-->>User: Application response built with the user's own access

    alt User account is sensitive and cannot be delegated
        Note right of KDC: NOT_DELEGATED flag set on the account
        KDC-->>Client: AS-REP TGT without the forwardable flag
        Client->>KDC: TGS-REQ for krbtgt/REALM with FORWARDED option
        KDC-->>Client: KRB-ERROR KDC_ERR_BADOPTION
        Client->>Frontend: AP-REQ with no KRB-CRED
        Frontend->>Backend: Call proceeds as the Frontend service account only
    end

    alt User is a member of Protected Users
        KDC-->>Client: AS-REP TGT not forwardable, no RC4 or DES,<br/>short lifetime, NTLM disabled
        Note right of Client: Delegation is impossible for this user<br/>regardless of the front-end configuration
    end

    alt Frontend is not trusted for delegation
        KDC-->>Client: TGS-REP service ticket without ok-as-delegate
        Client->>Frontend: AP-REQ with no forwarded credential
        Frontend->>Backend: Anonymous or service-account access only
    end

    opt Forwarded TGT has expired
        Frontend->>KDC: TGS-REQ with the cached forwarded TGT
        KDC-->>Frontend: KRB-ERROR KRB_AP_ERR_TKT_EXPIRED
    end
```

Notes

- Steps 10–11 are the whole risk: after the AP-REQ the front end holds a **TGT**,
  not a scoped ticket. Nothing in the protocol limits which SPN it asks for next,
  and nothing marks the downstream request as delegated.
- The KRB-CRED is encrypted with the AP-REQ subsession key, so it is protected in
  transit — the exposure is at rest, in the front end's LSA cache.
- Coercion attacks abuse exactly this sequence with an attacker-controlled
  `Frontend`: force a domain controller's computer account to authenticate, then
  keep its forwarded TGT. See the security notes in [README.md](./README.md).
- The `ok-as-delegate` flag is advisory to the client; a hostile client can forward
  a TGT to a service that never asked for one, and a hostile service can simply
  keep whatever it receives.
