# Conditional Access Evaluation — Swimlane

One lane per actor. The Entra lane hosts the policy engine; interrupts cross back to the
User/Browser lanes.

```mermaid
flowchart TD
    subgraph User
        U1["Open cloud app"]
        U2["Complete MFA gesture<br/>(only if challenged)"]
        U3(["Signed in"])
        U4(["Access blocked"])
    end

    subgraph Browser
        B1["Redirect to Entra /authorize"]
        B2["Carry interrupt for MFA<br/>or device remediation"]
        B3["Present token to app"]
    end

    subgraph Entra
        E1["Primary authentication"]
        E2["Gather signals: user/group, app,<br/>client type, location"]
        E3["Evaluate matching CA policies"]
        E4{"All grant<br/>controls met?"}
        E5["Issue id_token + access_token<br/>with session controls"]
        E6["Return interrupt or block"]
    end

    subgraph IdProtection
        R1["Compute sign-in + user risk"]
    end

    subgraph Device
        D1["Report join type + compliance<br/>(PRT / device cert / Intune)"]
    end

    subgraph App
        P1["Accept token, serve resource"]
    end

    U1 --> B1 --> E1 --> E2
    E2 --> R1 --> E3
    E2 --> D1 --> E3
    E3 --> E4
    E4 -->|Yes| E5 --> B3 --> P1 --> U3
    E4 -->|"No - remediable"| E6 --> B2 --> U2 --> E3
    E4 -->|"No - block control"| U4
```

Notes

- Risk (Identity Protection) and device state (Intune / registration) feed the engine as
  parallel signals before policy evaluation.
- The `E4 --> E6 --> ... --> E3` loop is the interrupt-and-re-evaluate cycle for MFA and
  device remediation; a block control skips straight to the deny terminal.
