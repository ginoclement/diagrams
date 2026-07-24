# Admin-Initiated Password Reset — Decision Flowchart

Branch-focused view: admin authorization, mandatory caller verification
(social-engineering gate), temp-password vs. reset-link choice, forced change at
next login, and session revocation.

```mermaid
flowchart TD
    Start(["Admin requests reset<br/>for a target user"]) --> Authz{"Admin authorized<br/>to reset this user?"}
    Authz -->|no| EAuthz(["Deny:<br/>insufficient privilege"])
    Authz -->|yes| Verify{"Caller identity verified<br/>out-of-band?"}

    Verify -->|no| Log["Log failed verification"] --> EVerify(["Abort:<br/>no credential issued<br/>(possible social engineering)"])
    Verify -->|yes| Record["Record verification<br/>method in audit"]

    Record --> Method{"Temp password<br/>or reset link?"}
    Method -->|temp password| Temp["Set single-use temp password,<br/>short TTL"]
    Method -->|reset link| Link["Send single-use,<br/>time-limited reset link"]

    Temp --> Flag["Flag mustChangePassword=true"]
    Link --> Flag
    Flag --> Revoke["Revoke all sessions<br/>+ refresh tokens"]
    Revoke --> Notify["Notify user out-of-band<br/>+ write audit record"]
    Notify --> Deliver(["Credential delivered:<br/>user must change<br/>at next login"])

    Deliver --> Login["User signs in"]
    Login --> Must{"mustChangePassword set?"}
    Must -->|yes| Change(["Redirect to<br/>change-password"])
    Must -->|no| Access(["Normal session<br/>(link flow already set password)"])
```
