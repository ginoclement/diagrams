# Application Default Credentials (ADC)

**Status:** ✅ Current

## What it is

The credential-discovery convention that Google Cloud client libraries and `gcloud` use to find
credentials automatically, without hard-coding keys. When code calls
`GoogleCredentials.getApplicationDefault()` (or the equivalent in any language SDK), the library
walks a **fixed resolution order** and uses the first credential source it finds:

1. **`GOOGLE_APPLICATION_CREDENTIALS`** environment variable → path to a credential JSON
   (service account key, or an external-account / impersonation config for
   [Workload Identity Federation](../workload-identity-federation/README.md)).
2. **gcloud user credentials** → the well-known file written by
   `gcloud auth application-default login`
   (`~/.config/gcloud/application_default_credentials.json`).
3. **Attached service account via the metadata server** → on GCE, GKE, Cloud Run, Cloud
   Functions, App Engine, the runtime's SA token from `metadata.google.internal`.

The first source that yields a credential wins; the search stops there.

## When it is used

- Essentially every Google Cloud client-library call that does not pass explicit credentials.
- Local development (gcloud login), CI (env-var config), and production (metadata server) all
  work through the same code path with no code change.

## Actors

| Actor | Role |
|---|---|
| App | Application code invoking a Google client library |
| ADC | The credential-resolution logic inside the library |
| EnvVar | `GOOGLE_APPLICATION_CREDENTIALS` file source, if set |
| Gcloud | Well-known gcloud application-default credentials file |
| Metadata | Compute metadata server providing the attached SA token |

## Key resolution details

- The env-var file may be a plain SA key (⛔ discouraged), an **external_account** config
  (WIF, keyless), or an **impersonated_service_account** config that wraps a source credential.
- The gcloud file holds user OAuth credentials (a refresh token) obtained by
  `gcloud auth application-default login` — for local dev, not production.
- The metadata endpoint is
  `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`
  and requires the header `Metadata-Flavor: Google`.
- You can override the target identity with `--impersonate-service-account` or an impersonation
  config, so ADC returns tokens for another SA.

## Alternate scenarios covered

- Env var set but file missing/invalid → hard error (ADC does not silently fall through).
- No env var, no gcloud file, not on GCP → `DefaultCredentialsError` / "could not find credentials".
- Env var points at a WIF external-account config → federated + impersonated token.

## Security notes

- Prefer the metadata server (production) and WIF/impersonation configs over pointing the env var
  at a downloadable SA key — keys are long-lived secrets.
- ADC on a developer laptop uses that developer's user credentials; do not assume it reflects a
  service account's permissions when testing.
- A missing-but-set env var fails loudly by design, preventing accidental use of a different,
  unexpected identity lower in the chain.

## Related diagrams

- [Workload Identity Federation](../workload-identity-federation/README.md) — external_account configs ADC can load
- [GKE Workload Identity](../gke-workload-identity/README.md) — the metadata-server source inside GKE pods
- [Service Account Impersonation](../service-account-impersonation/README.md) — impersonated_service_account configs
- OAuth to Google APIs *(planned)* — where gcloud user credentials come from

## Files

- [sequence.md](sequence.md) — resolution walk plus env-var-invalid and no-credentials alternates
- [swimlane.md](swimlane.md) — lanes for App, ADC, EnvVar, Gcloud, Metadata
- [flowchart.md](flowchart.md) — the ordered source-selection decision tree with error terminals
