# mTLS in a Service Mesh — Sequence Diagram

Happy path: workload attestation, SVID issuance, then a sidecar-to-sidecar mutual-TLS
call with policy enforcement. Alternates: cert rotation, policy deny, and permissive-mode
plaintext.

```mermaid
sequenceDiagram
    autonumber
    participant WA as Workload A
    participant PA as Sidecar A (Envoy)
    participant AG as Node / SPIFFE agent
    participant CP as Control plane + Mesh CA
    participant PB as Sidecar B (Envoy)
    participant WB as Workload B

    %% ----- identity bootstrap via attestation -----
    AG->>CP: Attest workload (k8s SA token, pod UID, node identity)
    CP->>CP: Verify selectors, decide SPIFFE ID
    CP-->>AG: Issue SVID (short-lived X.509) + trust bundle
    AG-->>PA: Deliver SVID + trust bundle (SDS)
    Note over AG,PB: Sidecar B is provisioned the same way with its own SVID

    %% ----- happy path: mutual-TLS call -----
    WA->>PA: Plaintext request over loopback
    PA->>PB: TLS ClientHello (present SVID A)
    PB-->>PA: ServerHello + SVID B + CertificateRequest
    PA->>PA: Verify SVID B against trust bundle
    PA-->>PB: Certificate (SVID A) + CertificateVerify
    PB->>PB: Verify SVID A - extract SPIFFE ID<br/>spiffe://trust-domain/ns/app/sa/svc-a
    Note over PA,PB: Both peers authenticated by SPIFFE ID, not by IP
    PB->>PB: Evaluate authz policy for source SPIFFE ID
    PB-->>WB: Forward plaintext request over loopback
    WB-->>PB: Response
    PB-->>PA: Encrypted response
    PA-->>WA: Plaintext response

    %% ----- certificate rotation -----
    alt SVID nearing expiry
        AG->>CP: Request new SVID before notAfter
        CP-->>AG: Fresh short-lived SVID
        AG-->>PA: Hot-swap cert via SDS
        Note over PA: Rotation is seamless - existing connections keep<br/>their session, new connections use the new cert
    end

    %% ----- policy deny -----
    alt Authorization policy denies the caller
        PA->>PB: mTLS handshake (SVID A valid)
        PB->>PB: Policy: source spiffe id not allowed to call /admin
        PB-->>PA: RBAC deny (403) - connection authenticated but not authorized
    end

    %% ----- permissive-mode migration -----
    alt Mesh in permissive mode (rollout)
        WA->>PB: Plaintext (workload A has no sidecar yet)
        PB-->>WA: Accepted (permissive allows plaintext + mTLS)
        Note over PB: Flip to STRICT once every workload has a sidecar,<br/>then plaintext is rejected
    end
```
