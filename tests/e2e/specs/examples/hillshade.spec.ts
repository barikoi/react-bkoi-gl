// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/hillshade: hillshade layer renders from the open Terrarium DEM', async ({
  page,
}) => {
  await gotoCase(page, 'examples/hillshade')
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const layer = window.__MAP__?.getStyle().layers?.find(l => l.id === 'hillshade-layer')
          return layer ? String(layer.type) : ''
        }),
      { timeout: 20_000 }
    )
    .toBe('hillshade')
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__.isStyleLoaded())), { timeout: 20_000 })
    .toBe(true)
})
