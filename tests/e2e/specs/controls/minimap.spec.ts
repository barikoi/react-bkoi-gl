// Controls group C — MinimapControl. One URL: /?case=controls-minimap
import { test, expect, gotoCase, waitForLog, section } from '../../fixtures/map.js'

test('MinimapControl renders with the full parent style, toggles, and reports onToggle', async ({
  page,
}) => {
  await gotoCase(page, 'controls-minimap/minimap')
  const sec = page
  // Parent + minimap maps inside this section
  await expect(sec.locator('.maplibregl-map')).toHaveCount(2)
  const minimap = sec.locator('.maplibregl-ctrl-minimap')
  await expect(minimap).toBeVisible()
  // Regression guard: the minimap snapshots the parent style only after the
  // parent style loads — its inner map must carry the FULL style.
  await expect
    .poll(
      () =>
        minimap.evaluate(el => {
          const ctrl = window.__MAP__._controls.find(c => c.container === el)
          return ctrl?.map?.getStyle?.().layers?.length ?? 0
        }),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(100)

  const toggle = minimap.locator('button').first()
  await toggle.click()
  const events = await waitForLog(page, 'minimap-toggle')
  expect(events[events.length - 1].isMinimized).toBe(true)
})

test('MinimapControl parentRect renders the parent viewport rectangle', async ({ page }) => {
  await gotoCase(page, 'controls-minimap/minimap-rect')
  const sec = page
  const minimap = sec.locator('.maplibregl-ctrl-minimap')
  await expect(minimap).toBeVisible()
  // parentRect layers live on the minimap's inner map
  await expect
    .poll(
      () =>
        minimap.evaluate(el => {
          const ctrl = window.__MAP__._controls.find(c => c.container === el)
          const ids = ctrl?.map?.getStyle?.().layers?.map(l => l.id) ?? []
          return ['parentRectOutline', 'parentRectFill'].filter(id => ids.includes(id)).length
        }),
      { timeout: 20_000 }
    )
    .toBe(2)
  // The rectangle source exists on the minimap and survives parent panning
  // (syncMaps → setParentBounds on every parent move).
  const box = await sec.locator('.case-map-wrap canvas').first().boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(() =>
      minimap.evaluate(el => {
        const ctrl = window.__MAP__._controls.find(c => c.container === el)
        return ctrl?.map?.getSource?.('parentRect') ? 1 : 0
      })
    )
    .toBe(1)
})
