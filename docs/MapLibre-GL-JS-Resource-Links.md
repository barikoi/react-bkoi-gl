# MapLibre GL JS – Verified Official Resource Links

**Last verified:** 2026-08-30  
**Scope:** Major changes (especially v5 → v6), installation, and bundler integration notes for Vite, Next.js, and CRA/webpack.  
All links below point to primary sources (maplibre.org, GitHub maplibre/maplibre-gl-js, npm). No secondary summaries.

---

## Core Documentation

| Resource | URL |
|----------|-----|
| Official documentation home | https://www.maplibre.org/maplibre-gl-js/docs/ |
| Project overview page | https://maplibre.org/projects/gl-js/ |
| API reference | https://maplibre.org/maplibre-gl-js/docs/API/ |
| Examples overview | https://www.maplibre.org/maplibre-gl-js/docs/examples/ |
| MapLibre Style Specification | https://maplibre.org/maplibre-style-spec/ |

---

## v5 → v6 Migration (Primary Source of Truth for Breaking Changes)

| Resource | URL |
|----------|-----|
| **v5 to v6 migration guide** (canonical) | https://www.maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/ |
| Same guide on GitHub (raw source) | https://github.com/maplibre/maplibre-gl-js/blob/main/docs/guides/v5-to-v6-migration-guide.md |
| v6.0.0 GitHub release notes | https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0 |
| Full CHANGELOG | https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md |
| All releases | https://github.com/maplibre/maplibre-gl-js/releases |

### Key points covered in the official migration guide
- ESM-only distribution (`maplibre-gl.mjs` + `maplibre-gl-worker.mjs`); UMD and CSP builds removed
- Default import removed → use named imports or `import * as maplibregl`
- WebGL1 support dropped; WebGL2 required
- `setWorkerUrl()` required for most bundlers
- `styleimagemissing` is notify-only; use `Map.setMissingStyleImageResolver`
- Events are now classes (prefer `type` field)
- Nested GeoJSON properties preserved as objects
- `#pragma mapbox` → `#pragma maplibre`
- Other smaller API clean-ups

---

## Installation & Bundler Setup (Official Snippets)

| Resource | URL |
|----------|-----|
| Installation / ESM section (Vite, webpack, esbuild, Rollup, Turbopack/Next.js, CDN) | https://www.maplibre.org/maplibre-gl-js/docs/ (see “ESM” / Installation tabs) |
| Same content on GitHub | https://github.com/maplibre/maplibre-gl-js/blob/main/docs/index.md |
| Minimal runnable apps per bundler (test suite) | https://github.com/maplibre/maplibre-gl-js/tree/main/test/integration/bundler |

### Quick reference – official patterns

**Vite**
```ts
import {Map, setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(workerUrl);
```

**webpack 5+ / CRA (modern)**
```ts
import {Map, setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString());
```

**Next.js (Turbopack or webpack mode)**  
Official recommendation: copy both `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` into `public/` via a predev/prebuild script, then:
```ts
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
```
(Full script in the docs Installation → Turbopack tab.)

**CDN / no bundler**
```html
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@^6.6.0/dist/maplibre-gl.css" />
<script type="module">
  import * as maplibregl from 'https://unpkg.com/maplibre-gl@^6.6.0/dist/maplibre-gl.mjs';
</script>
```
(Always pin a version; `@latest` can break on major releases.)

---

## Package & Repository

| Resource | URL |
|----------|-----|
| npm package | https://www.npmjs.com/package/maplibre-gl |
| GitHub repository | https://github.com/maplibre/maplibre-gl-js |
| MapLibre organization | https://github.com/maplibre |
| News / newsletters | https://maplibre.org/news/ |

Current latest (as of verification): **6.6.0** (npm).

---

## Related Official Guides

| Resource | URL |
|----------|-----|
| Mapbox → MapLibre migration guide | https://www.maplibre.org/maplibre-gl-js/docs/guides/mapbox-migration-guide/ |
| Leaflet migration guide | https://www.maplibre.org/maplibre-gl-js/docs/guides/leaflet-migration-guide/ |
| OpenLayers migration guide | https://www.maplibre.org/maplibre-gl-js/docs/guides/openlayers-migration-guide/ |

---

## CSP Notes (from official docs)

Self-hosted worker:
```
worker-src 'self';
img-src data: blob: 'self';
```

CDN (cross-origin) may also need:
```
worker-src 'self' blob:;
```

---

## How to keep this list current

1. Check the migration guide and Installation section first.  
2. Cross-reference the latest GitHub release notes.  
3. Prefer pinned versions (`^6.x.x`) over `@latest`.

---

*Generated from official MapLibre sources only. No third-party or AI-summarized content.*
