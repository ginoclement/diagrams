# Continuous Access Evaluation — Decision Flowchart

What happens on each API call once a CAE-capable token exists: honour it, or challenge and
re-evaluate against the current state of the world.

```mermaid
flowchart TD
    S(["API call with CAE-capable token"]) --> V{"Token signature<br/>and expiry valid?"}
    V -->|No| E1(["401 - reauthenticate"])
    V -->|Yes| FLAG{"Session flagged by a<br/>critical event?"}

    FLAG -->|No| SERVE(["200 - serve request"])
    FLAG -->|Yes| CH["401 WWW-Authenticate:<br/>claims challenge"]

    CH --> RE["Client reauthorizes<br/>with claims challenge"]
    RE --> COND{"Conditions still met?<br/>account enabled, MFA valid,<br/>risk acceptable, location allowed"}

    COND -->|No| DENY(["Deny - no new token,<br/>session ended"])
    COND -->|Yes| STEP{"Step-up needed to<br/>satisfy conditions?"}
    STEP -->|Yes| CHAL{"Step-up satisfied?"}
    STEP -->|No| NEW(["Issue fresh token,<br/>retry succeeds"])
    CHAL -->|No| DENY
    CHAL -->|Yes| NEW
```

Notes

- The `FLAG` gate is the whole point: an unflagged session is served with a single token
  check and no IdP round trip, so CAE is cheap on the common path.
- Re-evaluation (`COND`) checks *current* state — a token issued before a password reset is
  refused even though its signature and expiry are still fine.
- Re-evaluation can conclude that assurance must be *raised*, not just confirmed, so the
  path can fold into [step-up](../step-up-authentication/README.md) before issuing a token.
