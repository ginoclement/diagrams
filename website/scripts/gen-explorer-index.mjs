// Builds static/explorer/models/index.json from the per-flow model files, so the Explorer
// picker can list every flow. Run after adding or changing models.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELS = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'explorer', 'models');
const out = [];
for (const f of readdirSync(MODELS)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  const m = JSON.parse(readFileSync(join(MODELS, f), 'utf8'));
  out.push({ id: f.replace(/\.json$/, ''), title: m.title, category: m.category || 'Other', steps: (m.steps || []).length });
}
out.sort((a, b) => (a.category + a.title).localeCompare(b.category + b.title));
writeFileSync(join(MODELS, 'index.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote index.json with ${out.length} flows.`);
