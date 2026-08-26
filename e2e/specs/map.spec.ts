// README claims: Map component — real Barikoi style, initialViewState,
// controlled viewState, events, MapRef methods, default controls.
// One URL per module: everything lives on /?case=map as [data-section] blocks.
import { test, expect, gotoCase, getMapState, waitForLog, waitForCameraStable, section } from '../fixtures/map.js'

const DHAKA = { lng: 90.3938, lat: 23.8216 }

test('loads the real Barikoi style and applies initialViewState', async ({ page }) => {
  await gotoCase(page, 'map/basic')
  const state = await getMapState(page)
  expect(state.lng).toBeCloseTo(DHAKA.lng, 5)
  expect(state.lat).toBeCloseTo(DHAKA.lat, 5)
  expect(state.zoom).toBeCloseTo(12, 5)
})

test('onLoad fires exactly once per section map', async ({ page }) => {
  await gotoCase(page, 'map/basic')
  const loads = await page.evaluate(
    (s) => window.__LOG__.filter((l) => l.type === 'load' && l.section === s).length,
    'basic',
  )
  expect(loads).toBe(1)
})

test('canvas is rendered with non-zero size', async ({ page }) => {
  await gotoCase(page, 'map/basic')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box.width).toBeGreaterThan(0)
  expect(box.height).toBeGreaterThan(0)
})

test('Barikoi logo and attribution render by default', async ({ page }) => {
  await gotoCase(page, 'map/basic')
  const sec = page
  await expect(sec.locator('a.maplibregl-ctrl-logo[href*="barikoi.com"]')).toBeVisible()
  await expect(sec.locator('.maplibregl-ctrl-attrib')).toBeVisible()
})

test('Barikoi logo is visually painted, not just present in the DOM', async ({ page }) => {
  // Regression guard for the styles export (`react-bkoi-gl/styles`): the logo
  // anchor has no content — its entire visual is the background-image in
  // dist/styles/react-bkoi-gl.css. If that CSS fails to load/resolve, the logo
  // disappears while element-existence assertions above still pass.
  await gotoCase(page, 'map/basic')
  const logo = page.locator('a.maplibregl-ctrl-logo[href*="barikoi.com"]')
  const painted = await logo.evaluate(
    (el) =>
      new Promise((resolve) => {
        const cs = getComputedStyle(el)
        const box = el.getBoundingClientRect()
        const bg = cs.backgroundImage
        const finish = (imageLoaded) =>
          resolve({
            visibility: cs.visibility,
            display: cs.display,
            opacity: cs.opacity,
            hasBg: bg !== 'none',
            box: { width: box.width, height: box.height },
            imageLoaded,
          })
        if (bg === 'none') return finish(false)
        const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
        const img = new Image()
        img.onload = () => finish(img.naturalWidth > 0)
        img.onerror = () => finish(false)
        img.src = url
      })
  )
  expect(painted.visibility).toBe('visible')
  expect(painted.display).not.toBe('none')
  expect(Number(painted.opacity)).toBeGreaterThan(0)
  expect(painted.hasBg).toBe(true)
  expect(painted.imageLoaded).toBe(true)
  expect(painted.box.width).toBeGreaterThan(0)
  expect(painted.box.height).toBeGreaterThan(0)
})

test('attribution copyright survives maplibre rebuilds (styledata/sourcedata)', async ({ page }) => {
  // maplibre rebuilds the attribution DOM when tiles land seconds after load —
  // the Barikoi © links must be re-applied and stay visible (MutationObserver).
  await gotoCase(page, 'map/basic')
  const sec = page
  await expect
    .poll(
      async () =>
        sec.locator('.maplibregl-ctrl-attrib-inner').evaluate((el) => el.textContent.trim()),
      { timeout: 20_000 },
    )
    .toContain('© Barikoi © OpenMapTiles © OpenStreetMap contributors')
})

test('showAttribution=false hides attribution; Barikoi logo always renders', async ({ page }) => {
  // Branding policy: no hide prop for the logo — it must render even with
  // showAttribution={false}.
  await gotoCase(page, 'map/no-defaults')
  const sec = page
  await expect(sec.locator('.maplibregl-ctrl-attrib')).toHaveCount(0)
  await expect(sec.locator('a.maplibregl-ctrl-logo[href*="barikoi.com"]')).toBeVisible()
})

