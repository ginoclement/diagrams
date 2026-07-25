---
title: "IdP Reference Architecture — Authentication Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP Reference Architecture — Authentication Decision Flowchart

The decision path a request follows inside the IdP, from edge admission through
credential and factor verification to token issuance. Every gate has an explicit deny
terminal.

```mermaid
flowchart TD
    Start(["Authorize request arrives at Edge"]) --> Edge{"Passes WAF +<br/>rate limit?"}
    Edge -->|No| DenyEdge(["Deny: blocked at edge"])
    Edge -->|Yes| Sess{"Valid IdP<br/>SSO session?"}

    Sess -->|Yes| Policy{"Policy: is step-up<br/>required for this app?"}
    Sess -->|No| Realm{"Home realm =<br/>local or upstream?"}

    Realm -->|Upstream IdP| Fed["Redirect to upstream IdP<br/>(inbound federation)"]
    Fed --> FedOK{"Upstream assertion<br/>valid + mappable?"}
    FedOK -->|No| DenyFed(["Deny: federation failed"])
    FedOK -->|Yes| MkSess["Create IdP SSO session"]

    Realm -->|Local| Cred{"Primary credential<br/>valid?"}
    Cred -->|No| Lock{"Lockout threshold<br/>reached?"}
    Lock -->|Yes| DenyLock(["Deny: account locked"])
    Lock -->|No| DenyCred(["Deny: re-prompt credentials"])
    Cred -->|Yes| Factor{"Second factor<br/>required by policy?"}

    Factor -->|No| MkSess
    Factor -->|Yes| FactorOK{"Factor verified?"}
    FactorOK -->|No| DenyFactor(["Deny: MFA failed"])
    FactorOK -->|Yes| MkSess

    MkSess --> Policy
    Policy -->|"Step-up required"| Factor
    Policy -->|"Satisfied"| Issue["Token / Assertion Service<br/>builds credential"]
    Issue --> Sign{"HSM signs<br/>successfully?"}
    Sign -->|No| DenySign(["Deny: signing error, fail closed"])
    Sign -->|Yes| Log["Write audit event"]
    Log --> Done(["Return signed token / assertion to RP"])
```

Notes

- The edge admission gate runs before any credential is evaluated, so volumetric and
  bot traffic is shed before it can reach the authentication service.
- Seamless SSO still passes through the **policy** gate: an already-authenticated session
  can be forced into step-up MFA for a sensitive application.
- Signing failures **fail closed** — if the HSM cannot sign, no token is emitted rather
  than falling back to an unsigned or weakly signed credential.
- The upstream-federation branch mirrors the local branch but replaces credential/factor
  checks with validation and mapping of the external assertion.
