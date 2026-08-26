// README claims: Source (GeoJSON), Layer types + data-driven styling +
// filters + events, CanvasSource.
import { test, expect, gotoCase, queryFeaturesAt, waitForLog, section } from '../fixtures/map.js'

test('GeoJSON source renders circle + fill + line layers', async ({ page }) => {
  await gotoCase(page, 'sources-layers/geojson')
  const points = await queryFeaturesAt(page, 'points-layer')
  expect(points.length).toBe(2)
  const fills = await queryFeaturesAt(page, 'polygon-fill')
  expect(fills.length).toBe(1)
  const outlines = await queryFeaturesAt(page, 'polygon-outline')
  expect(outlines.length).toBe(1)
})

test('data-driven styling renders all features; filter narrows a layer', async ({ page }) => {
  await gotoCase(page, 'sources-layers/data-driven')
  // All three cities render on the unfiltered layer
  const all = await queryFeaturesAt(page, 'cities-circles')
  expect(all.length).toBe(3)
  // Only Dhaka (population > 5M) passes the filter
  const large = await queryFeaturesAt(page, 'large-cities')
  expect(large.length).toBe(1)
  expect(large[0].properties.name).toBe('Dhaka')
})

test('layer events: mouseenter/leave flips hover state; click reports feature', async ({ page }) => {
  await gotoCase(page, 'sources-layers/layer-events')

  // Feature sits at the section canvas center (Dhaka point at 90.3938,23.8216)
  const box = await page.locator('canvas').boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await waitForLog(page, 'layer-enter')
  await expect(page.getByTestId('hover-state')).toHaveText('hovered')

  await page.mouse.click(cx, cy)
  const clicks = await waitForLog(page, 'layer-click')
  expect(clicks[0].name).toBe('Point A')

  await page.mouse.move(100, 100)
  await waitForLog(page, 'layer-leave')
  await expect(page.getByTestId('hover-state')).toHaveText('idle')
})

test('CanvasSource adds a canvas-backed raster layer', async ({ page }) => {
  await gotoCase(page, 'sources-layers/canvas')
  // Source lands asynchronously (style load); poll instead of assuming
  // the settle already covered it.
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__?.getSource('my-canvas'))), { timeout: 8_000 })
    .toBe(true)
  const layers = await page.evaluate(
    () => window.__MAP__.getStyle().layers.filter((l) => l.source === 'my-canvas').length
  )
  // StrictMode double-mount can add the auto-id'd layer twice — count > 0.
  expect(layers).toBeGreaterThan(0)
})
