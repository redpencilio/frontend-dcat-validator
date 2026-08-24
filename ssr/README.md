# Prerendering

`/` and `/about` are rendered to static HTML at build time. The browser gets
readable markup immediately and the Ember app then **rehydrates** it — adopting
the existing DOM instead of rendering a second copy over it.

## The pipeline

`npm run build` — what the Dockerfile runs — is three steps:

```
build:client → vite build                        # browser bundle + shell → dist/
build:ssr    → vite build --ssr app/ssr-entry.js # same app, for Node     → dist-ssr/
prerender    → node ssr/prerender.mjs            # 2 × <route>.html       → dist/
```

Both builds come from the same [`vite.config.mjs`](../vite.config.mjs),
branching on Vite's `isSsrBuild`. That is deliberate: the bundle that
_generates_ the HTML and the bundle that _rehydrates_ it must be compiled by
the same Ember/babel stack. If they diverge the serialized markup stops
matching what the client expects — and both builds still succeed, so nothing
tells you.

A failed route exits non-zero, so a regression fails the build instead of
silently falling back to the SPA shell.

## Why this works without FastBoot

Server rendering is a first-class `ApplicationInstance` capability:
`isBrowser: false`, a caller-supplied `document`, a `rootElement`, and
`_renderMode`. FastBoot wrapped those in a v1-addon broccoli build that was
never ported to Embroider + Vite, so we use the boot options directly.

Two properties of this app make it cheap. Every addon it depends on at runtime
is a v2 addon — the five v1 packages in `package.json` are all build-time only
— so `dist/@embroider/virtual/vendor.js` is 316 bytes of `EmberENV` with no AMD
payload to evaluate. And no app code touches browser globals or fetches during
render, so the Node environment below needs almost nothing in it.

## Rehydration

Ember **appends** to `rootElement` rather than clearing it. Prerendered HTML
plus an ordinary boot therefore yields two copies of the entire app. Glimmer's
rehydration is what makes prerendering safe rather than actively harmful:

- The server renders with `_renderMode: 'serialize'`, emitting `<!--%+b:0%-->`
  boundary markers alongside the HTML.
- The client boots with `_renderMode: 'rehydrate'`, which walks those markers
  and adopts the existing nodes.

`_renderMode` is reachable only through explicit boot options, and autoboot
passes none (`didBecomeReady` calls `instance._bootSync()` with no arguments),
so a prerendered page cannot use autoboot. [`index.html`](../index.html) picks
its boot path from a marker the prerenderer injects:

```js
if (document.querySelector('meta[name="x-prerendered"]')) {
  const app = Application.create({ ...environment.APP, autoboot: false });
  app.visit(location.pathname + location.search + location.hash, {
    rootElement: document.body,
    _renderMode: "rehydrate",
  });
} else {
  Application.create(environment.APP); // dev server, and non-prerendered routes
}
```

The dev server never sees the marker, so `npm start` is unaffected.

## What is and is not prerendered

[`ssr/routes.mjs`](./routes.mjs) holds the list. A route belongs there only if
it has no dynamic segment and fetches nothing during render.

`/jobs/:id` and `/reports/:id` are neither: they are unbounded and both load
their model over the network. They are served `dist/app-shell.html`, a copy of
the pristine build shell with no marker, so they boot the SPA the ordinary way.

That distinction is load-bearing on the serving side. Handing a job page the
prerendered `index.html` would ask Glimmer to rehydrate the home page's
serialized DOM into a route it does not belong to. See
`config/frontend/prerender.conf` in the app repo:

```nginx
location = /        { try_files /index.html =404; }
location /assets/   { try_files $uri =404; }
location /@embroider/ { try_files $uri =404; }
location /          { try_files $uri $uri.html /app-shell.html; }
```

## The Node environment

Rendering needs a DOM in Node. The requirements are narrow but specific:

1. **Parse the built `dist/index.html`.** `app/config/environment.js` calls
   `loadConfigFromMeta()`, which does `document.querySelector(...)` at _module
   scope_. A parsed shell must be the ambient document before the SSR bundle is
   even imported.
2. **Serialize back to HTML**, markers and all.
3. **Be absent, not half-present**, for anything it does not implement, so
   render-time feature detection behaves.

`linkedom` satisfies all three. Two consequences worth knowing: its `window`
inherits from `globalThis`, so a global assigned in `prerender.mjs` is also
visible as `window.foo` in app code; and Glimmer calls
`document.createRawHTMLSection` for `{{{html}}}`, a SimpleDOM-era API no
standard DOM has, which `createDocument()` shims.

The global list is deliberately short — `self`, plus `CustomEvent`, `Node` and
`Element`. A missing global is a `ReferenceError` that fails the build, never
subtly wrong HTML, so the list can stay honest instead of defensive. **Guard
the call site rather than growing this list.** No app code needs a guard today.

## Invariants

Three things in `prerender.mjs` look incidental and are not:

- **Globals are installed before the SSR bundle is imported.** Requirement (1)
  above. A static import, or hoisting the dynamic one, breaks config loading.
- **A fresh document is installed per route.** Render-time code that reads a
  bare `document` must see the document being rendered into. A module that
  captures `document` at import scope would bind to the bootstrap document
  forever — don't write one.
- **The route loop is sequential.** One `Application`, one run loop and one
  ambient `document` are shared, so concurrent renders would corrupt each
  other.

## Verifying

`_renderMode` is a private Ember API on both sides. If a version bump changes
it, the build still succeeds and every page still looks right in `curl` — the
app just silently renders a second copy of itself in the browser. Only a real
browser catches that:

```
CHROME_BIN=/usr/bin/chromium npm run verify:ssr
```

It serves `dist/` with the same resolution rules as production, loads each
prerendered route, and asserts one `<h1>`, one root element, zero leftover
serialize markers and no console errors. Run it in CI after a build — it is not
part of `npm run build` because the build image has no Chrome.

## Gaps

- `<meta name="description">` is the shell's on every page. Titles are per-page
  because ember-page-title runs server-side fine. No canonical or per-page OG
  tags.
- Only static routes; see the discussion of `/reports/:id` if that changes.
- No dev-mode SSR, so SSR breakage only surfaces from the full build.
