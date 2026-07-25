---
title: "Session Cookie Authentication — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session Cookie Authentication — Client Snippets

Runnable client snippets for the session-cookie login flow. Everything below is
**synthetic** — the host, credentials, session ID, and CSRF token are placeholders,
not real values. Replace `app.example.com`, `alice`, and the secrets with your own.

## 1. Fetch the login page (get the anti-CSRF token)

```bash
# The login form embeds a CSRF token bound to a pre-auth session.
curl -i -c cookies.txt https://app.example.com/login
# -> 200 OK
# -> Set-Cookie: sid=PRE_AUTH_0000aaaa1111bbbb2222cccc; HttpOnly; Secure; SameSite=Lax; Path=/
# The HTML contains: <input name="csrf_token" value="csrf-SYNTHETIC-3f9a...">
```

## 2. Submit credentials (login POST → new session cookie)

```bash
curl -i -b cookies.txt -c cookies.txt \
  -X POST https://app.example.com/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=alice" \
  --data-urlencode "password=correct-horse-battery-staple" \
  --data-urlencode "csrf_token=csrf-SYNTHETIC-3f9a"
# -> 303 See Other, Location: /dashboard
# -> Set-Cookie: sid=s%3AsynthSESSION9f8e7d6c5b4a3210; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800
# The session ID is ROTATED here (session-fixation defense): the post-login sid
# differs from the PRE_AUTH_ one issued in step 1.
```

## 3. Authenticated request (cookie replayed automatically)

```bash
curl -i -b cookies.txt https://app.example.com/api/me
# -> Cookie: sid=s%3AsynthSESSION9f8e7d6c5b4a3210
# -> 200 OK  {"user":"alice","roles":["member"]}
```

## 4. Logout (destroy server-side session, clear cookie)

```bash
curl -i -b cookies.txt -c cookies.txt \
  -X POST https://app.example.com/logout \
  --data-urlencode "csrf_token=csrf-SYNTHETIC-3f9a"
# -> Set-Cookie: sid=; Max-Age=0; Path=/   (and the server deletes the store record)
```

## SDK / library example (Node.js, tough-cookie jar)

A cookie jar mirrors what a browser does: keep the `Set-Cookie` from login, then
send it back as `Cookie` on later requests.

```js
// npm i tough-cookie
import { CookieJar } from "tough-cookie";

const jar = new CookieJar();
const base = "https://app.example.com";

// --- login: capture Set-Cookie ---
const login = await fetch(`${base}/login`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    username: "alice",
    password: "correct-horse-battery-staple",
    csrf_token: "csrf-SYNTHETIC-3f9a",
  }),
  redirect: "manual",
});
for (const c of login.headers.getSetCookie()) {
  await jar.setCookie(c, base); // stores sid=s%3AsynthSESSION9f8e7d6c5b4a3210
}

// --- authenticated request: replay Cookie ---
const me = await fetch(`${base}/api/me`, {
  headers: { Cookie: await jar.getCookieString(base) },
});
console.log(await me.json()); // { user: "alice", roles: ["member"] }
```

---

**Synthetic note:** every credential, session ID, and CSRF token above is fabricated
for documentation. No real account, secret, or personal data is represented.
