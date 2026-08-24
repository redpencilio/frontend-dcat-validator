/**
 * The routes rendered to static HTML at build time.
 *
 * Only routes with no dynamic segment and no render-time data fetching belong
 * here. `/jobs/:id` and `/reports/:id` are unbounded and both load their model
 * over the network, so they stay client-rendered and are served the pristine
 * shell — see ssr/README.md.
 */
export const PRERENDER_ROUTES = ['/', '/about'];
