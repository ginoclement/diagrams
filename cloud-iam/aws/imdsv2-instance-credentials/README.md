---
title: "EC2 Instance Credentials via IMDSv2"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# EC2 Instance Credentials via IMDSv2

**Status:** ✅ Current

## What it is

Every EC2 instance can reach a link-local **Instance Metadata Service (IMDS)** at
`169.254.169.254`. When an **instance profile** (a container for an IAM role) is attached, IMDS
exposes automatically-rotated temporary credentials for that role under
`/latest/meta-data/iam/security-credentials/<role-name>`. SDKs read them from there and sign API
calls with SigV4 — no keys are ever stored on disk.

**IMDSv2** is the session-oriented, hardened protocol. The client first does a `PUT` to
`/latest/api/token` (with a TTL header) to obtain a short-lived session token, then sends that
token in the `X-aws-ec2-metadata-token` header on every `GET`. The `PUT`-first requirement plus a
default response hop limit of 1 defeats the server-side request forgery (SSRF) attacks that
plagued the older token-less **IMDSv1**, where a single crafted `GET` (often via a vulnerable app
proxying attacker input) could exfiltrate role credentials.

## When it is used

- Any workload on EC2 (or EKS/ECS on EC2) that needs AWS credentials without embedding keys.
- The default credential path for the AWS SDKs and CLI when running on an instance.
- New instances should enforce `HttpTokens=required` so only IMDSv2 works.

## Actors

| Actor | Role |
|---|---|
| App | Process on the instance (SDK/CLI) fetching credentials from IMDS |
| IMDS | Link-local metadata service at 169.254.169.254 |
| Profile | Instance profile mapping the instance to an IAM role |
| STS | Backing service that mints and rotates the role's temporary credentials |
| API | AWS service the credentials are used against |

## Key details

- Get token: `PUT http://169.254.169.254/latest/api/token` with
  `X-aws-ec2-metadata-token-ttl-seconds: 21600` (max 6 hours). Response body is the token.
- Use token: `GET .../iam/security-credentials/<role>` with header
  `X-aws-ec2-metadata-token: <token>`. Response is JSON with `AccessKeyId`, `SecretAccessKey`,
  `Token` (the session token), and `Expiration`.
- Credentials rotate automatically; SDKs refresh a few minutes before `Expiration`.
- Instance metadata options: `HttpTokens=required` (IMDSv2 only), `HttpEndpoint=enabled/disabled`,
  `HttpPutResponseHopLimit` (default 1, keeps the token off other hosts/containers).
- IMDSv2 blocks common SSRF because attackers usually cannot force a `PUT` with a custom header,
  and the hop limit stops the token from crossing a proxy or container boundary.

## Alternate scenarios covered

- Happy path: `PUT` token, then `GET` credentials, then SigV4-signed API call.
- **IMDSv1 (⛔ token-less)** shown as a deprecated alternate — a bare `GET` returns credentials,
  which is exactly what SSRF abuses.
- No instance profile attached — IMDS returns 404 for the credentials path.
- Session token expired or omitted on a `required` instance — 401 Unauthorized.

## Security notes

- Enforce `HttpTokens=required` account-wide; leaving IMDSv1 enabled reopens the SSRF exfiltration
  path even on patched apps.
- Keep `HttpPutResponseHopLimit=1` so the token cannot be relayed to containers or other hosts.
- Scope the instance role tightly — anything on the instance that can reach IMDS can use it.
- Prefer disabling IMDS entirely (`HttpEndpoint=disabled`) for instances that need no AWS access.
- Credentials are short-lived and auto-rotated, but cannot be individually revoked before expiry.

## Related diagrams

- [SigV4 request signing](../sigv4-request-signing/README.md) — how the fetched credentials sign API calls.
- [STS AssumeRole](../sts-assumerole/README.md) — the temporary-credential model IMDS delivers.
- [Cross-account role assumption](../cross-account-role-assumption/README.md) — assuming another account's role from an instance-profile identity.

## Files

- [sequence.md](sequence.md) — PUT-token then GET-credentials happy path, with the IMDSv1 SSRF alternate.
- [swimlane.md](swimlane.md) — lanes for App, IMDS, Profile, STS, API.
- [flowchart.md](flowchart.md) — token/version decision gates with deny and 404 terminals.
