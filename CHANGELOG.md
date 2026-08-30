# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - unreleased

Major release: `maplibre-gl` migrated from 5.24.0 to **6.6.0** (latest v6). See the [v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/).

### Added
- **CI pipeline** (`.github/workflows/ci.yaml`): Node 20/22 matrix — typecheck, lint, build, tests with coverage; coverage badge committed on `master`.
- **`prepublishOnly` gate**: typecheck + lint + test + build before every publish.
- **Release notes helper**: `scripts/extract-changelog.mjs` prints the top CHANGELOG section.
- **Jest → Vitest 4**: ~2× faster (~5s), native ESM. Deps removed: jest family, `react-test-renderer`, `tape-promise`, `@testing-library/jest-dom`. Added: `vitest`, `@vitest/coverage-v8`, `jsdom`.
- **Browser test layer** (Vitest browser mode): real maplibre-gl in headless Chromium (`__tests__/browser/`) — Map camera/controlled updates, Marker, Popup lifecycle, Source+Layer via `queryRenderedFeatures`. Scripts: `test:unit`, `test:browser`, `playwright:install`.
- **End-to-end suite** (`e2e/`, `npm run e2e`): runs against the built `dist/`. 27 case pages, one full-viewport map per URL, covering the README feature matrix — Map (styles/viewState/events/MapRef), Marker & Popup, Source/Layer/CanvasSource, controls in four groups (camera, globe, minimap incl. `parentRect`, terrain), DrawControl, hooks. Specs assert paint-level branding (logo PNG decodes), attribution persistence, and camera behavior (zoomIn/zoomOut/flyTo).
- **`npm run e2e:review`**: headed human-review runner — one browser, one case at a time, per-case evidence report in `e2e/report/`.
- **`npm run e2e:coverage`**: README-claim → case → spec matrix + `docs.barikoi.com/examples` mapping (`e2e/report/coverage.md`).
- **E2e suite expanded to 41 tests / 40 case pages** with open-data MapLibre-example cases (no Barikoi tiles required): hillshade (Terrarium DEM), clustered points, heatmap, animated marker, video source (CORS-open Wikimedia footage), fitBounds/pitch/bearing controls, globe with atmosphere (EOx satellite), 3D buildings + terrain (OpenFreeMap `planet` + Terrarium DEM). DrawControl coverage now spans the full README prop surface (`displayControlsDefault`, `defaultMode`, custom `styles`, `onDrawModeChange`, trash delete) alongside create/update/select/delete interactions. Headed review runs get a shared "Rendering ·" status pill, a 10s per-test hold, and maximized windows (no fixed viewport — never crops on any OS/display).
- **Every `docs.barikoi.com/examples` example is now covered by an e2e case** (23/23 in the coverage matrix, `e2e/report/coverage.md`): vector-tile source (`url` + `source-layer`), symbol layer with an `addImage` icon, soft pulsing CSS marker, `useControl` custom control with live state, `fitBounds`, live real-time `setData` feed, distance and polygon-area measurement, and an exact port of the cinematic camera animation example (orbit rotation + Dhaka flyover tour + reset).

### Fixed
- **`TerrainControl` could never enable terrain** — wrapper leaked `position`/`style` props into the maplibre control options; `setTerrain` spec validation rejected them and every toggle click silently failed. Wrapper-only props are now stripped before constructing the control.
- **`Marker` with a popup-only child lost its pin** — any child (even a lone `<Popup>`) replaced the default marker icon with an empty element. A `<Popup>`-only child now keeps the default icon; other children still replace it (documented in README).
- **`onLoad` fired twice** — synthetic `load` removed; maplibre's natural event is used.
- **Camera events crashed on v6** — `map.transform` no longer exists; view state read from public getters via new `mapToViewState`/`viewStateChanges` helpers.
- **Controlled props never updated the camera** — props-diff effect had `[mapInstance]` deps that never change; now runs per render.
- **SonarQube removed** — `action.yaml` and `sonar-project.properties` dropped.
- Test count 283 → 326 (~89% lines: 317 unit + 9 browser-mode).
- **README: Camera Animation section added** — the cinematic orbit/flyover/reset example (matching the Barikoi docs example verbatim), type-checked against the shipped types; `barikoi-dark-mode` added to the documented map styles.
- **README links and branding fixed** — dead links repaired (docs index, React, map options, engine docs URL); GitHub-hosted CI/coverage badges removed (private repository — they rendered broken), leaving npm/TypeScript/React badges; and MapLibre mentions reduced to code identifiers only — descriptions, headings, and feature lists now lead with Barikoi (the engine is credited once, under Resources).

