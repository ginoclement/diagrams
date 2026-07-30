// Produces a single self-contained Flow Explorer with every flow inlined — no server or
// models/ directory needed, so it embeds via <iframe> anywhere. Writes:
//   static/explorer/standalone.html            (full HTML document, for the repo/site)
//   <scratchpad>/explorer-all-body.html        (body-only, for publishing as an Artifact)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXP = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'explorer');
const css = readFileSync(join(EXP, 'explorer.css'), 'utf8');
const js = readFileSync(join(EXP, 'explorer.js'), 'utf8');
const index = JSON.parse(readFileSync(join(EXP, 'models', 'index.json'), 'utf8'));
const flows = {};
for (const f of readdirSync(join(EXP, 'models'))) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  flows[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(EXP, 'models', f), 'utf8'));
}
// </script> can't appear literally inside an inline script; guard the JSON just in case.
const safe = (o) => JSON.stringify(o).replace(/<\//g, '<\\/');

const body =
`<style>${css}</style>
<div class="wrap"><div id="app"></div></div>
<script>window.__FLOW_INDEX__=${safe(index)};window.__FLOWS__=${safe(flows)};</script>
<script>${js}</script>`;

const full =
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flow Explorer — Authentication</title>
<meta name="description" content="Interactive, self-contained walkthrough of ${index.length} authentication flows with per-step request/response and DevTools guidance.">
</head>
<body>
${body}
</body>
</html>
`;

writeFileSync(join(EXP, 'standalone.html'), full);

// Optionally also emit a body-only fragment (used only for publishing an Artifact preview).
// Enabled by setting EXPLORER_BODY_OUT to a writable path; never required for the site build.
const bodyOut = process.env.EXPLORER_BODY_OUT;
if (bodyOut) {
  try { writeFileSync(bodyOut, body); } catch (e) { console.warn('Skipped body fragment:', e.message); }
}
console.log(`Standalone built with ${index.length} flows (${Math.round(full.length / 1024)} KB).`);
