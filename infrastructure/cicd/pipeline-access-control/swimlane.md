---
title: "Pipeline Access Control — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pipeline Access Control — Swimlane Diagram

One lane per actor/component. Arrows crossing lanes are handoffs: role resolution at the
SCM, run authorization at the CI system, token minting for the pipeline identity, and the
human approval gate.

```mermaid
flowchart TD
    subgraph Contributor
        C1["Push branch / open PR"]
        C2(["See run result"])
    end

    subgraph SCM["VCS / SCM"]
        G1["Resolve actor role<br/>(Read, Triage, Write, Maintain, Admin)"]
        G2{"Fork PR from<br/>outside collaborator?"}
        G3["Enforce branch protection<br/>(protected branches)"]
    end

    subgraph CI["CI/CD system"]
        K1{"Actor allowed to<br/>run this ref?"}
        K2["Trusted run:<br/>secrets available"]
        K3["Fork run:<br/>read-only, no secrets"]
        K4{"Manual deploy<br/>gate on env?"}
        K5["Deploy job"]
    end

    subgraph Tok["Pipeline identity"]
        T1["Mint job token<br/>permissions read-all"]
        T2["Elevate per-job<br/>(contents write, id-token write)"]
        T3["Env-scoped identity<br/>(separate per environment)"]
    end

    subgraph Approver
        A1{"Approve and run<br/>this fork PR?"}
        A2{"Approve prod deploy?<br/>(non-author reviewer)"}
    end

    C1 --> G1 --> G3 --> G2
    G2 -->|"No - trusted member"| K1
    G2 -->|"Yes - untrusted"| A1
    A1 -->|"No"| C2
    A1 -->|"Yes"| K1
    K1 -->|"Denied"| C2
    K1 -->|"Allowed, trusted"| K2 --> T1 --> T2 --> K4
    K1 -->|"Allowed, fork"| K3 --> T1
    K4 -->|"No gate"| C2
    K4 -->|"Gate present"| A2
    A2 -->|"Rejected / self-approval"| C2
    A2 -->|"Approved"| T3 --> K5 --> C2
```

Notes

- The SCM lane owns git-side RBAC (roles, protected branches); the CI lane owns CI-side
  authorization (who may run a ref, deployment gates).
- The pipeline-identity lane makes least privilege visible: `read-all` first (`T1`), then
  per-job elevation (`T2`), then a **separate environment-scoped identity** for prod (`T3`).
- Fork PRs are routed to the read-only, no-secrets branch (`K3`) unless a maintainer approves
  the run at `A1`.
- Both approval diamonds are human gates; `A2` additionally forbids self-approval by the
  change author. Full decision detail is in [flowchart.md](./flowchart.md).
