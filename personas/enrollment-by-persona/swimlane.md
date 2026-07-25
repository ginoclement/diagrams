---
title: "Enrollment by Persona — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Enrollment by Persona — Swimlane Diagram

The initiator differs per persona: IT pushes for workforce, the user pulls for consumer, the
inviter gates for guest. The IdP lane is shared.

```mermaid
flowchart TD
    subgraph Router["Persona"]
        P0{"Who initiates<br/>enrolment?"}
    end

    subgraph IT["IT / MDM"]
        T1["Pre-stage account plus policy"]
        T2["Enrol managed device"]
        T3["Push device certificate<br/>(see SCEP/EST)"]
    end

    subgraph UserLane["User"]
        U1["Register factor on managed device"]
        U2["Self-register (email / social)"]
        U3["Add factor progressively"]
        U4["Redeem invitation"]
    end

    subgraph Inviter["Inviter"]
        V1["Issue single-use,<br/>time-limited invite"]
    end

    subgraph IdP["IdP"]
        I1["Bind factor to attested device"]
        I2["Verify proof of control,<br/>rate-limit"]
        I3["Create minimal scoped identity"]
        I4(["Enrolment complete"])
    end

    P0 -->|workforce| T1 --> T2 --> T3 --> U1 --> I1 --> I4
    P0 -->|consumer| U2 --> I2 --> U3 --> I4
    P0 -->|guest| V1 --> U4 --> I3 --> I4
```

Notes

- Three different lanes start the flow (IT, User, Inviter), which is exactly the persona fork.
- Only the workforce path traverses the IT lane and produces a device-bound factor.
- The guest path cannot begin without the Inviter lane issuing an invitation first.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
