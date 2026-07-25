---
title: "Secrets Management in Pipelines"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management in Pipelines

**Status:** ✅ Current

> Part of [CI/CD security and delivery](../README.md).

## Purpose

How a CI/CD job gets the credentials it needs — a registry password, a deploy key, an API
token — **without** leaking them and without handing them to untrusted code. A secret is
requested at runtime, the store checks the requesting identity/environment/branch, injects
the value into the job's environment, and **masks it in logs**. The safest secret is one
that never exists at rest: prefer **OIDC-brokered, short-lived credentials** over stored
long-lived secrets wherever the target supports it (see
[OIDC to cloud federation](../oidc-to-cloud-federation/README.md)).

## When it's used

- Any pipeline that authenticates to a registry, cloud, database, or third-party API.
- Deciding **where** secrets live: native CI store, external secret manager, or no stored
  secret at all (OIDC federation).
- Hardening against exfiltration from untrusted pull requests and script-injection attacks.
- Setting up secret **rotation**, TTLs, and scanning/revocation for leaked credentials.

## Sources of secrets

| Source | Examples | Notes |
|---|---|---|
| Native CI secret store | GitHub Actions encrypted secrets + Environments, GitLab CI/CD variables (masked + protected), Jenkins Credentials | Scoped to repo/org, environment, or protected branch |
| External secret manager | HashiCorp Vault, AWS Secrets Manager, cloud KMS | Central rotation, dynamic/short-TTL secrets, fine-grained policy |
| OIDC-brokered (no stored secret) | GitHub/GitLab OIDC → AWS STS / GCP / Azure | Short-lived token minted per run; nothing to leak at rest — **preferred** |

## Actors / components

| Actor / component | Role |
|---|---|
| Job | The running pipeline step requesting a secret |
| CI/CD system | GitHub Actions, GitLab CI, Jenkins, Argo/Flux orchestrating the run |
| Secret store | Native store, external manager, or OIDC broker holding/minting credentials |
| Runner | Machine/pod executing the job; see [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md) |
| Log sink | Build-log output — **treat as public** |
| Attacker input | Untrusted PR code or user-controlled strings attempting exfiltration |

## Happy path

1. A job on a trusted branch/environment requests a secret.
2. The store checks the requesting **identity + environment + branch/ref** against its policy.
3. The value is injected into the job at runtime (env var or file), never committed.
4. The CI system **masks** the value everywhere it appears in logs.
5. The job uses it; for dynamic secrets the lease expires shortly after.

## Alternate scenarios covered

- **Fork PR denied secret access** — an untrusted PR from a fork gets no secrets; the store
  refuses because the requesting context is not protected/trusted.
- **Vault dynamic secret with short TTL** — the store mints a fresh, short-lived credential
  per run that auto-expires, so a leak has a tiny blast radius.
- **Secret scanning / leaked secret revoked** — a committed or logged secret is detected and
  revoked, then rotated.
- **Script-injection exfiltration attempt blocked** — untrusted input interpolated into a
  `run` step tries to print/exfiltrate a secret; least privilege and no-secrets-on-forks stop it.

## Security notes

- **Never echo secrets; rely on masking, but don't trust it alone.** Masking is best-effort —
  transformed values (base64, substrings) can slip through. **Treat build logs as public.**
- **Scope secrets to environments and protected branches**, not repo/org-wide, so a feature
  branch or fork cannot read production credentials. Environment-scoped beats broad scope.
- **Prefer OIDC federation** over long-lived secrets; where a stored secret is unavoidable,
  give it a **short TTL** and rotate on a schedule and after any suspected exposure.
- **Untrusted forks must not access secrets.** Beware `pull_request_target` (and equivalent
  privileged triggers): it runs with the base repo's token/secrets against fork-authored code —
  never check out and execute fork code in that context.
- **Script injection:** never interpolate untrusted input (PR title, branch name, issue body)
  directly into a shell `run` step; pass it through an intermediate env var and quote it.
- **Pin third-party actions/images to a commit SHA** so a compromised tag cannot swap in code
  that reads the job's secrets.
- Restrict who can edit the pipeline definition — editing it is code execution with the
  pipeline's secret access. See [Pipeline access control](../pipeline-access-control/README.md).

## Diagrams

- [sequence.md](sequence.md) — request → policy check → inject → mask, with fork-denied, dynamic-TTL, revocation, and injection-blocked alternates.
- [swimlane.md](swimlane.md) — lanes for Job, CI/CD system, Secret store, Runner, and Log sink.
- [flowchart.md](flowchart.md) — decision logic: trusted context, source of secret, masking, and exfiltration gates.

## Related diagrams

- [CI/CD security and delivery](../README.md) — the category index.
- [OIDC to cloud federation](../oidc-to-cloud-federation/README.md) — the preferred no-stored-secret path.
- [Pipeline access control](../pipeline-access-control/README.md) — who can trigger runs and edit pipeline code.
- [Environment protection and approvals](../environment-protection-approvals/README.md) — environment scoping and deploy gates that guard secrets.
- [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md) — keeping a leaked secret from persisting on the runner.
