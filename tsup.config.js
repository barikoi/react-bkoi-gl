import { defineConfig } from 'tsup';
import { execSync } from 'child_process';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  external: ['react', 'react-dom', 'bkoi-gl', 'maplibre-gl', '@maplibre/maplibre-gl-style-spec'],
  noExternal: [],
  esbuildOptions(options) {
    options.conditions = ['module'];
    options.exports = 'named';
  },
  onSuccess: async () => {
    console.log('Processing CSS files...');
    execSync('node scripts/modify-css.js', { stdio: 'inherit' });
    console.log('Build completed successfully!');
  }
});