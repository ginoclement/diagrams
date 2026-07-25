# Authorization Models

Authentication answers **"who are you?"**; authorization answers **"what are you allowed to
do?"** Everything in this repository's other categories (SAML, OIDC, Kerberos, tokenless,
platform-specific) is primarily about **authentication** — proving identity and establishing a
session or token. This category covers the **authorization** half: how a system decides whether
an authenticated (or anonymous) subject may perform an action on a resource.

A useful mental split:

- **Coarse-grained, token-time authorization** — decisions baked into a token at issuance:
  OAuth scopes, group/role claims, audience restrictions. Fast, but static for the token's lifetime.
- **Fine-grained, runtime authorization** — decisions made per request against current data:
  "can user U edit document D right now?" This is where RBAC, ABAC, ReBAC, and policy engines live.

The models below are not mutually exclusive — real systems layer them (e.g. a coarse scope check
at the gateway plus a fine-grained ReBAC check in the service). They differ in **what the decision
is a function of**: roles, attributes, relationships, or externalized policy.

## Diagrams

| Diagram | Description |
|---|---|
| [rbac](rbac/README.md) | Role-Based Access Control: users are granted roles, roles bundle permissions; role hierarchy and the "role explosion" pitfall. |
| [abac](abac/README.md) | Attribute-Based Access Control: decisions computed from subject, resource, action, and environment attributes evaluated against policies. |
| [rebac-zanzibar](rebac-zanzibar/README.md) | Relationship-Based Access Control on the Google Zanzibar model: relation tuples, usersets, Check/Expand, and consistency zookies. |
| [pbac-policy-engine](pbac-policy-engine/README.md) | Policy-Based Access Control with an externalized engine (OPA/Rego, AWS Cedar): PEP calls PDP, policy bundles, decision logs. |
| [xacml-pdp-pep](xacml-pdp-pep/README.md) | The classic XACML reference architecture and request/response: PEP, PDP, PIP, PAP, obligations and advice. |
| [scopes-claims-entitlements](scopes-claims-entitlements/README.md) | How OAuth scopes, ID-token claims, and fine-grained entitlements relate; coarse token authZ vs fine-grained runtime authZ. |
| [policy-decision-enforcement](policy-decision-enforcement/README.md) | The generic PEP/PDP/PIP/PAP decision-and-enforcement pattern applied at an API gateway or sidecar. |
| [oauth-consent-authorization](oauth-consent-authorization/README.md) | User consent, admin consent, and incremental/step-up consent as an authorization mechanism for delegated access. |

## Related categories

- [OIDC flows](../oidc/README.md) — issues the tokens whose scopes and claims feed coarse
  authorization; see [scopes-claims-entitlements](scopes-claims-entitlements/README.md).
- [SAML flows](../saml/README.md) — assertions can carry attribute statements consumed by ABAC.
- [User lifecycle](../user-lifecycle/README.md) — provisioning and deprovisioning of the role and
  group memberships that RBAC and ABAC read.
- [Reference architecture](../architecture/identity-provider-reference-architecture/README.md) —
  where a PDP/policy engine sits relative to the IdP and resource servers.

## More diagrams

- [OAuth Consent as an Authorization Mechanism](./oauth-consent-authorization/README.md)
- [Policy Decision and Enforcement (PEP / PDP / PIP / PAP)](./policy-decision-enforcement/README.md)
- [Scopes, Claims, and Entitlements](./scopes-claims-entitlements/README.md)
