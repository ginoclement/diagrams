// @ts-check
// Docusaurus site that renders the existing diagram markdown (synced into ./docs by
// scripts/sync-docs.mjs) with mermaid enabled.

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Security & Identity Diagrams',
  tagline: 'A catalog of authentication, authorization, and identity flows',
  url: 'https://ginoclement.github.io',
  baseUrl: '/diagrams/',
  organizationName: 'ginoclement',
  projectName: 'diagrams',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'ignore',

  // Parse .md as CommonMark (not MDX) so prose containing { } and <...> is treated literally.
  markdown: { format: 'detect', mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'Security & Identity Diagrams',
        items: [
          { type: 'docSidebar', sidebarId: 'main', position: 'left', label: 'Browse' },
          { to: '/LEARNING-PATH', label: 'Learning Path', position: 'left' },
          { to: '/GLOSSARY', label: 'Glossary', position: 'left' },
          { href: 'https://github.com/ginoclement/diagrams', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        copyright: 'Security & Identity Diagram Repository',
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
      },
    }),
};

module.exports = config;
