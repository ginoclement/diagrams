# Ephemeral Runner Isolation — Decision Flowchart

Every gate between "a job is queued" and "it executes somewhere": is the context trusted, does a
fork PR have approval, is the runner ephemeral or persistent, and is network egress restricted.
The discouraged combination terminates at an explicit danger node.

```mermaid
flowchart TD
    Start(["Job queued"]) --> Trust{"Trusted context?<br/>(internal branch / member,<br/>not a fork)"}

    Trust -->|"No - fork PR"| Approve{"Maintainer approved<br/>this fork run?"}
    Approve -->|No| Held(["Held: never executes"])
    Approve -->|Yes| NoSecrets["Read-only token,<br/>secrets withheld"]
    NoSecrets --> RunnerType

    Trust -->|Yes| RunnerType{"Runner type?"}

    RunnerType -->|"Ephemeral (single-use)"| Fresh["Provision fresh VM / container / pod,<br/>least-priv token"]
    RunnerType -->|"Persistent self-hosted"| Public{"Public repo accepting<br/>fork PRs?"}

    Public -->|"Yes, and untrusted code runs<br/>with no approval gate"| Danger(["DANGER: untrusted code on a<br/>stateful, networked, secret-bearing host<br/>- discouraged pattern"])
    Public -->|"No - internal / private,<br/>trusted jobs only"| Leak{"Prior job state present?<br/>(caches, tools, creds)"}
    Leak -->|Yes| LeakRisk(["State-leak risk: one compromised<br/>job can poison the next"])
    Leak -->|No| Egress

    Fresh --> Egress{"Network egress<br/>restricted?"}
    Egress -->|No| WideOpen(["Risk: job can reach internal<br/>resources / exfiltrate"])
    Egress -->|Yes| RunIso["Run job isolated<br/>(no prior state, no prod network)"]

    RunIso --> Compromise{"Job compromised and<br/>attempts lateral movement?"}
    Compromise -->|Yes| Contained(["Contained: egress blocked,<br/>runner destroyed after"])
    Compromise -->|No| Collect["Collect artifacts + logs"]
    Collect --> Destroy(["Destroy runner - clean slate"])

    Contained --> Destroy
```

Notes

- The fork-PR branch gates on maintainer approval and strips secrets before any runner is even
  chosen; an unapproved fork PR simply never executes.
- The `Public` decision is the risky combination the topic calls out: a persistent self-hosted
  runner on a public, fork-accepting repo with no approval gate lands directly on the `Danger`
  terminal.
- On persistent runners even in private use, the `Leak` gate marks the state-leak risk that
  ephemeral runners avoid by construction.
- Even a compromised job on an ephemeral runner is contained: egress restriction removes the
  pivot, and destroy-after removes persistence — both paths converge on `Destroy`.
