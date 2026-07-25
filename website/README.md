# Documentation website

A [Docusaurus](https://docusaurus.io/) site that renders the diagram repository as a
browsable, searchable knowledge base with Mermaid diagrams.

The diagram content is **not duplicated** in git: `scripts/sync-docs.mjs` copies the domain
folders and top-level docs from the repository root into `docs/` at build time (that folder is
git-ignored), generating category labels and a landing page.

## Local development

```bash
cd website
npm install
npm start        # runs sync, then a live-reloading dev server
```

## Build

```bash
npm run build    # runs sync, then produces static HTML in website/build/
npm run serve    # preview the production build
```

## Deploy

The `.github/workflows/deploy-site.yml` workflow builds the site and publishes it to GitHub
Pages on every push to `master`. Enable Pages (Settings → Pages → Source: GitHub Actions) once.

## Embedding on another site

The build output in `website/build/` is fully static and can be hosted anywhere (S3/CloudFront,
Netlify, Nginx) or reverse-proxied under a path like `yourdomain.com/diagrams`. Set `url` and
`baseUrl` in `docusaurus.config.js` to match where it is hosted. Individual pages can also be
embedded via `<iframe>`.
