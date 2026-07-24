# PocketID — Passkey-Only OIDC Decision Flowchart

Decision logic combining the passkey-only login gate with OIDC authorization-code
issuance. Because PocketID is passwordless, a missing or invalid passkey has no
password fallback.

```mermaid
flowchart TD
    Start(["Client redirects to<br/>PocketID /authorize"]) --> Sess{"Valid PocketID<br/>session already?"}
    Sess -->|yes| Code
    Sess -->|no| Known{"User account exists<br/>(admin-created)?"}

    Known -->|no| ENoUser(["No account -<br/>admin must provision"])
    Known -->|yes| HasPk{"User has at least<br/>one registered passkey?"}

    HasPk -->|no| Onboard["Send to one-time<br/>enrollment link flow"]
    Onboard --> Reg{"One-time link valid<br/>and unexpired?"}
    Reg -->|no| ELink(["Enrollment link invalid /<br/>expired - admin re-issues"])
    Reg -->|yes| Create["Register passkey,<br/>consume link"]
    Create --> Challenge

    HasPk -->|yes| Challenge["Issue WebAuthn challenge<br/>(any registered passkey)"]
    Challenge --> UV{"User verification +<br/>assertion produced?"}
    UV -->|no| EUV(["No assertion -<br/>login cannot proceed (no password)"])
    UV -->|yes| Verify{"Signature, challenge,<br/>origin, rpIdHash valid?"}
    Verify -->|no| ESig(["Reject: invalid assertion"])
    Verify -->|yes| MkSess["Establish PocketID session"]

    MkSess --> Code["Mint authorization code"]
    Code --> Exchange{"Client exchanges code<br/>with PKCE verifier?"}
    Exchange -->|"invalid / mismatch"| EExch(["Reject token request"])
    Exchange -->|valid| Tokens(["Issue id_token + access_token<br/>to client"])
```
