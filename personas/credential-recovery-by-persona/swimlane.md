# Credential Recovery by Persona — Swimlane Diagram

A router lane resolves the persona; each persona then flows through its own recovery path.

```mermaid
flowchart TD
    subgraph Router["Persona resolution"]
        P0["Recovery request"]
        P1{"Principal type?"}
    end

    subgraph SelfService["Self-service"]
        C1["Consumer: verify recovery factor,<br/>set new password"]
        W1["Workforce: verify MFA factors<br/>(SSPR)"]
    end

    subgraph Assisted["Helpdesk"]
        H1["Identity proofing<br/>(manager callback, ID check)"]
        H2["Issue one-time code,<br/>force change"]
    end

    subgraph Privileged["PAM Vault"]
        V1["Approval + SoD check"]
        V2["Rotate + check out vaulted secret<br/>(recorded, expiring)"]
    end

    subgraph Machine["CA / Secret mgr"]
        K1["Revoke old key / cert"]
        K2["Re-attest, issue new credential"]
    end

    subgraph Done["Outcome"]
        D1(["Consumer/Workforce access restored"])
        D2(["Privileged secret checked out"])
        D3(["Workload re-credentialed"])
    end

    P0 --> P1
    P1 -->|consumer| C1 --> D1
    P1 -->|workforce| W1 --> D1
    W1 -.->|"factors insufficient"| H1 --> H2 --> D1
    P1 -->|privileged| V1 --> V2 --> D2
    P1 -->|workload| K1 --> K2 --> D3
```

Notes

- The workforce lane is the only one with a **fallback edge** into the Helpdesk lane, and that
  assisted path is where identity proofing must be strongest.
- The Privileged lane never enters self-service: recovery is a vault operation with approval
  and recording, not a password the holder can set.
- The Machine lane has no human step — revoke-and-reissue replaces the whole notion of a reset.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
