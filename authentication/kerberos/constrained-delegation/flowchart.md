---
title: "Constrained Delegation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Constrained Delegation — Decision Flowchart

Two KDC decisions decide everything: whether S4U2Self may return a **forwardable**
ticket, and whether the requested SPN is on the front end's allowlist.

```mermaid
flowchart TD
    Start(["Front end needs to call a back end as the user"]) --> How{"How did the user<br/>authenticate?"}

    How -->|"Kerberos - SPNEGO"| Evid["Use the user's forwardable service ticket<br/>as the evidence ticket"]
    How -->|"Non-Kerberos - forms, SAML, certificate"| Trans{"TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION<br/>set on the front-end account?"}

    Trans -->|No| SelfOnly["S4U2Self returns a non-forwardable ticket"] --> IdOnly(["Identity and PAC available,<br/>delegation not possible"])
    Trans -->|Yes| Self["S4U2Self with PA-FOR-USER<br/>checksum keyed with the front-end key"]

    Self --> Sens{"Named user sensitive<br/>or in Protected Users?"}
    Sens -->|Yes| Refuse(["KDC refuses to delegate this identity"])
    Sens -->|No| Fwd["KDC issues a forwardable ticket<br/>to the front end in the user's name"]

    Fwd --> Evid
    Evid --> Proxy["S4U2Proxy TGS-REQ - own TGT plus<br/>evidence ticket in additional-tickets"]

    Proxy --> FwdChk{"Evidence ticket has<br/>the forwardable flag?"}
    FwdChk -->|No| Bad(["KDC_ERR_BADOPTION"])
    FwdChk -->|Yes| List{"Requested SPN on<br/>msDS-AllowedToDelegateTo?"}
    List -->|No| Bad
    List -->|Yes| Domain{"Target SPN in the<br/>front end's own domain?"}
    Domain -->|"No - classic KCD does not follow referrals"| Rbcd(["Use resource-based constrained delegation instead"])
    Domain -->|Yes| Issue["Issue ticket for the target SPN, cname=user,<br/>PAC copied, S4U_DELEGATION_INFO added"]

    Issue --> Ap["AP-REQ to the back end"] --> Valid{"Ticket and authenticator<br/>valid at the back end?"}
    Valid -->|No| ApErr(["AP error - clock skew, wrong SPN key, replay"])
    Valid -->|Yes| Authz{"Back end authorizes<br/>the user's PAC?"}
    Authz -->|No| Denied(["Access denied by the application"])
    Authz -->|Yes| Done(["Back end serves data as the user"])
```

Notes

- `Trans` is the protocol-transition switch. With it **off**, the only route to a
  usable evidence ticket is a genuine Kerberos logon by the user, which is why the
  *Use Kerberos only* mode is materially safer.
- `List` is per-SPN. Adding an SPN to the allowlist is a delegation-scope change
  and should be treated as a privileged operation; in AD it requires
  `SeEnableDelegationPrivilege`.
- `Sens` is where *Account is sensitive and cannot be delegated* and Protected
  Users membership protect tier-0 identities against a compromised front end.
- Everything downstream of `Issue` is a plain [AP Exchange](../ap-exchange/README.md);
  the back end applies its normal authorization and can still deny.
