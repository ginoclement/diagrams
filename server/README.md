# Training Path Leaderboard (optional backend)

A **tiny, zero-dependency** Node service that powers the optional leaderboard and cross-device
score sync for the [Training Path](https://ginoclement.github.io/diagrams/training/). The
training app works **fully offline without this** — XP, levels, badges, streaks, and progress
all live in the browser. Deploy this only if you want a shared leaderboard.

- One file (`server.mjs`), Node built-ins only — no `npm install`, no framework.
- Scores persist to a JSON file (mount a volume in production).
- CORS-enabled so the static GitHub Pages site can call it.

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + player count |
| `GET` | `/api/leaderboard?limit=25` | Top players by XP |
| `GET` | `/api/players/:id` | One player's record (cross-device sync) |
| `POST` | `/api/scores` | Upsert a score `{playerId,name,xp,level,levelName,badges,stages}` (never lowers a player's best XP) |

Config via env: `PORT` (8080), `DATA_FILE` (`./data/leaderboard.json`), `ALLOW_ORIGIN` (`*` — set to `https://ginoclement.github.io` in production), `MAX_NAME` (24).

## Run it

**Docker (recommended):**
```bash
cd server
docker compose up --build       # → http://localhost:8080/health
```

**Plain Node (no container):**
```bash
cd server && node server.mjs    # needs Node >= 18
```

## Deploy to a free/cheap platform

**Fly.io** (Docker, has a free-ish allowance, persistent volume):
```bash
cd server
flyctl launch --no-deploy --name your-app-name    # edit app name in fly.toml
flyctl volumes create leaderboard_data --size 1
flyctl deploy
# → https://your-app-name.fly.dev
```

**Render** (free web service): New → Web Service → this repo, root `server/`, Docker runtime.
Add a persistent disk mounted at `/app/data` (free tier disks are ephemeral — a disk keeps
scores across redeploys). Set `ALLOW_ORIGIN`.

**Railway / Koyeb:** point at `server/`, Dockerfile runtime, add a volume at `/app/data`.

**Deno Deploy / Cloudflare Workers** (no container, generous free tier): the logic is standard
HTTP; port `server.mjs` to `Deno.serve` / a Worker `fetch` handler and back it with Deno KV /
Workers KV instead of the file. (Left as an option; the Node/Docker path above is turnkey.)

## Point the site at it

Edit [`website/static/training/training-config.js`](../website/static/training/training-config.js):
```js
window.__LEADERBOARD_API__ = "https://your-app-name.fly.dev";
```
Commit + let the site redeploy. The leaderboard link then appears in the Training Path, and
scores submit automatically as learners earn XP. For a quick test without redeploying, append
`?api=https://your-app-name.fly.dev` to the training URL.

## Notes
- No accounts: a random `playerId` is generated per browser and stored locally; the display
  name is whatever the learner types. This is a friendly leaderboard, not an identity system.
- Basic hardening included: 4 KB body cap, per-IP write rate limit, field clamping/sanitizing,
  and best-XP-only updates. For anything higher-stakes, add auth and move to a real datastore.
