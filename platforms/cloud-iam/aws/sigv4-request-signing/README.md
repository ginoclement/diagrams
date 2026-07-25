---
title: "AWS Signature Version 4 (SigV4) Request Signing"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AWS Signature Version 4 (SigV4) Request Signing

**Status:** ✅ Current

## What it is

SigV4 is the signing protocol AWS uses to authenticate almost every API request. Instead of
sending the secret access key on the wire, the client derives a per-request **signature** by
HMAC-SHA256 over a deterministic representation of the request. The service re-derives the same
signature from the request it received plus its copy of the secret; a match proves the caller
holds the key and that the signed parts were not tampered with.

Signing has four stages:

1. **Canonical request** — a normalized string built from the HTTP method, URI-encoded path,
   sorted canonical query string, sorted canonical headers, the `SignedHeaders` list, and the
   hex SHA256 of the payload (`X-Amz-Content-Sha256`, or `UNSIGNED-PAYLOAD` / `STREAMING-...`
   for large or streamed bodies).
2. **String to sign** — `AWS4-HMAC-SHA256`, the `X-Amz-Date` timestamp, the **credential
   scope** (`<date>/<region>/<service>/aws4_request`), and the hex SHA256 of the canonical
   request.
3. **Signing key derivation** — a four-step HMAC chain that binds the key to date, region, and
   service so a leaked signature cannot be replayed against another region or service.
4. **Signature** — `HexEncode(HMAC(kSigning, stringToSign))`, placed in the `Authorization`
   header (or as `X-Amz-*` query parameters for presigned URLs).

## When it is used

- Every AWS SDK / CLI call signs with SigV4 under the hood using the caller's credentials.
- Temporary credentials from STS additionally send `X-Amz-Security-Token`, which is part of the
  signed headers.
- **Presigned URLs** (S3 `GET`/`PUT`, etc.) move the signature into the query string so a
  browser can use it without seeing the secret.
- Direct HTTP callers (webhooks, minimal clients, other languages) implement SigV4 by hand.

## Actors

| Actor | Role |
|---|---|
| Client | SDK, CLI, or hand-rolled caller that builds the canonical request and signs it |
| Creds | Access key id, secret access key, and (for STS) session token used for signing |
| Service | AWS service endpoint that re-derives and compares the signature |
| IAM | Authorizes the action once the signature is verified and identity resolved |

## Key protocol details

- Algorithm string: `AWS4-HMAC-SHA256` (SigV4). The asymmetric multi-region variant is
  `AWS4-ECDSA-P256-SHA256` (SigV4A), used by services that accept a `*` region.
- Signing key chain: `kDate = HMAC("AWS4" + secret, date)`, `kRegion = HMAC(kDate, region)`,
  `kService = HMAC(kRegion, service)`, `kSigning = HMAC(kService, "aws4_request")`.
- `Authorization` header layout:
  `AWS4-HMAC-SHA256 Credential=<AKID>/<scope>, SignedHeaders=<list>, Signature=<hex>`.
- `Host` and `X-Amz-Date` must be signed; `X-Amz-Content-Sha256` is required for S3.
- Clock skew tolerance is 5 minutes; a stale `X-Amz-Date` is rejected as `SignatureDoesNotMatch`
  or `RequestTimeTooSkewed`.

## Alternate scenarios covered

- Temporary credentials: `X-Amz-Security-Token` added to the signed headers.
- Presigned URL: signature and `X-Amz-Expires` carried as query parameters.
- Signature mismatch from an unsigned-but-present header, wrong region, or bad canonicalization.
- Expired request (clock skew beyond 5 minutes) rejected before authorization.
- SigV4A shown as an alternate for multi-region signing.

## Security notes

- The secret access key never leaves the client; only the derived signature travels on the wire.
- Scope binding (date/region/service) means a captured signature cannot be reused against another
  region or service, and only for the request it signed.
- Always sign over `Host` and any security-relevant headers; unsigned headers are attacker-mutable.
- Prefer short-lived STS credentials so a leaked signing key expires quickly.
- Set the shortest workable `X-Amz-Expires` on presigned URLs — until expiry anyone with the URL
  can replay it.

## Related diagrams

- [STS AssumeRole](../sts-assumerole/README.md) — issues the temporary credentials that SigV4 signs with.
- [IMDSv2 instance credentials](../imdsv2-instance-credentials/README.md) — where an EC2 workload gets the keys it then signs with.
- [Cross-account role assumption](../cross-account-role-assumption/README.md) — signing with credentials from an assumed cross-account role.

## Files

- [sequence.md](./sequence.md) — building the canonical request through signature verification, with presigned and mismatch alternates.
- [swimlane.md](./swimlane.md) — lanes for Client, Creds, Service, IAM.
- [flowchart.md](./flowchart.md) — the signing pipeline and verification decision gates with error terminals.
