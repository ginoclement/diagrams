# Federated vs Managed Authentication — Swimlane Diagram

One lane per actor. The Cloud lane's routing decision sends the flow either fully cloud-side
(managed) or out to the on-prem IdP lane (federated).

```mermaid
flowchart TD
    subgraph User
        U1["Enter UPN at cloud app"]
        U2["Enter password / credentials"]
        U3(["Signed in"])
    end

    subgraph Browser
        B1["Submit UPN to cloud"]
        B2["POST password to cloud (managed)"]
        B3["Follow 302 to on-prem IdP (federated)"]
        B4["Auto-POST signed token back to cloud"]
    end

    subgraph Cloud["Cloud (Entra ID)"]
        C1{"Domain setting:<br/>Managed or Federated?"}
        C2["Validate hash (PHS) or via PTA agent"]
        C3["Verify token signature vs trust cert"]
        C4["Issue cloud session"]
    end

    subgraph IdP["On-prem IdP (ADFS, Legacy)"]
        I1["Prompt / integrated auth"]
        I2["Issue signed SAML/JWT token"]
    end

    subgraph Directory["Directory (AD)"]
        D1["Validate credential"]
    end

    U1 --> B1 --> C1
    C1 -->|"Managed"| U2 --> B2 --> C2 --> C4
    C2 -.->|"PTA reaches on-prem"| D1
    C1 -->|"Federated"| B3 --> I1 --> D1
    D1 --> I2 --> B4 --> C3 --> C4
    C4 --> U3
```

Notes

- `C1` is the whole contrast: the managed branch stays in the Cloud lane (the token is
  minted there), the federated branch detours through the IdP lane which mints the token.
- Both branches ultimately consult the Directory lane, but only federation hands the on-prem
  IdP the job of issuing the token the cloud must then trust.
- Federated failure modes (bad signing cert, IdP unreachable) break the `I2 --> B4 --> C3`
  hand-back — see [flowchart.md](flowchart.md).