### Breaking (relative to 2.2.1)
- **`showBarikoiLogo` prop removed** — the Barikoi logo always renders; consumers who must hide it override the CSS.
- **`Marker` drag callbacks no longer receive `lngLat` on the event** — maplibre-gl v6's `MarkerDragEvent` carries `{ type, target }` only. Use `e.target.getLngLat()` (or a `marker` ref) to read the position.
- **Bundlers must set the worker URL** — v6 is ESM-only; `import.meta.url` auto-detection fails under webpack/Turbopack/Vite (blank map, no errors). Call `setWorkerUrl()` from `maplibre-gl` before first render. CDN/`<script type="module">` usage needs no change.
- **Transitive maplibre-gl is now v6** — consumers importing `maplibre-gl` directly get ESM-only output; the UMD bundle and separate CSP build are gone (CSP no longer needs a special bundle). Nested objects/arrays in GeoJSON feature properties are preserved as real objects — remove any `JSON.parse` on them.
- **`PopupEvent` / `MarkerDragEvent` types now come from `maplibre-gl`** — v6 exports them as classes; the locally defined shapes are removed. Check `e.type` instead of `instanceof`.
- **`MapBoxZoomEvent`** replaces the `MapLibreZoomEvent` alias, matching maplibre-gl v6.

### Changed
- `Map#transformCameraUpdate` property assignment replaced with `Map#setTransformCameraUpdate()`.
- `Popup` open/close handlers use the v6 `PopupEvent` directly (no more `MapMouseEventBase` casting).
- `mapLib` prop module resolution supports v6 ESM named-export modules alongside legacy default-export (UMD/v5) bundles.
- `_updateSize` reads canvas `clientWidth`/`clientHeight` instead of the internal `map.transform` dims.
- `DrawControl` event subscriptions typed via `any` cast (draw events are not part of maplibre's `MapEventType`).
- The separate direct `@maplibre/maplibre-gl-style-spec@25.0.0` dependency was removed — style-spec types are re-exported from `maplibre-gl` (which bundles style-spec `^26.3.0`), so no consumer-facing type change.
- All `package.json` version specifiers are exact pins (no `^`/`~`); `maplibre-gl` pinned to `6.6.0`.


## [2.2.1] - 09-07-2026

### Fixed
- **Barikoi logo asset regression** — the 2.2.0 CSS build rewrite (commit `6167c19`) replaced the canonical Barikoi logo PNG with a corrupted variant (1 byte shorter, different pixel data), leaving the logo blank or broken for consumers upgrading from 2.1.0. Restored the canonical 2.1.0 PNG (Barikoi wordmark with green ô) in `styles/overrides.css`. `LogoControl` unchanged — the logo remains CSS-driven (empty `<a>` + `background-image`), single source of truth.

---

## [2.2.0] - 30-06-2026

### Added
- **Injectable logger** (`logger`, `setLogger`, `Logger`) exported from the public surface — route warnings/errors to telemetry (Sentry, etc.) instead of `console`.
- **`onWarning` prop** on `<Map>` for per-instance non-fatal warning handling (transient `queryRenderedFeatures` errors, etc.); falls back to `console.warn`.
- **`showAttribution` prop** on `<Map>` (default `true`) — opt out of the auto-included Attribution control without the OSM/MapLibre license compliance caveats. (The Barikoi logo has no opt-out: see Breaking.)
- **Accessibility hardening** for `GlobeControl` and `MinimapControl`:
  - `GlobeControl` forces `type="button"`, `aria-label`, `title`; custom `buttonElement` must be `<button>` or carry `role="button"`, otherwise refused with a warning; dynamic label on toggle.
  - `MinimapControl` announces collapse/expand via a visually-hidden `aria-live="polite"` region; `aria-expanded` reflects state.
- **SVG sanitization** in `MinimapControl` rewritten as DOMParser + allowlist walk (`ALLOWED_TAGS`, drop `on*` attrs, `style` attrs, restrict `href`/`xlink:href` to `#`/`http(s)://`); unsafe values rejected.
- **CSS injection defense** — `MinimapControl` validates `borderRadius`, `containerStyle`, `toggleButton` colors via `CSS.supports` and rejects values containing `;`, `{`, `}`, `\`, or `url(`; style element uses `textContent` instead of `innerHTML` to neutralize `</style>` breakout.
- **CSS build rewrite** — `scripts/build-styles.js` replaces regex-based `modify-css.js`; vendor CSS concatenated with a committed `styles/overrides.css`, no runtime mutation.
- Tests: `globe-control` a11y, `minimap-control` security/sanitization, `logger`, `setGlobals`, and `Map` control-visibility coverage.

### Changed
- **React ≥18 peer dependency** (uses `useId`, `useSyncExternalStore`); `react` and `react-dom` now require `>=18.0.0`.
- TypeScript `target`/`moduleResolution` upgraded (`es2022`, `bundler`); added `skipLibCheck`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, `eslint-plugin-prettier`.
- Map component props-diff effect no longer re-subscribes every render (deps reduced to `[mapInstance]`); uses `latestPropsRef`.
- `<Layer>` and `<Source>` now throw with a clear message when rendered outside `<Map>` instead of silently failing.
- README: removed bundlephobia badge, added interactive npm badges (version, downloads, license, React ≥18), new sections for **Requirements**, **Next.js & SSR**, **Logging**, **Accessibility**; dropped `mapLib` props row and "optional maplibre-gl peer" language.

### Fixed
- **`getContext` hijack leak** — `HTMLCanvasElement.prototype.getContext` is now restored in a `try/finally` around `new Map()`, so a constructor throw can no longer permanently break every other `<canvas>` on the page.
- **`isStyleLoaded()` throw** — both call sites now guarded with `map.style &&` to avoid throwing when no style is set (deferred/error path).
- **Silent RTL plugin failure** — `setGlobals` now `logger.warn`s when `RTLTextPlugin` is configured but the supplied `mapLib` lacks `setRTLTextPlugin`, instead of silently skipping (Arabic/Hebrew would not render).
- **Prototype-polluted prop keys** — `<Layer>` and `<Source>` use `hasOwnProperty` guards before comparing `paint`/`layout`/source props.
- **Attribution element type check** — `AttributionControl` uses `instanceof HTMLElement` instead of truthy check before applying required attribution styling; logs a warning if the legally-required element is missing.
- **Redundant `maplibre-gl` peer dependency** removed from `package.json` (already shipped as a regular dependency).

### Removed
- `scripts/modify-css.js` (replaced by `scripts/build-styles.js`).
- Unused React imports across `canvas-source`, `draw-control`, `minimap-control`, `source`.

---

## [2.1.0] - 30-03-2026

### Added
- **MinimapControl** component for displaying a minimap preview
- **DrawControl** component for drawing and editing geometries on the map
- New events for draw control (`onDrawCreate`, `onDrawDelete`, `onDrawUpdate`, etc.)
- New events for minimap control (`onMinimapClick`, etc.)
- Husky integration for git hooks with lint-staged
- Test cases for DrawControl and MinimapControl components

### Changed
- Updated README with comprehensive documentation and examples
- Refined type definitions and improved type safety across components
- Updated dependencies to latest versions (maplibre-gl v5.15.0, etc.)
- Updated ESLint configuration
- Improved logo positioning

### Fixed
- TypeScript issues
- ESLint issues
- Issues identified in security audit report

## [2.0.1] - 07-01-2025

### Added
- Added developer guide documentation (`DEVELOPMENT.md`)

### Changed
- Update LogoControl and AttributionControl components for improved functionality and styling

## [2.0.0] - 12-05-2025

### Added
- Unit test integration with Jest
- SonarQube integration for code quality analysis
- CI/CD pipeline implementation

### Changed
- Migrated from `mapbox-gl` to `maplibre-gl` as the underlying mapping library

### Fixed
- Typescript and linting issue
- Peer dependency issue

