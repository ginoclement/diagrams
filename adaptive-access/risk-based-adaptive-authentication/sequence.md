# Risk-Based Adaptive Authentication — Sequence Diagram

Happy path first (low risk, allowed), then the step-up and deny alternates, plus the
degraded-signal fallback.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant IdP as IdP
    participant Risk as Risk engine
    participant Sig as Signal sources

    User->>Client: Start sign-in
    Client->>IdP: Authorization request
    IdP->>User: Prompt for primary factor
    User->>IdP: Submit credentials (or passkey)
    IdP->>IdP: Verify primary factor

    IdP->>Sig: Collect signals<br/>(device, geo-IP, velocity, reputation, threat intel)
    Sig-->>IdP: Signal set
    IdP->>Risk: Score signals + user history
    Risk-->>IdP: Risk level = low

    alt Low risk - allow
        IdP-->>Client: Issue tokens<br/>(acr / amr reflect achieved assurance)
        Client-->>User: Signed in
    else Medium risk - step-up required
        Risk-->>IdP: Risk level = medium (new device / unusual location)
        IdP->>User: Challenge for stronger factor<br/>(prefer FIDO2 / passkey)
        User->>IdP: Complete step-up
        IdP->>Risk: Re-score with satisfied challenge
        alt Step-up satisfied
            Risk-->>IdP: Residual risk acceptable
            IdP-->>Client: Issue tokens (elevated acr)
            Client-->>User: Signed in
        else Step-up failed or abandoned
            IdP-->>Client: Deny (assurance not met)
            IdP->>Sig: Emit auth-failure event for detection
        end
    else High risk - deny
        Risk-->>IdP: Risk level = high<br/>(impossible travel / known-bad IP / leaked credential)
        IdP-->>Client: Block sign-in
        IdP->>Sig: Raise alert, mark session risky
        Client-->>User: Access denied - contact support
    end

    opt Risk engine or a feed unavailable
        Risk--x IdP: Timeout / no score
        IdP->>IdP: Fail closed - default to step-up (not allow)
    end
```

Notes

- The primary factor is verified **before** scoring so the engine can bind the score to a
  known identity and its history, not an anonymous attempt.
- The achieved assurance is stamped into the token as `acr` / `amr` so downstream relying
  parties and [CAE](../continuous-access-evaluation/README.md) can reason about it.
- Hard signals (leaked-credential hit, impossible travel) short-circuit directly to deny;
  soft signals (new device) tend to route through step-up.
