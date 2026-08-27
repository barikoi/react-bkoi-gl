// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/cluster: clustered circles with count symbols render', async ({ page }) => {
  await gotoCase(page, 'examples/cluster')
  // Source carries cluster options
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const src = window.__MAP__?.getSource('cities')?.serialize()
          return src?.cluster === true && typeof src?.clusterRadius === 'number'
        }),
      { timeout: 20_000 }
    )
    .toBe(true)
  // At Bangladesh zoom, at least one cluster circle and one symbol render
  await expect
    .poll(
      async () => {
        const n = await page.evaluate(() => {
          const m = window.__MAP__
          const circles = m.queryRenderedFeatures(undefined, { layers: ['clusters'] })
          const labels = m.queryRenderedFeatures(undefined, { layers: ['cluster-count'] })
          return { circles: circles.length, labels: labels.length }
        })
        return n.circles > 0 && n.labels > 0 ? 'ok' : JSON.stringify(n)
      },
      { timeout: 20_000 }
    )
    .toBe('ok')
})
