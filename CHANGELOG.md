# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - unreleased

Major release: `maplibre-gl` migrated from 5.24.0 to **6.6.0** (latest v6). See the [v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/).

### Added
- **CI pipeline** (`.github/workflows/ci.yaml`) — single workflow, master only (push + PRs): Node 20/22 matrix running typecheck, lint, build, tests with coverage; coverage badge auto-committed on `master` (`scripts/make-coverage-badge.mjs` → `coverage.json` shields endpoint). No secrets required; publishing stays manual.
- **`prepublishOnly` gate** — typecheck + lint + test + build enforced on every (manual) publish.
- **Release notes helper** — `scripts/extract-changelog.mjs` prints the top CHANGELOG section for pasting into GitHub Releases.
- **Test migration: Jest → Vitest 4** — matches the peer ecosystem (`react-map-gl`, `maplibre-gl-js`, `deck.gl` all run Vitest). Suite runs ~2× faster (≈5s vs ≈10s) with native ESM (no ts-jest/babel-jest/identity-obj-proxy CJS shims). Changes: `vitest.config.ts` replaces `jest.config.cjs`; JSX test files renamed `.js` → `.jsx`; `jest.*` → `vi.*` codemod; constructor mocks converted from arrow to regular function implementations (Vitest 4 delegates `new` to the spy implementation); default-export module mocks (`assert`, `maplibre-gl-draw`, `set-globals`) now return `{ __esModule: true, default }` objects; RTL auto-cleanup wired via `afterEach(cleanup)` in setup; `use-isomorphic-layout-effect` tests rewritten against the real source (jsdom + a `node`-environment file covering the SSR branch — the old version mocked the module under test); geolocate white-box tests rewritten behaviorally (no React hook spying). Dev deps removed: jest, ts-jest, babel-jest, jest-environment-jsdom, identity-obj-proxy, @types/jest, react-test-renderer (unused), tape-promise (unused), @testing-library/jest-dom (plain vitest assertions). Added: vitest, @vitest/coverage-v8, jsdom.
- **Browser test layer (Vitest browser mode + Playwright)** — same stack as react-map-gl: real maplibre-gl runs in headless Chromium for `__tests__/browser/` specs (Map camera + controlled updates, Marker, Popup portal lifecycle, Source+Layer rendering via `queryRenderedFeatures`) against offline inline styles; browser setup applies maplibre v6 `setWorkerUrl` exactly like react-map-gl's. Deps added: `playwright`, `@vitest/browser-playwright`. Scripts: `test:unit`, `test:browser`, `playwright:install`; CI installs Chromium.

### Fixed
- **`onLoad` fired twice** — the wrapper fired a synthetic `load` event on top of maplibre-gl's natural one, double-triggering consumer `onLoad` callbacks in real browsers. Synthetic fire removed; caught by the browser tests.
- **Camera events crashed on maplibre v6** — `_onCameraEvent` read the internal `map.transform`, which no longer exists in v6 (`Cannot read properties of undefined (reading 'center')` on resize/move). View state now read from public getters (`getCenter`/`getZoom`/`getBearing`/`getPitch`/`getPadding`) via new `mapToViewState`/`viewStateChanges` helpers.
- **Controlled props never updated the camera** — `<Map longitude={…} zoom={…}>` rerenders never called `setProps`: the diffing layout effect had `[mapInstance]` deps that never change. The effect now runs per render (it subscribes to nothing); caught by the browser tests via the `cursor` side effect.
- **SonarQube removed** — `action.yaml` workflow and `sonar-project.properties` dropped; CI is the single remaining workflow.
- **Test coverage improvements** — attribution-content rewrite, logo-control stale-logo removal/attributes/cleanup, draw-control event wiring/cursor reset/unsubscription, `set-globals` URL validation branches, `emitWarning` routing (311 tests, was 283; ~89% lines; `src/**/*.d.ts` excluded from coverage).
- **README badges** — CI, coverage (live endpoint), maplibre-gl version, Node engines.

### Breaking (relative to 2.2.1)
- **`Marker` drag callbacks no longer receive `lngLat` on the event** — maplibre-gl v6's `MarkerDragEvent` carries `{ type, target }` only. Use `e.target.getLngLat()` (or a `marker` ref) to read the position.
- **Bundlers must set the worker URL** — v6 is ESM-only; `import.meta.url` auto-detection fails under webpack/Turbopack/Vite, producing a blank map with no errors. Call `setWorkerUrl()` from `maplibre-gl` before first render (see README "Next.js + Turbopack: Worker URL fix"). Direct CDN/`<script type="module">` usage needs no change.
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

### Fixed
- **Unused `Popup` import** removed from `src/types/events.ts`.
- **README worker-fix script** — `fileURLToPath` replaces `.pathname` (broken on Windows: `/C:/...`).
- Tests updated for the v6 event shapes (`marker.test.js`, `maplibre.test.js`).

## [2.2.1] - 09-07-2026

### Fixed
- **Barikoi logo asset regression** — the 2.2.0 CSS build rewrite (commit `6167c19`) replaced the canonical Barikoi logo PNG with a corrupted variant (1 byte shorter, different pixel data), leaving the logo blank or broken for consumers upgrading from 2.1.0. Restored the canonical 2.1.0 PNG (Barikoi wordmark with green ô) in `styles/overrides.css`. `LogoControl` unchanged — the logo remains CSS-driven (empty `<a>` + `background-image`), single source of truth.

---

## [2.2.0] - 30-06-2026

### Added
- **Injectable logger** (`logger`, `setLogger`, `Logger`) exported from the public surface — route warnings/errors to telemetry (Sentry, etc.) instead of `console`.
- **`onWarning` prop** on `<Map>` for per-instance non-fatal warning handling (transient `queryRenderedFeatures` errors, etc.); falls back to `console.warn`.
- **`showBarikoiLogo` / `showAttribution` props** on `<Map>` (default `true`) — opt out of the auto-included Logo/Attribution controls without the OSM/MapLibre license compliance caveats.
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

