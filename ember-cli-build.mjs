import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import EmberApp from 'ember-cli/lib/broccoli/ember-app.js';
import { compatBuild } from '@embroider/compat';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function (defaults) {
  const { setConfig } = await import('@warp-drive/core/build-config');
  const { buildOnce } = await import('@embroider/vite');

  const app = new EmberApp(defaults, {
    postcssOptions: {
      compile: {
        enabled: true,
        plugins: [
          postcssImport({ path: [resolve(__dirname, 'node_modules')] }),
          tailwindcss,
          autoprefixer,
        ],
      },
    },
  });

  setConfig(app, __dirname, {
    compatWith: '5.8',
    deprecations: {},
  });

  return compatBuild(app, buildOnce);
}
