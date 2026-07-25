# Pass-Through Authentication — Sequence Diagram

Happy path first (cloud encrypts, on-prem agent validates against the DC), then wrong
password, password expired, locked/disabled account, no agent available, and Seamless SSO.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Cloud as Cloud (Entra ID)
    participant Agent as PTA Agent
    participant Dir as Directory (AD DC)

    User->>Browser: Enter UPN + password at cloud sign-in
    Browser->>Cloud: POST credentials to auth endpoint
    Cloud->>Cloud: Encrypt password with agent public key,<br/>place on validation queue
    Agent->>Cloud: Persistent outbound channel polls queue (443)
    Cloud-->>Agent: Encrypted validation request
    Agent->>Agent: Decrypt password with private key
    Agent->>Dir: LogonUser (Kerberos AS-REQ to DC)
    Dir-->>Agent: Success (account enabled, in policy)
    Agent-->>Cloud: Result = success (no hash returned)
    Cloud->>Cloud: Issue token / session cookie
    Cloud-->>Browser: 302 signed in
    Browser-->>User: Cloud app loads

    opt Seamless SSO (domain-joined device)
        Note over Browser,Cloud: Kerberos ticket for the cloud SPN
        Browser->>Cloud: Kerberos ticket, no password prompt
        Cloud-->>Browser: Token issued silently
    end

    alt Wrong password
        Agent->>Dir: LogonUser with bad password
        Dir-->>Agent: STATUS_LOGON_FAILURE
        Agent-->>Cloud: Result = invalid credentials
        Cloud->>Cloud: Increment smart-lockout counter
        Cloud-->>Browser: Incorrect username or password
    end

    alt Password expired or must change
        Dir-->>Agent: STATUS_PASSWORD_EXPIRED / MUST_CHANGE
        Agent-->>Cloud: Result = password change required
        Cloud-->>Browser: Redirect to change-password flow
    end

    alt Account locked, disabled, or outside logon hours
        Dir-->>Agent: STATUS_ACCOUNT_LOCKED_OUT / DISABLED
        Agent-->>Cloud: Result = account not permitted
        Cloud-->>Browser: Sign-in blocked, contact admin
    end

    alt No agent available (all agents down)
        Cloud->>Cloud: No agent picks up request before timeout
        Cloud-->>Browser: Sign-in failed, service unavailable
    end
```

Notes

- The password is encrypted in the cloud with the agent's public key and decrypted only in
  agent memory, so no hash or plaintext is stored in the cloud.
- The agent's channel is outbound-only, it polls the cloud queue, the cloud never connects
  inbound to the agent.
- All on-prem account state (expiry, lockout, disabled, logon hours) is enforced live by the
  DC and surfaced back to the cloud as a specific sub-status.
