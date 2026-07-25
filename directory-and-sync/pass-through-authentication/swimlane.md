# Pass-Through Authentication — Swimlane Diagram

One lane per actor. The password is encrypted in the Cloud lane and only decrypted in the
Agent lane; the Directory lane holds the authoritative verdict.

```mermaid
flowchart TD
    subgraph User
        U1["Enter UPN + password"]
        U2(["Signed in to cloud app"])
        U3["Change password / see error"]
    end

    subgraph Browser
        B1["POST credentials to cloud endpoint"]
        B2["Follow redirect after token issued"]
    end

    subgraph Cloud["Cloud (Entra ID)"]
        CL1["Encrypt password with agent public key"]
        CL2["Queue validation request"]
        CL3{"Agent result?"}
        CL4["Issue token / session"]
        CL5["Smart lockout / block sign-in"]
    end

    subgraph Agent["PTA Agent (on-prem)"]
        A1["Poll queue over outbound 443"]
        A2["Decrypt password with private key"]
        A3["Call LogonUser against DC"]
        A4["Return pass/fail sub-status"]
    end

    subgraph Directory["Directory (AD DC)"]
        D1["Verify password + account state"]
        D2["Return success or specific status"]
    end

    U1 --> B1 --> CL1 --> CL2
    A1 --> CL2
    CL2 --> A2 --> A3 --> D1 --> D2 --> A4
    A4 --> CL3
    CL3 -->|"success"| CL4 --> B2 --> U2
    CL3 -->|"expired / must change"| U3
    CL3 -->|"bad password / locked / disabled"| CL5 --> U3
```

Notes

- The `CL1`/`A2` split is the core of PTA: encryption happens in the cloud, decryption only
  on the on-prem agent, so no reusable secret is stored in the cloud.
- The agent lane always initiates the connection (`A1 --> CL2`), the cloud never reaches
  inbound to the agent.
- Every non-success verdict originates in the Directory lane (`D2`) and is faithfully
  relayed by the agent to the cloud — see [flowchart.md](flowchart.md) for the full tree.
