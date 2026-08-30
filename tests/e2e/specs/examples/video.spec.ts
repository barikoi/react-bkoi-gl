// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/video: video source loads and reaches playable state', async ({ page }) => {
  await gotoCase(page, 'examples/video')
  // Source is a video source with the georeferenced quad
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s = window.__MAP__?.getSource('drone')?.serialize()
          return s?.type === 'video' && Array.isArray(s?.coordinates) ? 'ok' : ''
        }),
      { timeout: 20_000 }
    )
    .toBe('ok')
  // The video element lives DETACHED on the source (s.video, never in the
  // DOM), and raster layers return no queryRenderedFeatures — assert on the
  // source's video readiness instead.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s = window.__MAP__?.getSource('drone')
          return s?.video?.readyState >= 2 && !s?.video?.error ? 'ok' : ''
        }),
      { timeout: 30_000 }
    )
    .toBe('ok')
})
