---
title: "RP-Initiated Logout — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout — Reading it in DevTools

Open DevTools (F12 / Cmd+Opt+I), go to the **Network** tab, enable **Preserve log** (this
flow is a chain of redirects — without it the early hops vanish), and filter per step.
This whole flow is browser-visible. See [README](./README.md).

## Step by step

1. **Click "Log out" — the RP local-logout request.**
   - Filter: `logout`
   - Request: `GET https://rp1.example.com/logout`
   - Read the **Response**: a `302` and a `Set-Cookie: rp1_session=; Max-Age=0` — the RP
     kills its own session *before* handing off. Confirm the cookie is actually cleared.
   - Read the **Location** header: it points at the IdP `end_session_endpoint` with
     `id_token_hint`, `post_logout_redirect_uri`, and `state` query params.

2. **The IdP end_session request.**
   - Filter: `end_session`
   - Request: `GET https://idp.example.com/end_session?id_token_hint=...&post_logout_redirect_uri=...&state=af0ifjsldkj`
   - Read the **Query String Parameters**:
     - `id_token_hint` — decode the JWT (jwt.io or the Auth Inspector extension) to read
       `sub` and `sid`; this is how the IdP identifies which session to end and skips the
       confirmation prompt. See [samples/README.md](./samples/README.md) for the decode.
     - `post_logout_redirect_uri` — must exactly match one registered for the client.
     - `state` — opaque value that should come back unchanged.
   - Read the **Request Cookies**: the IdP session cookie is sent here; the response should
     clear it (`Set-Cookie` with `Max-Age=0`).

3. **The post-logout redirect back to the RP.**
   - Filter: `loggedout`
   - Request: `GET https://rp1.example.com/loggedout?state=af0ifjsldkj`
   - Read: the `state` query param — the RP compares it to what it stored. If the
     `post_logout_redirect_uri` had **not** been registered, this hop would not happen and
     you'd instead land on the IdP's own logged-out page (an unregistered URI must never
     become an open redirect).

## Alternate: confirmation prompt (no / invalid `id_token_hint`)

- If `id_token_hint` is missing, the `end_session` response is **not** a `302` but a
  `200` HTML page ("Do you want to log out?"). In the Network tab you'll see the GET
  return a document, then a `POST` to the IdP when the user confirms.

> **Note on propagation:** if this deployment chains into
> [Front-Channel Logout](../front-channel-logout/README.md), you'll ALSO see hidden
> `frontchannel-logout` iframe requests on the IdP page. If it chains into
> [Back-Channel Logout](../back-channel-logout/README.md), those `logout_token` POSTs are
> **server-to-server and will NOT appear in DevTools** — capture them on the RP instead.
