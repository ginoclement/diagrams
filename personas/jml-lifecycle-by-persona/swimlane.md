# JML Lifecycle by Persona — Swimlane Diagram

The `Source` lane holds four different mastering authorities. IGA is the shared hub; the end
state in the App lane differs per persona.

```mermaid
flowchart TD
    subgraph Source["Source of Truth (per persona)"]
        S1["HR: hire / change / terminate"]
        S2["Sponsor: create with end date"]
        S3["External org: invite / offboard"]
        S4["Owner: register / decommission"]
    end

    subgraph IGA["IGA Engine"]
        G0{"Which mastering model?"}
        G1["Employee: attribute-driven<br/>joiner / mover / leaver"]
        G2["Contractor: provision plus<br/>hard-expiry disable"]
        G3["Partner: boundary grant,<br/>no local mastering"]
        G4["Workload: bind scopes,<br/>rotate, decommission"]
        G5["Reconciliation sweep<br/>(target vs actual)"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Create / update / disable account"]
        I2["External-user shell (no credential)"]
        I3["Client identity plus rotating secret/cert"]
    end

    subgraph App["Downstream App"]
        A1(["Access matches policy<br/>then delete after retention"])
        A2(["Access expires at hard deadline"])
        A3(["Boundary access revoked on offboard"])
        A4(["Entitlements removed at decommission"])
    end

    S1 --> G0
    S2 --> G0
    S3 --> G0
    S4 --> G0
    G0 -->|employee| G1 --> I1 --> A1
    G0 -->|contractor| G2 --> I1 --> A2
    G0 -->|partner| G3 --> I2 --> A3
    G0 -->|workload| G4 --> I3 --> A4
    G5 -.-> I1
    G5 -.-> App
```

Notes

- Four sources, one IGA hub, four distinct terminal semantics — the fork is entirely in the
  source and the end state, not in the orchestration in between.
- The Partner path never mints a local credential (`I2` is a shell), which is why its
  offboarding is a **revoke of a link**, not a directory termination.
- The reconciliation sweep (`G5`) dashes into both the account and app lanes for every persona.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
