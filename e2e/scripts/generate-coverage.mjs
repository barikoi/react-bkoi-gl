// Generates e2e/report/coverage.md — the README-claim coverage matrix:
// README section → e2e case → covering spec → status, plus a mapping of
// docs.barikoi.com/examples to our case coverage.
// Run after `npx playwright test` (reads spec files statically; statuses come
// from the last run via e2e/report/review-*.json when present).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'

const specs = readdirSync('e2e/specs').map((f) => `e2e/specs/${f}`)

// case-id → spec references (static grep: gotoCase(page, '<id>'))
const caseToSpecs = {}
for (const s of specs) {
  const src = readFileSync(s, 'utf8')
  for (const m of src.matchAll(/gotoCase\(page,\s*'([^']+)'\)/g)) {
    ;(caseToSpecs[m[1]] ||= []).push(s.replace('e2e/specs/', ''))
  }
}

// Last review evidence (logo/attribution state per case), if any.
let review = null
const reports = existsSync('e2e/report') ? readdirSync('e2e/report').filter((f) => f.startsWith('review-')).sort() : []
if (reports.length) review = JSON.parse(readFileSync(`e2e/report/${reports.at(-1)}`, 'utf8'))

// README claim matrix (section anchor → case ids).
const matrix = [
  ['Map Component — style, view state, defaults', ['map/basic', 'map/no-defaults', 'map/alt-style']],
  ['Map Component — controlled viewState', ['map/controlled']],
  ['Map Component — events (drag/hover/zoom/resize/idle)', ['map/events', 'map/events-extended']],
  ['Map Component — MapRef methods', ['map/ref-methods']],
  ['Marker Component — default, custom, draggable', ['marker/basic']],
  ['Popup Component — basic, close, marker-attached', ['popup/basic', 'popup/marker-attached']],
  ['Source/Layer — GeoJSON circle/fill/line', ['source/geojson']],
  ['Layer — data-driven styling, filter', ['layer/data-driven']],
  ['Layer events — mouseenter/leave, click', ['layer/events']],
  ['CanvasSource', ['source/canvas']],
  ['Controls — Navigation', ['controls/navigation']],
  ['Controls — Scale', ['controls/scale']],
  ['Controls — Fullscreen', ['controls/fullscreen']],
  ['Controls — Geolocate', ['controls/geolocate']],
  ['Controls — Globe', ['controls/globe']],
  ['Controls — Minimap', ['controls/minimap']],
  ['Controls — Terrain', ['controls/terrain']],
  ['DrawControl — toolbar, draw point/polygon, delete', ['draw/basic']],
  ['Hooks — useMap, useControl', ['hooks/use-map', 'hooks/use-control']],
  ['Styles — react-bkoi-gl/styles (logo paint)', ['map/basic']],
  ['Available Map Styles — osm-liberty, osm_barikoi_v2', ['map/basic', 'map/alt-style']],
]

// docs.barikoi.com/examples → our coverage.
const barikoiExamples = [
  ['getting-started/display-basic-map', 'map/basic', '✅'],
  ['getting-started/display-custom-map-style', 'map/alt-style', '✅'],
  ['getting-started/add-maps-control', 'controls/navigation', '✅'],
  ['markers-and-popups/add-marker', 'marker/basic', '✅'],
  ['markers-and-popups/add-draggable-marker', 'marker/basic (draggable)', '✅'],
  ['markers-and-popups/add-marker-map-click', 'map/events (click→marker state)', '✅'],
  ['markers-and-popups/add-popup', 'popup/basic', '✅'],
  ['markers-and-popups/multiple-marker-as-layer', 'source/geojson (features→layer)', '✅'],
  ['markers-and-popups/soft-pulsing-marker', '—', '➖ pass-through (CSS on Marker children), no case yet'],
  ['layers-and-styling/add-geojson-line', 'source/geojson (line layer)', '✅'],
  ['layers-and-styling/add-polygon', 'source/geojson (fill layer)', '✅'],
  ['layers-and-styling/multiple-geojson', 'layer/data-driven', '✅'],
  ['layers-and-styling/icon-layer', '—', '❌ gap: no icon/symbol-layer e2e case'],
  ['layers-and-styling/vector-tile-layer', '—', '❌ gap: no vector-tile Source e2e case'],
  ['advanced-features/animate-map-camera', 'map/ref-methods (flyTo)', '✅'],
  ['advanced-features/fly-location', 'map/ref-methods (flyTo)', '✅'],
  ['advanced-features/fit-bound', '—', '❌ gap: fitBounds untested in e2e'],
  ['advanced-features/animate-point-along-line', '—', '➖ app-level pattern; source/geojson covers the data path'],
  ['advanced-features/click-to-center', 'map/events (click)', '✅'],
  ['advanced-features/mouse-position', 'map/events (click lngLat)', '✅'],
  ['advanced-features/live-real-time-data', '—', '➖ app-level pattern (WebSocket→setData); unit-covered'],
  ['advanced-features/measure-distance', '—', '➖ app-level (turf); not a library claim'],
  ['advanced-features/measure-polygon-area', '—', '➖ app-level (turf); not a library claim'],
]

const rows = matrix
  .map(([claim, cases]) => {
    const cells = cases
      .map((c) => {
        const specsFor = caseToSpecs[c]
        const status = specsFor ? '✅' : '❌ no spec'
        const rev = review?.results.find((r) => r.id === c)
        const revMark = rev ? (rev.ok ? '' : ' ⚠️review') : ''
        return `\`${c}\` ${status}${specsFor ? ` (${specsFor.join(', ')})` : ''}${revMark}`
      })
      .join('<br>')
    return `| ${claim} | ${cells} |`
  })
  .join('\n')

const bkoiRows = barikoiExamples.map(([ex, c, st]) => `| ${ex} | ${c} | ${st} |`).join('\n')

const md = `# E2E Coverage Report — README claims & Barikoi docs examples

Generated: ${new Date().toISOString()}
${review ? `Review evidence: ${reports.at(-1)} (dwell ${review.dwell}ms, headed)` : 'No headed review run yet — run `npm run e2e:review` for per-case visual evidence.'}

## README claim matrix

| README claim | e2e case → spec | 
|---|---|
${rows}

## docs.barikoi.com/examples mapping

Legend: ✅ covered · ➖ app-level pattern, not a library contract · ❌ gap

| Barikoi example | Our case | Status |
|---|---|---|
${bkoiRows}

## Suites

- \`npm run e2e\` — headless, full spec suite (CI gate)
- \`npm run e2e:headed\` — same specs, visible browser (fast, auto-advancing)
- \`npm run e2e:review\` — ONE browser, one case at a time with dwell, so a
  human can inspect each README claim live; writes \`e2e/report/review-*.json\`
  (logo paint + attribution text + page errors per case)
`

mkdirSync('e2e/report', { recursive: true })
writeFileSync('e2e/report/coverage.md', md)
console.log('wrote e2e/report/coverage.md')
