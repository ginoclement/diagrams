# Scopes, Claims, Entitlements — Decision Flowchart

The layered decision: validate the token, check the coarse **scope** at the gateway, then resolve
the fine-grained **entitlement** at the resource against live data. Each layer has an explicit deny
terminal; passing a coarse layer never implies the fine one.

```mermaid
flowchart TD
    Start(["Request with access token"]) --> Valid{"Token valid?<br/>(iss, aud, sig, exp)"}
    Valid -->|No| DenyTok(["Deny: 401 invalid_token"])
    Valid -->|Yes| Scope{"Route-required scope<br/>present in token?"}
    Scope -->|No| DenyScope(["Deny: 403 insufficient_scope<br/>(coarse, token-time)"])
    Scope -->|Yes| Acr{"acr / amr meets<br/>action risk level?"}
    Acr -->|No| StepUp(["Challenge: 401 step-up<br/>(stronger auth needed)"])
    Acr -->|Yes| Fresh{"Authorization claims<br/>fresh enough to trust?"}

    Fresh -->|No| Live["Re-resolve from live<br/>policy / data (revocation)"]
    Fresh -->|Yes| Ent
    Live --> Ent{"Entitled on THIS object?<br/>(role/relationship/attribute<br/>+ ownership)"}
    Ent -->|No| DenyEnt(["Deny: 403 object-level<br/>(fine-grained, runtime)"])
    Ent -->|Yes| Permit(["Permit: execute action"])
```

Notes

- **Two distinct deny terminals** matter operationally: `insufficient_scope` means the *client* was
  never granted the capability (fix by re-consenting a broader/incremental scope), while the
  object-level `403` means the *subject* lacks permission on *this* resource (a data/policy fact, not
  a token problem).
- **Scope check is necessary, not sufficient.** The `Scope` diamond is a ceiling on delegated client
  authority; the `Ent` diamond is the real access decision. Skipping `Ent` and trusting scope is the
  broken-object-level-authorization (BOLA/IDOR) vulnerability.
- **Claim freshness gate** (`Fresh`): when a role/entitlement claim may be stale, the resource
  re-resolves against live data so a revocation takes effect before the token expires.
- `acr`/`amr` gate handles **step-up**: a low-assurance token is fine for reads but challenged for
  high-risk actions.
