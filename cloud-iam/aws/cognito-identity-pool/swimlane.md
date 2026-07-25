# Cognito Identity Pool — Swimlane Diagram

One lane per actor. The identity pool turns a provider token into AWS credentials, choosing
the authenticated or unauthenticated role.

```mermaid
flowchart TD
    subgraph App["App (mobile/web)"]
        A1["Authenticate at login provider"]
        A2["GetId with Logins map"]
        A3["GetCredentialsForIdentity"]
        A4["Receive AWS temp credentials"]
        A5(["Call AWS service with SigV4"])
    end

    subgraph LP["Login Provider"]
        L1["Issue ID token (JWT)"]
    end

    subgraph IP["Identity Pool"]
        N1["Return IdentityId"]
        N2{"Logins present<br/>and token valid?"}
        N3{"Role mapping rule<br/>matches a claim?"}
        N4["Select authenticated role<br/>(default or mapped)"]
        N5["Select unauthenticated role<br/>(guest)"]
        N6(["NotAuthorized"])
    end

    subgraph STS
        T1["Assume selected role,<br/>mint temporary credentials"]
    end

    subgraph API["AWS Service API"]
        P1["Authorize vs role policy"]
        P2["Return data"]
    end

    A1 --> L1 --> A2 --> N1 --> A3 --> N2
    N2 -->|"No token - guest"| N5 --> T1
    N2 -->|"Token invalid"| N6
    N2 -->|"Valid"| N3
    N3 -->|Yes| N4
    N3 -->|"No - default"| N4
    N4 --> T1 --> A4 --> A5 --> P1 --> P2
```

Notes

- The enhanced flow performs the `T1` assume inside Cognito; the classic flow moves it into
  the App lane via `AssumeRoleWithWebIdentity`.
- Guest access (`N5`) is reachable with no login token, so its role must be minimal or
  disabled.
- Role trust policies gate on `cognito-identity.amazonaws.com:aud` (pool ID) and `amr`
  (authenticated vs unauthenticated) — see [flowchart.md](flowchart.md).
