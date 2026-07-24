# Resource-Based Constrained Delegation — Decision Flowchart

The protocol decisions, then the abuse path that the same decisions permit when
the resource's attribute is writable by the wrong principal.

```mermaid
flowchart TD
    Start(["Front end must call the back end as the user"]) --> Self["S4U2Self with PA-FOR-USER<br/>naming the user"]
    Self --> Sens{"User sensitive or<br/>in Protected Users?"}
    Sens -->|Yes| Refuse(["Delegation refused for this identity"])
    Sens -->|No| Evid["Evidence ticket issued to the front end<br/>forwardable flag not required for RBCD"]

    Evid --> Proxy["S4U2Proxy TGS-REQ for the back-end SPN<br/>evidence ticket in additional-tickets"]
    Proxy --> Read["KDC reads msDS-AllowedToActOnBehalfOfOtherIdentity<br/>on the back-end account object"]

    Read --> Present{"Descriptor present<br/>and parsable?"}
    Present -->|No| Bad(["KDC_ERR_BADOPTION"])
    Present -->|Yes| Granted{"Front-end SID granted<br/>in the DACL?"}
    Granted -->|No| Bad
    Granted -->|Yes| Spn{"Front-end account<br/>has an SPN?"}
    Spn -->|No| Bad
    Spn -->|Yes| Issue["Issue forwardable ticket for the back-end SPN,<br/>cname=user, PAC copied, S4U_DELEGATION_INFO added"]

    Issue --> Ap["AP-REQ to the back end"] --> Valid{"Ticket decrypts and<br/>authenticator is fresh?"}
    Valid -->|No| ApErr(["KRB_AP_ERR_MODIFIED or skew error"])
    Valid -->|Yes| Authz{"Back end authorizes<br/>the user's PAC?"}
    Authz -->|No| Denied(["Access denied by the application"])
    Authz -->|Yes| Done(["Back end serves data as the user"])

    Write(["Attacker holds GenericWrite or WriteDacl<br/>over the back-end computer object"]) -.-> Mkacct["Create a computer account<br/>under MachineAccountQuota - SPNs included"]
    Mkacct -.-> SetAttr["Set the resource descriptor to allow<br/>the attacker-controlled account"]
    SetAttr -.-> Read
    Issue -.->|"attacker named a Domain Admin at S4U2Self"| Pwn(["Ticket for HOST or CIFS on the target<br/>as Domain Admin - local admin access"])
```

Notes

- The dashed subgraph is the RBCD attack path. It reuses the *same* legitimate
  decision nodes — nothing is bypassed. The only precondition is write access to
  one attribute on the target object.
- `Sens` is the single node that blocks step 5 of that path: a Domain Admin marked
  *sensitive and cannot be delegated*, or placed in Protected Users, cannot be
  named at S4U2Self.
- `MachineAccountQuota = 0` removes the `Mkacct` node for ordinary users, forcing
  an attacker to compromise an existing account that already has an SPN.
- `Present` and `Granted` fail identically from the client's point of view —
  `KDC_ERR_BADOPTION` with no detail — which makes directory-side auditing of the
  attribute the only reliable troubleshooting and detection signal.
