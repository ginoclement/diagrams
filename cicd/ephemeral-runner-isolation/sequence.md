---
title: "Ephemeral Runner Isolation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Ephemeral Runner Isolation — Sequence Diagram

Happy path first (a trusted job runs on a fresh, isolated, single-use runner that is destroyed
after), then alternates: a first-time contributor's fork PR held for maintainer approval, a
persistent runner reused (state-leak risk), a compromised job's lateral-movement attempt
contained by isolation, and the discouraged public-repo self-hosted danger branch.

```mermaid
sequenceDiagram
    autonumber
    participant Job as Job
    participant CI as CI control plane
    actor Maint as Maintainer
    participant Prov as Provisioner
    participant Run as Ephemeral runner
    participant Int as Internal resources

    Job->>CI: Job queued (trusted internal branch)
    CI->>Prov: Request a runner for this job
    Prov->>Run: Provision fresh VM / container / pod
    Run->>Run: No prior state, least-priv token,<br/>egress restricted, no prod network
    CI->>Run: Dispatch job
    Run->>Run: Build / test in isolation
    Run-->>CI: Upload artifacts and logs
    Prov->>Run: Destroy runner (single-use)
    CI-->>Job: Completed on a clean, disposed environment

    alt Fork PR from first-time contributor
        Job->>CI: Fork PR workflow queued (untrusted)
        CI->>CI: Hold - outside contributor,<br/>secrets withheld, token read-only
        CI-->>Maint: Await "approve and run"
        alt Maintainer approves
            Maint->>CI: Approve run
            CI->>Prov: Provision ephemeral runner (no secrets)
            Prov->>Run: Fresh, isolated, read-only token
            Run-->>CI: Build/test only, then destroyed
        else Not approved
            CI-->>Job: Held - never executes
        end
    end

    alt Persistent self-hosted runner reused (discouraged)
        CI->>CI: Persistent runner: prior caches,<br/>tools, credentials still present
        Note over CI,Int: State from a previous job is visible,<br/>a poisoned cache or planted tool<br/>carries into this job.
        CI-->>Job: Runs with inherited state (risk)
    end

    alt Compromised job attempts lateral movement
        Run->>Int: Try to reach internal registry / secret store
        Int-->>Run: Blocked by egress restriction
        Prov->>Run: Destroy runner - nothing persists
        Note over Run,Int: Ephemerality + network isolation<br/>contain the blast radius.
    end

    alt Persistent self-hosted on PUBLIC repo, no approval gate (DANGER)
        Job->>CI: Fork PR runs automatically on self-hosted host
        CI->>Run: Attacker-chosen code executes on stateful,<br/>networked runner with secrets
        Run->>Int: Exfiltrate secrets / pivot / persist
        Note over Job,Int: Discouraged pattern - never run untrusted<br/>fork code on a persistent self-hosted runner.
    end
```

Notes

- The happy path's security is the last two steps: least-privilege token plus destroy-after,
  so nothing this job touched survives it.
- Fork PRs from outside contributors never auto-run and never receive secrets, a maintainer's
  "approve and run" is the gate, and even then the runner is ephemeral and secret-free.
- The persistent-runner alternate shows the state-leak mechanism: whatever a prior job left —
  cache, tool, credential, malware — is visible to the next job.
- The final `DANGER` branch is the explicitly discouraged pattern, the diagram depicts the
  exfiltration/pivot it enables so the risk is unmistakable.
