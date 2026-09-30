/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14's asset minifier parses the emitted bkoi-map-worker.mjs as a
  // classic script and hard-fails on its ESM `export`. Keep the worker out of
  // the build: the library HEAD-probes the (now dead) asset URL and falls
  // back to its inlined same-origin Blob worker (CSP: worker-src blob:).
  webpack: (config, { dev }) => {
    if (!dev) {
      config.module.rules.push({
        test: /bkoi-map-worker\.mjs$/,
        type: 'asset/resource',
        generator: { emit: false },
      });
    }
    return config;
  },
};
export default nextConfig;
