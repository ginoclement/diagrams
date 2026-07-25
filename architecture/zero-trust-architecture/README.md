# Zero Trust Architecture (NIST SP 800-207)

**Status:** ✅ Current

## What it shows

A NIST-style zero trust architecture: access to every resource is mediated by a
**Policy Decision Point (PDP)** — a Policy Engine plus a Policy Administrator — and
enforced at a **Policy Enforcement Point (PEP)** in front of each resource. There is
**no implicit trust based on network location**: being "inside the perimeter" grants
nothing. Every request is authenticated, authorized against context signals (identity,
device posture, risk, time), and **continuously re-verified** rather than trusted for the
life of a session.

This diagram shows the control-plane / data-plane split and the signal sources that feed
each access decision. The identity signals come from the
[IdP reference architecture](../identity-provider-reference-architecture/README.md); the
enforcement pattern generalizes the [API gateway](../api-gateway-authn-authz/README.md).

## Actors / components

| Component | Role |
|---|---|
| Subject | User or workload requesting access |
| Device / Endpoint | The client device whose posture is a decision input |
| Policy Enforcement Point (PEP) | Inline gate at each resource; allows, blocks, or terminates a session |
| Policy Decision Point (PDP) | The brain: Policy Engine + Policy Administrator |
| Policy Engine (PE) | Computes the trust/allow decision from policy + signals |
| Policy Administrator (PA) | Establishes/tears down the connection; issues session credentials to the PEP |
| Policy store | Access policies, roles, and rules the PE evaluates |
| Identity / IdP | Authenticates the subject; source of identity + MFA signals |
| Device posture / EDR | Reports device compliance, patch level, health |
| Threat / risk signals | SIEM, threat intel, behavior analytics, geolocation |
| Resource | The protected application, API, or data the subject wants |

## Trust boundaries & security notes

- **No network-location trust:** the PEP challenges every request regardless of source
  network. "Internal" traffic is treated exactly like internet traffic — see how this
  differs from [IP-allowlist network auth](../../tokenless/ip-allowlist-network-auth/README.md),
  which is the anti-pattern zero trust exists to replace.
- **Control plane vs data plane:** the PDP (PE + PA) is the control plane and never carries
  application data; the PEP is the data-plane gate. Compromising the data path does not by
  itself grant policy authority.
- **Decision is a function of signals, not a one-time login:** identity, device posture,
  and risk are combined per request. A device that falls out of compliance mid-session is
  denied on the next evaluation.
- **Continuous verification:** sessions are short and re-evaluated. The PA can revoke an
  established session when a signal changes (new risk alert, posture failure, credential
  revocation).
- **Least privilege / per-resource:** access is granted to a single resource for a single
  session, not to a network segment. Lateral movement is denied by default.
- **The PDP is a high-value target:** its integrity and the authenticity of its signal
  feeds must be protected; poisoned posture or risk data corrupts every decision.

## Related diagrams

- [IdP reference architecture](../identity-provider-reference-architecture/README.md) — the identity signal source
- [API gateway authN/authZ](../api-gateway-authn-authz/README.md) — a concrete PEP for APIs
- [Federation topology](../federation-topology/README.md) — where brokered identity enters the PDP
- [mTLS service mesh](../../network-security/mtls-service-mesh/README.md) — workload-to-workload zero trust
- [Mutual TLS client-cert auth](../../tokenless/mutual-tls/README.md) — device/workload identity for posture
- [IP-allowlist network auth](../../tokenless/ip-allowlist-network-auth/README.md) — the location-based model zero trust rejects

## Files

- [sequence.md](sequence.md) — a request evaluated by the PDP, with continuous re-verification
- [swimlane.md](swimlane.md) — control plane / data plane / signal sources across zones
- [flowchart.md](flowchart.md) — the PDP allow/deny decision from combined signals
