---
title: "TLS 1.3 Handshake — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8446"
---

# TLS 1.3 Handshake — Sequence Diagram

Happy path: the 1-RTT full handshake. Alternates: HelloRetryRequest, resumption via
PSK / session ticket, 0-RTT early data (with its replay caveat), and a client-certificate
request.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant S as Server
    participant CA as CA (trust anchor)

    %% ----- happy path: 1-RTT full handshake -----
    C->>S: ClientHello (key_share, supported_versions=1.3,<br/>cipher_suites, signature_algorithms)
    Note over C,S: Client sends its (EC)DHE key share in the FIRST flight -<br/>no separate key-exchange round trip like TLS 1.2
    S->>S: Select cipher, pick matching key_share group
    S-->>C: ServerHello (key_share, selected cipher)
    Note over C,S: Both sides derive handshake traffic secrets -<br/>everything below is now ENCRYPTED
    S-->>C: EncryptedExtensions
    S-->>C: Certificate (server chain) [encrypted]
    S-->>C: CertificateVerify (signature over transcript)
    S-->>C: Finished (MAC over transcript)
    C->>CA: Validate server chain to trusted root
    CA-->>C: Chain trusted, not revoked
    C->>C: Verify CertificateVerify + Finished
    C-->>S: Finished
    Note over C,S: Application traffic secrets derived - 1 round trip total
    C->>S: Application data (HTTP request)
    S-->>C: Application data (HTTP response)
    S-->>C: NewSessionTicket (for future resumption)

    %% ----- HelloRetryRequest -----
    alt Client offered no usable key_share group
        C->>S: ClientHello (key_share in group not supported)
        S-->>C: HelloRetryRequest (use group X)
        C->>S: ClientHello (retry with key_share in group X)
        S-->>C: ServerHello ... continue as full handshake
    end

    %% ----- resumption via PSK / session ticket -----
    alt Resumption with pre-shared key
        C->>S: ClientHello (pre_shared_key from prior NewSessionTicket,<br/>key_share for PFS)
        S-->>C: ServerHello (pre_shared_key selected)
        Note over C,S: No Certificate/CertificateVerify - identity is the PSK.<br/>key_share still included so resumption keeps forward secrecy
        S-->>C: EncryptedExtensions + Finished
        C-->>S: Finished
    end

    %% ----- 0-RTT early data -----
    alt 0-RTT early data
        C->>S: ClientHello (pre_shared_key, early_data) + Application data
        Note over C,S: Early data encrypted under the resumption PSK -<br/>saves a round trip
        alt Server accepts early data
            S-->>C: ServerHello (early_data accepted)
            Note over S: REPLAY RISK - early data is not forward-secret and<br/>can be replayed. Only allow idempotent requests, dedupe server-side
        else Server rejects early data
            S-->>C: ServerHello (early_data rejected)
            C->>S: Resend request after handshake completes (1-RTT)
        end
    end

    %% ----- client-certificate request -----
    opt Server requests client authentication
        S-->>C: CertificateRequest (acceptable CAs, sig algs)
        C-->>S: Certificate (client) + CertificateVerify + Finished
        Note over C,S: Full mutual-auth validation is covered in the mTLS diagram
    end
```
