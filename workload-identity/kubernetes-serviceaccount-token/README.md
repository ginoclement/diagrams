# Kubernetes Projected ServiceAccount Token

**Status:** 🔵 Emerging

## What it is

A Kubernetes **projected ServiceAccount token** is a short-lived, audience-bound OIDC JWT
that the kubelet obtains from the API server's **TokenRequest API** and mounts into a Pod as
a projected volume. Unlike the old, long-lived Secret-based ServiceAccount tokens, a
projected token has an explicit **audience** (`aud`), a bounded **expiry** (`exp`, refreshed
by the kubelet before it lapses), and is bound to the Pod's lifetime. Because the cluster
publishes an **OIDC discovery document** and **JWKS** (at `/.well-known/openid-configuration`
and `/openid/v1/jwks`), any external system that trusts the cluster issuer can verify the
token's signature and claims without calling back into the cluster.

The token is then **exchanged** with an external system — for example AWS STS
`AssumeRoleWithWebIdentity`, GCP/Azure workload identity federation, HashiCorp Vault's
Kubernetes auth, or any OIDC-aware relying party — which validates issuer, audience, and
subject and returns its own short-lived credential (cloud STS credentials, a Vault token,
an access token).

## When it is used

- A Pod needs to authenticate to a cloud provider or SaaS **without a stored secret** — the
  projected token is the only credential and it is minted on demand.
- Keyless cloud access from Kubernetes: the exchange target is the cloud STS, so no cloud
  access key ever lives in the cluster.
- As the node/workload attestation evidence under
  [spiffe-spire-issuance](../spiffe-spire-issuance/README.md) (PSAT node attestor).

## Actors

| Actor | Role |
|---|---|
| `Workload` | The Pod process; reads the projected token from a mounted file and presents it |
| `Kubelet` | Node agent; calls TokenRequest for the Pod's ServiceAccount, projects and refreshes the token |
| `API` | kube-apiserver: TokenRequest API (mints tokens) and OIDC issuer (discovery + JWKS) |
| `External` | Relying party: cloud STS, Vault, or SaaS that validates the OIDC token and issues its own credential |

## Key protocol details

- **TokenRequest API** (`POST /api/v1/namespaces/<ns>/serviceaccounts/<sa>/token`) mints a
  signed JWT with the requested `audiences`, `expirationSeconds`, and a bound object
  reference (the Pod), so the token dies with the Pod.
- **Projected volume**: the `serviceAccountToken` volume source sets `audience`,
  `expirationSeconds`, and `path`; the kubelet writes the token to the file and **rotates**
  it (rewrites the file) at ~80% of its lifetime.
- **Audience binding**: the exchange target must be listed in the token's `aud`; a token
  minted for one audience must be rejected by another relying party.
- **OIDC trust**: the external system is configured with the cluster's **issuer URL** and
  fetches JWKS to verify the RS256 signature. The issuer must be reachable/public (managed
  clusters expose it; self-managed clusters often publish JWKS to an object store).
- **Subject mapping**: the token `sub` is `system:serviceaccount:<ns>:<sa>`; the external
  system maps that subject (plus namespace/SA claims) to a role or policy.

## Alternate scenarios covered

- Cloud STS exchange (`AssumeRoleWithWebIdentity`) versus a Vault/SaaS exchange.
- Token near expiry: kubelet refresh with no Pod restart.
- Rejection paths: wrong audience, expired token, untrusted issuer, subject not mapped to a role.
- Legacy long-lived Secret token contrast (called out as discouraged).

## Security notes

- Prefer projected tokens over legacy Secret-mounted ServiceAccount tokens: the legacy tokens
  never expire, are not audience-bound, and leak as a stored Secret. Treat them as deprecated.
- Always set a **specific audience** and the **shortest workable expiry**; never request a
  broad or default audience for an external exchange.
- The external relying party must validate **issuer, audience, signature, and expiry** and
  map the **exact** `sub`/namespace/SA — do not trust namespace alone on a shared cluster.
- Protect the projected token file with the Pod's filesystem isolation; any container that can
  read it can impersonate the ServiceAccount until expiry.
- Rotate the cluster's OIDC signing keys and keep JWKS current; a compromised signing key
  forges every workload identity.

## Related diagrams

- [spiffe-spire-issuance](../spiffe-spire-issuance/README.md) — uses the projected SA token (PSAT) as a node/workload attestor.
- [workload-identity-federation-generic](../workload-identity-federation-generic/README.md) — the generic OIDC-token-for-cloud-credential exchange this specializes.
- [service-account-key-lifecycle](../service-account-key-lifecycle/README.md) — the static-key alternative this avoids.
- [OIDC Token Exchange](../../oidc/token-exchange/README.md) — RFC 8693 exchange mechanics.
- [OIDC Client Credentials](../../oidc/client-credentials/README.md) — the non-Kubernetes machine-auth baseline.

## Files

- [sequence.md](sequence.md) — TokenRequest, projection, and external exchange with alt/opt blocks.
- [swimlane.md](swimlane.md) — lanes for Workload, Kubelet, API server, External system.
- [flowchart.md](flowchart.md) — issuance and validation gates with error terminals.
