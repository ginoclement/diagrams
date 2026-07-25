# OAuth Consent Phishing — Decision Flowchart

Where each control forces a **deny** (prevention) or **detect** terminal. The login and token
issuance are always valid — so defense depends on consent policy and app governance, not crypto.

```mermaid
flowchart TD
    Start(["Victim opens consent<br/>lure for malicious app"]) --> PubQ{"App publisher verified<br/>and within consent policy?"}
    PubQ -->|"No - unverified / risky scopes"| Deny1(["DENY: consent blocked,<br/>no tokens issued"])
    PubQ -->|"Requires admin consent"| AdmQ{"Admin reviewer<br/>approves app?"}
    AdmQ -->|No| Deny2(["DENY: admin rejects<br/>unknown app"])
    AdmQ -->|Yes| Consent

    PubQ -->|"User consent permitted"| Consent["Victim clicks Accept"]
    Consent --> Tok["IdP issues access<br/>+ refresh tokens to app"]
    Tok --> Use["App reads mail / files"]

    Use --> GovQ{"App governance:<br/>risky behavior?<br/>rare app, burst reads,<br/>high-impact scopes"}
    GovQ -->|Yes| Detect1(["DETECT: revoke grant<br/>+ refresh tokens,<br/>notify, access review"])
    GovQ -->|No| ReviewQ{"Periodic access review<br/>flags the grant?"}
    ReviewQ -->|Yes| Detect2(["DETECT: prune stale /<br/>over-permissioned grant"])
    ReviewQ -->|No| Gap(["Residual risk: valid tokens,<br/>low-and-slow abuse<br/>- least privilege, short<br/>refresh lifetimes, CAE"])
```

Notes

- The **consent gate** (`PubQ` / `AdmQ`) is the strongest prevention: keep unverified and
  broadly-scoped apps from ever reaching a grantable screen.
- After tokens are issued, defense shifts to **app governance** (`GovQ`) revoking the grant —
  password resets do nothing because no password was stolen.
- The `Gap` terminal is honest about residual risk: a low-volume, well-scoped malicious app can
  evade behavioral detection, which is why least-privilege consent and continuous access
  evaluation reduce reliance on catching it after the fact.
