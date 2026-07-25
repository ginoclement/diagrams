# EC2 Instance Credentials via IMDSv2

**Status:** ✅ Current

## What it is

Code on an EC2 instance obtains AWS credentials from the **Instance Metadata Service
(IMDS)** at the link-local address `169.254.169.254`, without any stored keys. When the
instance has an **IAM instance profile** attached, the metadata path
`/latest/meta-data/iam/security-credentials/<role-name>` returns temporary credentials that
AWS rotates automatically before expiry. **IMDSv2** hardens this with a **session-oriented,
token-based** scheme: the caller first does a `PUT /latest/api/token` (with a required TTL
header) to get a short-lived session token, then supplies that token in the
`X-aws-ec2-metadata-token` header on every `GET`. The token, TTL, and the fact that `PUT`
is required defeat the SSRF and open-proxy attacks that plagued **IMDSv1** (a single
unauthenticated `GET`).

IMDSv1 is retained on the instance only if the instance metadata options allow it; AWS now
recommends setting `HttpTokens=required` to enforce IMDSv2 and treats bare IMDSv1 as
**deprecated** (see the alternate below).

## When it is used

- Any workload running on EC2 (or ECS on EC2, self-managed Kubernetes nodes) that calls AWS
  APIs — the SDK's default credential provider chain reads IMDS automatically.
- Replacing embedded long-lived access keys on instances with auto-rotating role
  credentials.

## Actors

| Actor | Role |
|---|---|
| Workload | Process/SDK on the instance needing AWS credentials |
| IMDS | Instance Metadata Service at 169.254.169.254 |
| InstanceProfile | The IAM instance profile / role attached to the instance |
| STS | Backs the role credentials the metadata service surfaces |
| API | AWS service the credentials are used against |

## Key mechanics

- IMDSv2 handshake: `PUT /latest/api/token` with
  `X-aws-ec2-metadata-token-ttl-seconds: 21600` -> session token; then
  `GET /latest/meta-data/iam/security-credentials/` (list role) and
  `GET .../<role-name>` (credentials) with `X-aws-ec2-metadata-token`.
- Response contains `AccessKeyId`, `SecretAccessKey`, `Token` (session token), and
  `Expiration`; the SDK refreshes automatically as expiry approaches.
- Metadata options: `HttpTokens=required` (IMDSv2 only), `HttpPutResponseHopLimit`
  (default 1 — set low so containers can't reach IMDS through an extra hop),
  `HttpEndpoint=enabled/disabled`.
- The instance profile role's permissions bound everything the workload can do.

## Alternate scenarios covered

- **IMDSv1 (⛔ deprecated in this diagram's alternate)**: a single unauthenticated
  `GET .../security-credentials/<role>` — vulnerable to SSRF credential theft.
- No instance profile attached -> 404, no credentials.
- Hop-limit / container reachability: `HttpPutResponseHopLimit=1` blocks a pod behind an
  extra network hop from reading host credentials.
- Credential auto-refresh near expiry.

## Security notes

- Enforce IMDSv2 with `HttpTokens=required`; the `PUT`-then-`GET` and TTL requirements stop
  simple SSRF/`GET`-only exfiltration (the Capital One-class attack).
- Keep `HttpPutResponseHopLimit=1` so containers/proxies cannot pivot to instance
  credentials; disable the endpoint entirely on instances that never call AWS.
- Instance-profile roles are reachable by **any** code on the box — scope them least
  privilege and prefer per-task roles (ECS task roles, [IRSA](../irsa-eks/README.md)) over
  broad node roles.
- Credentials are temporary and rotated; never copy them off the instance.

## Related diagrams

- [STS AssumeRole](../sts-assumerole/README.md) — the temporary-credential model behind instance profiles.
- [IRSA on EKS](../irsa-eks/README.md) — pod-level roles that avoid sharing the node instance profile.
- [SigV4 request signing](../sigv4-request-signing/README.md) — how the retrieved credentials sign requests.
- [Cross-account role assumption](../cross-account-role-assumption/README.md) — using instance credentials to hop into another account.

## Files

- [sequence.md](sequence.md) — IMDSv2 token handshake and credential fetch, with the IMDSv1 deprecated alternate.
- [swimlane.md](swimlane.md) — lanes for Workload, IMDS, InstanceProfile, STS, API.
- [flowchart.md](flowchart.md) — IMDSv2-vs-IMDSv1 and no-profile decision gates with error terminals.
