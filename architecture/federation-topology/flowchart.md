---
title: "Federation Topology — Home-Realm Discovery Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Federation Topology — Home-Realm Discovery Decision Flowchart

How the broker decides which upstream IdP (if any) authenticates a given user, and how
it guards the claim-mapping boundary before issuing a downstream token. Deny terminals
are explicit.

```mermaid
flowchart TD
    Start(["User arrives at broker from a downstream SP"]) --> Sess{"Existing broker<br/>session?"}
    Sess -->|Yes| Issue["Mint downstream token<br/>(broker is issuer)"]
    Sess -->|No| Hint{"IdP hint or<br/>known domain?"}

    Hint -->|"Yes"| Known{"Realm registered<br/>in trust registry?"}
    Hint -->|"No"| Picker["Show IdP picker / prompt for email"]
    Picker --> Known

    Known -->|No| DenyRealm(["Deny: unknown / untrusted realm"])
    Known -->|Yes| Type{"Realm assurance<br/>meets SP requirement?"}

    Type -->|No| DenyAssurance(["Deny: insufficient assurance level"])
    Type -->|Yes| Redirect["Redirect to upstream IdP<br/>(broker acts as SP / client)"]

    Redirect --> Upstream{"Upstream assertion /<br/>token valid + signed?"}
    Upstream -->|No| DenyUpstream(["Deny: upstream authentication failed"])
    Upstream -->|Yes| Map{"Required claims present<br/>and mappable?"}

    Map -->|No| DenyClaims(["Deny: missing / unmappable attributes"])
    Map -->|Yes| Sanitize["Normalize claims:<br/>keep trusted, drop asserted privileges"]
    Sanitize --> MkSess["Create broker session"]
    MkSess --> Issue
    Issue --> Done(["Return brokered credential to SP"])
```

Notes

- The **assurance gate** enforces that a low-assurance social login cannot satisfy an SP
  that demands enterprise-grade MFA, even if the user is genuinely authenticated upstream.
- **Sanitize** is where transitive trust is contained: privilege-bearing claims (group,
  role, entitlement) an upstream is not authoritative for are dropped rather than passed
  through to downstreams.
- Unknown realms fail closed at the registry check — the broker only ever redirects to a
  peer it holds signed metadata for.
- A live broker session skips the entire upstream round-trip, which is what delivers SSO
  across all downstream SPs.
