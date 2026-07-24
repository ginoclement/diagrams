# Profile Attribute Update — Decision Flowchart

Server-side attribute classification drives the gate: immediate commit, step-up plus
optional re-verification, or outright rejection. Explicit terminals for each outcome.

```mermaid
flowchart TD
    Start(["User submits an attribute change"]) --> Class{"Attribute<br/>classification?"}

    Class -->|"admin-restricted"| ERej(["403: not self-serviceable,<br/>use governance / request process"])
    Class -->|"non-sensitive"| Val0{"Value valid<br/>(format, length)?"}
    Class -->|"sensitive"| Step{"Session freshly<br/>authenticated / stepped up?"}

    Val0 -->|no| EVal(["Reject: invalid value"])
    Val0 -->|yes| Commit0(["Commit to directory"])

    Step -->|no| Reauth{"Re-authentication<br/>succeeds?"}
    Reauth -->|no| EAuth(["Deny: step-up failed,<br/>change not applied"])
    Reauth -->|yes| Chan
    Step -->|yes| Chan{"New value is a<br/>contact channel<br/>(email / phone)?"}

    Chan -->|no| Notify["Notify old channel<br/>of the change"]
    Notify --> Commit1(["Commit sensitive change"])

    Chan -->|yes| Verify{"New value verified<br/>(code / link confirmed)?"}
    Verify -->|no| EVerify(["Pending: old value stays<br/>authoritative until verified"])
    Verify -->|yes| Promote(["Promote new value,<br/>retire old, notify old channel"])
```
