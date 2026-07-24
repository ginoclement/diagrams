# Secrets Management Platform (Vault-style)

## What it shows

The architecture of a centralized secrets platform (Vault-style): applications and CI/CD
pipelines authenticate to a hardened **secret store** using pluggable **auth methods**,
receive **dynamic, short-lived secrets** minted on demand (database credentials, cloud
keys, certificates), and rely on the platform for **leasing/rotation**,
**encryption-as-a-service**, and a complete **audit** trail. The goal is to eliminate
long-lived secrets scattered across config files and to make every secret access
attributable and revocable.

The store's own signing/encryption keys sit behind the [PKI hierarchy](../pki-hierarchy/README.md)
and HSM; workloads often authenticate with credentials issued by the
[IdP](../identity-provider-reference-architecture/README.md) or via
[mTLS](../../tokenless/mutual-tls/README.md).

## Actors / components

| Component | Role |
|---|---|
| Application / Workload | Consumer that needs a secret at runtime |
| CI/CD Pipeline | Consumer that needs secrets to build, test, and deploy |
| Secret Store / Vault | Core engine: authenticates callers, issues + leases secrets, encrypts data |
| Auth Methods | Pluggable identity verification (OIDC/JWT, Kubernetes, cloud IAM, AppRole, mTLS) |
| Policy Engine | Maps an authenticated identity to the paths/secrets it may access |
| Secret Engines | Produce secrets: static KV, dynamic DB creds, cloud keys, PKI/certs |
| Lease / Rotation Manager | Tracks TTLs, renews, and revokes secrets on expiry or on demand |
| Encryption-as-a-Service | Encrypt/decrypt/sign on behalf of apps without exposing keys (transit) |
| Master Key / HSM / Unseal | Protects the store's root encryption key; controls seal/unseal |
| Audit Log | Append-only record of every auth, read, and lease event |
| Backing Datastore | Encrypted storage for sealed secrets and state |

## Trust boundaries & security notes

- **The store is only as trustworthy as its auth methods.** A workload proves identity
  with a platform-native credential — a Kubernetes service-account token, a cloud IAM
  identity, a signed JWT from the [IdP](../identity-provider-reference-architecture/README.md),
  or an [mTLS client cert](../../tokenless/mutual-tls/README.md) — never a static password.
- **Dynamic > static.** Prefer dynamic secrets with short TTLs generated per request, so a
  leaked credential expires quickly and every issuance is uniquely attributable. Static KV
  secrets should still be rotated and leased.
- **Least-privilege policy binding:** the Policy Engine grants each identity only the paths
  it needs. An app can read its own database creds and nothing else.
- **Encryption-as-a-service keeps keys inside the boundary:** apps send plaintext/ciphertext
  to the transit engine and never hold the key. Key material never leaves the store/HSM.
- **Seal/unseal + master key:** the root key is protected by an HSM or split via key
  shares. A sealed store reveals nothing even if its storage is stolen.
- **CI/CD is a high-risk consumer:** pipelines are frequent targets; scope their secrets
  tightly, keep TTLs minutes-long, and never bake secrets into build artifacts or logs.
- **Everything is audited:** the append-only log makes secret access attributable and is
  the basis for detecting anomalous retrieval.

## Related diagrams

- [PKI hierarchy](../pki-hierarchy/README.md) — the CA/HSM behind the PKI secret engine and master key
- [IdP reference architecture](../identity-provider-reference-architecture/README.md) — issuer of workload identity tokens
- [API gateway authN/authZ](../api-gateway-authn-authz/README.md) — a consumer needing introspection/signing secrets
- [Zero trust architecture](../zero-trust-architecture/README.md) — secrets access as a per-request, verified decision
- [Mutual TLS client-cert auth](../../tokenless/mutual-tls/README.md) — an auth method for workloads
- [OAuth 2.0 Client Credentials](../../oidc/client-credentials/README.md) — machine identity for app auth

## Files

- [sequence.md](sequence.md) — an app authenticating and fetching a leased dynamic secret
- [swimlane.md](swimlane.md) — consumers / control plane / secret store / storage zones
- [flowchart.md](flowchart.md) — the store's auth + policy + lease decision
