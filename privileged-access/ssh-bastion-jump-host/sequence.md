# SSH Bastion / Jump Host — Sequence Diagram

Happy path first (authenticate to CA, sign short-lived cert, jump through the bastion to
the target), then expired-certificate, principal-mismatch, and the discouraged standing-key
alternates, plus optional host-certificate verification.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Cli as Client
    participant CA as SSH CA
    participant Bas as Bastion
    participant Tgt as Target

    User->>Cli: Request access to target (principal = account)
    Cli->>CA: Authenticate (SSO / OIDC + MFA), submit public key
    CA->>CA: Verify identity + authorization policy
    CA-->>Cli: Sign short-lived user certificate<br/>(principals, TTL, source-address, force-command)

    Cli->>Bas: Connect presenting certificate
    Bas->>Bas: Validate cert against trusted user CA<br/>(signature, not expired, principal allowed)
    Bas-->>Cli: Accepted - ProxyJump established
    Cli->>Tgt: Connect through bastion presenting same certificate
    Tgt->>Tgt: Validate cert against trusted user CA + critical options
    Tgt-->>User: Shell as allowed principal (until cert TTL)

    Note over Cli,Tgt: No authorized_keys entry, no standing private key

    opt Host certificate verification
        Tgt-->>Cli: Present CA-signed host certificate
        Cli->>Cli: Verify host cert via @cert-authority (defeats MITM)
    end

    alt Certificate expired
        Bas--xCli: Reject - certificate not valid / expired
        Cli->>CA: Re-authenticate for a fresh certificate
    end

    alt Principal or critical option mismatch
        Tgt--xCli: Deny - principal not permitted / source-address fails
    end

    alt Legacy standing long-lived key (discouraged)
        Note over Cli,Tgt: authorized_keys + durable private key -<br/>no expiry, revoked only by editing files on every host
    end
```

Notes

- Identity is proven **once** to the CA, everything downstream is stateless certificate
  validation, the bastion and target hold only the CA public key, never per-user secrets.
- The same ephemeral certificate authenticates to both the bastion and the target, its
  short TTL is the revocation mechanism, so there is nothing to clean up when it lapses.
- Host certificates (the `opt` block) make trust mutual, the client verifies the target is
  genuine rather than accepting a first-seen host key blindly.
