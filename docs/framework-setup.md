# Framework setup — internals, overrides, and troubleshooting

**Audience:** `react-bkoi-gl` maintainers and consumers with non-standard
setups (strict CSP, custom bundler pipelines). Everything here is validated
empirically by `tests/framework/` (see that directory's README for the runner).

---

## How zero-config worker resolution works

maplibre-gl v6 is ESM-only and parses vector tiles in a **Web Worker**. Its own
worker auto-detection reads `import.meta.url`, which does not survive bundling
— with the raw engine, a broken worker URL means the map mounts but never
requests a tile: blank canvas, no error.

`react-bkoi-gl` removes that entire problem class:

1. **Build time** (`scripts/build-worker.mjs`): the engine's worker and its
   `maplibre-gl-shared.mjs` dependency are bundled by esbuild into ONE
   self-contained file, `dist/bkoi-map-worker.mjs`, exported as
   `react-bkoi-gl/worker`. The same source is inlined as a string into
   `src/maplibre/worker-bundle.generated.ts` (committed — keeps
   `npm run typecheck` working before a build). Upstream BSD-3 license text is
   preserved inline (`legalComments: 'inline'`).
2. **Consumer build time**: `src/maplibre/worker-setup.ts` computes
   `new URL('./bkoi-map-worker.mjs', import.meta.url)` from inside the library
   entry. Bundlers that emit `new URL(..., import.meta.url)` assets (webpack 5,
   CRA, Next.js — Turbopack and webpack modes; Vite production builds) turn
   that into a real, hashed, same-origin asset.
3. **Runtime**: before the engine `Map` is constructed
   (`src/components/map.tsx`, inside the existing dynamic-import chain),
   `ensureWorkerUrl()` HEAD-probes the computed URL and checks the
   content-type is JavaScript:
   - asset present → `setWorkerUrl(assetUrl)` (CSP `worker-src 'self'` suffices);
   - asset absent or HTML-fallback (Vite dev pre-bundling, esbuild/Rollup,
     bare CJS where `import.meta` is unavailable) → the worker is constructed
     from the inlined source via a **same-origin Blob URL** — the same
     technique maplibre itself uses for CDN loading (CSP then needs
     `worker-src 'self' blob:`, or self-host, see below).
   - An explicit consumer override (`setWorkerUrl()` call or the `workerUrl`
     `<Map>` prop) is detected via `getWorkerUrl() !== FILE_URL` and is always
     respected — never second-guessed.

The file URL is only probed when it is `http(s)`; `file://` (tests, opening
`dist/index.html` directly) goes straight to the Blob fallback — and `file://`
pages cannot host workers at all.

### Why the engine's own two-file layout broke under Turbopack

Upstream, `maplibre-gl-worker.mjs` imports `./maplibre-gl-shared.mjs` by
relative path. Turbopack rewrites the `new URL(..., import.meta.url)` reference
into a hashed asset **without emitting the sibling** — the worker dies on its
first import, the map mounts, no tiles, no error
([maplibre-gl-js#8126](https://github.com/maplibre/maplibre-gl-js/issues/8126)).
Bundling the shared chunk into the worker removes the sibling dependency, so a
single emitted asset is complete. The same trick is what makes the esbuild /
Rollup / bare-CJS paths work without any copy step.

## Self-hosting the worker

For strict CSPs that disallow `blob:` in `worker-src`:

1. Copy one file into static assets (it is self-contained — no sibling):
   `node_modules/react-bkoi-gl/dist/bkoi-map-worker.mjs` → e.g. `public/bkoi/`.
2. Register it once, at module scope, before the first `<Map>`:

   ```tsx
   import { setWorkerUrl } from 'react-bkoi-gl'
   setWorkerUrl('/bkoi/bkoi-map-worker.mjs')
   ```

   Next.js consumers: run the copy in `predev`/`prebuild` hooks (package
   managers skip `postinstall` when an install has no work to do, and
   `--ignore-scripts` skips it entirely); add matching `pre<name>` hooks for
   custom scripts like `build:local`.

## CSP summary

| Setup | Directives |
|---|---|
| Emitted asset (webpack 5 / CRA / Next.js, Vite build) | `worker-src 'self'; img-src data: blob: 'self';` |
| Blob fallback (Vite dev, esbuild/Rollup, CJS) | `worker-src 'self' blob:; img-src data: blob: 'self';` |
| Self-hosted (override above) | `worker-src 'self'; img-src data: blob: 'self';` |

## TypeScript

- TS ≥ 5, `skipLibCheck: true` (older TS / strict lib checks choke on the
  engine's declarations).
- `new URL(..., import.meta.url)` in overrides requires `module: ES2020+`
  (TS1343 otherwise).
- Keep build targets ES2020+; the engine ships modern JS, downleveling is
  unsupported.

## Engine v6 behavior changes worth knowing

- WebGL2 required; `GPUInitializationError` (re-exported) on unsupported
  browsers.
- No default export; named imports only.
- Events are classes — check `e.type`, not `instanceof`.
- `styleimagemissing` is notify-only → `map.setMissingStyleImageResolver(...)`.
- Nested GeoJSON properties are real objects — remove `JSON.parse`.
- `#pragma mapbox` → `#pragma maplibre`.
- `zoomLevelsToOverscale` changed tile overscaling behavior in v6 (rendering
  and `queryRenderedFeatures` results); revert with
  `zoomLevelsToOverscale: undefined` if needed.

## Package-manager notes

- **npm / yarn 1 / bun**: hoisted layouts — everything resolves.
- **pnpm**: strict layout. Safe because consumer code never imports
  `maplibre-gl` (it is only a transitive dependency here and would NOT resolve
  from app code). All engine touch-points go through `react-bkoi-gl`.
- **yarn Plug'n'Play**: unsupported — `nodeLinker: node-modules`.

## Validated matrix (as of this writing)

Runner: `node tests/framework/run.mjs [--only=<app>] [--pm=npm|pnpm|yarn|bun]`.
Each cell = install from the packed tarball → build → serve → headless verify
(Worker constructed, worker URL 200, engine `load` + `idle` fired, no uncaught
page errors).

| App | Cells | npm | pnpm | yarn | bun |
|---|---|---|---|---|---|
| vite-app (Vite 7) | `vite build` + static serve | PASS | — | PASS | PASS |
| next15-app (Next 15.5) | `next build` (webpack), `next build --turbopack` | PASS | — | — | — |
| next16-app (Next 16) | `next build` (Turbopack), `next build --webpack` | PASS | PASS | — | — |
| cra-app (react-scripts 5) | `react-scripts build`, Jest | PASS | — | — | — |

Next apps run on React 19 (App Router requirement), Vite/CRA on React 18.

### Findings baked into these tests

- **CRA + Jest**: jest cannot resolve the engine (exports-only package, no
  `main`) AND CRA's 2022 babel preset cannot parse its ES2022 syntax (static
  class blocks — `@babel/plugin-transform-class-static-block` scoped
  transforms do not survive react-scripts' jest config merge). The supported
  recipe is mocking the library in unit tests (see README "CRA & Jest").
- **CRA + `CI=true`**: react-scripts promotes webpack warnings to build errors
  when `CI` is set, and the engine's `new URL(./…, import.meta.url)` worker
  resolution trips webpack 5's "Critical dependency" warning. Build without
  `CI=true` (only the build step — `CI=true react-scripts test` is fine).
- **`office_11` console error in every framework result**: the hosted
  osm-liberty style's `Barikoi Poi icons` layer references a `source-layer`
  the POI tiles (`tiles.bmapsbd.com/poi`) never ship, so the engine emits
  `Source layer "office_11" does not exist` per tile load. Known upstream
  style issue — not a framework or library failure (see README
  "Known error" section for the consumer-side filter).
- **CRA inside a monorepo**: react-scripts' build lint crashes on conflicting
  parent `@typescript-eslint` installs
  (`Cannot read properties of undefined (reading 'allowShortCircuit')`) —
  build with `DISABLE_ESLINT_PLUGIN=true`; nested-app artifact, not a library
  issue.
- **Serve lifecycle**: `npx next start` orphans its child on the port when the
  parent is killed; the runner spawns `node_modules/.bin/next` directly in its
  own process group and `fuser -k`s the port before and after.

## Maintainer notes

- `scripts/build-worker.mjs` regenerates BOTH the dist worker and the
  committed `src/maplibre/worker-bundle.generated.ts`; `--ts-only` (run before
  tsup) only ensures the TS module exists without touching `dist/`.
- Unit-test mocks (`tests/unit/mocks/maplibre-gl.js` and the virtual
  `vi.mock('maplibre-gl')` factories in `tests/unit/`) must expose
  `setWorkerUrl`, `getWorkerUrl`, `getVersion` — vitest throws on property
  access of missing exports on mocked modules, which rejects the `<Map>` mount
  chain.
- Bump `maplibre-gl` → run `npm run build` (regenerates the worker bundle) →
  run the `tests/framework` matrix before releasing.
