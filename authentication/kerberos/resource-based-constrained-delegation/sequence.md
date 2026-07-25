---
title: "Resource-Based Constrained Delegation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Resource-Based Constrained Delegation — Sequence Diagram

Happy path: the front end performs S4U2Self, then S4U2Proxy for the back-end SPN,
and the KDC authorizes by reading the **back end's**
`msDS-AllowedToActOnBehalfOfOtherIdentity`. Alternates cover a front end absent
from the allow list, a front end without an SPN, a protected user, and the
abuse path.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant Frontend as Frontend
    participant KDC as KDC
    participant Backend as Backend

    Note over Backend: Resource configuration - Backend object holds<br/>msDS-AllowedToActOnBehalfOfOtherIdentity<br/>with a DACL granting the Frontend account SID

    User->>Client: Sign in to the application
    Client->>Frontend: Credentials, SAML assertion or client certificate
    Frontend->>Frontend: Authenticate by non-Kerberos means,<br/>map to the AD principal user@REALM

    rect rgb(240, 245, 250)
        Note over Frontend,KDC: S4U2Self - obtain the evidence ticket
        Frontend->>KDC: TGS-REQ sname=HTTP/frontend.realm.example<br/>padata PA-FOR-USER naming user@REALM
        KDC->>KDC: Verify the PA-FOR-USER checksum,<br/>build the user's PAC
        KDC-->>Frontend: TGS-REP ticket to Frontend in the user's name<br/>forwardable only if protocol transition is enabled
        Note right of KDC: For RBCD the evidence ticket does NOT<br/>need the forwardable flag
    end

    rect rgb(240, 245, 250)
        Note over Frontend,KDC: S4U2Proxy - resource-side authorization
        Frontend->>KDC: TGS-REQ sname=cifs/backend.realm.example<br/>own TGT + evidence ticket in additional-tickets
        KDC->>Backend: Read msDS-AllowedToActOnBehalfOfOtherIdentity<br/>from the Backend account object
        Backend-->>KDC: Security descriptor with the allowed principal SIDs
        KDC->>KDC: Is the Frontend SID granted in that DACL? Yes<br/>Does Frontend have an SPN? Yes<br/>Is the user delegable? Yes
        KDC->>KDC: Copy the user's PAC, record S4U_DELEGATION_INFO
        KDC-->>Frontend: TGS-REP forwardable ticket for cifs/backend<br/>cname=user, encrypted with the Backend account key
    end

    Frontend->>Backend: AP-REQ service ticket + authenticator
    Backend->>Backend: Decrypt with own key, validate authenticator,<br/>authorize from the user's PAC
    Backend-->>Frontend: Data returned for the impersonated user
    Frontend-->>Client: Application response
    Client-->>User: Page rendered with the user's own back-end access

    alt Frontend not in the resource's allow list
        Frontend->>KDC: S4U2Proxy TGS-REQ for cifs/backend
        KDC->>Backend: Read msDS-AllowedToActOnBehalfOfOtherIdentity
        Backend-->>KDC: Descriptor absent, empty, or Frontend SID not granted
        KDC-->>Frontend: KRB-ERROR KDC_ERR_BADOPTION
        Note right of KDC: No indication of which principals are allowed
    end

    alt Frontend account has no SPN
        Frontend->>KDC: S4U2Proxy TGS-REQ
        KDC-->>Frontend: KRB-ERROR - the requester is not a service principal
    end

    alt User is sensitive or in Protected Users
        Frontend->>KDC: S4U2Self naming the protected user
        KDC-->>Frontend: Delegation refused for this identity
    end

    opt Abuse path - attacker with write access to the Backend object
        Note over Frontend,Backend: Attacker creates a computer account under<br/>MachineAccountQuota and controls its key
        Frontend->>Backend: Write msDS-AllowedToActOnBehalfOfOtherIdentity<br/>granting the attacker-controlled account
        Frontend->>KDC: S4U2Self naming a Domain Admin, then S4U2Proxy for cifs/backend
        KDC-->>Frontend: Forwardable ticket as Domain Admin to the Backend host
        Frontend->>Backend: AP-REQ - local administrator access
    end
```

Notes

- The only structural difference from
  [constrained delegation](../constrained-delegation/README.md) is which object the
  KDC reads at S4U2Proxy time. Everything on the wire is identical.
- The forwardable relaxation noted at step 8 matters: a front end with **no**
  delegation privileges of its own can still complete RBCD, so the attribute write
  in the `opt` block is sufficient on its own to take over the resource.
- The KDC lookup drawn as `KDC->>Backend` is a directory read of the account
  object, not network traffic to the running service.
- Cross-domain RBCD works because the check is made by the KDC of the *resource's*
  domain; see [Cross-Realm](../cross-realm/README.md).
