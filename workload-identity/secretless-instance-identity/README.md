---
title: "Secretless Instance Identity (IMDS / Metadata Server)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secretless Instance Identity (IMDS / Metadata Server)

**Status:** ✅ Current

## What it is

The generic pattern by which a cloud VM (or serverless/container host) obtains credentials
for its **attached identity** with no secret on disk. The platform runs a link-local
**metadata service** — reachable at `169.254.169.254` (and `metadata.google.internal` on
GCP) — that the hypervisor associates with exactly one instance. Because only code running
*on that instance* can reach its own metadata endpoint, the endpoint authenticates the
caller implicitly and hands back **short-lived credentials** for the instance's role /
service account / managed identity. The platform rotates these automatically; the workload
just re-reads the endpoint.

## When it is used

- Any workload running directly on a cloud VM, managed instance group, or container host with an attached role/identity.
- The default credential source for cloud SDKs (AWS default provider chain, GCP Application Default Credentials, Azure `DefaultAzureCredential`).
- When the workload already runs on the target cloud, this is preferred over [workload-identity-federation-generic](../workload-identity-federation-generic/README.md) (which is for cross-domain cases) and over [service-account-key-lifecycle](../service-account-key-lifecycle/README.md).

## Actors

| Actor | Role |
|---|---|
| Workload | Process on the instance calling the metadata endpoint |
| IMDS | Instance metadata service on the link-local address |
| Cloud IAM | Backing identity service that mints the credentials |
| Cloud API | Resource the credentials are used against |

## Key protocol details

- **AWS IMDSv2** (session-oriented, SSRF-hardened): `PUT /latest/api/token` with `X-aws-ec2-metadata-token-ttl-seconds` to get a session token, then `GET /latest/meta-data/iam/security-credentials/<role>` carrying `X-aws-ec2-metadata-token`. IMDSv1 (plain GET, no token) is deprecated.
- **GCP**: `GET metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token` with header `Metadata-Flavor: Google`; returns a short-lived OAuth access token.
- **Azure IMDS**: `GET 169.254.169.254/metadata/identity/oauth2/token?resource=...&api-version=...` with header `Metadata: true`; returns an AAD access token for the (system- or user-assigned) managed identity.
- The header/token requirement on GCP and Azure, and the session token on AWS IMDSv2, all exist to make blind SSRF harder to weaponize.
- Credentials are cached by the SDK and refreshed from the endpoint before expiry.

## Alternate scenarios covered

- AWS IMDSv1 vs IMDSv2 — why v2's `PUT`-then-`GET` and hop-limit defeat SSRF.
- No identity attached to the instance → endpoint returns no credentials.
- SSRF attempt: an app tricked into fetching the metadata URL — mitigations that block it.
- Missing required header (GCP `Metadata-Flavor`, Azure `Metadata: true`) → request rejected.

## Security notes

- **SSRF is the primary threat**: if an app can be coerced into requesting the metadata URL, it can leak credentials. Enforce IMDSv2, set the IMDS hop limit to 1, require the identity header, and block egress to the link-local range from untrusted code paths.
- The metadata endpoint has no bearer secret — reachability *is* the authentication — so anything that can make requests as the instance can obtain its credentials; keep the instance's attached identity least-privileged.
- Credentials are short-lived and auto-rotated; never copy them off the instance or log them.
- Disable IMDSv1 entirely where the platform allows; prefer instance/pod-level identity boundaries so co-located workloads do not share one over-broad role.

## Related diagrams

- [workload-identity-federation-generic](../workload-identity-federation-generic/README.md) — the cross-trust-domain counterpart when the workload is *not* on the target cloud.
- [service-account-key-lifecycle](../service-account-key-lifecycle/README.md) — the static-key approach this removes the need for.
- [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md) — the in-cluster identity source that layers on top of node IMDS.
- [cloud-iam/entra/managed-identity-imds](../../platforms/cloud-iam/entra/managed-identity-imds/README.md), [cloud-iam/gcp/application-default-credentials](../../platforms/cloud-iam/gcp/application-default-credentials/README.md), [cloud-iam/aws/sts-assumerole](../../platforms/cloud-iam/aws/sts-assumerole/README.md) — vendor specifics.
- [network-security/reverse-proxy-waf](../../infrastructure/network-security/reverse-proxy-waf/README.md) — SSRF sits alongside the web-layer defenses here.

## Files

- [sequence.md](./sequence.md) — token/credential fetch with alt blocks for v1/v2, no-identity, and SSRF.
- [swimlane.md](./swimlane.md) — lanes for Workload, IMDS, Cloud IAM, Cloud API.
- [flowchart.md](./flowchart.md) — request-validation and SSRF-defense decisions with error terminals.
</content>
