// README claims: DrawControl — point/line/polygon creation, selection,
// update (drag), deletion, event callbacks, style prop, controls config,
// displayControlsDefault, custom styles, onDrawModeChange.
//
// ONE test, ONE URL (/?case=draw/all): the whole draw module runs on a single
// map in a single window. The case swaps DrawControl basic → advanced config
// in-page when we dispatch the 'draw:advanced' event — no second navigation,
// so the headed review window keeps rendering the same map throughout.
import { test, expect, gotoCase, waitForLog, section } from '../fixtures/map.js'

async function drawReady(page) {
  // maplibre-gl-draw connects lazily (16ms loaded() poll); its cold source is
  // the concrete readiness signal — same gate as the browser-mode spec.
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__?.getSource('mapbox-gl-draw-cold'))), {
      timeout: 20_000,
    })
    .toBeTruthy()
}

async function center(page) {
  const box = await page.locator('canvas').boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

// Click a draw tool and WAIT for it to activate — the mode switch is async,
// and a canvas click landing before it creates a feature in the previous
// mode (a stray point instead of a line vertex).
async function activateTool(page, tool) {
  const btn = page.locator(tool)
  await btn.click()
  await expect(btn).toHaveClass(/active/)
}

// The dblclick that finishes a line/polygon is also seen by maplibre's
// doubleClickZoom handler: the camera zooms mid-draw and the fresh features
// render off-camera / lag behind, so rendered-feature polls time out.
// Disable it on the live map (public API) before any drawing.
async function prepCanvas(page) {
  await page.evaluate(() => window.__MAP__.doubleClickZoom.disable())
}

// A drawn feature auto-selects — but the mode transition is async and in slow
// headed runs a drag landing before simple_select is ACTIVE is silently
// dropped. Gate on the selected point actually RENDERING in the draw active
// layers before dragging.
async function waitSelectedPoint(page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const m = window.__MAP__
          return ['gl-draw-point-active.hot', 'gl-draw-point-active.cold'].reduce(
            (n, id) => n + m.queryRenderedFeatures(undefined, { layers: [id] }).length,
            0
          )
        }),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(0)
}

