# Federated vs Managed Authentication — Decision Flowchart

The per-domain routing decision and each path's validation gates, with explicit error
terminals for the federated failure modes.

```mermaid
flowchart TD
    START(["User enters UPN at cloud app"]) --> HRD{"Domain auth setting?<br/>(home-realm discovery)"}

    HRD -->|"Managed"| MTYPE{"PHS or PTA?"}
    MTYPE -->|"PHS"| PHS{"Synced hash<br/>matches?"}
    PHS -->|"no"| ERPhs(["Deny: invalid credentials"])
    PHS -->|"yes"| ISSUE["Cloud issues token"]
    MTYPE -->|"PTA"| PTA{"On-prem agent<br/>validates against DC?"}
    PTA -->|"no agent / bad password"| ERPta(["Deny: validation failed"])
    PTA -->|"yes"| ISSUE

    HRD -->|"Federated"| REACH{"On-prem IdP<br/>reachable?"}
    REACH -->|"no"| ERReach(["Deny: IdP unreachable,<br/>no cloud fallback"])
    REACH -->|"yes"| AUTH{"AD credential<br/>valid at IdP?"}
    AUTH -->|"no"| ERAuth(["Deny: authentication failed at IdP"])
    AUTH -->|"yes"| SIGN["IdP issues signed token"]
    SIGN --> VERIFY{"Signature matches<br/>federation trust cert?"}
    VERIFY -->|"no"| ERCert(["Deny: token-signing cert<br/>expired or mismatched"])
    VERIFY -->|"yes"| ISSUE

    ISSUE --> RISK{"Conditional Access /<br/>MFA satisfied?"}
    RISK -->|"no"| ERCa(["Deny: blocked by policy / MFA"])
    RISK -->|"yes"| DONE(["Cloud session issued, signed in"])
```

Notes

- The first fork is configuration, not credentials: the domain's Managed-vs-Federated
  setting decides whether the credential is ever checked in the cloud at all.
- The federated path adds two failure modes managed does not have — an unreachable on-prem
  IdP and a signing-certificate mismatch — and neither has a cloud-side fallback.
- Both paths converge at `ISSUE`, after which cloud-side Conditional Access and MFA apply
  identically regardless of how the credential was verified.
