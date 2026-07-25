# SSH Bastion / Jump Host — Decision Flowchart

From an access request to an authenticated shell, showing the certificate-issuance gate,
the per-hop validation gates, and the discouraged standing-key branch.

```mermaid
flowchart TD
    S(["Operator requests access to target"]) --> AuthN{"Authenticated to CA?<br/>(SSO / OIDC + MFA)"}
    AuthN -->|No| DenyAuth(["Deny: identity not proven"])
    AuthN -->|Yes| Authz{"Authorized for<br/>requested principal?"}
    Authz -->|No| DenyAuthz(["Deny: principal not permitted"])
    Authz -->|Yes| Sign["CA signs short-lived cert<br/>(principals, TTL, source-address)"]

    Sign --> BasChk{"Bastion: cert signature valid<br/>+ not expired?"}
    BasChk -->|No| DenyExp(["Deny: expired / invalid - re-auth to CA"])
    BasChk -->|Yes| Jump["ProxyJump through bastion"]

    Jump --> TgtChk{"Target: principal allowed<br/>+ critical options satisfied?"}
    TgtChk -->|"No - source-address / force-command"| DenyOpt(["Deny: policy option failed"])
    TgtChk -->|Yes| HostChk{"Client verifies<br/>host certificate?"}
    HostChk -->|"No match"| DenyHost(["Deny: possible MITM - host not trusted"])
    HostChk -->|Yes| Shell(["Shell as principal until cert TTL"])

    Shell --> Expire{"Certificate TTL<br/>elapsed?"}
    Expire -->|Yes| Gone(["Access ends: nothing to revoke"])

    Legacy["Standing authorized_keys<br/>+ durable private key"] -.->|"discouraged"| Warn(["Legacy: no expiry, revoke by editing<br/>files on every host"])
```

Notes

- Two validation diamonds (`BasChk`, `TgtChk`) enforce the certificate at both hops; a cert
  that clears the bastion still dies at the target if the principal or a critical option
  fails.
- The `Expire` gate is the revocation model — access ends by the TTL lapsing, so `Gone` has
  nothing to clean up, unlike the standing-key `Legacy` branch.
- `HostChk` makes trust mutual: a failed host-certificate match terminates in `DenyHost`
  rather than a blind trust-on-first-use prompt.
