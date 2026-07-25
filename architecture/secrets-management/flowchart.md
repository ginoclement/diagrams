---
title: "Secrets Management — Access Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management — Access Decision Flowchart

The store's decision path for a secret request: seal state, caller authentication, policy
authorization, then dynamic issuance with a lease. Deny terminals are explicit and the
store fails closed when sealed.

```mermaid
flowchart TD
    Start(["Secret request arrives"]) --> Sealed{"Store unsealed?"}
    Sealed -->|No| DenySealed(["Deny: store sealed, no access"])
    Sealed -->|Yes| Authed{"Caller presents a<br/>valid store token?"}

    Authed -->|No| DoAuth{"Auth method verifies<br/>platform identity?"}
    DoAuth -->|No| DenyAuth(["Deny: authentication failed"])
    DoAuth -->|Yes| Mint["Issue scoped token<br/>(policies attached, TTL set)"]
    Mint --> Policy

    Authed -->|Yes| Policy{"Policy permits this token<br/>on the requested path?"}
    Policy -->|No| DenyPolicy(["Deny: not permitted by policy"])
    Policy -->|Yes| Kind{"Secret kind?"}

    Kind -->|"Static KV"| ReadKV["Return stored value"]
    Kind -->|"Dynamic"| Gen{"Backend reachable to<br/>mint ephemeral secret?"}
    Kind -->|"Encrypt / sign"| Transit["Transit engine performs crypto<br/>(key stays in store)"]

    Gen -->|No| DenyGen(["Deny: backend unavailable, fail closed"])
    Gen -->|Yes| Lease["Create secret + register lease (TTL)"]

    ReadKV --> Audit
    Transit --> Audit
    Lease --> Audit["Write audit event"]
    Audit --> Done(["Return secret / result to caller"])

    Lease -.->|"on expiry or revoke"| Revoke(["Ephemeral secret deleted"])
```

Notes

- A **sealed** store is the ultimate fail-closed state: with the master key locked away,
  no request can read anything, even with a valid token.
- Authentication and authorization are separate gates — a valid token still must pass the
  **policy** check for the specific path it is requesting.
- Dynamic issuance registers a **lease**, so every secret has a TTL and an automatic
  revocation path; expiry deletes the ephemeral credential at the target system.
- Encryption-as-a-service returns a result without ever handing out key material, keeping
  keys inside the trust boundary.
