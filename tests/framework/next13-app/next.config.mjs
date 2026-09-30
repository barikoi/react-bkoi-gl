/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 13.5's bundled SWC minifier corrupts maplibre's symbol-placement
  // code in production builds ("symbolInstance.crossTileID can't be 0" every
  // frame, the map never paints). The SWC version Next 14+ ships is fine and
  // dev is unaffected. Terser can't replace it here (can't parse SWC's
  // output), so this compat target ships an unminified production bundle.
  webpack: (config, { dev }) => {
    if (!dev) {
      // Next 13's asset minifier also breaks on the emitted ESM worker asset.
      // Don't emit it: the library HEAD-probes the (now dead) asset URL and
      // falls back to its inlined same-origin Blob worker (CSP: worker-src
      // blob:).
      config.module.rules.push({
        test: /bkoi-map-worker\.mjs$/,
        type: 'asset/resource',
        generator: { emit: false },
      });
      config.optimization.minimizer = [];
    }
    return config;
  },
};
export default nextConfig;