test('draw/all: basic + advanced DrawControl on one map', async ({ page }) => {
  await gotoCase(page, 'draw/all')
  await drawReady(page)
  await prepCanvas(page)
  const { x, y } = await center(page)

  // ---- PHASE 1: basic config -------------------------------------------
  // Toolbar: configured tools render, disabled tools absent
  await expect(page.locator('.mapbox-gl-draw_point')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_polygon')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_line')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_trash')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_combine')).toHaveCount(0)

  // style prop lands on the control container
  const group = page.locator('.maplibregl-ctrl-top-left .maplibregl-ctrl-group')
  const styles = await group.evaluate(el => ({
    opacity: el.style.opacity,
    zIndex: el.style.zIndex,
  }))
  expect(styles.opacity).toBe('0.9')
  expect(styles.zIndex).toBe('5')

  // Point: tool → canvas click → onDrawCreate
  await activateTool(page, '.mapbox-gl-draw_point')
  await page.mouse.click(x, y)
  let creates = await waitForLog(page, 'create')
  expect(creates[0].features).toContain('Point')

  // Drag the auto-selected point → onDrawUpdate (feature moved). Retry:
  // re-click the point's location to (re)select it, wait for the selected
  // point to render, then drag — creation auto-select can lose the race in
  // headed runs, and a drag before simple_select is active is dropped.
  let updates = []
  for (let attempt = 0; attempt < 3 && !updates.length; attempt++) {
    await page.mouse.click(x, y)
    await waitSelectedPoint(page)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 80, y + 60, { steps: 10 })
    await page.mouse.up()
    updates = await waitForLog(page, 'update', { timeout: 5_000 }).catch(() => [])
  }
  expect(updates[0].features).toContain('Point')

  // Trash while the point is still selected → onDrawDelete (whole feature;
  // trash in direct_select on a polygon only deletes the active vertex)
  await page.locator('.mapbox-gl-draw_trash').click()
  const deletes = await waitForLog(page, 'delete')
  expect(deletes[0].features).toContain('Point')

  // LineString: two clicks + double-click finishes → onDrawCreate
  await activateTool(page, '.mapbox-gl-draw_line')
  await page.mouse.click(x - 160, y - 40)
  await page.mouse.click(x + 40, y + 40)
  await page.mouse.dblclick(x + 160, y - 60)
  creates = await waitForLog(page, 'create')
  const last = creates[creates.length - 1]
  expect(last.features).toContain('LineString')

  // Polygon: three clicks + double-click closes → onDrawCreate; the
  // completion auto-select fires onDrawSelectionChange with the new feature
  await activateTool(page, '.mapbox-gl-draw_polygon')
  await page.mouse.click(x - 100, y - 60)
  await page.mouse.click(x + 100, y - 60)
  await page.mouse.click(x, y + 80)
  await page.mouse.dblclick(x, y + 80)
  creates = await waitForLog(page, 'create')
  const lastCreate = creates[creates.length - 1]
  expect(lastCreate.features).toContain('Polygon')
  // The polygon's completion auto-select fires onDrawSelectionChange — poll
  // for a selectionchange logged AFTER the polygon create. Don't require
  // features to contain 'Polygon': in slow headed runs the auto-select event
  // can fire before draw snapshots the feature, arriving with features: [].
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const log = window.__LOG__
          const polyCreate = log.findIndex(
            l => l.type === 'create' && l.features?.includes('Polygon')
          )
          return (
            polyCreate !== -1 && log.some((l, i) => i > polyCreate && l.type === 'selectionchange')
          )
        }),
      { timeout: 15_000 }
    )
    .toBe(true)

  // Point deleted; line and polygon survive. Poll — the rendered draw
  // layers update a frame after the delete event.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const m = window.__MAP__
          const q = ids =>
            ids.reduce(
              (n, id) => n + m.queryRenderedFeatures(undefined, { layers: [id] }).length,
              0
            )
          return {
            // point-ACTIVE layers also carry the selected polygon's vertex
            // handles — count only real unselected points
            points: q(['gl-draw-point-inactive.cold', 'gl-draw-point-inactive.hot']),
            lines: q([
              'gl-draw-line-inactive.cold',
              'gl-draw-line-active.cold',
              'gl-draw-line-inactive.hot',
              'gl-draw-line-active.hot',
            ]),
            polys: q([
              'gl-draw-polygon-fill-inactive.cold',
              'gl-draw-polygon-fill-active.cold',
              'gl-draw-polygon-fill-inactive.hot',
              'gl-draw-polygon-fill-active.hot',
            ]),
          }
        }),
      { timeout: 15_000 }
    )
    .toEqual({ points: 0, lines: 1, polys: 1 })

  // ---- PHASE 2: advanced config (in-page swap, same map) ----------------
  await page.evaluate(() => window.dispatchEvent(new Event('draw:advanced')))
  await drawReady(page)
  await prepCanvas(page)

  // displayControlsDefault: the full toolbar renders, including tools that
  // phase 1 explicitly disables
  await expect(page.locator('.mapbox-gl-draw_combine')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_polygon')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_uncombine')).toBeVisible()

  // Custom `styles` array: the custom point layer carries our paint color
  // (draw layers add asynchronously — poll, don't read once)
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const layer = window.__MAP__
            .getStyle()
            .layers.find(l => l.id.startsWith('gl-draw-custom-point'))
          return layer?.paint?.['circle-color'] ?? ''
        }),
      { timeout: 15_000 }
    )
    .toBe('#e6a817')

  // Selecting a tool fires onDrawModeChange with the draw mode
  await activateTool(page, '.mapbox-gl-draw_point')
  const [mode] = await waitForLog(page, 'draw-modechange')
  expect(mode.mode).toBe('draw_point')

  // Trash on the advanced toolbar: draw a point, select, delete
  await page.mouse.click(x, y)
  await waitForLog(page, 'create')
  // Creation auto-selects — trash straight away
  await page.locator('.mapbox-gl-draw_trash').click()
  const deletes2 = await waitForLog(page, 'delete')
  expect(deletes2[deletes2.length - 1].features).toContain('Point')
})
