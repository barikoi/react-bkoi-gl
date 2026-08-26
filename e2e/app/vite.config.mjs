import { defineConfig, loadEnv } from 'vite'

// Serves the e2e host app. `react-bkoi-gl` resolves to the BUILT package in
// dist/ — e2e verifies the publish artifact, not the sources (those are
// covered by the unit/browser suites).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.BARIKOI_API_KEY || env.API_KEY
  if (!apiKey) {
    throw new Error('Missing API key: set BARIKOI_API_KEY (or API_KEY) in .env')
  }
  return {
    define: {
      'import.meta.env.BARIKOI_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: [
        {
          find: /^react-bkoi-gl\/styles$/,
          replacement: new URL('./../../dist/styles/react-bkoi-gl.css', import.meta.url)
            .pathname,
        },
        { find: /^react-bkoi-gl$/, replacement: new URL('./../../dist/index.js', import.meta.url).pathname },
      ],
    },
  }
})
