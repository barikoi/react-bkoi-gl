// README claims: DrawControl — point/line/polygon creation, selection,
// deletion, event callbacks, style prop.
import { test, expect, gotoCase, waitForLog, section } from '../fixtures/map.js'

async function drawReady(page) {
  // maplibre-gl-draw connects lazily (16ms loaded() poll); its cold source is
  // the concrete readiness signal — same gate as the browser-mode spec.
  await expect
    .poll(
      () => page.evaluate(() => Boolean(window.__MAP__?.getSource('mapbox-gl-draw-cold'))),
      { timeout: 20_000 },
    )
    .toBeTruthy()
}

async function center(page) {
  const box = await page.locator('canvas').boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('toolbar renders with configured tools; hidden tools absent', async ({ page }) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  await expect(page.locator('.mapbox-gl-draw_point')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_polygon')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_line')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_trash')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_combine')).toHaveCount(0)
})

test('style prop is applied to the draw control container', async ({ page }) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  const group = page.locator('.maplibregl-ctrl-top-left .maplibregl-ctrl-group')
  const styles = await group.evaluate((el) => ({ opacity: el.style.opacity, zIndex: el.style.zIndex }))
  expect(styles.opacity).toBe('0.9')
  expect(styles.zIndex).toBe('5')
})

test('draw a point: tool → canvas click → onDrawCreate', async ({ page }) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  const { x, y } = await center(page)

  await page.locator('.mapbox-gl-draw_point').click()
  await page.mouse.click(x, y)

  const events = await waitForLog(page, 'create')
  expect(events[0].features).toContain('Point')
})

test('draw a polygon: three clicks + double-click closes → onDrawCreate', async ({ page }) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  const { x, y } = await center(page)

  await page.locator('.mapbox-gl-draw_polygon').click()
  await page.mouse.click(x - 100, y - 60)
  await page.mouse.click(x + 100, y - 60)
  await page.mouse.click(x, y + 80)
  await page.mouse.dblclick(x, y)

  const events = await waitForLog(page, 'create')
  expect(events[0].features).toContain('Polygon')
})

test('select then trash deletes the feature → onDrawDelete', async ({ page }) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  const { x, y } = await center(page)

  // Create a point first
  await page.locator('.mapbox-gl-draw_point').click()
  await page.mouse.click(x, y)
  await waitForLog(page, 'create')

  // Select it (click on the feature) — draw enters direct_select/simple_select
  await page.mouse.click(x, y)
  await waitForLog(page, 'selectionchange')

  // Delete via trash
  await page.locator('.mapbox-gl-draw_trash').click()
  await waitForLog(page, 'delete')

  const remaining = await page.evaluate(() => window.__MAP__.queryRenderedFeatures(undefined, { layers: ['gl-draw-point.point.cold'] }).length)
  expect(remaining).toBe(0)
})
