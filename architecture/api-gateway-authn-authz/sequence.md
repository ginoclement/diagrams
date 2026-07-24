# API Gateway AuthN/AuthZ — Sequence Diagram

A request traversing the gateway: TLS termination, token validation (JWT or introspection),
scope-based authorization, rate limiting, token exchange for the downstream hop, and
routing to a microservice. `alt`/`opt` cover opaque-vs-JWT tokens and failure terminals.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client / SPA / Mobile
    participant GW as API Gateway / BFF
    participant JWKS as JWKS Endpoint
    participant Introspect as Introspection Endpoint
    participant STS as Token Exchange (STS)
    participant Svc as Microservice

    Client->>GW: HTTPS request with bearer token (TLS terminates here)
    GW->>GW: Rate-limit check (per client / per route)

    alt JWT (self-contained) token
        GW->>JWKS: Fetch signing keys (cached by kid)
        JWKS-->>GW: Public keys
        GW->>GW: Verify signature, iss, aud, exp / nbf, alg allow-list
    else Opaque / reference token
        GW->>Introspect: POST token for validation
        Introspect-->>GW: active=true, scopes, sub, exp
    end

    alt Token valid
        GW->>GW: Authorize: required scope / claim for this route + method?
        alt Authorized
            opt Downstream needs a scoped credential
                GW->>STS: Exchange caller token for service-scoped token (RFC 8693)
                STS-->>GW: Downstream token (narrow aud + scope)
            end
            GW->>Svc: Route request with forwarded identity + scoped token
            Svc->>Svc: Trust gateway identity, apply business rules
            Svc-->>GW: Response
            GW-->>Client: 200 response
        else Insufficient scope
            GW-->>Client: 403 forbidden (authenticated but not authorized)
        end
    else Token invalid or expired
        GW-->>Client: 401 unauthorized (re-authenticate)
    end
```

Notes

- Rate limiting runs before any cryptographic work, step 2, so abusive callers are shed
  cheaply at the edge.
- Signature verification comes before any claim is trusted, step 7, keys are matched by
  kid from a cached JWKS and the algorithm is pinned to reject alg none.
- Authorization is a separate gate from authentication, a valid token that lacks the
  route's required scope still gets a 403, not a 200.
- Token exchange gives the microservice a narrowly scoped, audience-restricted credential
  instead of the caller's original token, containing blast radius per hop.
