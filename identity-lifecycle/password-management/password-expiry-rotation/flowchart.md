---
title: "Password Expiry and Rotation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Password Expiry and Rotation — Decision Flowchart

Branch-focused view: after a valid login, decide whether the password is expired or
flagged must-change, whether grace logins remain, whether to warn or force, and
validate the replacement password before granting a session.

```mermaid
flowchart TD
    Start(["User submits login<br/>credentials"]) --> Valid{"Credentials valid?"}
    Valid -->|no| EInvalid(["Deny:<br/>invalid credentials"])
    Valid -->|yes| Flag{"Password expired OR<br/>must-change set?"}

    Flag -->|no| Warn{"Nearing expiry?"}
    Warn -->|yes| Banner(["Grant session +<br/>'expires in N days' banner"])
    Warn -->|no| Normal(["Grant normal session"])

    Flag -->|yes| Grace{"Grace logins<br/>remaining?"}
    Grace -->|yes| Dec["Decrement grace counter"] --> Nag(["Grant session +<br/>'change required soon' nag"])
    Grace -->|no| Force["Withhold session,<br/>force change now"]

    Force --> New{"New password meets<br/>policy + history + breach<br/>and differs from old?"}
    New -->|no| ENew(["Reject:<br/>choose a stronger,<br/>unused password"])
    New -->|yes| Update["Store new hash,<br/>clear must-change,<br/>reset age timer"]
    Update --> Granted(["Grant session"])
```
