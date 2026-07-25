---
title: "Secrets Broker with Dynamic Credentials — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Broker with Dynamic Credentials — Decision Flowchart

From a workload's request to a leased credential, and the lease lifecycle that ends in
guaranteed revocation. Every terminal either denies or tears the credential down.

```mermaid
flowchart TD
    S(["Workload requests a credential"]) --> AuthN{"Workload identity<br/>verified?"}
    AuthN -->|No| DenyAuth(["Deny: identity not proven"])
    AuthN -->|Yes| Pol{"Entitled to<br/>requested role?"}
    Pol -->|No| DenyPol(["Deny: not entitled"])
    Pol -->|Yes| Mint["Backend creates ephemeral<br/>principal (scoped grants)"]
    Mint --> Lease["Return credential + lease + TTL"]

    Lease --> Use["Workload uses credential<br/>against resource"]
    Use --> Event{"Lease event?"}

    Event -->|"Renew requested"| Cap{"Within max TTL?"}
    Cap -->|Yes| Extend["Extend TTL"] --> Use
    Cap -->|"No - max TTL reached"| Revoke

    Event -->|"TTL elapsed"| Revoke["Backend deletes<br/>ephemeral principal"]
    Event -->|"Operator / breach revoke"| Revoke
    Event -->|"Still valid"| Use

    Revoke --> Dead(["Credential invalid:<br/>zero standing secret"])
```

Notes

- The two gates (`AuthN`, `Pol`) are checked before anything is minted, a denied request
  never touches the backend, so failure leaves no residue.
- The `Cap` diamond enforces the hard ceiling: renewal can extend a lease only up to
  `max TTL`, after which the credential is revoked and the workload must start over at `S`.
- Every non-deny exit converges on `Revoke --> Dead`, so whether by expiry, max-TTL, or
  manual action the credential always ends invalid — there is no path that leaves a standing
  secret behind.
