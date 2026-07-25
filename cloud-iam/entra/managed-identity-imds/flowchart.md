# Managed Identity via IMDS — Decision Flowchart

The identity-selection and validation gates on the token path, with explicit error terminals.

```mermaid
flowchart TD
    Start(["Workload needs a token for a resource"]) --> Header{"Metadata: true<br/>header present?"}
    Header -->|No| ErrHdr(["400 Bad Request:<br/>metadata header required"])
    Header -->|Yes| Kind{"System- or<br/>user-assigned identity?"}

    Kind -->|User-assigned| Spec{"client_id / object_id /<br/>mi_res_id supplied?"}
    Spec -->|"No, and 2+ attached"| ErrAmb(["400: multiple identities,<br/>specify which one"])
    Spec -->|Yes| Mint
    Kind -->|System-assigned| Mint["Entra mints access_token<br/>for the identity"]

    Mint --> Call["App calls API with Bearer token"]
    Call --> Valid{"Token valid?<br/>(signature, iss, aud, exp)"}
    Valid -->|No| ErrTok(["401 Unauthorized"])
    Valid -->|Yes| Rbac{"Identity has an RBAC role<br/>on the target resource?"}
    Rbac -->|No| ErrRbac(["403 Forbidden"])
    Rbac -->|Yes| Ok(["200 result"])
```

Notes

- The ambiguity terminal (`ErrAmb`) only fires for user-assigned identities when more than one is
  attached and none is named.
- Token validation (`Valid`) is authentication, the RBAC check (`Rbac`) is authorization — both
  must pass.
- A system-assigned identity skips the disambiguation gate entirely.
