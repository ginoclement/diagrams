# TLS 1.3 Handshake — Decision Flowchart

Server-side decision logic from receiving `ClientHello` to application data, with
explicit terminals for retry, resumption, 0-RTT accept/reject, and abort.

```mermaid
flowchart TD
    Start(["ClientHello received"]) --> Ver{"supported_versions<br/>includes TLS 1.3?"}
    Ver -->|no| Downgrade{"Fall back to<br/>TLS 1.2 allowed?"}
    Downgrade -->|no| Abort1(["Abort: protocol_version<br/>(no shared version)"])
    Downgrade -->|yes| Legacy(["TLS 1.2 handshake<br/>(cert in the clear, 2-RTT)"])

    Ver -->|yes| Cipher{"Shared cipher suite<br/>and sig alg?"}
    Cipher -->|no| Abort2(["Abort: handshake_failure"])
    Cipher -->|yes| KS{"key_share in a<br/>supported group?"}

    KS -->|no| HRR(["Send HelloRetryRequest<br/>(client retries once)"])
    KS -->|yes| PSK{"Valid pre_shared_key<br/>offered?"}

    PSK -->|"no (full handshake)"| Cert["Send Certificate +<br/>CertificateVerify + Finished"]
    Cert --> Fin{"Client Finished<br/>verifies?"}
    Fin -->|no| Abort3(["Abort: decrypt_error"])
    Fin -->|yes| App(["Derive app secrets -<br/>application data flows"])

    PSK -->|"yes (resume)"| Early{"early_data (0-RTT)<br/>offered?"}
    Early -->|no| Resume(["PSK resumption,<br/>1-RTT, no certificate"])
    Resume --> App
    Early -->|yes| Replay{"Request idempotent AND<br/>anti-replay window OK?"}
    Replay -->|no| Reject(["Reject early_data -<br/>client resends at 1-RTT"])
    Reject --> Resume
    Replay -->|yes| Accept(["Accept 0-RTT early data<br/>(not forward-secret)"])
    Accept --> App
```
