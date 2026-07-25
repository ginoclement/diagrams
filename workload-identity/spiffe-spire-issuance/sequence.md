# SPIFFE / SPIRE Issuance — Sequence Diagram

Happy path first: node attestation, then a workload fetching an X.509-SVID. Alternates:
JWT-SVID for a named audience, silent rotation, no matching entry, and node attestation
failure.

```mermaid
sequenceDiagram
    autonumber
    participant WL as Workload
    participant Agent as SPIRE Agent
    participant Srv as SPIRE Server
    participant Att as Attestor / IID service

    Note over Agent,Srv: Node attestation (agent bootstrap)
    Agent->>Att: Obtain node evidence<br/>(AWS IID, GCP identity token, k8s PSAT, TPM quote)
    Att-->>Agent: Signed attestation document
    Agent->>Srv: Attest node with evidence
    Srv->>Srv: Verify evidence via node attestor plugin,<br/>derive node selectors
    Srv-->>Agent: Agent SVID + authorized registration entries

    Note over WL,Agent: Workload attestation (X.509-SVID)
    WL->>Agent: Connect to Workload API socket,<br/>FetchX509SVID
    Agent->>Agent: Read peer PID from UDS,<br/>run workload attestors (unix, docker, k8s)
    Agent->>Agent: Match selectors to registration entries
    alt Selectors match an entry
        Agent->>Srv: CSR for SPIFFE ID<br/>spiffe://example.org/ns/prod/sa/frontend
        Srv->>Srv: Sign leaf cert, SPIFFE ID in URI SAN,<br/>short TTL (default 1h)
        Srv-->>Agent: X.509-SVID + trust bundle
        Agent-->>WL: X.509-SVID (cert + key) + CA bundle
        WL->>WL: Use SVID as client/server cert in mTLS
    else No entry matches selectors
        Agent-->>WL: No identity issued (empty response)
    end

    opt JWT-SVID for a specific audience
        WL->>Agent: FetchJWTSVID aud=spiffe://example.org/ns/prod/sa/backend
        Agent->>Srv: Request signed JWT-SVID
        Srv-->>Agent: JWT-SVID (sub = SPIFFE ID, aud, exp)
        Agent-->>WL: JWT-SVID
    end

    opt Automatic rotation (streaming)
        Srv-->>Agent: Push new SVID before expiry
        Agent-->>WL: Updated X.509-SVID on the open stream
        WL->>WL: Swap cert with no restart
    end

    opt Node attestation fails
        Agent->>Srv: Attest node with invalid / spoofed evidence
        Srv->>Srv: Attestor rejects (unknown node, bad signature)
        Srv-->>Agent: Denied - no agent SVID
    end
```

Notes

- The agent never sees the workload's private key material beyond what it mints; keys are generated per SVID and delivered over the local socket only.
- Selector matching is AND across an entry's selectors: a workload must satisfy every selector on a registration entry to receive that identity.
- Rotation is push-based over a long-lived gRPC stream, so workloads that keep the stream open get new SVIDs without polling.
</content>
