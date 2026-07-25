---
title: "Kerberos Delegation Models — Comparison"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kerberos Delegation Models — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **Resource-based constrained delegation (RBCD)** | ✅ Current | Modern default; back-end resource owner controls who may impersonate to it | Legacy setups where the resource object cannot be edited | Control lives with the resource; scales across domains | Uses S4U2Self + S4U2Proxy; scoped to the resource's `msDS-AllowedToActOnBehalfOfOtherIdentity` |
| **Constrained delegation (S4U2Proxy)** | ✅ Current | Front-end configured with a fixed allow-list of back-end SPNs | Front-end must reach back-ends it can't enumerate up front | Limits blast radius to listed SPNs; front-end-side config | Protocol transition (S4U2Self) can widen risk; keep the SPN list tight |
| **Unconstrained delegation** | ⛔ Deprecated | — | Any new design; remove where found | Back-end gets the user's forwardable TGT and can impersonate anywhere | **Why:** a compromised server impersonates users domain-wide (TGT theft). **Use instead:** RBCD or constrained delegation. Mark accounts "sensitive, cannot be delegated" |

Notes

- Prefer avoiding delegation entirely when the service can act with its own identity.
- Flag privileged accounts as *sensitive and cannot be delegated* and add them to the
  *Protected Users* group so they are never delegated regardless of config.
- The ticket mechanics behind all three live in
  [TGS exchange](../../kerberos/tgs-exchange/README.md).
