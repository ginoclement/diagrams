# Policy Decision and Enforcement — Decision Flowchart

Evaluation from intercepted request to enforced outcome, covering PDP availability, attribute
resolution via the PIP, the Permit/Deny/Indeterminate decision, and obligation enforcement. Every
deny and fail-closed path is an explicit terminal.

```mermaid
flowchart TD
    Start(["Request intercepted by PEP"]) --> Build["Build decision request:<br/>subject, action, resource, context"]
    Build --> Up{"PDP reachable?"}
    Up -->|No| FailClosed(["Deny: fail closed<br/>(PDP unavailable)"])
    Up -->|Yes| Attr{"Policy needs attributes<br/>not in the request?"}

    Attr -->|Yes| Fetch{"PIP resolves<br/>the attributes?"}
    Fetch -->|No| Indet(["Deny: Indeterminate<br/>(required attribute missing)"])
    Fetch -->|Yes| Eval
    Attr -->|No| Eval["PDP evaluates policy<br/>against request + attributes"]

    Eval --> Decision{"Decision?"}
    Decision -->|Deny| DenyPol(["Deny: 403 (policy)"])
    Decision -->|Permit| Obl{"Obligations<br/>attached?"}

    Obl -->|No| Permit(["Permit: PEP forwards action"])
    Obl -->|Yes| Apply{"PEP can satisfy<br/>all obligations?"}
    Apply -->|No| DenyObl(["Deny: obligation<br/>unfulfillable"])
    Apply -->|Yes| PermitObl(["Permit: enforce + forward<br/>(redacted / logged)"])

    Permit --> Log["Emit decision log record"]
    PermitObl --> Log
    DenyPol --> Log
    Indet --> Log
```

Notes

- **Three fail-closed terminals** — unreachable PDP, unresolved required attribute
  (`Indeterminate`), and unfulfillable obligation — all deny. There is no default-allow anywhere in
  the chain.
- **Obligations gate the permit**: a Permit with obligations is only released after the PEP applies
  them (`Apply → PermitObl`); if it cannot (e.g. cannot redact), the outcome flips to deny (`DenyObl`).
- The **PIP is on the path only when needed** (`Attr → Fetch`): a self-contained request skips
  attribute resolution, which is the low-latency common case for sidecar PDPs.
- **Both permit and deny are logged**: the decision log is the audit trail and the debugging source
  for "why was this denied?".
