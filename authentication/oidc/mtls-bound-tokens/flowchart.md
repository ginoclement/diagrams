---
title: "mTLS Client Auth and Certificate-Bound Tokens — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# mTLS Client Auth and Certificate-Bound Tokens — Decision Flowchart

From client authentication method through token binding and the resource-server
proof-of-possession check, with explicit error terminals.

```mermaid
flowchart TD
    S(["Client opens mTLS connection to token endpoint"]) --> Q1{Client-auth method?}
    Q1 -->|tls_client_auth| M1["Validate CA chain,<br/>match registered DN/SAN"]
    Q1 -->|self_signed_tls_client_auth| M2["Match SHA256(cert)<br/>to registered jwks key"]
    Q1 -->|"other (secret / private_key_jwt)"| M3["Not mTLS client auth"]

    M1 --> Q2{Cert valid and matched?}
    M2 --> Q2
    Q2 -->|No| E1(["401 invalid_client"])
    Q2 -->|Yes| Q3{"AS binds tokens?<br/>(metadata flag on)"}
    M3 --> Q3

    Q3 -->|No| T1["Issue plain bearer token"]
    Q3 -->|Yes| BIND["Issue token with<br/>cnf x5t#S256 = thumbprint(cert)"]

    BIND --> USE["Client calls API over mTLS<br/>with same cert, Bearer AT"]
    T1 --> USE
    USE --> Q4{Token carries a cnf<br/>x5t#S256 claim?}
    Q4 -->|"No (plain bearer)"| OK([Serve resource])
    Q4 -->|Yes| Q5{Client cert present<br/>on this connection?}
    Q5 -->|No| E2(["401 invalid_token<br/>missing bound cert"])
    Q5 -->|Yes| Q6{"thumbprint(presented cert)<br/>== cnf x5t#S256?"}
    Q6 -->|No| E3(["401 invalid_token<br/>binding mismatch"])
    Q6 -->|Yes| OK
```
