// Load every prerendered page in a real browser and assert it rehydrated.
//
//   CHROME_BIN=/usr/bin/chromium npm run verify:ssr
//
// This is the check that catches the failure mode prerendering exists to avoid.
// `_renderMode` is a private Ember API on both the serialize and the rehydrate
// side; if a version bump changes it, the build still succeeds and every page
// still looks right in `curl` — the app just silently renders a second copy of
// itself over the prerendered DOM in the browser. Only a real browser sees it.
//
// Not part of `npm run build`: the build image has no Chrome. Run it in CI, or
// locally after a build.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

import { PRERENDER_ROUTES } from './routes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

// Mirrors config/frontend/prerender.conf in the app repo: exact file, then
// <route>.html, then the pristine shell. Verifying against different resolution
// rules than production uses would prove nothing.
async function resolveFile(urlPath) {
  const candidates =
    urlPath === '/'
      ? [join(distDir, 'index.html')]
      : [
          join(distDir, urlPath),
          join(distDir, `${urlPath}.html`),
          join(distDir, 'app-shell.html'),
        ];

  for (const candidate of candidates) {
    try {
      return { body: await readFile(candidate), path: candidate };
    } catch {
      /* next */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const found = await resolveFile(urlPath);

  if (!found) {
    res.writeHead(404).end('not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(found.path)] ?? 'application/octet-stream',
  });
  res.end(found.body);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failed = 0;

for (const route of PRERENDER_ROUTES) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(origin + route, { waitUntil: 'networkidle0' });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

  const result = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_COMMENT,
    );
    let markers = 0;
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.startsWith('%')) markers++;
    }
    return {
      h1: document.querySelectorAll('h1').length,
      roots: document.body.querySelectorAll(':scope > div').length,
      markers,
      text: document.body.innerText.trim().length,
    };
  });

  await page.close();

  const problems = [];
  // The double-render signature: Ember appended a live copy beside the static
  // one instead of adopting it.
  if (result.h1 !== 1) problems.push(`expected 1 <h1>, found ${result.h1}`);
  if (result.roots !== 1)
    problems.push(`expected 1 root div, found ${result.roots}`);
  // Rehydration consumes the boundary markers; leftovers mean it bailed out.
  if (result.markers !== 0)
    problems.push(`${result.markers} serialize markers left in the DOM`);
  if (result.text === 0) problems.push('page rendered no text');
  if (errors.length)
    problems.push(`console: ${errors.slice(0, 3).join(' | ')}`);

  if (problems.length) {
    console.error(`✗ ${route}\n    ${problems.join('\n    ')}`);
    failed++;
  } else {
    console.log(
      `✓ ${route}  h1=${result.h1}  roots=${result.roots}  markers=${result.markers}  ${result.text} chars`,
    );
  }
}

await browser.close();
server.close();

console.log(`\n${PRERENDER_ROUTES.length - failed} ok, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
