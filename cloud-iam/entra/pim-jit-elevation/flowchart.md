# PIM JIT Elevation — Decision Flowchart

Every activation gate from eligibility to expiry. Deny and expiry paths terminate
explicitly.

```mermaid
flowchart TD
    Start(["User requests role activation"]) --> Elig{"User eligible<br/>for the role?"}
    Elig -->|No| DenyElig(["Deny: not eligible"])
    Elig -->|Yes| Just{"Justification / ticket<br/>required and provided?"}
    Just -->|No| DenyJust(["Deny: justification missing"])
    Just -->|Yes| Mfa{"MFA / auth-context<br/>satisfied?"}
    Mfa -->|No| DenyMfa(["Deny: strong auth failed"])
    Mfa -->|Yes| Appr{"Approval<br/>required?"}

    Appr -->|No| Activate["Create active assignment<br/>(time-bound)"]
    Appr -->|Yes| Wait{"Approver acts<br/>before deadline?"}
    Wait -->|"No - timed out"| DenyExpire(["Deny: request expired"])
    Wait -->|Yes| Decision{"Approved?"}
    Decision -->|No| DenyReject(["Deny: request rejected"])
    Decision -->|Yes| Activate

    Activate --> Use(["Elevated token usable<br/>for the window"])
    Use --> Window{"Activation window<br/>still open?"}
    Window -->|Yes| Use
    Window -->|No| Deactivate(["Auto-deactivate:<br/>privilege removed"])
```

Notes

- Each gate is fail-closed: failing eligibility, justification, MFA, or approval yields no
  privilege at all.
- The `Use --> Window` loop represents the bounded active period; expiry triggers automatic
  deactivation, and CAE can cut it short on a critical event.
- Break-glass accounts are deliberately excluded from these gates for emergency access and
  are monitored instead.
