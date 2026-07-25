# Application Default Credentials — Decision Flowchart

The ordered source-selection logic with explicit error terminals.

```mermaid
flowchart TD
    Start(["Library needs credentials"]) --> Q1{"GOOGLE_APPLICATION_CREDENTIALS<br/>set?"}
    Q1 -->|Yes| Q2{"File exists and<br/>parses?"}
    Q2 -->|No| E1(["Error: invalid credentials file<br/>(no fall-through)"])
    Q2 -->|Yes| Kind{"Config type?"}
    Kind -->|"service_account key"| C1(["Use SA key (discouraged)"])
    Kind -->|"external_account"| C2(["WIF exchange -> federated token"])
    Kind -->|"impersonated_service_account"| C3(["Impersonate -> SA token"])

    Q1 -->|No| Q3{"gcloud ADC file present?"}
    Q3 -->|Yes| C4(["Use gcloud user credentials (local dev)"])
    Q3 -->|No| Q4{"Metadata server reachable?"}
    Q4 -->|Yes| C5(["Use attached SA token (on GCP)"])
    Q4 -->|No| E2(["DefaultCredentialsError:<br/>no credentials found"])
```

Notes

- The three env-var config types all resolve through the same env-var branch; only `external_account`
  and `impersonated_service_account` are keyless and preferred.
- The chain is short-circuit: the first branch that produces a credential ends the search, so
  ordering (env → gcloud → metadata) determines which identity the app runs as.
- A set-but-broken env var (`E1`) never falls through to gcloud or metadata, preventing silent
  identity substitution.
