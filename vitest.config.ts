import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  test: {
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/index.{js,ts}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/exports-maplibre-gl.ts',
      ],
    },
    projects: [
      {
        // Unit tests: mocked maplibre-gl, jsdom
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['tests/unit/setup.js'],
          include: ['tests/unit/**/*test*.{js,jsx,ts,tsx,cjs}'],
          exclude: ['tests/browser/**'],
        },
        resolve: {
          alias: [
            // Order matters: first match wins
            {
              find: /^react-bkoi-gl\/test(.*)$/,
              replacement: `${root}/tests/unit$1`,
            },
            { find: /^react-bkoi-gl(.*)$/, replacement: `${root}/src$1` },
            {
              find: /^maplibre-gl$/,
              replacement: `${root}/tests/unit/mocks/maplibre-gl.js`,
            },
          ],
        },
      },
      {
        // Browser tests: real maplibre-gl in headless Chromium (Playwright),
        // following the react-map-gl browser-mode setup
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.spec.{js,jsx,ts,tsx}'],
          setupFiles: ['tests/browser/setup.ts'],
          testTimeout: 10_000,
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
        resolve: {
          alias: [{ find: /^react-bkoi-gl(.*)$/, replacement: `${root}/src$1` }],
        },
      },
    ],
  },
})
