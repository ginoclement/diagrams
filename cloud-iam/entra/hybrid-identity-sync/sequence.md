# Hybrid Identity Sync — Sequence Diagram

Happy path first (Password Hash Sync: Entra validates the password itself), then alternates:
Pass-Through Authentication, AD FS Federation (legacy), and Seamless SSO.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Entra as Microsoft Entra ID
    participant Connect as Entra Connect
    participant Agent as PTA agent / AD FS
    participant AD as On-prem AD

    Note over Connect,AD: Ongoing sync, PHS pushes a hash of the AD hash to Entra
    Connect->>AD: Read user objects (and password hashes for PHS)
    Connect->>Entra: Sync users, PHS: hash-of-hash

    User->>Entra: Sign in (username + password)
    Entra->>Entra: PHS: validate password against synced hash
    Entra-->>User: Tokens issued (on-prem not contacted)

    alt Pass-Through Authentication
        User->>Entra: Sign in (username + password)
        Entra->>Agent: Place encrypted credential in agent queue
        Agent->>AD: Validate password (Win32 LogonUser)
        AD-->>Agent: Valid
        Agent-->>Entra: Success (outbound only)
        Entra-->>User: Tokens issued
    end

    alt AD FS Federation (legacy)
        User->>Entra: Sign in, realm is federated
        Entra-->>User: Redirect to AD FS
        User->>Agent: Authenticate at AD FS
        Agent->>AD: Validate credentials
        AD-->>Agent: Valid
        Agent-->>User: Signed SAML/WS-Fed token
        User->>Entra: Present token, Entra trusts AD FS
        Entra-->>User: Tokens issued
    end

    opt Seamless SSO (on PHS or PTA)
        User->>Entra: Access from domain-joined device
        Entra-->>User: 401 Negotiate (Kerberos)
        User->>AD: Get Kerberos ticket for AZUREADSSOACC
        AD-->>User: Ticket
        User->>Entra: Present Kerberos ticket, silent sign-in
        Entra-->>User: Tokens issued (no password prompt)
    end

    alt On-prem / agent outage
        Note over Entra,AD: PHS keeps working, PTA and Federation fail<br/>because AD cannot be reached to validate.
    end
```

Notes

- PHS validates in the cloud, so an on-prem outage does not block sign-in, PTA and Federation both
  depend on on-prem reachability.
- PTA agents connect outbound only and never store password material in the cloud.
- AD FS issues the token itself, token-signing key theft forges any user (Golden SAML), which is
  why it is now discouraged.
