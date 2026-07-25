// Repository validator: parses every mermaid block and checks every relative link.
// Usage: node tools/validate.mjs   (run from the repository root)
// Exit code 0 = all good, 1 = failures. Deps (mermaid, jsdom) live in tools/package.json.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = process.cwd();
const dom = new JSDOM('<!DOCTYPE html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
try { Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true }); } catch {}
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git' || e === 'node_modules') continue;
    const p = join(dir, e);
    (statSync(p).isDirectory()) ? walk(p, out) : out.push(p);
  }
  return out;
}
const all = walk(ROOT);
const files = all.filter(f => f.endsWith('.md'));

// --- HAR sample captures must be valid JSON ---
let hars = 0, hFail = 0;
for (const f of all.filter(f => f.endsWith('.har'))) {
  hars++;
  try { JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { hFail++; console.error(`HAR      ${relative(ROOT, f)}: ${String(e.message || e).split('\n')[0]}`); }
}

// --- mermaid ---
let blocks = 0, mFail = 0;
for (const f of files) {
  const re = /```mermaid\s*\n([\s\S]*?)```/g; let m;
  while ((m = re.exec(readFileSync(f, 'utf8'))) !== null) {
    blocks++;
    try { await mermaid.parse(m[1]); }
    catch (e) { mFail++; console.error(`MERMAID  ${relative(ROOT, f)}: ${String(e.message || e).split('\n')[0]}`); }
  }
}

// --- links ---
let links = 0, lFail = 0;
const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
for (const f of files) {
  let m; const src = readFileSync(f, 'utf8');
  while ((m = linkRe.exec(src)) !== null) {
    let t = m[1].trim();
    if (/^(https?:|mailto:|#)/.test(t)) continue;
    t = t.split('#')[0]; if (!t) continue;
    links++;
    if (!existsSync(resolve(dirname(f), t))) { lFail++; console.error(`LINK     ${relative(ROOT, f)} -> ${m[1]}`); }
  }
}

console.log(`\nmermaid: ${blocks - mFail}/${blocks} OK   links: ${links - lFail}/${links} OK   har: ${hars - hFail}/${hars} OK`);
process.exit(mFail + lFail + hFail ? 1 : 0);
