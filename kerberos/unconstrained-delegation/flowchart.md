# Unconstrained Delegation — Decision Flowchart

Delegation only happens when every gate below opens. The diagram doubles as the
hardening checklist: closing any one gate stops TGT forwarding.

```mermaid
flowchart TD
    Start(["User authenticates to the front-end service"]) --> Sens{"User account flagged<br/>account is sensitive and<br/>cannot be delegated?"}
    Sens -->|Yes| NoFwd["KDC issues a TGT without the forwardable flag"] --> NoDeleg(["No delegation - front end acts as itself"])
    Sens -->|No| Prot{"User in the<br/>Protected Users group?"}
    Prot -->|Yes| NoFwd
    Prot -->|No| Fwd["KDC issues a forwardable TGT"]

    Fwd --> Trust{"Front-end account has<br/>TRUSTED_FOR_DELEGATION?"}
    Trust -->|No| NoOk["Service ticket issued without ok-as-delegate"] --> NoDeleg
    Trust -->|Yes| Ok["Service ticket carries ok-as-delegate"]

    Ok --> Policy{"Client policy allows<br/>delegating credentials<br/>to this SPN?"}
    Policy -->|No| NoDeleg
    Policy -->|Yes| ReqFwd["Client requests a TGT with the FORWARDED option"]

    ReqFwd --> Issued{"KDC issues the<br/>forwarded TGT?"}
    Issued -->|"No - KDC_ERR_BADOPTION"| NoDeleg
    Issued -->|Yes| Cred["Client sends KRB-CRED inside the AP-REQ authenticator"]

    Cred --> Cache["Front end stores the forwarded TGT<br/>in its LSA credential cache"]
    Cache --> Any["Front end may request a ticket for ANY SPN as the user"]
    Any --> Life{"Forwarded TGT still<br/>within its lifetime?"}
    Life -->|No| Expired(["KRB_AP_ERR_TKT_EXPIRED on the back-end request"])
    Life -->|Yes| Call["TGS-REQ then AP-REQ to the chosen back end"]
    Call --> Auth{"Back end authorizes<br/>the user's PAC?"}
    Auth -->|No| Denied(["Back end denies - authorization, not authentication"])
    Auth -->|Yes| Done(["Back end serves data as the impersonated user"])

    Cache -.->|"Abuse path"| Harvest["Attacker with code execution on the front end<br/>dumps every cached TGT"]
    Harvest -.-> Coerce["Coerce a domain controller to authenticate<br/>via printer bug or MS-EFSRPC"]
    Coerce -.-> Tier0(["DC TGT captured - domain compromise"])
```

Notes

- The dashed branch is not part of the protocol flow; it shows where the cached
  credential in `Cache` becomes an attack primitive. It is drawn here because the
  cache is a *design* property of this model, not a misconfiguration.
- `Sens` and `Prot` are the only gates that protect a **specific identity**; the
  others protect a specific service. Tier-0 accounts should rely on the identity
  gates, since any newly flagged service would otherwise be able to impersonate them.
- The failure at `Issued` is what an operator actually sees when the sensitive
  flag is set: the client asks for a forwarded TGT and receives
  `KDC_ERR_BADOPTION`.
- Both scoped alternatives —
  [constrained delegation](../constrained-delegation/README.md) and
  [RBCD](../resource-based-constrained-delegation/README.md) — remove the `Any`
  node entirely and replace it with an allowlist check.
