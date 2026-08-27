// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/heatmap: heatmap layer is applied with its paint props', async ({ page }) => {
  await gotoCase(page, 'examples/heatmap')
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const layer = window.__MAP__?.getStyle().layers?.find(l => l.id === 'heatmap-layer')
          if (!layer) return ''
          return layer.type === 'heatmap' && layer.paint?.['heatmap-radius'] === 30 ? 'ok' : 'bad'
        }),
      { timeout: 20_000 }
    )
    .toBe('ok')
})
