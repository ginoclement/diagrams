# AssumeRoleWithSAML — Decision Flowchart

Assertion validation and trust-policy gates STS applies, with explicit deny terminals.

```mermaid
flowchart TD
    Start(["IdP posts SAML assertion to AWS<br/>(AssumeRoleWithSAML)"]) --> Prov{"Issuer matches a configured<br/>IAM SAML provider?"}
    Prov -->|No| ErrProv(["AccessDenied: unknown SAML issuer"])
    Prov -->|Yes| Sig{"Assertion signature valid<br/>against IdP metadata cert?"}

    Sig -->|No| ErrSig(["403: invalid SAML response (signature)"])
    Sig -->|Yes| Time{"Within NotBefore /<br/>NotOnOrAfter window?"}

    Time -->|No| ErrTime(["403: assertion expired or not yet valid"])
    Time -->|Yes| Aud{"SAML:aud =<br/>signin.aws.amazon.com/saml?"}

    Aud -->|No| ErrAud(["AccessDenied: audience not AWS"])
    Aud -->|Yes| RoleAttr{"Role attribute present<br/>with RoleARN,PrincipalARN?"}

    RoleAttr -->|No| ErrRole(["AccessDenied: no role in assertion"])
    RoleAttr -->|"Multiple values"| Pick["User selects a role<br/>on AWS selection page"] --> Trust
    RoleAttr -->|"Single value"| Trust{"Role trust policy allows<br/>sts:AssumeRoleWithSAML for this<br/>PrincipalArn + SAML:aud condition?"}

    Trust -->|No| ErrTrust(["AccessDenied: trust policy"])
    Trust -->|Yes| Mint["Mint temporary credentials"]
    Mint --> Issue(["Console sign-in token / CLI credentials"])
```

Notes

- The `SAML:aud` gate is doubly important: STS checks it and the trust policy should also
  condition on it, so an assertion for another SP cannot be replayed against AWS.
- Signature validation uses the certificate published in the IdP metadata stored on the IAM
  SAML provider — never a certificate embedded only in the assertion.
- Multiple `Role` values branch to the role-selection page before the trust-policy gate.
