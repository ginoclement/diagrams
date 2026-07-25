# Step-Up Authentication — Decision Flowchart

The assurance comparison a resource server and IdP jointly make: does the current session
meet the action's required class *and* freshness, and if not, can it be raised?

```mermaid
flowchart TD
    S(["User attempts sensitive action"]) --> POL{"Action requires<br/>elevated assurance?"}
    POL -->|No| GO(["Proceed with existing token"])
    POL -->|Yes| ACR{"Token acr meets<br/>required class?"}

    ACR -->|No| CH
    ACR -->|Yes| FRESH{"auth_time within<br/>max_age?"}
    FRESH -->|Yes| GO2(["Proceed - already sufficient"])
    FRESH -->|No| REP["Re-prompt for freshness<br/>(same factor OK)"]

    CH["Challenge stronger factor<br/>(prefer FIDO2 / passkey)"] --> OK{"Challenge satisfied?"}
    REP --> OK2{"Re-auth satisfied?"}

    OK -->|No| DENY(["Refuse action<br/>base session unchanged"])
    OK -->|Yes| ISS["Issue token:<br/>elevated acr, fresh auth_time"]
    OK2 -->|No| DENY
    OK2 -->|Yes| ISS

    ISS --> VER{"API re-verifies acr<br/>and auth_time on retry?"}
    VER -->|No| DENY
    VER -->|Yes| DONE(["Action performed"])
```

Notes

- Two independent conditions gate the action: the **class** (`acr`) and the **recency**
  (`auth_time` vs `max_age`). Failing either routes to a challenge, but only recency can be
  cured by re-running the *same* factor.
- The final `VER` gate makes the elevation authoritative on the server: the RP proves
  assurance from the reissued token's claims, closing the "we prompted, trust us" gap.
- A refused challenge is a dead end for the *action only* — it never downgrades or ends the
  base session.
