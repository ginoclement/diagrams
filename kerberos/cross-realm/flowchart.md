---
title: "Cross-Realm Authentication — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cross-Realm Authentication — Decision Flowchart

The referral loop: the client keeps exchanging TGTs until it reaches the KDC that
owns the target SPN, or until a KDC refuses. Every deny path terminates explicitly.

```mermaid
flowchart TD
    Start(["Client needs a ticket for an SPN<br/>in a foreign realm"]) --> HaveTGT{"Valid TGT for the<br/>current realm in cache?"}
    HaveTGT -->|No| AS["Run AS exchange in the home realm"] --> Req
    HaveTGT -->|Yes| Req["TGS-REQ to the current KDC<br/>with sname = target SPN"]

    Req --> Local{"Is the SPN in<br/>this KDC's realm?"}
    Local -->|No| Path{"Trust path to the<br/>target realm known and<br/>transitivity allowed?"}
    Path -->|No| ErrPath(["KDC_ERR_PATH_NOT_ACCEPTED"])
    Path -->|Yes| Referral["Issue referral TGT<br/>krbtgt/NEXT-REALM@THIS-REALM<br/>encrypted with the inter-realm key"]

    Referral --> Decrypt{"Next KDC can decrypt<br/>the referral TGT?"}
    Decrypt -->|"No - trust key mismatch"| ErrKey(["KRB_AP_ERR_MODIFIED"])
    Decrypt -->|Yes| Transit["Append the previous realm<br/>to the transited field"] --> Hop["Client sends TGS-REQ to the next KDC"] --> Local

    Local -->|Yes| Skew{"Timestamps within<br/>the allowed skew?"}
    Skew -->|No| ErrSkew(["KRB_AP_ERR_SKEW"])
    Skew -->|Yes| Spn{"SPN registered and<br/>unique in this realm?"}
    Spn -->|No| ErrSpn(["KDC_ERR_S_PRINCIPAL_UNKNOWN"])
    Spn -->|Yes| TransitOK{"Transited realm path<br/>acceptable to local policy?"}
    TransitOK -->|No| ErrPath
    TransitOK -->|Yes| Sid["Apply SID filtering to the PAC,<br/>re-sign with the local krbtgt key"]

    Sid --> Sel{"Selective authentication<br/>enforced on this trust?"}
    Sel -->|No| Etype
    Sel -->|Yes| Allowed{"Principal has<br/>allowed-to-authenticate<br/>on the target object?"}
    Allowed -->|No| ErrPolicy(["KDC_ERR_POLICY - authentication firewall"])
    Allowed -->|Yes| Etype{"Etype supported by<br/>the service account?"}

    Etype -->|No| ErrEtype(["KDC_ERR_ETYPE_NOSUPP"])
    Etype -->|Yes| Issue["Issue service ticket encrypted with<br/>the service account long-term key"]
    Issue --> Ap["Client sends AP-REQ to the service"] --> ApOK{"Ticket decrypts, authenticator<br/>fresh and not replayed?"}
    ApOK -->|No| ErrAp(["Service rejects: AP error"])
    ApOK -->|Yes| Done(["Authenticated - PAC used for authorization"])
```

Notes

- The loop `Local --> Path --> Referral --> Hop --> Local` is the referral chain.
  Each iteration is one realm hop; clients enforce a maximum hop count to avoid
  chasing a misconfigured trust graph forever.
- `KDC_ERR_PATH_NOT_ACCEPTED` appears twice on purpose: it is returned both by the
  *referring* KDC when no path exists and by the *target* KDC when the path taken
  is not acceptable to its transit policy.
- SID filtering runs before the authorization decision, so filtered SIDs simply
  do not appear in the PAC the service later evaluates.
- The final AP-REQ leg is the ordinary [AP Exchange](../ap-exchange/README.md);
  nothing about it is cross-realm specific once the ticket is issued.
