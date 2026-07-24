# Breached Password Detection — Sequence Diagram

Happy path: the auth server hashes the candidate with SHA-1, sends only the 5-char
prefix to the range API, receives all matching suffixes, and matches locally.
Alternates: breached password rejected, a breach-count threshold, and an offline
bloom-filter variant with no network call.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (auth server)
    participant API as BreachAPI
    participant Dir as Directory

    %% ----- happy path (not breached) -----
    User->>Browser: Enter candidate password
    Browser->>IdP: POST /set-password (candidate over TLS)
    IdP->>IdP: Compute SHA1(candidate) = 40 hex chars
    IdP->>IdP: Split into prefix (5) + suffix (35)
    IdP->>API: GET /range/{prefix} (Add-Padding on)
    Note over IdP,API: Only the 5-char prefix leaves the server, never the password or full hash
    API-->>IdP: List of suffixes + breach counts for that prefix
    IdP->>IdP: Scan list locally for our suffix
    Note over IdP: Suffix not found -> password not in breach corpus
    IdP->>IdP: Run remaining policy + history checks
    IdP->>Dir: Store with slow salted hash (bcrypt/argon2)
    Dir-->>IdP: Stored
    IdP-->>Browser: Password accepted

    %% ----- alternates -----
    alt Breached -> reject
        IdP->>API: GET /range/{prefix}
        API-->>IdP: Suffixes for prefix
        IdP->>IdP: Our suffix IS in the list
        IdP-->>Browser: This password appeared in a breach, choose another
    end

    alt Count threshold
        IdP->>IdP: Suffix found with breach count = 4
        alt count > threshold (e.g. 10)
            IdP-->>Browser: Too widely breached, choose another
        else count <= threshold
            IdP->>Dir: Accept with warning, store hash
            IdP-->>Browser: Accepted (rarely seen, allowed)
        end
    end

    alt Offline bloom-filter variant (no network)
        IdP->>IdP: Check SHA1(candidate) against local bloom filter
        alt Bloom says possibly present
            IdP-->>Browser: Likely breached, choose another
        else Bloom says definitely absent
            IdP->>Dir: Store hash (no API call made)
            IdP-->>Browser: Password accepted
        end
    end
```
