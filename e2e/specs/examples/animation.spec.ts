// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/animation: marker animates along the route', async ({ page }) => {
  await gotoCase(page, 'examples/animation')
  // The route line renders
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const l = window.__MAP__?.getStyle().layers?.find(x => x.id === 'route-line')
          return l ? 'ok' : ''
        }),
      { timeout: 20_000 }
    )
    .toBe('ok')
  // The marker moves: compare the first and latest animation positions
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const logs = window.__LOG__.filter(l => l.type === 'anim-pos')
          if (logs.length < 2) return 0
          return Math.abs(logs[logs.length - 1].lng - logs[0].lng)
        }),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(0.005)
})
