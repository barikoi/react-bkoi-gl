// Captures README screenshots from the e2e host app (which serves the built
// dist/ via the vite alias) — JPEG so the tarball stays small.
//
// Requires the host app on :5175 (npm run e2e:serve). Output: screenshots/*.jpg
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const PORT = process.env.E2E_PORT || '5175'
const base = `http://localhost:${PORT}`

const SHOTS = [
  { case: 'map/basic', file: 'map-basic' },
  { case: 'marker-popup/popup-marker-attached', file: 'marker-popup', click: '.maplibregl-marker' },
  { case: 'sources-layers/geojson', file: 'layers' },
  { case: 'controls-minimap/minimap', file: 'minimap' },
  { case: 'controls-globe/globe', file: 'globe', click: 'button.maplibregl-ctrl-globe' },
  { case: 'draw/all', file: 'draw' },
]

// Render settle before every screenshot — let remote tiles stream in.
const RENDER_WAIT = Number(process.env.RENDER_WAIT ?? 10_000)

mkdirSync('screenshots', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 625 }, deviceScaleFactor: 2 })

for (const s of SHOTS) {
  process.stdout.write(`▶ ${s.case} … `)
  await page.goto(`${base}/?case=${s.case}`, { waitUntil: 'domcontentloaded' })
  // Wait for the live map instance (set on map load). isStyleLoaded() is
  // deliberately NOT used: the globe case's remote raster tiles error/retry,
  // flipping style state and hanging that poll.
  await page.waitForFunction(() => Boolean(window.__MAP__), null, { timeout: 30000 })
  if (s.click)
    await page
      .locator(s.click)
      .first()
      .click()
      .catch(() => {})
  await page.waitForTimeout(RENDER_WAIT)
  await page.screenshot({ path: `screenshots/${s.file}.jpg`, type: 'jpeg', quality: 78 })
  console.log(`screenshots/${s.file}.jpg`)
}

await browser.close()
