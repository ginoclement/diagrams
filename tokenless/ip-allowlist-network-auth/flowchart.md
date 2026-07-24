# IP Allowlist / Network-Location Authentication — Decision Flowchart

Decision logic at the gateway and app, including the trap of trusting
client-supplied forwarding headers, and the step-up path that turns a bare
allowlist into layered security.

```mermaid
flowchart TD
    Start(["Packet arrives at gateway"]) --> Src{"Which source address<br/>to evaluate?"}
    Src -->|"transport-level peer IP"| Match{"IP in allowlist?"}
    Src -->|"X-Forwarded-For header"| Trusted{"Header set by an edge<br/>hop we own?"}
    Trusted -->|no| EHdr(["Do not trust:<br/>client-controlled header -<br/>evaluate peer IP instead"])
    Trusted -->|yes| Match
    EHdr --> Match

    Match -->|no| EDrop(["Silent drop / TCP reset<br/>service stays invisible"])
    Match -->|yes| Fwd["Forward to application"]

    Fwd --> Authn{"App requires real<br/>authentication?"}
    Authn -->|"no (location = identity)"| Risk["Access granted to ANYONE<br/>on the trusted network"]
    Risk --> Warn(["Weak: shared NAT, lateral movement,<br/>compromised device inherits access -<br/>see zero-trust-network-access"])
    Authn -->|"yes (recommended)"| Sess{"Valid authenticated<br/>session?"}
    Sess -->|yes| OK(["200: verified user<br/>from allowed network"])
    Sess -->|no| Login["Redirect to IdP"]
    Login --> Cond{"Conditional access:<br/>network location as signal"}
    Cond -->|"on-network"| Base["Standard login<br/>(location lowers risk score)"]
    Cond -->|"off-network"| Step["Step-up: MFA required"]
    Base --> Done{"Authentication succeeded?"}
    Step --> Done
    Done -->|no| EAuth(["Access denied:<br/>authentication failed"])
    Done -->|yes| OK
```
