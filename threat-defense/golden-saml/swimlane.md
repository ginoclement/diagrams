# Golden SAML — Swimlane Diagram

Lanes for Attacker, Victim, IdP, and Defender controls. The dashed arrows into the Defender
lane are the detection signals; solid arrows are the attack/forgery path.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Compromise federation server<br/>(post-exploitation)"]
        A2["Attempt to export<br/>token-signing key"]
        A3["Forge assertion for chosen user<br/>with elevated groups"]
        A4["Sign with stolen key"]
        A5["POST forged SAMLResponse<br/>to SP ACS URL"]
        A6(["Impersonated session at SP"])
    end

    subgraph Victim
        V1["Legitimate user being<br/>impersonated - never involved"]
    end

    subgraph IdP["IdP / federation server"]
        I1{"Signing key in HSM?"}
        I2["Key non-exportable<br/>- export denied"]
        I3["Rotate signing key twice<br/>(containment)"]
    end

    subgraph Defender["Defender controls"]
        D1(["HSM blocks key theft<br/>- attack prevented"])
        D2["Ingest SP success event"]
        D3{"Matching IdP<br/>auth event?"}
        D4(["Alert - golden assertion<br/>revoke session, isolate"])
        D5["Enforce short assertion<br/>lifetime + strict Conditions"]
    end

    A1 --> A2 --> I1
    I1 -->|Yes| I2 --> D1
    I1 -->|No - soft store| A3 --> A4 --> A5
    V1 -.->|identity forged, no action| A3
    A5 --> D5
    D5 --> A6
    A6 -.->|SP login logged| D2 --> D3
    D3 -->|No IdP auth| D4 --> I3
    D3 -->|Yes| A6
```

Notes

- The Victim lane is intentionally passive: a hallmark of Golden SAML is that the real user
  takes no action and generates no IdP authentication.
- `D3` — "no matching IdP auth event" — is the core detection: SP success with no
  corresponding IdP sign-in.
- The only path that stops the attack outright is `I1 --> Yes` (HSM); everything else is
  detection and containment after a valid-looking session already exists.
