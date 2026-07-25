# Application Default Credentials — Sequence Diagram

Happy path first (metadata server on GCP), then alternates: env-var config, invalid env-var
file, gcloud local credentials, and no credentials found.

```mermaid
sequenceDiagram
    autonumber
    participant App as App (client library)
    participant ADC as ADC resolver
    participant EnvVar as GOOGLE_APPLICATION_CREDENTIALS
    participant Gcloud as gcloud ADC file
    participant Metadata as Metadata Server

    App->>ADC: getApplicationDefault()
    ADC->>EnvVar: Is GOOGLE_APPLICATION_CREDENTIALS set?

    alt Env var not set - resolve down the chain
        EnvVar-->>ADC: Not set
        ADC->>Gcloud: application_default_credentials.json present?
        alt gcloud file present (local dev)
            Gcloud-->>ADC: User OAuth refresh token
            ADC-->>App: Credential (refreshes access tokens)
        else No gcloud file - try metadata (on GCP)
            ADC->>Metadata: GET .../service-accounts/default/token<br/>(Metadata-Flavor: Google)
            alt Running on GCP
                Metadata-->>ADC: Attached SA access token
                ADC-->>App: Credential (attached service account)
            else Not on GCP
                Metadata-->>ADC: Unreachable / timeout
                ADC-->>App: DefaultCredentialsError - no credentials found
            end
        end
    else Env var set and valid
        EnvVar-->>ADC: Path to JSON config
        ADC->>ADC: Load: SA key, external_account (WIF),<br/>or impersonated_service_account
        ADC-->>App: Credential from that config
    else Env var set but file missing/invalid
        EnvVar-->>ADC: Path does not exist / malformed JSON
        ADC-->>App: Error - does not fall through to other sources
    end
```

Notes

- Resolution is strictly ordered: env var, then gcloud user credentials, then the metadata
  server; the first source that yields a credential wins.
- A set-but-broken env var is a hard failure by design, so the app never silently uses a
  different identity further down the chain.
- An `external_account` config makes ADC perform the keyless
  [Workload Identity Federation](../workload-identity-federation/README.md) exchange transparently.
