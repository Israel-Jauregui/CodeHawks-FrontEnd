// Runs after `vite build`. Renders the app into dist/index.html, adds the Organization
// structured data and writes the sitemap, so crawlers and link previews that do not run
// JavaScript still get the full page. The browser then hydrates this markup.
import { readFile, writeFile } from 'node:fs/promises';
import { StrictMode, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const file = new URL('../dist/index.html', import.meta.url);
const placeholder = '<div id="root"></div>';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const { organizationJsonLd } = await vite.ssrLoadModule('/src/lib/structured-data.ts');
  const { club } = await vite.ssrLoadModule('/src/constants/club.ts');

  const template = await readFile(file, 'utf8');
  if (!template.includes(placeholder) || !template.includes('</head>')) throw new Error('dist/index.html is not the expected template.');

  const markup = renderToString(createElement(StrictMode, null, createElement(App)));
  if (!markup.includes('<h1')) throw new Error('Prerendered markup has no <h1>.');
  // The site's Content Security Policy blocks style attributes, so one in the markup is a bug.
  if (/\sstyle="/.test(markup)) throw new Error('Prerendered markup has an inline style attribute, which the CSP blocks.');

  // A JSON data block is not executed, so the site's script-src 'self' CSP allows it.
  const jsonLd = JSON.stringify(organizationJsonLd()).replaceAll('<', '\\u003c');
  await writeFile(file, template
    .replace('</head>', () => `  <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
    .replace(placeholder, () => `<div id="root">${markup}</div>`));

  const today = new Date().toISOString().slice(0, 10);
  await writeFile(new URL('../dist/sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${club.siteUrl}</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`);
} finally {
  await vite.close();
}
