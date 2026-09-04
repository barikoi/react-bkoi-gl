# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - unreleased

Major release: `maplibre-gl` migrated from 5.24.0 to **6.6.0** (latest v6). See the [v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/).

### Added
- **Zero-config map rendering in every bundler.** The package ships a self-contained Web Worker and registers it automatically before the first `<Map>` mounts — no `setWorkerUrl()` call, no bundler worker rules, no files to copy. Overrides (`setWorkerUrl`, the `workerUrl` prop) are still respected.
- **Engine utilities re-exported** so consumers never import `maplibre-gl` directly (a transitive dependency is not resolvable under pnpm's strict layout or yarn PnP): `setWorkerUrl`, `getWorkerUrl`, `getVersion`, `GPUInitializationError`.

### Breaking (relative to 2.2.1)
- **WebGL2 required** — the engine v6 dropped WebGL1; unsupported browsers throw `GPUInitializationError` and cannot render.
- **Node >= 18.18.0** required for builds/development (runtime is browser-only).
- **`showBarikoiLogo` prop removed** — the Barikoi logo always renders; consumers who must hide it override the CSS.
- **`Marker` drag callbacks no longer receive `lngLat` on the event** — maplibre-gl v6's `MarkerDragEvent` carries `{ type, target }` only. Use `e.target.getLngLat()` (or a `marker` ref) to read the position.
- **Manual worker setup removed (and no longer needed)** — v3 ships its own worker and registers it automatically; **remove any v2-era `setWorkerUrl()` workaround**. Explicit calls still work as overrides, and `setWorkerUrl` is now imported from `react-bkoi-gl`, not `maplibre-gl`.
- **Transitive maplibre-gl is now v6** — consumers importing `maplibre-gl` directly get ESM-only output; the UMD bundle and separate CSP build are gone. Nested objects/arrays in GeoJSON feature properties are preserved as real objects — remove any `JSON.parse` on them.
- **`PopupEvent` / `MarkerDragEvent` types now come from `maplibre-gl`** — v6 exports them as classes; the locally defined shapes are removed. Check `e.type` instead of `instanceof`.
- **`MapBoxZoomEvent`** replaces the `MapLibreZoomEvent` alias, matching maplibre-gl v6.

### Changed
- `Map#transformCameraUpdate` property assignment replaced with `Map#setTransformCameraUpdate()`.
- `Popup` open/close handlers use the v6 `PopupEvent` directly (no more `MapMouseEventBase` casting).
- `mapLib` prop module resolution supports v6 ESM named-export modules alongside legacy default-export (UMD/v5) bundles.
- All `package.json` version specifiers are exact pins (no `^`/`~`); `maplibre-gl` pinned to `6.6.0`.

### Testing
- **Jest → Vitest 4** (~2× faster, native ESM) — jsdom unit suite (390 tests) plus a browser-mode layer running the real engine in headless Chromium (9 tests).
- **End-to-end suite** (41 specs / 40 case pages) runs against the built package and covers the full README feature matrix plus every `docs.barikoi.com/examples` example (23/23).
- **Framework compatibility suite** — real consumer apps (Vite 5/6/7, Next.js 15/16 in webpack + Turbopack modes, CRA 5) install the packed tarball across npm/pnpm/yarn/bun on React 18 and 19, verified headlessly for actual tile rendering.
- **Line coverage raised from 88% to 98%** across the full unit + browser run.
- **Pre-publish gates** — pack tarball smoke test, `publint --strict`, `@arethetypeswrong/cli` (dual CJS/ESM types across resolution modes), and a package-manager resolution matrix (`npm`, `pnpm`, `yarn` classic, `yarn` PnP, `bun`).
- **README examples are executable contracts** — `npm run check:readme` typechecks every fenced example against the built `.d.ts` (strict), and the e2e suite mounts the extracted examples verbatim in a real browser (`readme-examples` case + spec).

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

