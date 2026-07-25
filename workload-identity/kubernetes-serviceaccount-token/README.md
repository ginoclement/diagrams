# Kubernetes Projected ServiceAccount Token

**Status:** ✅ Current

## What it is

The modern way a pod proves its Kubernetes identity: a **projected ServiceAccount token**
minted through the **TokenRequest API** and mounted into the pod by the kubelet. Unlike the
old auto-mounted Secret token, a projected token is **bound** (tied to the pod, and
optionally the ServiceAccount object), **audience-scoped** (`aud` names the intended
verifier), and **time-bound** (short TTL, default 1h; the kubelet refreshes it at ~80% of
its lifetime). The token is a JWT signed by the cluster's ServiceAccount signing key, and
the kube-apiserver publishes an **OIDC discovery** document and **JWKS**, which makes the
token verifiable by systems outside the cluster — so it can be **exchanged** at external
clouds for their credentials.

## When it is used

- In-cluster service-to-service auth and calls back to the kube-apiserver.
- As the OIDC assertion in [workload-identity-federation-generic](../workload-identity-federation-generic/README.md): AWS IRSA, GCP Workload Identity Federation, Azure workload identity, and HashiCorp Vault's Kubernetes auth all validate this token.
- As a SPIRE `k8s_psat` node/workload attestor input — see [spiffe-spire-issuance](../spiffe-spire-issuance/README.md).

## Actors

| Actor | Role |
|---|---|
| Pod | Workload holding the projected token via a volume mount |
| Kubelet | Requests and refreshes the token, projects it into the pod |
| API Server | Signs the token (TokenRequest), publishes OIDC discovery + JWKS |
| External Verifier | Cloud STS / service that validates the token against the cluster JWKS |

## Key protocol details

- **Projection**: the pod spec declares a `serviceAccountToken` projected volume with an `audience` and `expirationSeconds`; the kubelet calls the TokenRequest API and writes the JWT into the pod, refreshing before expiry.
- **Claims**: `iss` = the cluster's issuer URL, `sub` = `system:serviceaccount:<ns>:<name>`, `aud` = the requested audiences, `exp`/`iat`/`nbf`, plus `kubernetes.io` claims (namespace, pod name+uid, serviceaccount name+uid). Binding the token to the pod uid means it stops validating once the pod is gone.
- **Discovery**: `/.well-known/openid-configuration` and `/openid/v1/jwks` on the issuer let external verifiers fetch the public keys; the issuer URL must be reachable (or its JWKS mirrored) by those verifiers.
- **External exchange**: request a token whose `aud` is the target (e.g. `sts.amazonaws.com`), then present it — AWS `AssumeRoleWithWebIdentity`, GCP WIF STS exchange, Azure federated credential.
- **Legacy contrast**: the pre-1.24 auto-mounted Secret token was non-expiring, un-audienced, and stored in etcd as a Secret — discouraged; bound tokens are the default since the BoundServiceAccountTokenVolume feature went GA.

## Alternate scenarios covered

- In-cluster use against the kube-apiserver vs external exchange at a cloud STS.
- Audience mismatch — a token minted for `aud=A` rejected by a verifier expecting `aud=B`.
- Token expiry mid-use and the kubelet's silent refresh.
- Legacy non-expiring Secret token and why it is discouraged.

## Security notes

- **Always set a specific `aud`.** A token minted for the API server must not be accepted by a cloud STS, and vice versa — audience binding is the main anti-replay control.
- Prefer bound, short-lived projected tokens over legacy Secret tokens; disable auto-mount (`automountServiceAccountToken: false`) where a pod needs no token.
- The token is a bearer credential in the pod filesystem — protect the mount, avoid logging it, and keep TTLs short so a leaked token expires quickly.
- For external exchange, condition the cloud trust policy on `sub` (namespace + serviceaccount), not just the issuer, to stop any pod in the cluster from assuming the role.
- Ensure the OIDC issuer/JWKS is served over HTTPS and that key rotation is coordinated with external verifiers' caches.

## Related diagrams

- [workload-identity-federation-generic](../workload-identity-federation-generic/README.md) — the exchange pattern this token feeds.
- [spiffe-spire-issuance](../spiffe-spire-issuance/README.md) — PSAT as a SPIRE attestor.
- [secretless-instance-identity](../secretless-instance-identity/README.md) — the node-level identity beneath the cluster.
- [cloud-iam/aws/sts-assumerole](../../cloud-iam/aws/sts-assumerole/README.md) (IRSA), [cloud-iam/gcp/gke-workload-identity](../../cloud-iam/gcp/gke-workload-identity/README.md), [cloud-iam/entra/workload-identity-federation](../../cloud-iam/entra/workload-identity-federation/README.md) — cloud specifics.
- [oidc/authorization-code-pkce](../../oidc/authorization-code-pkce/README.md) — OIDC/JWKS validation fundamentals.

## Files

- [sequence.md](sequence.md) — projection, in-cluster use, and external exchange with alt blocks.
- [swimlane.md](swimlane.md) — lanes for Pod, Kubelet, API Server, External Verifier.
- [flowchart.md](flowchart.md) — audience and validation decisions with error terminals.
</content>
