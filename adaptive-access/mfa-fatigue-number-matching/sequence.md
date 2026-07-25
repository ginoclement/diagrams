# MFA Fatigue and Number Matching — Sequence Diagram

Happy path first (legitimate sign-in with number matching), then the push-bombing attack
that number matching defeats, plus the wrong-number lockout and the discouraged plain
approve/deny alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Att as Attacker
    participant IdP as IdP
    participant Auth as Authenticator

    User->>IdP: Start sign-in (submit correct password)
    IdP->>IdP: Password valid, require push MFA
    IdP->>User: Display number on sign-in screen
    IdP->>Auth: Send push with number + context (app, location)
    User->>Auth: Enter the number shown on my sign-in screen
    Auth->>IdP: Submit entered number
    IdP->>IdP: Compare entered number to expected
    IdP-->>User: Match - access granted

    alt Push-bombing attack (number matching mitigates)
        Att->>IdP: Sign-in with stolen password (repeated)
        IdP->>Att: Display number on attacker screen
        IdP->>Auth: Send push to victim (number + context)
        Note over User,Auth: Victim did not start this sign-in,<br/>the number is on the attacker screen, not theirs
        User->>Auth: Deny / ignore (no correct number to enter)
        Auth->>IdP: Denied or no response
        IdP-->>Att: Not approved - alert raised, prompts rate-limited
    end

    alt Wrong number entered
        User->>Auth: Enter incorrect number
        Auth->>IdP: Submit wrong number
        IdP-->>User: Rejected - repeated failures trigger lockout
    end

    alt Legacy plain approve/deny push (discouraged)
        IdP->>Auth: One-tap Approve / Deny prompt (no number)
        Note over User,Auth: A fatigued user can tap Approve on an<br/>attacker prompt - the failure this pattern removes
    end
```

Notes

- The number is shown on the **initiating** device, so in an attack it is on the attacker's
  screen while the push lands on the victim's phone, the victim simply has no correct value
  to type.
- Entering a number is an **active** step, unlike a one-tap approve, which is why fatigue and
  reflex taps stop working once number matching is enforced.
- A burst of unrequested pushes means the password is already compromised, the `alert` and
  rate-limit in the attack branch are as important as the number itself.
