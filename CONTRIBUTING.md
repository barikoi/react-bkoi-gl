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
| `npm run clean` | Remove the `dist/` directory |
| `npm run build` | Production bundle (tsup + `scripts/build-styles.js`) |
| `npm run lint` | ESLint |
| `npm test` | TypeScript validation + Jest test suite |
| `npm run coverage` | Jest with coverage report |

### Project Structure

```
src/
  components/     # React components — Map, Layer, Source, controls, etc.
  maplibre/       # MapLibre wrapper class, MapRef factory
  types/          # TypeScript type definitions
  utils/          # Helpers (logger, deep-equal, transform, etc.)
__tests__/        # Jest tests, mirrors src/ layout
  mocks/          # Load-bearing maplibre-gl and react-dom mocks
scripts/          # Build scripts (build-styles.js)
styles/           # Committed CSS overrides, concatenated into the bundle
docs/audits/      # Historical code audit reports (not shipped)
```

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

### Public Surface

Everything exported from `src/exports-maplibre-gl.ts` is public. Anything
else is internal even if TypeScript visibility allows it. Notably public:
`logger`, `setLogger`, `Logger` (injectable logger), all map components,
hooks (`useMap`, `useControl`), and `MapRef`. Type re-exports live in
`src/types/`. Add new exports only via `src/exports-maplibre-gl.ts` — no
barrel files elsewhere.

---

## Testing Workflow

### Unit Tests

- **Framework**: Jest + React Testing Library + `ts-jest`.
- **Location**: `__tests__/`, organized by component and utility.
- **Mocks**: `__tests__/mocks/maplibre-gl.js` and
  `__tests__/mocks/react-dom-mock.js` are load-bearing.
- **Coverage**: run `npm run coverage` to generate a report in `coverage/`.

```bash
npm test               # typecheck + full Jest suite
npm run coverage       # Jest with coverage
npm run typecheck      # TypeScript only
npx jest <pattern>     # subset of tests
```

### Testing Pitfalls (read before writing tests)

- **Component tests mock the whole `Maplibre` class**
  (`jest.mock('../../src/maplibre/maplibre', () => class { ... })`). Changes
  to the real `Maplibre.setProps`, `_updateStyleComponents`, or `_initialize`
  are NOT exercised by `__tests__/components/*`. Test wrapper internals in
  `__tests__/maplibre/maplibre.test.js` instead.
- **Style readiness has two signals, depending on the file:**
  - `src/maplibre/maplibre.ts` checks `map.style && map.isStyleLoaded()`.
    Mock with `style: {}` and `isStyleLoaded: jest.fn()`. Do NOT use
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
- **`__tests__/mocks/maplibre-gl.js`** must be updated whenever the MapLibre
  API surface used by source changes.

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

- **Trigger**: automatic on push to `dev` (see `.github/workflows/action.yaml`
  for the current branch — temporary overrides apply while SonarQube is
  undergoing maintenance).
- **Steps**: install dependencies, run `npm run coverage`, run SonarQube
  scan via `sonarsource/sonarqube-scan-action@v4`.
- **Notifications**: Discord webhook on success, failure, and cancellation.
- **Config**: `.github/workflows/action.yaml` and `sonar-project.properties`.

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

1. **Log in to npm** (requires 2FA):
   ```bash
   npm login
   ```
2. **Bump the version and update the changelog:**
   - Add a `## [<new-version>] - <YYYY-MM-DD>` entry to `CHANGELOG.md`
     following the Keep a Changelog format.
   - Bump via npm:
     ```bash
     npm version patch   # bug fixes (2.2.0 → 2.2.1)
     npm version minor   # new features (2.2.0 → 2.3.0)
     npm version major   # breaking changes (2.2.0 → 3.0.0)
     ```
3. **Re-run the pre-release checks** (tests, build, publint,
   `@arethetypeswrong`).
4. **Publish:**
   ```bash
   npm publish --access public
   ```
5. **Verify publication:**
   - [npm package page](https://www.npmjs.com/package/react-bkoi-gl)
   - `npm install react-bkoi-gl@latest` in a fresh project.
6. **Tag the release** on GitHub and copy the CHANGELOG entry into the
   release notes.

---

## Resources

- [README.md](./README.md) — user-facing API docs and examples
- [CHANGELOG.md](./CHANGELOG.md) — version history
- [Barikoi API docs](https://docs.barikoi.com/docs/maps-api)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Issues](https://github.com/barikoi/react-bkoi-gl/issues)
