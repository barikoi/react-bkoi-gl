// Human review mode: ONE headed browser, one tab, walking through every e2e
// case grouped by module, with an on-screen banner (module, case, progress,
// what to look for), fake geolocation (so the geolocate dot shows), and a
// camera check on map/ref-methods (zoom in/out + fly actually verified).
//
// Usage:
//   npm run e2e:review                 # 10s dwell per case
//   DWELL=20000 npm run e2e:review     # longer dwell
//   PAUSE=1 npm run e2e:review         # wait for Enter between cases
//   ONLY=map npm run e2e:review        # one module or exact case id
//   DWELL=0 npm run e2e:review         # fast evidence-only pass
//
// Requires the vite host app on :5175 (npm run e2e:serve) — reused if up.
import { chromium } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

const PORT = process.env.E2E_PORT || '5175'
const DWELL = Number(process.env.DWELL ?? 10_000)
const PAUSE = process.env.PAUSE === '1'
const ONLY = process.env.ONLY
const base = `http://localhost:${PORT}`

const registrySrc = readFileSync(new URL('../app/cases/index.js', import.meta.url), 'utf8')
const CASES = [...registrySrc.matchAll(/'([\w/-]+)':/g)].map((m) => m[1])

// Module grouping + human notes: what each case demonstrates (visual aid).
const MODULES = [
  ['map', [
    ['map/basic', 'Default map — Barikoi logo (bottom-left) + attribution (bottom-right)'],
    ['map/no-defaults', 'showAttribution=false (logo always renders)'],
    ['map/alt-style', 'osm_barikoi_v2 documented style'],
    ['map/controlled', 'Controlled viewState — click Move, camera jumps'],
    ['map/events', 'Click map → marker moves to clicked point'],
    ['map/events-extended', 'Drag / hover the circle / wheel-zoom / resize — events fire'],
    ['map/ref-methods', 'MapRef: Report, ZoomIn, ZoomOut, Fly — camera verified below'],
  ]],
  ['marker-popup', [
    ['marker-popup/marker-basic', 'Default, draggable, custom-element markers'],
    ['marker-popup/popup-basic', 'Popup content, close button, closeOnClick'],
    ['marker-popup/popup-marker-attached', 'Popup anchored to marker'],
  ]],
  ['sources-layers', [
    ['sources-layers/geojson', 'GeoJSON → circle + fill + line layers'],
    ['sources-layers/data-driven', 'Data-driven styling + filter'],
    ['sources-layers/layer-events', 'Hover feature → state change; click → feature'],
    ['sources-layers/canvas', 'CanvasSource animated raster'],
  ]],
  ['controls-camera', [
    ['controls-camera/navigation', 'Zoom in/out + compass'],
    ['controls-camera/camera-ref', 'MapRef: ZoomIn / ZoomOut / FlyTo'],
    ['controls-camera/scale', 'Scale bar — bottom-left ("2 km")'],
    ['controls-camera/fullscreen', 'Fullscreen toggle'],
    ['controls-camera/geolocate', 'Geolocate — dot + accuracy circle (fake location)'],
  ]],
  ['controls-globe', [['controls-globe/globe', 'Globe projection toggle']]],
  ['controls-minimap', [
    ['controls-minimap/minimap', 'Minimap (200x150) — full style, toggleable'],
    ['controls-minimap/minimap-rect', 'Minimap — parent viewport rectangle (parentRect)'],
  ]],
  ['controls-terrain', [['controls-terrain/terrain', 'Terrain control (mount only)']]],
  ['draw', [['draw/basic', 'Draw point/polygon, select, delete']]],
  ['hooks', [
    ['hooks/use-map', 'useMap drives the map from outside <Map>'],
    ['hooks/use-control', 'useControl custom IControl'],
  ]],
]

const flat = MODULES.flatMap(([m, cs]) => cs)
const allIds = new Set(CASES)

const planned = flat.filter(([id]) => (!ONLY || id.startsWith(ONLY)))
const missing = ONLY ? [] : CASES.filter((mod) => !MODULES.some(([m]) => m === mod))

// Visual aid banner — SAME visual format as the case pages' title chip
// (.case-page-title in app.css): white chip, 600 13px system-ui, rounded.
// Shown top-center with progress + what-to-look-for; pointer-events none.
const banner = (module, i, j, caseId, note) => `(function(){
  document.title='▶ ${caseId} (${i}/${j})';
  const old=document.getElementById('__bkoiBanner'); old&&old.remove();
  const b=document.createElement('div');
  b.id='__bkoiBanner';
  b.style.cssText='position:absolute;top:10px;left:12px;z-index:5;display:flex;gap:8px;align-items:center;font:600 13px/1.4 system-ui,sans-serif;color:#123;pointer-events:none';
  b.innerHTML='<span style="background:rgba(255,255,255,0.85);padding:3px 10px;border-radius:4px">${module} — ${caseId}</span>' +
    '<span style="background:rgba(255,255,255,0.85);padding:3px 10px;border-radius:4px">${i}/${j}</span>' +
    '<span style="background:rgba(255,255,255,0.9);padding:3px 10px;border-radius:4px;font-weight:400">👁 ${note}</span>';
  document.body.appendChild(b);
})()`

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
// Fake geolocation so the geolocate control shows its dot + accuracy circle.
await context.grantPermissions(['geolocation'], { origin: base })
await context.setGeolocation({ latitude: 23.75, longitude: 90.38, accuracy: 30 })
const page = await context.newPage()

const results = []
const total = planned.length + missing.length
let n = 0

