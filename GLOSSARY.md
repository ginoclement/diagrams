---
title: "Glossary & Diagram Legend"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Glossary & Diagram Legend

## Legend

**Status badges** (top of each diagram README):

| Badge | Meaning |
|---|---|
| ✅ Current | Recommended / in active use |
| 🟡 Legacy | Still valid, but newer options are preferred |
| ⛔ Deprecated | Actively discouraged — see the "Use instead" pointer |
| 🔵 Emerging | Newer standard, not yet ubiquitous |

**Diagram files** in each folder:

| File | What it shows |
|---|---|
| `sequence.md` | Message-level exchange over time (`sequenceDiagram`) |
| `swimlane.md` | Responsibilities per actor (one `subgraph` lane each) |
| `flowchart.md` | Decision and error logic, with explicit deny/error terminals |
| `comparison-table.md` | (decision guides) options compared side by side |

**Flowchart shapes:** `{diamond}` = decision · `(["rounded"])` = terminal/outcome · `["box"]` = step.

## Acronyms

| Term | Meaning |
|---|---|
| ABAC | Attribute-Based Access Control |
| ACS | Assertion Consumer Service (SAML SP endpoint) |
| ADC | Application Default Credentials (GCP) |
| AiTM | Adversary-in-the-Middle |
| AS | Authentication Service (Kerberos KDC component) |
| CAE | Continuous Access Evaluation |
| CIBA | Client-Initiated Backchannel Authentication |
| CSR | Certificate Signing Request |
| DPoP | Demonstrating Proof-of-Possession (RFC 9449) |
| Entra ID | Microsoft's IdP (formerly Azure Active Directory / Azure AD) |
| FIDO2 | Fast IDentity Online 2 (WebAuthn + CTAP) |
| IdP | Identity Provider |
| IMDS | Instance Metadata Service (cloud instance credentials) |
| IRSA | IAM Roles for Service Accounts (AWS EKS) |
| JAR / JARM | JWT-Secured Authorization Request / Response Mode |
| JIT | Just-In-Time (privilege elevation) |
| JML | Joiner / Mover / Leaver |
| JWKS | JSON Web Key Set |
| JWT | JSON Web Token |
| KDC | Key Distribution Center (Kerberos) |
| LDAP | Lightweight Directory Access Protocol |
| MDM | Mobile Device Management |
| mTLS | Mutual TLS |
| NHI | Non-Human Identity |
| OIDC | OpenID Connect |
| OPA | Open Policy Agent (Rego policies) |
| PAM / PIM | Privileged Access / Identity Management |
| PAR | Pushed Authorization Requests (RFC 9126) |
| PBAC | Policy-Based Access Control |
| PDP / PEP / PIP / PAP | Policy Decision / Enforcement / Information / Administration Point |
| PKCE | Proof Key for Code Exchange (RFC 7636) |
| PRT | Primary Refresh Token (Entra) |
| RAR | Rich Authorization Requests (RFC 9396) |
| RBAC | Role-Based Access Control |
| ReBAC | Relationship-Based Access Control (Google Zanzibar) |
| ROPC | Resource Owner Password Credentials (deprecated grant) |
| SAML | Security Assertion Markup Language |
| SCEP / EST | Simple Certificate Enrollment Protocol / Enrollment over Secure Transport |
| SCIM | System for Cross-domain Identity Management |
| SLO | Single Logout (SAML) |
| SP | Service Provider (SAML relying party) |
| SPIFFE / SPIRE | Secure Production Identity Framework For Everyone / its runtime |
| SSPR | Self-Service Password Reset |
| STS | Security Token Service |
| SVID | SPIFFE Verifiable Identity Document |
| TGS / TGT | Ticket-Granting Service / Ticket (Kerberos) |
| WHfB | Windows Hello for Business |
| WIF | Workload Identity Federation |
