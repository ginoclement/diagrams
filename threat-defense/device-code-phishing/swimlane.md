# Device Code Phishing — Swimlane Diagram

Lanes for Attacker, Victim, IdP, and Defender controls. Solid arrows are the attack path; dashed
arrows into the Defender lane are policy evaluation and detection signals.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Start device flow<br/>on own device"]
        A2["Send user_code lure<br/>to victim"]
        A3["Poll /token<br/>until approval or expiry"]
        A4["Use tokens<br/>against API"]
        A5(["Token access to<br/>victim's account"])
    end

    subgraph Victim
        V1["Open real<br/>verification_uri"]
        V2["Enter user_code"]
        V3["Authenticate + MFA"]
        V4{"Approval screen:<br/>did you start this?"}
    end

    subgraph IdP["IdP / authorization server"]
        I1["Issue device_code<br/>+ user_code"]
        I2{"user_code<br/>still valid?"}
        I3["Render approval<br/>(app, origin, warning)"]
        I4{"Conditional access<br/>allows polling client?"}
        I5["Issue tokens<br/>to polling client"]
    end

    subgraph Defender["Defender controls"]
        D1(["DENY: code expired<br/>- window closed"])
        D2(["DENY: victim cancels<br/>unexpected prompt"])
        D3(["DENY: device grant<br/>blocked off-policy"])
        D4{"Approval loc ==<br/>token-use loc?"}
        D5(["DETECT: revoke tokens,<br/>reauth, notify"])
    end

    A1 --> I1 --> A2 --> V1 --> V2 --> I2
    I2 -->|No| D1
    I2 -->|Yes| V3 --> I3 --> V4
    A1 --> A3
    V4 -->|"Cancel"| D2
    V4 -->|"Approve"| I4
    I4 -->|No| D3
    I4 -->|Yes| I5 --> A4 --> A5
    A4 -.->|token telemetry| D4
    D4 -->|No| D5 -.->|tokens revoked| A5
    D4 -->|Yes| A5
```

Notes

- The Victim never sees a fake page — every step is at the legitimate IdP — so the defenses live
  in **policy** (`I4`), **code lifetime** (`I2`), and **approval clarity** (`V4`).
- Outright prevention is `I2 --> No`, `V4 --> Cancel`, or `I4 --> No`; past `I5` the response is
  detection and token revocation on a location mismatch (`D4`).
- Tokens are delivered to the attacker's polling client, not the victim's browser — the hallmark
  of this flow abuse.