for (const [module, cases] of MODULES) {
  const todo = cases.filter(([id]) => planned.some(([p]) => p === id))
  if (!todo.length) continue
  console.log(`\n━━ ${module}`)

  for (const [id, note] of todo) {
    n += 1
    process.stdout.write(`  ▶ ${id} … `)
    const errors = []
    page.removeAllListeners('pageerror')
    page.on('pageerror', (e) => errors.push(String(e)))

      await page.goto(`${base}/?case=${id}`, { waitUntil: 'domcontentloaded' })
    let mapReady = false
    try {
      await page.waitForFunction(
        () => Boolean(window.__MAP__ && window.__MAP__.isStyleLoaded()),
        null,
        { timeout: 30000 },
      )
      mapReady = true
    } catch {
      errors.push('map did not load within 30s')
    }
    const secLoc = page.locator('body')

    // Camera verification for the ref-methods case (zoom in/out + fly).
    let camera = null
    if (id.endsWith('camera-ref') && mapReady) {
      
      const zoom = async () => page.evaluate(() => window.__MAP__.getZoom())
      const start = await zoom()
      await page.getByTestId('zoom-in').click()
      await page.waitForTimeout(600)
      const afterIn = await zoom()
      await page.getByTestId('zoom-out').click()
      await page.waitForTimeout(600)
      const afterOut = await zoom()
      await page.getByTestId('fly').click()
      await page.waitForTimeout(1600)
      const afterFly = await page.evaluate(() => {
        const c = window.__MAP__.getCenter()
        return { lng: c.lng, lat: c.lat, zoom: window.__MAP__.getZoom() }
      })
      camera = {
        zoomStart: start, afterZoomIn: afterIn, afterZoomOut: afterOut, afterFly,
        zoomInWorks: afterIn > start, zoomOutWorks: afterOut < afterIn,
        flyWorks: Math.abs(afterFly.lng - 90.4) < 0.01 && afterFly.zoom > afterOut,
      }
    }

    // Activate geolocate so the user-location dot + accuracy circle show.
    // The click listener is attached asynchronously (maplibre v6 wires it in
    // _finishSetupUI after a permissions query) — wait for the enabled button
    // before clicking, or the click is silently dropped.
    if (id.endsWith('/geolocate') && mapReady) {
      await secLoc.scrollIntoViewIfNeeded().catch(() => {})
      const btn = page.locator('button.maplibregl-ctrl-geolocate:not([disabled])')
      await btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      await page.locator('button.maplibregl-ctrl-geolocate:not([disabled])').click().catch(() => {})
      await page.waitForTimeout(1500)
    }

    // On-screen banner (visual aid) once body exists.
    await page.evaluate(banner(module, n, total, id, note)).catch(() => {})

    const evidence = await page
      .evaluate(() => {
        const logo = document.querySelector('a.maplibregl-ctrl-logo')
        const attrib = document.querySelector('.maplibregl-ctrl-attrib')
        const scale = document.querySelector('.maplibregl-ctrl-scale')
        const minimap = document.querySelector('.maplibregl-ctrl-minimap')
        const geo = document.querySelector('.maplibregl-ctrl-geolocate')
        const dot = document.querySelector('.maplibregl-user-location-dot')
        return {
          canvas: !!document.querySelector('canvas'),
          logo: logo ? { painted: getComputedStyle(logo).backgroundImage !== 'none', box: `${logo.offsetWidth}x${logo.offsetHeight}` } : null,
          attribution: attrib ? (attrib.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) : null,
          scale: scale ? scale.textContent.trim() : null,
          minimap: minimap ? `${minimap.offsetWidth}x${minimap.offsetHeight}` : null,
          geolocateBtn: !!geo, geolocateDot: !!dot,
          pageErrors: window.__pageErrors__ || [],
        }
      })
      .catch(() => null)

    if (DWELL > 0) {
      if (PAUSE) {
        process.stdout.write('loaded — press Enter for next … ')
        await new Promise((r) => process.stdin.once('data', r))
      } else {
        await page.waitForTimeout(DWELL)
      }
    }

    const probs = [...errors, ...(evidence?.pageErrors || [])]
    if (camera && !(camera.zoomInWorks && camera.zoomOutWorks && camera.flyWorks)) probs.push('camera check failed')
    const ok = mapReady && probs.length === 0
    results.push({ id, module, ok, evidence, camera, errors: probs })
    console.log(ok ? 'OK' : `PROBLEM (${probs.join('; ')})`)
    const e = evidence || {}
    console.log(
      `     logo=${JSON.stringify(e.logo)} attrib="${e.attribution}" scale=${JSON.stringify(e.scale)}` +
        ` minimap=${JSON.stringify(e.minimap)} geoDot=${e.geolocateDot}` +
        (camera ? ` camera=${camera.zoomInWorks && camera.zoomOutWorks && camera.flyWorks ? 'zoomIn/zoomOut/fly ✓' : JSON.stringify(camera)}` : '')
    )
  }
}

for (const id of missing) {
  console.log(`  ⚠ ${id} not in review modules — run separately`)
  results.push({ id, module: '(unlisted)', ok: null, evidence: null, camera: null, errors: ['not in review modules'] })
}

await browser.close()

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync('e2e/report', { recursive: true })
const out = `e2e/report/review-${stamp}.json`
writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), dwell: DWELL, results }, null, 2))

const failed = results.filter((r) => r.ok === false)
console.log(`\n${results.filter((r) => r.ok !== null).length} cases reviewed — ${results.filter((r) => r.ok).length} OK, ${failed.length} problems`)
if (failed.length) console.log('Problems:', failed.map((f) => f.id).join(', '))
console.log(`Report: ${out}`)
