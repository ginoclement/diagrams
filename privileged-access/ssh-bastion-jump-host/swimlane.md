# SSH Bastion / Jump Host — Swimlane Diagram

One lane per actor. The CA lane mints the ephemeral certificate; the Bastion and Target
lanes only validate it against the trusted CA — neither holds a per-user secret.

```mermaid
flowchart TD
    subgraph User
        U1["Request access to target"]
        U2(["Shell as allowed principal"])
        U3(["Access denied"])
    end

    subgraph Client
        C1["Authenticate to CA, submit public key"]
        C2["Present certificate to bastion"]
        C3["ProxyJump to target"]
        C4["Verify host certificate"]
    end

    subgraph CA["SSH CA"]
        A1["Verify identity (SSO + MFA)"]
        A2{"Authorized for<br/>requested principal?"}
        A3["Sign short-lived cert<br/>(principals, TTL, options)"]
    end

    subgraph Bastion
        B1{"Cert valid + not expired<br/>+ principal allowed?"}
        B2["Establish ProxyJump"]
    end

    subgraph Target
        T1{"Cert valid + critical<br/>options satisfied?"}
        T2["Open shell session"]
    end

    U1 --> C1 --> A1 --> A2
    A2 -->|"No"| U3
    A2 -->|"Yes"| A3 --> C2 --> B1
    B1 -->|"No - expired / bad"| U3
    B1 -->|"Yes"| B2 --> C3 --> T1
    T1 -->|"No - principal / source-address"| U3
    T1 -->|"Yes"| T2 --> U2
    T2 --> C4
```

Notes

- The only place a durable secret lives is the **CA** lane (`A3` signing key), the Bastion
  and Target lanes carry only the CA public key and make stateless yes/no decisions.
- Two independent validations (`B1` at the bastion, `T1` at the target) mean the certificate
  is checked at every hop, a cert good for the bastion still fails at the target if the
  principal is wrong.
- `C4` (host-cert verification) closes the loop so trust is mutual rather than the client
  trusting whatever host answers.
