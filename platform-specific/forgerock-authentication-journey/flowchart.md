# ForgeRock / PingAM Authentication Journey — Decision Flowchart

Node-by-node tree traversal driven by the `authId` + callbacks loop, with per-node
branch outcomes and the lockout / failure terminals.

```mermaid
flowchart TD
    Start(["POST /authenticate<br/>(tree start, no session)"]) --> Node["AM returns authId<br/>+ callbacks for current node"]
    Node --> Fill["Client fills callbacks,<br/>resubmits with authId"]
    Fill --> Which{"Current node type?"}

    Which -->|"Collector (username/password)"| Collect["Capture credentials"]
    Collect --> Node

    Which -->|"Data Store Decision"| DSD{"Credentials valid<br/>in Directory?"}
    DSD -->|"false"| Retry{"Retry Limit /<br/>Lockout node: attempts left?"}
    Retry -->|yes| Node
    Retry -->|no| Lock(["Failure: account locked<br/>(lockout flag set in DS)"])
    DSD -->|true| NextT["Follow true branch"]

    Which -->|"MFA node"| MFA{"Push / OTP / WebAuthn<br/>verified?"}
    MFA -->|no| Retry
    MFA -->|yes| NextT

    Which -->|"Inner Tree (progressive profiling)"| Inner{"Required attributes<br/>collected?"}
    Inner -->|no| Node
    Inner -->|yes| NextT

    NextT --> Outcome{"Reached an<br/>outcome node?"}
    Outcome -->|"Failure"| Fail(["Failure node -<br/>no session issued"])
    Outcome -->|"Success"| Done(["Success node -<br/>issue session tokenId"])
    Outcome -->|"more nodes"| Node
```
