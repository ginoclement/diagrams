# SPIFFE / SPIRE Issuance — Decision Flowchart

Every gate from node attestation through workload attestation to SVID issuance, with
error terminals drawn explicitly.

```mermaid
flowchart TD
    Start(["Agent starts on a node"]) --> NEv["Gather node evidence<br/>(IID, PSAT, TPM, join token)"]
    NEv --> NGate{"Node evidence valid?<br/>(known plugin, good signature)"}
    NGate -->|No| ErrNode(["Denied: node attestation failed"])
    NGate -->|Yes| Agent["Server issues agent SVID<br/>+ authorized entries"]

    Agent --> WCall{"Workload calls<br/>Workload API?"}
    WCall -->|No| Idle(["Idle - stream held open"])
    WCall -->|Yes| WAtt["Read peer PID from UDS,<br/>run workload attestors"]
    WAtt --> Sel["Produce selectors<br/>(unix uid/gid, docker, k8s pod)"]
    Sel --> Match{"Selectors satisfy a<br/>registration entry?"}
    Match -->|No| ErrNoEntry(["No identity issued<br/>(empty response)"])
    Match -->|Yes| Kind{"X.509-SVID or<br/>JWT-SVID?"}

    Kind -->|X.509| X1["CSR to server for SPIFFE ID"]
    X1 --> X2["Sign leaf: SPIFFE ID in URI SAN,<br/>short TTL"]
    X2 --> Deliver["Deliver SVID + trust bundle<br/>over socket"]

    Kind -->|JWT| J1{"Audience requested?"}
    J1 -->|No| ErrAud(["Reject: JWT-SVID needs an aud"])
    J1 -->|Yes| J2["Sign JWT-SVID<br/>(sub = SPIFFE ID, aud, exp)"]
    J2 --> Deliver

    Deliver --> Use(["Workload authenticates<br/>via mTLS or JWT"])
    Use --> Rot{"Near expiry?"}
    Rot -->|Yes| X1
    Rot -->|No| Use
```

Notes

- The node-attestation gate protects the whole node: a failed agent never receives entries, so no workload on that node can be issued an identity.
- Selector matching is strict AND — a workload that satisfies only some of an entry's selectors is treated as no match.
- Rotation loops back to signing before expiry, keeping SVIDs continuously fresh without a human in the loop.
</content>
