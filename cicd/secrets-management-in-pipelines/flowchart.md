# Secrets Management in Pipelines — Decision Flowchart

The gates between "a job asks for a secret" and "the secret is safely used": is the context
trusted, which source serves it, is it masked and short-lived, and are exfiltration attempts
blocked. Deny/fail paths terminate explicitly.

```mermaid
flowchart TD
    Start(["Job step requests a secret"]) --> Trust{"Trusted context?<br/>(protected branch/env,<br/>not a fork PR)"}
    Trust -->|"No - fork / untrusted"| DenyFork(["Deny: no secret injected,<br/>build/test only"])
    Trust -->|Yes| Prefer{"OIDC federation<br/>available for target?"}

    Prefer -->|Yes| Oidc["Exchange OIDC token for<br/>short-lived cloud credential"]
    Oidc --> Use
    Prefer -->|"No - stored secret needed"| Src{"Secret source?"}

    Src -->|"Native store"| Scope{"Scoped to this<br/>environment / branch?"}
    Scope -->|No| DenyScope(["Deny: out-of-scope request"])
    Scope -->|Yes| Native["Read native secret value"]
    Native --> Mask

    Src -->|"External manager / Vault"| Dyn{"Dynamic secret<br/>supported?"}
    Dyn -->|Yes| Lease["Mint dynamic secret,<br/>short TTL, auto-revoke"]
    Dyn -->|"No - static"| Static["Read static secret<br/>(rotate on schedule)"]
    Lease --> Mask
    Static --> Mask

    Mask["Register value for log masking"] --> Inject["Inject into job at runtime<br/>(env var / file)"]
    Inject --> Use["Job uses the secret"]

    Use --> Inj{"Untrusted input flows into<br/>a shell run step?"}
    Inj -->|"Yes - unquoted inline"| Exfil(["Block: pass via quoted env var,<br/>least-privilege token limits damage"])
    Inj -->|"No / safely quoted"| Emit["Emit masked output"]

    Emit --> Leak{"Scanner flags a<br/>secret in logs / commit?"}
    Leak -->|Yes| Revoke(["Revoke + rotate credential"])
    Leak -->|No| Done(["Step succeeds"])
```

Notes

- The first gate rejects untrusted/fork contexts outright — the single most important control
  against secret exfiltration from pull requests.
- OIDC is checked first on purpose: a short-lived federated credential leaves nothing at rest,
  so it is preferred over any stored secret (see [OIDC to cloud federation](../oidc-to-cloud-federation/README.md)).
- Native secrets must be **environment/branch scoped**; dynamic secrets add a short TTL and
  auto-revoke so a leak's blast radius is small.
- Masking and treating logs as public are complementary — the script-injection gate assumes an
  attacker can read output, so least privilege and quoted-env-var handling do the real work.
- Detection ends in revoke-and-rotate, not silent hope; pinning third-party actions to a SHA
  keeps a swapped dependency from reading the secret in the first place.
