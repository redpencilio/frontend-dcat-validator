// Render the static routes to HTML. See ssr/README.md.
//
// Needs both builds present: `npm run build:client` (dist/) and
// `npm run build:ssr` (dist-ssr/). `npm run build` runs all three in order.
//
// Accepts route arguments to render a subset:
//
//   node ssr/prerender.mjs /about
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { outputPathForUrl } from './output-path.mjs';
import { PRERENDER_ROUTES } from './routes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

// Every page is rendered into a copy of the client build's shell. Rendering "/"
// overwrites dist/index.html, so the pristine shell is snapshotted outside dist/
// first — otherwise a second run would template off its own output.
const shellSnapshot = join(root, 'dist-ssr', 'app-shell.html');
let shell;
try {
  shell = await readFile(shellSnapshot, 'utf8');
} catch {
  shell = await readFile(join(distDir, 'index.html'), 'utf8');
  await writeFile(shellSnapshot, shell, 'utf8');
}

// The pristine shell also ships, as dist/app-shell.html. nginx serves it for
// the routes that are not prerendered (/jobs/:id, /reports/:id). It must not
// carry the marker below: those pages have no serialized DOM to adopt, so they
// need an ordinary client render. Falling back to the prerendered index.html
// instead would ask the client to rehydrate the home page's markup while
// visiting a job — a mismatch Glimmer can only recover from by discarding
// nodes.
await writeFile(join(distDir, 'app-shell.html'), shell, 'utf8');

// Tells index.html's boot script to rehydrate rather than render fresh. Added
// to the template once rather than per document, and after both copies of the
// pristine shell are written.
shell = shell.replace('</head>', '<meta name="x-prerendered"></head>');

/**
 * A document Glimmer can render into, paired with its own `window`.
 *
 * Parsed per call rather than cloned: each route needs an isolated document,
 * and `parseHTML` is what mints the paired `window`.
 */
function createDocument() {
  const { window, document } = parseHTML(shell);

  // Glimmer calls this for `{{{html}}}`; it is a SimpleDOM-era API that no
  // standard DOM implements.
  document.createRawHTMLSection = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    const fragment = document.createDocumentFragment();
    fragment.append(...el.childNodes);
    return fragment;
  };

  return { window, document };
}

/**
 * Make a fresh document the ambient one and return it.
 *
 * Render-time code that reads a bare `document` must see the document being
 * rendered into, not just the one passed to `render()`.
 */
function installDocument() {
  const { window, document } = createDocument();

  globalThis.window = window;
  globalThis.document = document;

  return { window, document };
}

// --- browser globals, installed before the app bundle is imported ------------
// The order matters. app/config/environment.js calls loadConfigFromMeta() at
// module scope, so the shell's `<meta name="rpio-dcat-validator/config/
// environment">` must be reachable through the ambient document before the
// dynamic import below runs.
const bootstrap = installDocument();

// Ember's deprecation-workflow module assigns to `self` when imported.
globalThis.self = globalThis;

// Keep this list minimal. A global that is missing raises a ReferenceError and
// fails the build; a global that is present but wrong produces subtly bad HTML.
// Prefer guarding the call site over adding a shim.
// This assigns linkedom's CustomEvent; it does not use Node's own.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
globalThis.CustomEvent = bootstrap.window.CustomEvent;
globalThis.Node = bootstrap.window.Node;
globalThis.Element = bootstrap.window.Element;

// What @embroider/virtual/vendor.js sets in the browser. Taken from the config
// meta tag rather than restated here, so a flag change in config/environment.js
// cannot leave the prerender booting Ember differently from the client that
// rehydrates its output.
const appConfig = JSON.parse(
  decodeURIComponent(
    bootstrap.document
      .querySelector('meta[name="rpio-dcat-validator/config/environment"]')
      .getAttribute('content'),
  ),
);
globalThis.EmberENV = appConfig.EmberENV;
globalThis.runningTests = false;

const { render } = await import(join(root, 'dist-ssr/ssr-entry.mjs'));

// --- render ------------------------------------------------------------------
const args = process.argv.slice(2);
const routes = args.length ? args : PRERENDER_ROUTES;

let ok = 0;
let failed = 0;
const failedRoutes = [];

// Errors thrown inside Glimmer's render reach the run loop, not the try/catch
// below, so they are counted here too. `current` keeps the attribution honest:
// without it an async failure lands on whichever route happens to be in flight.
let current = null;
process.on('uncaughtException', (error) => {
  console.error(`  ! uncaught during ${current}: ${error.message}`);
  if (current && !failedRoutes.includes(current)) failedRoutes.push(current);
});

// Sequential by necessity: renders share one Ember Application, one run loop
// and one ambient document, so concurrent ones would read each other's state.
for (const url of routes) {
  current = url;
  const started = performance.now();

  try {
    const { document } = installDocument();
    const { html, title } = await render(url, document);

    // A render that produced no serialize markers cannot be rehydrated -- the
    // client would render a second copy over it. Catch that here rather than
    // shipping it.
    if (!html.includes('<!--%+b:0%-->')) {
      throw new Error('no serialize markers in output');
    }

    const outPath = outputPathForUrl(distDir, url);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');

    const ms = Math.round(performance.now() - started);
    console.log(
      `✓ ${url}  ${(html.length / 1024).toFixed(0)}kb  ${ms}ms  title=${JSON.stringify(title)}`,
    );
    ok++;
  } catch (error) {
    console.error(
      `✗ ${url}\n    ${error?.stack?.split('\n').slice(0, 6).join('\n    ')}`,
    );
    if (!failedRoutes.includes(url)) failedRoutes.push(url);
  }
}

current = null;

// Let any late async failure land before the tally.
await new Promise((r) => setImmediate(r));

failed = failedRoutes.length;
ok = routes.length - failed;

console.log(`\n${ok} rendered, ${failed} failed`);

// Fail the build rather than let the SPA fallback quietly cover a missing page.
if (failed > 0) {
  console.error(`failed routes: ${failedRoutes.join(', ')}`);
  process.exitCode = 1;
}
