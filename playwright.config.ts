import { defineConfig } from '@playwright/test'

// E2E runs against the BUILT package (dist/) — run `npm run build` first.
// The e2e script chains this; see package.json "e2e".
export default defineConfig({
  testDir: './tests/e2e/specs',
  timeout: 60_000, // proven ceiling (AGENTS.md): real remote tiles + headless CPU-WebGL map load takes 4-6s; traces showed 10s starves multi-interaction tests. Never above 60s, no CLI/per-test overrides
  fullyParallel: false,
  workers: 1, // one map per page; sequential keeps WebGL/memory deterministic
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/e2e/report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:5175',
    // Fixed viewports crop the right/bottom edge on small displays because
    // every OS adds different window chrome (tabs/address bar, macOS menubar+
    // dock, Linux panels) ON TOP of the fixed content area — a size that fits
    // one machine crops another (seen on both Linux and macOS). Fix: no fixed
    // viewport + --start-maximized → the page renders at exactly the visible
    // desktop area on every OS/display. Headless runs use Chromium's default
    // window size; specs assert DOM/map state, never pixel layout.
    viewport: null,
    launchOptions: { args: ['--start-maximized'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite tests/e2e/app --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe', // make start-vs-reuse visible in test output
  },
})
