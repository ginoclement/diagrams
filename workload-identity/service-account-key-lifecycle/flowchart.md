# Service-Account Key Lifecycle — Decision Flowchart

The lifecycle as a decision loop, with the rotation-order outage and compromise paths as
explicit terminals.

```mermaid
flowchart TD
    Start(["Need static SA credential"]) --> Fed{"Federation or instance<br/>identity available?"}
    Fed -->|Yes| UseFed(["Use short-lived credential instead<br/>- no static key"])
    Fed -->|No| Create["Create key at IAM<br/>(secret returned once)"]
    Create --> Store["Write to secret manager<br/>with access policy + audit"]
    Store --> Use["Workload reads key,<br/>signs JWT / SigV4"]
    Use --> Valid{"IAM validates<br/>signature?"}
    Valid -->|No| ErrAuth(["401 invalid credentials"])
    Valid -->|Yes| Work(["Authenticated call succeeds"])

    Work --> Trigger{"Rotation trigger?<br/>(schedule, role change, leak)"}
    Trigger -->|No| Work
    Trigger -->|Compromise| Revoke["Disable / delete key now"]
    Revoke --> ResidTTL{"Derived tokens<br/>still within TTL?"}
    ResidTTL -->|Yes| Wait(["Residual access until token exp<br/>- keep TTLs short"])
    ResidTTL -->|No| Done(["Access fully cut off"])

    Trigger -->|Scheduled| New["Create new key"]
    New --> Deploy{"New key deployed<br/>before old deleted?"}
    Deploy -->|No| Outage(["Outage: old key deleted too early"])
    Deploy -->|Yes| Deact["Deactivate old, monitor for use"]
    Deact --> Del["Delete old key"] --> Work
```

Notes

- The first gate pushes callers toward federation or instance identity; a static key is only issued when no attested alternative exists.
- The scheduled-rotation branch enforces make-before-break: the outage terminal is reached precisely when the delete happens before the deploy.
- On compromise, revocation is immediate but not always sufficient — residual tokens live out their TTL, which is why the diagram routes through the `ResidTTL` gate.
</content>
