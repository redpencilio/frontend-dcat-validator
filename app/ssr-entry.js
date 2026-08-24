// Prerender entry point. Bundled for Node by the `isSsrBuild` branch of
// vite.config.mjs and driven by ssr/prerender.mjs — see ssr/README.md.
import App from './app';
import config from 'rpio-dcat-validator/config/environment';

let appPromise;

/** Boot the Application once and reuse it for every route. */
function getApp() {
  return (appPromise ??= App.create({
    ...config.APP,
    autoboot: false,
  }).boot());
}

/**
 * Render `url` into `document` and return the serialized HTML.
 *
 * Each call gets a fresh `ApplicationInstance` so route state cannot leak
 * between pages. The `Application` itself is booted only once.
 *
 * `_renderMode: 'serialize'` selects Glimmer's `serializeBuilder` over the
 * normal `clientBuilder`, emitting the `<!--%+b:0%-->` boundary markers the
 * client needs in order to rehydrate rather than render a second copy of the
 * app on top of ours.
 *
 * Returns the title as well as the HTML: ember-page-title clears
 * `document.title` on teardown, so the caller cannot recover it afterwards.
 */
export async function render(url, document) {
  const app = await getApp();
  const instance = app.buildInstance();

  const bootOptions = {
    isBrowser: false,
    document,
    rootElement: document.body,
    shouldRender: true,
    location: 'none',
    _renderMode: 'serialize',
  };

  try {
    await instance.boot(bootOptions);
    await instance.visit(url, bootOptions);

    return {
      html: `<!DOCTYPE html>\n${document.documentElement.outerHTML}`,
      title: document.title,
    };
  } finally {
    instance.destroy();
  }
}
