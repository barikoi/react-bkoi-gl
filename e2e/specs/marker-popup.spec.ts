// README claims: Marker (color, children, draggable) + Popup (standalone,
// close button, marker-attached).
// Selectors use real Marker DOM (.maplibregl-marker) — Marker does not
// forward data-testid to the DOM.
import { test, expect, gotoCase, waitForLog, section } from '../fixtures/map.js'

test('markers render: default, draggable, custom children', async ({ page }) => {
  await gotoCase(page, 'marker-popup/marker-basic')
  const sec = page
  await expect(sec.locator('.maplibregl-marker')).toHaveCount(3)
  await expect(sec.locator('.maplibregl-marker-draggable')).toHaveCount(1)
  await expect(page.getByTestId('custom-content')).toBeVisible()
  await expect(page.getByTestId('custom-content')).toHaveText('Custom Marker')
})

test('marker color prop is applied to the icon body path', async ({ page }) => {
  await gotoCase(page, 'marker-popup/marker-basic')
  // v6 default icon carries the color on a <g fill=...> wrapper, not the path
  const fills = await page
    .locator('.maplibregl-marker')
    .first()
    .evaluate((el) => [...el.querySelectorAll('g')].map((g) => g.getAttribute('fill')))
  expect(fills).toContain('red')
})

test('marker is draggable and reports new coordinates', async ({ page }) => {
  await gotoCase(page, 'marker-popup/marker-basic')
  const marker = page.locator('.maplibregl-marker-draggable')
  await expect(marker).toBeVisible()
  const before = await page.getByTestId('pos').textContent()

  const box = await marker.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y + 120, { steps: 8 })
  await page.mouse.up()

  const [drag] = await waitForLog(page, 'dragend')
  expect(Math.abs(drag.lngLat.lng - 90.3938)).toBeGreaterThan(0.005)
  const after = await page.getByTestId('pos').textContent()
  expect(after).not.toBe(before)
})

test('popup renders content; close button closes it and fires onClose', async ({ page }) => {
  await gotoCase(page, 'marker-popup/popup-basic')
  const sec = page
  await expect(sec.getByTestId('popup-content')).toBeVisible()
  await expect(sec.getByTestId('popup-content')).toContainText('Capital of Bangladesh')

  await sec.locator('.maplibregl-popup-close-button').click()
  await expect(sec.getByTestId('popup-content')).toHaveCount(0)
  await waitForLog(page, 'popup-close')
})

test('closeOnClick closes the popup on map click', async ({ page }) => {
  await gotoCase(page, 'marker-popup/popup-basic')
  const sec = page
  await expect(sec.getByTestId('popup-content')).toBeVisible()
  const box = await sec.locator('canvas').boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(sec.getByTestId('popup-content')).toHaveCount(0, { timeout: 10_000 })
})

test('popup attached to marker renders anchored at the marker', async ({ page }) => {
  await gotoCase(page, 'marker-popup/popup-marker-attached')
  const sec = page
  // README pattern: <Popup> as <Marker> child — anchored at marker coords,
  // rendered open, no longitude/latitude props needed on the Popup.
  await expect(sec.getByTestId('popup-content')).toBeVisible({ timeout: 20_000 })
  await expect(sec.getByTestId('popup-content')).toHaveText('Popup attached to marker')

  // Anchored: popup tip sits at the marker's screen position
  const markerBox = await sec.locator('.maplibregl-marker').boundingBox()
  const popupBox = await sec.locator('.maplibregl-popup').boundingBox()
  expect(Math.abs(popupBox.x + popupBox.width / 2 - (markerBox.x + markerBox.width / 2))).toBeLessThan(20)
})
