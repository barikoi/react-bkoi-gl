# Contributing to react-bkoi-gl

Single source of truth for working on this library: setup, architecture,
testing pitfalls, gotchas, and release checklist.

For user-facing API docs see [README.md](./README.md). For version history
see [CHANGELOG.md](./CHANGELOG.md).

---

## Quick Start

1. **Setup:** see [Development Environment](#development-environment) below.
2. **Workflow:**
   - Work happens on the `dev` branch.
   - Write tests for new features and bugfixes.
   - Build and test locally using the [tarball method](#local-package-testing).
   - Push to `dev` after hooks pass.
3. **Merges:** maintainers periodically merge `dev` into `master`.

---

## Development Environment

### Prerequisites

- Node.js >= 18.18.0
- npm (latest)
- Git

### Setup

```bash
git clone https://github.com/barikoi/react-bkoi-gl.git
cd react-bkoi-gl
npm install
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run typecheck` | TypeScript validation (`tsc --noEmit`) |
| `npm run lint` | ESLint (flat config, `src/`) |
| `npm test` | Typecheck + full Vitest suite |
| `npm run test:unit` / `npm run test:browser` | Vitest projects (jsdom / real Chromium) |
| `npm run coverage` | Vitest with coverage report |
| `npm run build` | Production bundle (worker bundle + tsup + CSS) |
| `npm run test:pack` | Pack-tarball smoke (installs the tarball, asserts exports/files) |
| `npm run e2e` | Playwright suite vs built `dist/` (chains build) |
| `npm run e2e:serve` / `e2e:review` / `e2e:coverage` | e2e host app / headed review / claim-coverage matrix |
| `npm run test:framework` / `test:framework:review` | Framework compatibility matrix / its headed review |
| `npm run playwright:install` | One-time Chromium install for browser tests |
| `npm run prepublishOnly` | Publish gate: typecheck + lint + test + build |

### Project Structure

```
src/
  components/     # React components — Map, Layer, Source, controls, etc.
  maplibre/       # MapLibre wrapper class, MapRef factory, worker-setup.ts
  types/          # TypeScript type definitions
  utils/          # Helpers (logger, deep-equal, transform, etc.)
scripts/          # build-worker.mjs, build-styles.js, test-pack.mjs, …
styles/           # Committed CSS overrides, concatenated into the bundle
tests/
  unit/           # Vitest, jsdom, mocked maplibre-gl (mocks/ here too)
  browser/        # Vitest browser mode — real maplibre-gl in Chromium
  e2e/            # Playwright suite vs built dist/ (app/, specs/, review/)
  framework/      # Consumer repro apps: Vite/Next 15/Next 16/CRA + runner
docs/
  framework-setup.md  # Worker-resolution internals, overrides, troubleshooting
  audits/         # Historical code audit reports (not shipped)
```
`src/maplibre/worker-bundle.generated.ts` is GENERATED (worker source inlined
for the Blob fallback) and committed so typecheck works before a build.

### Git Hooks

Hooks are configured automatically by `npm install` via Husky. Files live in
`.husky/`.

- **pre-commit**: runs `lint-staged` (eslint --fix, prettier --write),
  `npm run typecheck`, and `npm run test`. `npm run build` also runs on
  `main`/`dev` branches.
- **commit-msg**: enforces that `user.name` and `user.email` are set, appends
  a `Signed-off-by` trailer via `git interpret-trailers`, and runs
  `commitlint --edit` to validate the message format.

Bypassing these checks is not supported — fix the underlying issue instead.

---

## Architecture

The library is organized around a `Map` component that provides context to
all child components.

### Context Pattern

- `MapContext`: provides `{ mapLib, map }` to all children — used by Marker,
  Popup, Layer, Source, and controls.
- `MountedMapsContext`: tracks all mounted maps by ID — used by `useMap()`.

### MapRef Pattern

The `MapRef` type (from `src/maplibre/create-ref.ts`) exposes most MapLibre
map methods but explicitly skips methods that would break React bindings:
`setMaxBounds`, `setMinZoom`, `setMaxZoom`, `setMinPitch`, `setMaxPitch`,
`setRenderWorldCopies`, `setProjection`, `setStyle`, `addSource`,
`removeSource`, `addLayer`, `removeLayer`, `setLayerZoomRange`, `setFilter`,
`setPaintProperty`, `setLayoutProperty`, `setLight`, `setTerrain`, `setFog`,
`remove`.

Use `map.getMap()` to access the raw MapLibre instance when needed.

### Component Lifecycle

`Source`, `Layer`, `Marker`, `Popup`:

1. Access the map via `useContext(MapContext)`.
2. Create their MapLibre counterpart in `useMemo`.
3. Add to map in `useEffect` (cleanup on unmount).
4. Update props reactively via additional effects.

### Worker Setup (automatic)

`<Map>` never requires worker configuration. Before the engine Map is
constructed, `ensureWorkerUrl()` (`src/maplibre/worker-setup.ts`) probes the
bundler-emitted `dist/bkoi-map-worker.mjs` asset (webpack/CRA/Next — both
Turbopack and webpack modes) and falls back to a same-origin Blob worker built
from the inlined source. Explicit overrides (`setWorkerUrl()`, the `workerUrl`
prop) always win. Mechanism, CSP, and self-hosting:
[docs/framework-setup.md](./docs/framework-setup.md).

### Public Surface

Everything exported from `src/exports-maplibre-gl.ts` is public. Anything
else is internal even if TypeScript visibility allows it. Notably public:
`logger`, `setLogger`, `Logger` (injectable logger), all map components,
hooks (`useMap`, `useControl`), `MapRef`, and the engine globals
`setWorkerUrl` / `getWorkerUrl` / `getVersion` / `GPUInitializationError`.
Type re-exports live in `src/types/`. Add new exports only via `src/exports-maplibre-gl.ts` — no
barrel files elsewhere.

---

## Testing Workflow

### Framework Compatibility (`tests/framework/`)

One real consumer app per framework — **Vite 6/7, Next.js 15, Next.js 16, CRA
react-scripts 5** — installed from the packed tarball (tarball method) and
verified headlessly for actual tile rendering (worker constructed + 200, engine
`load` + `idle`, no uncaught errors). Covers the README's zero-config claims
and the package-manager matrix (npm/pnpm/yarn/bun) plus both Next bundler
modes (Turbopack and webpack).

```bash
npm run test:framework                                # full npm matrix (~10 min; run detached)
node tests/framework/run.mjs --only=next16 --pm=pnpm  # single cell + PM
npm run test:framework:review                         # headed human walkthrough (e2e:review UX)
```

Installs are heavy and long — run detached (`nohup … &`) and poll the log.
Mechanism details: [docs/framework-setup.md](./docs/framework-setup.md).

### Unit Tests

- **Framework**: Vitest (unit, jsdom, mocked maplibre-gl) + React Testing Library;
  Vitest browser mode (real maplibre-gl in headless Chromium via Playwright)
  for `tests/browser/` specs — same setup as react-map-gl.
- **Projects**: `unit` (jsdom, `tests/unit/**/*test*`) and `browser`
  (`tests/browser/**/*.spec.*`, real WebGL rendering, offline inline styles).
  Run one: `npm run test:unit` / `npm run test:browser`; browsers:
  `npm run playwright:install` (once per machine/CI).
- **Location**: `tests/unit/`, organized by component and utility; browser specs in `tests/browser/`.
- **Mocks**: `tests/unit/mocks/maplibre-gl.js` and
  `tests/unit/mocks/react-dom-mock.js` are load-bearing.
- **Coverage**: run `npm run coverage` to generate a report in `coverage/`.

```bash
npm test               # typecheck + full Vitest suite
npm run coverage       # Vitest with coverage
npm run typecheck      # TypeScript only
npx vitest run <pattern> # subset of tests
```

### Browser Specs (real maplibre-gl in Chromium)

Copy an existing spec — `tests/browser/controls.spec.jsx` and
`draw-control.spec.jsx` are the patterns. Conventions:

- Harness: `createRoot` + `act()` from `react-dom/test-utils`, `ref={mapRef}`
  on `<Map>`; mount into a detached `div` (no `document.body` state leak).
- Wait for readiness with `waitForMapLoad(mapRef)`, `waitFor(() => cond)`
  (polling with a deadline — for DOM/state conditions) or
  `actUntil(resolve => eventSource.once(..., resolve))` (one-shot event
  registration) — never arbitrary `sleep()` values, and never `actUntil`
  with an `if (cond) resolve()` body (it checks once and hangs if not met).
- Styles: `emptyStyle` (camera/marker/control tests) or `geojsonStyle`
  (layer/source tests) — both offline; do not fetch remote styles/tiles.
- Sequential re-renders on one `<Map>` instance per test (react-map-gl idiom),
  then one `root.unmount()` with DOM-absence assertions.
- Real-map timing is slower than jsdom: for lazy components (e.g.
  maplibre-gl-draw polls `map.loaded()` at 16 ms) wait for a concrete signal
  (`map.getSource('mapbox-gl-draw-cold')`) and raise the per-file timeout via
  `vi.setConfig({ testTimeout: 30000 })`.

### Testing Pitfalls (read before writing tests)

- **Component tests mock the whole `Maplibre` class**
  (`vi.mock('../../src/maplibre/maplibre', () => class { ... })`). Changes
  to the real `Maplibre.setProps`, `_updateStyleComponents`, or `_initialize`
  are NOT exercised by `tests/unit/components/*`. Test wrapper internals in
  `tests/unit/maplibre/maplibre.test.js` instead.
- **Style readiness has two signals, depending on the file:**
  - `src/maplibre/maplibre.ts` checks `map.style && map.isStyleLoaded()`.
    Mock with `style: {}` and `isStyleLoaded: vi.fn()`. Do NOT use
    `style._loaded` here — it's not read.
  - `src/components/layer.ts` and `src/components/source.ts` read
    `mapInternal.style._loaded` directly. In component tests, toggle
    `mockMapInstance.style._loaded` to control readiness.
- **`isStyleLoaded()` throws when no style is set.** The source guards with
  `map.style && ...`; setting `map.style = undefined` short-circuits so
  `isStyleLoaded` is never called.
- **MapLibre private fields** (`_container`, `_resizeObserver`, `_update`,
  `_render`, `_frame`) are accessed via `typeof` guards in `maplibre.ts`.
  They drift across MapLibre versions — never assume they exist.
- **`tests/unit/mocks/maplibre-gl.js`** must be updated whenever the MapLibre
  API surface used by source changes.
- **Vitest mocks throw on missing-export property access** — any virtual
  `vi.mock('maplibre-gl', …)` factory must expose everything source touches
  (`setWorkerUrl`, `getWorkerUrl`, `getVersion`, …) or `<Map>`'s mount chain
  rejects with "No X export is defined on the mock" and components never
  render. Keep the factories in sync with the engine surface.
- **Worker resolution in tests**: `<Map>` probes the bundled worker URL and
  falls back to a Blob worker (see `docs/framework-setup.md`); in jsdom the
  probe is skipped (non-http URL). If a test asserts worker behavior, mock at
  the `maplibre-gl` level, not the network level.

### Local Package Testing

**Do NOT use `npm link`.** Use the tarball method:

1. **Build and pack:**
   ```bash
   npm run build
   npm pack          # creates react-bkoi-gl-<version>.tgz
   ```
2. **Install in another project:**
   ```bash
   npm install /absolute/path/to/react-bkoi-gl-*.tgz
   ```
3. **Iterate:** rebuild, pack, and reinstall after each change.

The tarball simulates a real npm install and ensures dependencies resolve
correctly. `npm link` produces phantom-symbol bugs because of symlink
resolution across `node_modules`.

### CI Pipeline

**None.** All quality gates run locally (deliberate decision — CI minutes are
expensive and the maintainer tests locally):

- Full gate before release: `npm run typecheck` → `npm run lint` →
  `npm test` (typecheck + full vitest, unit + browser) → `npm run e2e` →
  `npm run test:pack`. `prepublishOnly` enforces typecheck + lint + tests +
  build before any publish.
- The README coverage badge is a self-contained `coverage-badge.svg`
  (committed, relative-path reference — renders on private repos);
  `npm run coverage` regenerates it locally.
- `package-lock.json` is gitignored by policy — installs use `npm install`,
  resolving from the exact version pins in `package.json`.

---

## CSS Build

`scripts/build-styles.js` concatenates vendor CSS in this order:

1. `node_modules/maplibre-gl/dist/maplibre-gl.css`
2. `node_modules/maplibre-gl-draw/dist/mapbox-gl-draw.css`
3. `styles/overrides.css` (Barikoi branding)

Output: `dist/styles/react-bkoi-gl.css` plus `dist/styles/index.d.ts` so
`import "react-bkoi-gl/styles"` resolves.

Overrides win by source order (equal specificity, later declaration wins).
Edit `styles/overrides.css` — never patch vendor CSS at build time. The
prior regex-based `modify-css.js` was replaced because mutating third-party
CSS with regex is brittle and unauditable.

---

## Background: Mapbox → Maplibre Migration

This library originally wrapped `mapbox-gl@1.13.1` (the last BSD-licensed
release). When Mapbox GL JS moved to a proprietary license at v2, the
project migrated to [Maplibre GL JS](https://maplibre.org/projects/maplibre-gl-js/)
— the community fork of Mapbox GL v1, fully open-source and drop-in
compatible for the v1 API surface.

The migration shaped the current architecture:

- `src/maplibre/` is decoupled from any specific map engine version.
- `src/utils/set-globals.ts` invokes RTL plugin and worker config via
  optional chaining on a `MapLib`-augmented type, so the wrapper tolerates
  map engines that don't expose every setter.
- `src/types/lib.ts` excludes engine-specific private fields. Access to
  those in `maplibre.ts` is guarded with `typeof` checks because they drift
  across MapLibre versions.

---

## Gotchas

- **`isStyleLoaded()` throws when no style is set.** Always guard with
  `map.style && map.isStyleLoaded()`.
- **`keyboard` prop must stay `true` (default)** for a11y keyboard navigation
  (arrow keys pan, +/- zoom).
- **`<Layer>` and `<Source>` throw** when rendered outside `<Map>`. The
  error message names the constraint.
- **SVG content in `MinimapControl` `toggleButton.icon` is sanitized** via
  DOMParser + allowlist walk. `style` attributes and unsafe
  `href`/`xlink:href` values are stripped.
- **CSS values in `MinimapControl` props** (`borderRadius`, `containerStyle`,
  `toggleButton` colors) are validated via `CSS.supports`. Values containing
  `;`, `{`, `}`, `\`, or `url(` are rejected and fall back to defaults.
- **MapLibre GL is bundled as a regular dependency** (not a peer dep). End
  users do not need to install it separately.
- **React ≥18** is required (`useId`, `useSyncExternalStore`).

---

## Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/),
enforced via Husky + commitlint (`commitlint.config.js`).

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

### Scopes (optional)

`map`, `marker`, `popup`, `layer`, `source`, `controls`, `hooks`, `utils`,
`types`, `tests`

### Examples

Good:

```
feat(map): add support for custom map projections
fix(marker): correct position calculation for rotated maps
test(layer): add coverage for circle layer rendering
docs: update installation instructions
refactor(controls): simplify navigation control logic
```

Bad:

```
update                       # no type
fixed bug                    # wrong tense
FEAT: new feature            # wrong case
```

### Validation

Commits are checked at three points: `pre-commit` (lint-staged + typecheck +
test), `commit-msg` (commitlint + Signed-off-by trailer + identity check),
`pre-push` (full test suite). Failures must be fixed, not bypassed.

---

## Release Process

### Pre-Release Checklist

1. **Verify tests pass:**
   ```bash
   npm test
   npm run coverage
   ```
2. **Lint the package config:**
   ```bash
   npm run build
   npx publint
   ```
3. **Verify TypeScript types resolve correctly:**
   ```bash
   npx @arethetypeswrong/cli --pack .
   ```
   `@arethetypeswrong` will flag CSS subpath imports as unresolvable —
   that's expected for a library shipping styles, not a real problem.
4. **Build:**
   ```bash
   npm run build
   ```
5. **Test the tarball locally** — see [Local Package Testing](#local-package-testing).

### Publishing Steps

Publishing is **manual** — CI never publishes.

1. Prepare the release on a branch:
   - `package.json` `version` matches the top `## [x.y.z] - <date>` entry in
     `CHANGELOG.md` (real date, not `unreleased`).
   - Dry-run the notes extraction to preview release notes:
     ```bash
     node scripts/extract-changelog.mjs
     ```
2. Merge into `master` — CI runs the full gate (typecheck, lint, build,
   tests with coverage).
3. Publish from your machine (requires `npm login` + 2FA):
   ```bash
   npm publish --access public   # prepublishOnly gate runs automatically
   ```
4. Tag and create the GitHub Release, pasting the CHANGELOG section as notes
   (`node scripts/extract-changelog.mjs` prints it):
   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```
5. **Verify publication:**
   - [npm package page](https://www.npmjs.com/package/react-bkoi-gl)
   - `npm install react-bkoi-gl@latest` in a fresh project.

---

## Resources

- [README.md](./README.md) — user-facing API docs and examples
- [CHANGELOG.md](./CHANGELOG.md) — version history
- [Barikoi API docs](https://docs.barikoi.com/docs/maps-api)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Issues](https://github.com/barikoi/react-bkoi-gl/issues)
