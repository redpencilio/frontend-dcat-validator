import { join } from 'node:path';

/**
 * The file a route's HTML is written to.
 *
 * Flat `<route>.html`, never `<route>/index.html`. nginx resolves both without
 * a redirect (see config/frontend/prerender.conf in the app repo, which does
 * `try_files $uri $uri.html`), so the flat form is chosen simply because one
 * file per route is easier to reason about than a tree of index.html files.
 */
export function outputPathForUrl(distDir, url) {
  const relative = url.replace(/^\/+/, '').replace(/\/+$/, '');

  return relative === ''
    ? join(distDir, 'index.html')
    : join(distDir, `${relative}.html`);
}
