const { readFileSync } = require('node:fs');

const { withNx } = require('@nx/rollup/with-nx');
const url = require('@rollup/plugin-url');
const svg = require('@svgr/rollup');

/**
 * Re-publishes the design system stylesheet as `dist/styles.css`, so hosts load
 * one stylesheet from this package (`@tesouro/worldpay-super-widget/styles.css`)
 * rather than reaching into `@tesouro/embedded-components-react` themselves.
 *
 * Copied at build time from the exact pinned version, so the CSS and the
 * components it styles always ship together.
 */
function emitDesignSystemStyles() {
  return {
    name: 'emit-design-system-styles',
    buildStart() {
      const source = require.resolve(
        '@tesouro/embedded-components-react/styles.css',
      );
      this.addWatchFile(source);
      this.emitFile({
        type: 'asset',
        fileName: 'styles.css',
        source: readFileSync(source),
      });
    },
  };
}

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    // 'all' keeps every dependency and peerDependency out of the bundle.
    external: 'all',
    format: ['esm'],
    // `input: '.'` would resolve against the workspace root (Nx runs rollup from
    // there) and ship the monorepo README, so anchor it to this project.
    assets: [{ input: __dirname, output: '.', glob: 'README.md' }],
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    plugins: [
      emitDesignSystemStyles(),
      svg({
        svgo: false,
        titleProp: true,
        ref: true,
      }),
      url({
        limit: 10000, // 10kB
      }),
    ],
  },
);
