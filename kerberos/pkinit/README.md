# PKINIT (Certificate / Smart-Card Initial Authentication)

## Purpose

PKINIT (Public Key Cryptography for Initial Authentication, RFC 4556) replaces
the password-derived pre-authentication of the [AS Exchange](../as-exchange/README.md)
with **public-key cryptography**. The client signs an **AuthPack** with the
private key of an X.509 certificate (typically on a **smart card** / Windows
Hello for Business); the KDC validates the certificate chain and maps it to an
account, then issues a TGT. This is the foundation of smart-card logon.

## When it is used

- Smart-card / PIV / CAC logon and Windows Hello for Business.
- Passwordless / phishing-resistant authentication to a Kerberos realm.
- Any environment issuing user certificates from an enterprise CA trusted by
  the KDC (`NTAuth` store in Active Directory).

## Actors

| Actor | Role |
|---|---|
| `User` | Presents smart card + PIN |
| `Client` | Logon process using the card's private key |
| `AS` | Authentication Service lane of the KDC |
| `CA` | Certificate authority / trust + revocation source (CRL/OCSP) |

## Key message contents

- **AS-REQ / PA-PK-AS-REQ**: `signedAuthPack` = CMS `SignedData` over
  `{ pkAuthenticator (cusec, ctime, nonce), clientPublicValue (DH params) }`,
  signed with the client cert private key; the client certificate is included.
- **AS-REP / PA-PK-AS-REP**: either **DH mode** (`dhSignedData` — KDC's DH
  contribution, signed) or **public-key mode** (`encKeyPack` — reply key
  encrypted to the client's public key). The reply key protects the normal
  AS-REP enc-part carrying `SK-TGT`; the TGT itself is encrypted with the
  krbtgt key as usual.

## Alternate / error scenarios

- **Revoked certificate** — CRL/OCSP shows the cert revoked:
  `KDC_ERR_REVOKED_CERTIFICATE`.
- **Missing certificate mapping** — no account maps to the certificate (no
  `altSecurityIdentities` / UPN SAN match): `KDC_ERR_CLIENT_NOT_TRUSTED` /
  `NT_AUTH` failure.
- **Untrusted issuer** — issuing CA not in the KDC's NTAuth store:
  `KDC_ERR_CANT_VERIFY_CERTIFICATE`.
- **Clock skew** — `pkAuthenticator` time outside window:
  `KRB_AP_ERR_SKEW`.

## Security notes

- Strong certificate **mapping** is critical: after recent hardening, weak
  implicit UPN mapping is deprecated in favor of strong SID-bound mappings —
  weak mappings enabled certificate-spoofing escalations.
- Enforce **revocation checking** (CRL/OCSP); a stale or unreachable CRL should
  fail closed for high-assurance realms.
- Private keys held on **hardware** (smart card / TPM) give phishing-resistant,
  non-exportable credentials.
- Certificate-based auth complements [Mutual TLS](../../tokenless/mutual-tls/README.md),
  which uses the same X.509 credentials at the TLS layer.

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [AS Exchange](../as-exchange/README.md) — the password-based initial exchange PKINIT replaces.
- [TGS Exchange](../tgs-exchange/README.md) — next step once the TGT is issued.
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — certificate authentication at the TLS layer.
