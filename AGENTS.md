# AGENTS.md

Development guide for AI coding assistants working on this repo.

**Read [CONTRIBUTING.md](./CONTRIBUTING.md)** — single source of truth for
setup, architecture details, testing pitfalls, CSS build, gotchas, and
pre-publish validation. User-facing API docs: [README.md](./README.md).
Version history: [CHANGELOG.md](./CHANGELOG.md).

## Project

`react-bkoi-gl` — React wrapper (v3, react-map-gl-style declarative API) over
**maplibre-gl v6**, wired to Barikoi basemaps
(`https://map.barikoi.com/styles/<name>/style.json?key=<API_KEY>`).
Every README example is a published contract — breaking one is a regression,
and e2e specs exist to cover each claim.

## Architecture

- `src/components/map.tsx` — `<Map>` core: creates the maplibre instance,
  exposes `MapContext` (map + mapLib), `MapProvider`, and `MapRef`
  (imperative methods: `flyTo`, `fitBounds`, `queryRenderedFeatures`, …).
- `src/components/use-map.tsx` — `useMap()` hook family (context access).
- Overlays: `Marker` (portals children into the marker element, injects its
  coords into a `<Popup>` child), `Popup`.
- Data: `Source` (geojson/vector/raster/image/video), `Layer`,
  `CanvasSource` (canvas-backed raster).
- Controls: Navigation, Scale, Geolocate, Fullscreen, Attribution, Terrain,
  Globe, Logo, Minimap, and `DrawControl` (maplibre-gl-draw wrapper with
  toolbar; captures its container via control-corner DOM query).
- `src/components/use-control.ts` — `useControl()` for custom IControls.
- `src/maplibre/worker-setup.ts` — auto-registers the worker URL before the
  first `<Map>` mounts (asset probe → Blob-worker fallback; overrides win).
  `scripts/build-worker.mjs` bundles the engine worker into
  `dist/bkoi-map-worker.mjs` (exported as `react-bkoi-gl/worker`) and regenerates
  `src/maplibre/worker-bundle.generated.ts` (committed). Details:
  `docs/framework-setup.md`.
- `src/exports-maplibre-gl.ts` — public surface: `Map` (default), all
  components/hooks above, re-exports of maplibre-gl types, plus engine globals
  (`setWorkerUrl`, `getWorkerUrl`, `getVersion`, `GPUInitializationError`) so
  app code never imports `maplibre-gl` (breaks under pnpm strict layout).
- `src/utils/` — `applyReactStyle`, `deep-equal`, `compare-class-names`,
  `style-utils`, `logger`, `warn`.
- Build: `scripts/build-worker.mjs --ts-only` → `tsup` (ESM/CJS to `dist/`) →
  `scripts/build-worker.mjs` (branded worker + generated TS) +
  `scripts/build-styles.js` (CSS into `dist/styles/`). maplibre-gl v6 is
  ESM-only → `dist/index.cjs` is bundler-only (asserted in
  `scripts/test-pack.mjs`).

## Commands

| Purpose | Command |
|---|---|
| Dev server (style/api experiments) | `npm run e2e:serve` (vite, :5175) |
| Typecheck / lint | `npm run typecheck` / `npm run lint` |
| Build | `npm run build` (tsup + CSS) |
| Unit tests (mocked maplibre) | `npm run test:unit` — 317 tests |
| Browser tests (real maplibre, headless, local style) | `npm run test:browser` — 9 tests |
| E2E (Playwright vs built `dist/`) | `npm run e2e` (chains `npm run build`) |
| Pack tarball smoke | `npm run test:pack` |
| Framework repros (Vite/Next 15/Next 16/CRA consumer apps) | `npm run test:framework` (npm; `--pm=pnpm|yarn|bun`, `--only=<app>`; long: run detached) |
| Framework headed review (same UX as e2e:review) | `npm run test:framework:review` (`ONLY=`, `DWELL=`, `PAUSE=1`, `PM=`, `SKIP_INSTALL=1`) |
| Test suites | `tests/` — `unit/`, `browser/`, `e2e/`, `framework/` |
| Full gate | typecheck + lint + unit + browser + e2e + test:pack (+ `npm run test:framework` before releases) |

## Command discipline (tool/assistant workflow)

- **Short tool timeouts.** Never set long bash timeouts hoping a command
  finishes; anything expected to exceed ~60 s (full e2e suite, installs)
  runs detached: `nohup … > /tmp/log 2>&1 &` then poll the log.
- **Fail fast, abort, then fix.** Chain checks with `&&` / `set -e` so the
  first error aborts immediately. If a run errors: kill the process (and
  any dev servers it spawned) before diagnosing — never let a broken run
  block on its timeout.
- **Recon-then-action.** Reproduce with the single failing spec before any
  full-suite run; fix, then retry just that spec; only then re-run the suite.
- Zombie vite from aborted calls: `pkill -f "[v]ite e2e"` (bracket so
  `pkill` never matches its own pattern). Framework servers: `npx next start`
  orphans its child on kill — `tests/framework` spawns `node_modules/.bin/next`
  in its own process group and `fuser -k <port>/tcp`s before and after.

## E2E architecture

- `tests/e2e/app/` — vite app, one case per URL (`/?case=<name>`) from
  `tests/e2e/app/cases/`; `react-bkoi-gl` aliased to `dist/` (e2e validates the
  publish artifact; rebuild before runs).
- Page state on `window`: `__MAP__` (live maplibre instance), `__LOG__`
  (event log), `__pageErrors__` (uncaught errors, recorded in
  `tests/e2e/app/main.jsx`).
- `tests/e2e/fixtures/map.ts` — `gotoCase`, `getMapState`, `waitForLog`,
  `waitForCameraStable` (poll-based waits only; assert map state/DOM,
  never pixels).
- Config: `workers: 1` (WebGL determinism), `timeout: 60_000` — never
  raised above 60 s, never overridden by CLI `--timeout`, no per-test
  `setTimeout` patches; long waits belong in `expect.poll`/locator options.

## Known limits & pitfalls

- Headless-shell: FullscreenControl → assert the class swap
  (`maplibregl-ctrl-fullscreen` ↔ `maplibregl-ctrl-shrink`), not
  `document.fullscreenElement`; GeolocateControl → fake position via
  `context.addInitScript` overriding `navigator.geolocation`.
- MapLibre private internals (`style._loaded` etc.) drift across versions —
  use public `isStyleLoaded()` and re-arm listeners with `on`, not `once`
  (styledata can fire before load completes; a one-shot listener loses the
  race and sources never get added).
- `Marker` does not forward `data-testid` — spec selectors must use real
  Marker DOM (`.maplibregl-marker`, `.maplibregl-marker-draggable`).
- Component function children need `forwardRef` to receive refs (React 18).
- Vitest mock factories (`vi.mock('maplibre-gl', …)`) throw on PROPERTY
  ACCESS of missing exports — when the engine surface grows (e.g.
  `setWorkerUrl`), every virtual mock in `tests/unit/` must gain it, or the
  `<Map>` mount chain rejects and components never render.
- Framework review transitions are instant because builds are snapshotted into
  `tests/framework/<app>/.fw-snap/<cell>` (gitignored); rerun without
  `SKIP_BUILD` after library changes or you review stale builds.
- `.env` (gitignored) must define `BARIKOI_API_KEY` (exact name, matching
  `.env.example`).
