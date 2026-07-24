# Joiner — Onboarding Swimlane Diagram

One lane per actor. The HR event flows left-to-right through IGA into the IdP and apps,
with the manager lane handling the privileged-approval and failure-remediation branches.

```mermaid
flowchart TD
    subgraph HR["HR / Source of Truth"]
        H1["New / future worker record<br/>(dept, job code, start date, type)"]
        H2["Emit worker event to IGA"]
    end

    subgraph IGA["IGA Engine"]
        G1["Create authoritative identity,<br/>uniqueness match"]
        G2["Compute birthright + RBAC<br/>from attributes"]
        G3{"Worker type?"}
        G4["Standard birthright profile"]
        G5["Contingent profile<br/>(narrow set, hard end date)"]
        G6{"Any privileged<br/>birthright?"}
        G7["Orchestrate provisioning<br/>(SCIM to IdP + apps)"]
        G8["Queue + retry on failure<br/>(exponential backoff)"]
        G9["Activate on start date"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Create account<br/>(active=false until start)"]
        I2["Add to birthright groups"]
        I3["Enable account,<br/>send activation link"]
    end

    subgraph App["Downstream App"]
        A1["SCIM POST /Users<br/>+ group membership"]
        A2([App access provisioned])
    end

    subgraph Manager["Manager / Owner"]
        M1{"Approve privileged<br/>birthright?"}
        M2["Handle remediation task<br/>(manual provisioning)"]
    end

    subgraph Worker["Worker"]
        W1["Set password, enroll MFA"]
        W2([Day-one access ready])
    end

    H1 --> H2 --> G1 --> G2 --> G3
    G3 -->|standard / full-time| G4
    G3 -->|contingent| G5
    G4 --> G6
    G5 --> G6
    G6 -->|yes| M1
    G6 -->|no| G7
    M1 -->|approved| G7
    M1 -->|rejected| G7
    G7 --> I1 --> I2
    G7 --> A1
    A1 --> A2
    A1 -.->|failure| G8
    G8 -->|recovered| A1
    G8 -.->|exhausted| M2
    I2 --> G9 --> I3 --> W1 --> W2
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
