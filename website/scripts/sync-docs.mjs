// Copies the repository's diagram content into website/docs so Docusaurus can render it,
// and generates _category_.json files (nice labels + generated index pages) plus a landing.
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.cwd();          // website/
const REPO = join(SITE, '..');
const DOCS = join(SITE, 'docs');

const DOMAINS = [
  'authentication', 'authorization', 'identity-lifecycle', 'privileged-access',
  'workload-identity', 'platforms', 'infrastructure', 'threat-defense', 'reference',
];
const ROOTDOCS = ['LEARNING-PATH.md', 'GLOSSARY.md', 'CONVENTIONS.md', 'CONTRIBUTING.md',
  'DEPRECATED.md', 'STATUS.md', 'FUTURE.md', 'BACKLOG.md'];

rmSync(DOCS, { recursive: true, force: true });
mkdirSync(DOCS, { recursive: true });

for (const d of DOMAINS) cpSync(join(REPO, d), join(DOCS, d), { recursive: true });
for (const f of ROOTDOCS) if (existsSync(join(REPO, f))) cpSync(join(REPO, f), join(DOCS, f));

const ACR = { oidc: 'OIDC', saml: 'SAML', cicd: 'CI/CD', mtls: 'mTLS', mfa: 'MFA', jml: 'JML',
  ldap: 'LDAP', imds: 'IMDS', imdsv2: 'IMDSv2', irsa: 'IRSA', pkce: 'PKCE', ciba: 'CIBA',
  dpop: 'DPoP', par: 'PAR', jarm: 'JARM', jar: 'JAR', ropc: 'ROPC', rbac: 'RBAC', abac: 'ABAC',
  rebac: 'ReBAC', pbac: 'PBAC', xacml: 'XACML', pdp: 'PDP', pep: 'PEP', scim: 'SCIM', sso: 'SSO',
  slo: 'SLO', ecp: 'ECP', aws: 'AWS', gcp: 'GCP', iam: 'IAM', pim: 'PIM', pam: 'PAM', jit: 'JIT',
  spiffe: 'SPIFFE', spire: 'SPIRE', tls: 'TLS', vpn: 'VPN', dmz: 'DMZ', waf: 'WAF', aitm: 'AiTM',
  est: 'EST', scep: 'SCEP', rar: 'RAR', dcr: 'DCR', b2b: 'B2B', cae: 'CAE', prt: 'PRT',
  whfb: 'WHfB', idp: 'IdP', oauth: 'OAuth', oidc4: 'OIDC', entra: 'Entra', gke: 'GKE', iap: 'IAP',
  adc: 'ADC', sts: 'STS', sigv4: 'SigV4', ntlm: 'NTLM', totp: 'TOTP', fido2: 'FIDO2', ip: 'IP' };
const label = (name) => name.split('-')
  .map((w) => ACR[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1)))
  .join(' ');

// Add a _category_.json to every subdirectory: label always; generated-index only when the
// folder has no README/index to serve as its own landing page.
function categorize(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (!statSync(p).isDirectory()) continue;
    const hasIndex = existsSync(join(p, 'README.md')) || existsSync(join(p, 'index.md'));
    const cat = { label: label(e) };
    if (!hasIndex) cat.link = { type: 'generated-index' };
    writeFileSync(join(p, '_category_.json'), JSON.stringify(cat, null, 2));
    categorize(p);
  }
}
categorize(DOCS);

// Landing page (kept link-light to avoid build warnings; the sidebar is the main nav).
writeFileSync(join(DOCS, 'intro.md'),
  `---\nslug: /\ntitle: Overview\nsidebar_position: 0\n---\n\n` +
  `# Security & Identity Diagrams\n\n` +
  `A cross-referenced catalog of authentication, authorization, and identity flows, drawn in ` +
  `Mermaid. Most flows have a **sequence**, **swimlane**, and **flowchart** view, and the ` +
  `authentication flows add **hands-on** pages (client snippets, a "read it in DevTools" ` +
  `walkthrough, and sanitized sample captures).\n\n` +
  `New here? Start with the [Learning Path](LEARNING-PATH). Browse everything from the sidebar. ` +
  `Look up terms in the [Glossary](GLOSSARY).\n\n` +
  `**Domains:** ${DOMAINS.map(label).join(' · ')}.\n`);

console.log('Synced repository content into website/docs.');
