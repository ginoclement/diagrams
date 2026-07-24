# Zero Trust Architecture — PDP Decision Flowchart

The Policy Engine's allow/deny logic for a single request, evaluating identity, device
posture, risk, and policy together. Network location is never a factor. Deny terminals
are explicit and the continuous-verification loop is drawn.

```mermaid
flowchart TD
    Start(["Request intercepted by PEP"]) --> Auth{"Subject authenticated<br/>at required assurance?"}
    Auth -->|No| DenyAuth(["Deny: authenticate / step-up MFA"])
    Auth -->|Yes| Device{"Device known<br/>and enrolled?"}

    Device -->|No| DenyDevice(["Deny: unmanaged device"])
    Device -->|Yes| Posture{"Posture compliant?<br/>(patched, encrypted, healthy)"}

    Posture -->|No| DenyPosture(["Deny: remediate device"])
    Posture -->|Yes| Risk{"Risk score within<br/>acceptable threshold?"}

    Risk -->|No| DenyRisk(["Deny: high risk / anomalous"])
    Risk -->|Yes| Policy{"Policy grants this subject<br/>this resource, this context?"}

    Policy -->|No| DenyPolicy(["Deny: not permitted by policy"])
    Policy -->|Yes| Grant["PA establishes scoped,<br/>short-TTL session at the PEP"]

    Grant --> Access(["Access granted to one resource"])
    Access --> Recheck{"Re-evaluation due?<br/>(next request / interval)"}
    Recheck -->|"Signals unchanged"| Access
    Recheck -->|"Signal changed"| Revoke["PA revokes / terminates session"]
    Revoke --> Reauth(["Session ended: re-verify from start"])
    Reauth --> Start
```

Notes

- **Every gate must pass on every evaluation** — identity, device, posture, risk, and
  policy. There is no gate for "source is on the corporate network," by design.
- Access is granted to **one resource for one short-lived session**; the loop re-runs the
  full decision rather than trusting the earlier grant.
- Any signal change — a posture failure, a new risk alert, a revoked credential — routes
  through **Revoke** and forces re-verification, which is continuous verification in action.
- The decision **fails closed**: any gate that cannot be positively satisfied denies.
