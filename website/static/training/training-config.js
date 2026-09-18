/* Optional leaderboard backend.
 *
 * Leave this empty and the Training Path runs 100% locally (XP, levels, badges, streaks,
 * and progress all live in the browser — no network calls, no backend needed).
 *
 * To enable the shared leaderboard + cross-device submission, deploy the tiny service in
 * /server (see server/README.md — Docker, Fly.io, Render, or Deno Deploy) and set its URL:
 *
 *   window.__LEADERBOARD_API__ = "https://your-service.fly.dev";
 *
 * You can also enable it per-visit with ?api=https://your-service on the training URL.
 */
window.__LEADERBOARD_API__ = window.__LEADERBOARD_API__ || "";