test('controlled viewState props drive the camera', async ({ page }) => {
  await gotoCase(page, 'map/controlled')
  await page.getByTestId('move').click()
  await waitForCameraStable(page)
  const state = await getMapState(page)
  expect(state.lng).toBeCloseTo(90.0, 5)
  expect(state.lat).toBeCloseTo(23.0, 5)
  expect(state.zoom).toBeCloseTo(14, 5)
})

test('onClick reports lngLat; onMoveEnd/onZoomEnd fire on interaction', async ({ page }) => {
  await gotoCase(page, 'map/events')
  const box = await page.locator('canvas').boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // Click near section center
  await page.mouse.click(cx, cy)
  const clicks = await waitForLog(page, 'click')
  expect(clicks[0].lngLat.lng).toBeGreaterThan(90.39)
  expect(clicks[0].lngLat.lng).toBeLessThan(90.40)
  expect(clicks[0].lngLat.lat).toBeGreaterThan(23.81)
  expect(clicks[0].lngLat.lat).toBeLessThan(23.83)

  // Drag the map
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 100, cy - 50, { steps: 6 })
  await page.mouse.up()
  await waitForLog(page, 'moveend')
  const state = await getMapState(page)
  expect(Math.abs(state.lng - DHAKA.lng)).toBeGreaterThan(0.01)

  // Wheel zoom
  await page.mouse.wheel(0, -240)
  await waitForLog(page, 'zoomend')
})

test('MapRef methods expose the maplibre instance', async ({ page }) => {
  await gotoCase(page, 'map/ref-methods')

  const readLastReport = async () => {
    const reports = await page.evaluate(() => window.__LOG__.filter((l) => l.type === 'ref-report'))
    return reports[reports.length - 1]
  }

  await page.getByTestId('report').click()
  let report = await readLastReport()
  expect(report.zoom).toBeCloseTo(12, 5)
  expect(report.bearing).toBeCloseTo(0, 5)

  await page.getByTestId('zoom-in').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.zoom).toBeCloseTo(13, 3)

  await page.getByTestId('zoom-out').click()
  await page.getByTestId('zoom-out').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.zoom).toBeCloseTo(11, 3)

  await page.getByTestId('fly').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.center.lng).toBeCloseTo(90.4, 4)
  expect(report.center.lat).toBeCloseTo(23.83, 4)
  expect(report.zoom).toBeCloseTo(15, 3)
})

test('README styles claim: osm_barikoi_v2 style loads', async ({ page }) => {
  await gotoCase(page, 'map/alt-style')
  const state = await getMapState(page)
  expect(state.lng).toBeCloseTo(DHAKA.lng, 5)
  const info = await page.evaluate(
    (s) => {
      const map = window.__MAP__
      return { layers: map.getStyle().layers.length, name: map.getStyle().name }
    },
  )
  expect(info.layers).toBeGreaterThan(0)
  expect(info.name).toBeTruthy()
})

test('README events claim: drag, hover, resize, idle, movestart/zoomstart', async ({ page }) => {
  await gotoCase(page, 'map/events-extended')
  const sec = page
  const canvas = sec.locator('canvas')
  const box = await canvas.boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // Hover: enter then leave the map canvas
  await canvas.hover()
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'mouseenter').length))
    .toBeGreaterThan(0)
  await page.mouse.move(10, 10) // off-canvas corner (controls area)
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'mouseleave').length))
    .toBeGreaterThan(0)

  // Drag with real mouse (library gesture handlers need real input)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 80, cy - 60, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'dragend').length))
    .toBeGreaterThan(0)
  const logTypes = await page.evaluate(() => window.__LOG__.map((l) => l.type))
  expect(logTypes).toContain('dragstart')
  expect(logTypes).toContain('drag')
  expect(logTypes).toContain('movestart')

  // Zoom via wheel → zoomstart
  await page.mouse.wheel(0, -240)
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'zoomstart').length))
    .toBeGreaterThan(0)

  // Resize: viewport change must fire onResize
  await page.setViewportSize({ width: 1000, height: 700 })
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'resize').length))
    .toBeGreaterThan(0)

  // Idle: map settles after all interaction
  await expect
    .poll(() => page.evaluate(() => window.__LOG__.filter((l) => l.type === 'idle').length))
    .toBeGreaterThan(0)
})
