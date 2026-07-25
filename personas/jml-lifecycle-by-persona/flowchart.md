# JML Lifecycle by Persona — Decision Flowchart

Route on **who masters the identity**, then follow each mastering model to its guaranteed end
state. Terminal nodes point to the base transition diagrams.

```mermaid
flowchart TD
    Start(["New identity to govern"]) --> Master{"Who masters<br/>the identity?"}

    Master -->|HR| Emp{"Event type?"}
    Emp -->|hire| EJ(["Joiner: create plus birthright<br/>see joiner-onboarding"])
    Emp -->|change| EM(["Mover: re-evaluate plus SoD<br/>see mover-role-change"])
    Emp -->|termination| EL(["Leaver: disable, revoke,<br/>deprovision, retain, delete"])

    Master -->|Sponsor| Con["Create with hard expiry"]
    Con --> Ext{"Sponsor re-attests<br/>before expiry?"}
    Ext -->|Yes| ConX(["Extend end date"]) --> Ext
    Ext -->|No| ConE(["Auto-disable at deadline<br/>then deprovision"])

    Master -->|External org| Par["Grant boundary-scoped access<br/>(no local credential)"]
    Par --> Trust{"Partner trust signal<br/>still valid?"}
    Trust -->|Yes| ParL(["Keep boundary access"])
    Trust -->|No| ParR(["Revoke shell plus federation link"])

    Master -->|Owner| WL["Register client, bind scopes"]
    WL --> WLd{"Owner action?"}
    WLd -->|rotate| WLr(["Rotate secret / cert<br/>(not a mover)"]) --> WLd
    WLd -->|decommission| WLx(["Revoke credentials, remove client<br/>(not a leaver)"])
    WLd -->|attest still needed| WL
```

Notes

- The root diamond is the entire thesis of this diagram: lifecycle forks on **mastering
  authority**, and each authority guarantees an end state differently — HR event, hard
  expiry, lost trust signal, or owner decommission.
- Contractor and Workload both loop (extend / rotate) but each loop is bounded by a control
  (re-attestation, decommission) so no identity becomes permanent by default.
- Partner has no local termination node at all — access simply stops tracking a trust signal
  it no longer receives.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
