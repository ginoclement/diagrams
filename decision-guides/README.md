# Decision Guides

Selection guides that answer **"which mechanism should I choose, and why?"** Each guide
is a decision **tree** (a `flowchart` whose leaves name a recommended mechanism and link
to that flow's folder), plus a comparison table and short rationale.

These guides do not re-draw the underlying flows — they route you to the right one in
`saml/`, `oidc/`, `kerberos/`, `tokenless/`, `cloud-iam/`, `workload-identity/`,
`authorization/`, and elsewhere.

## How to use these guides

1. Open the guide closest to your question.
2. Walk the `flowchart.md` decision tree from the top; each `{diamond}` is a selection
   criterion (client type, trust boundary, interactivity, compliance, scale).
3. Land on a leaf. Rounded leaves name the recommended mechanism; the **Leaf links**
   list under the diagram points to the chosen flow's folder.
4. Confirm tradeoffs and deprecation status in that guide's `comparison-table.md`.

## Guides

- [Choosing an authentication protocol](choosing-an-authentication-protocol/README.md) —
  SAML vs OIDC vs Kerberos vs tokenless.
- [Choosing an OAuth 2.0 grant](choosing-an-oauth-grant/README.md) — by client type.
- [Choosing an MFA factor](choosing-an-mfa-factor/README.md) — phishing-resistant vs
  push/TOTP vs SMS/voice.
- [Choosing a Kerberos delegation model](choosing-a-kerberos-delegation-model/README.md) —
  unconstrained vs constrained vs resource-based.
- [Choosing workload cloud auth](choosing-workload-cloud-auth/README.md) — static keys vs
  managed identity vs workload identity federation.
- [Choosing session vs token](choosing-session-vs-token/README.md) — server session cookie
  vs stateless JWT vs reference token.
- [Choosing an authorization model](choosing-an-authorization-model/README.md) — RBAC vs
  ABAC vs ReBAC vs PBAC.
- [SAML to OIDC migration](saml-to-oidc-migration/README.md) — when, why, and how to
  coexist.

## Conventions

See [`../CONVENTIONS.md`](../CONVENTIONS.md), "Decision-guide diagrams" and "Status and
deprecation callouts". Status emojis used below: ✅ Current, 🟡 Legacy, ⛔ Deprecated,
🔵 Emerging.
