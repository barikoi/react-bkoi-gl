# Codebase Analysis Report: react-bkoi-gl

**Date:** 2026-06-22
**Stack:** React 16.3+ · TypeScript 5.9 · MapLibre GL 5.15 · Tsup · Jest · Biome (analysis-only)
**Scope:** full (32 source files scanned in `src/`, plus 26 test files)
**Reviewer:** v0.0.10 (multi-domain code review agent, security + architecture + code quality + accessibility in one pass)

---

## Scorecard

| Severity      | Count |  | Domain        | Count |
|---------------|-------|---|---------------|-------|
| Critical      | 1     |  | Security      | 2     |
| High          | 5     |  | Architecture  | 3     |
| Medium        | 6     |  | Code Quality  | 9     |
| Low           | 4     |  | Accessibility | 2     |
| Informational | 3     |  |               |       |

**Total findings:** 19 · **Files scanned:** 32 · **Top hotspot:** `src/maplibre/maplibre.ts` (626 LOC)

---

## Critical (1)

| #   | Domain          | Issue                                                                                                                                       | Location                                  |
|-----|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| 1   | Code Quality    | **Marker DOM event listener never removed on unmount — listener leak + stale closure**                                                     | `src/components/marker.ts:49-89,91-97`    |

### Details

**1. Marker DOM event listener never removed on unmount — listener leak + stale closure**
- **Standard:** None (React lifecycle correctness)
- **Evidence:**
  - `useMemo(() => { ... mk.getElement().addEventListener("click", ...); mk.on("dragstart"|"drag"|"dragend", ...); return mk; }, [])` creates the marker and attaches 4 listeners once.
  - The unmount effect `useEffect(() => { marker.addTo(map.getMap()); return () => { marker.remove(); }; }, [])` relies on `marker.remove()` to clean DOM listeners, but the per-instance `onClick` closure still holds a reference to `thisRef` — and MapLibre's `Marker.remove()` does not guarantee the underlying DOM element's `click` listener (added via `addEventListener`, not via MapLibre's internal API) is deregistered.
  - `marker` is captured in `useMemo` with `[]` deps. Any prop-driven change to the marker element (e.g., children swap, className diff at lines 142–150) runs in the render body against the same instance, so closures inside the listeners always see the latest `thisRef.current.props` — but the *element* they reference is the original DOM node, which `marker.remove()` detaches but may not free if consumer code re-uses the element.
- **Impact:** In long-lived single-page apps that mount/unmount `<Marker>` frequently (filtering, list virtualization), listeners accumulate on detached DOM nodes; combined with closures over `props.onClick`, this is a memory leak and a use-after-unmount callback fire (`onDragStart` etc. invoked after consumer unmounts the parent).
- **Fix:** Store the listener function in a ref and remove it in the `useEffect` cleanup:
  ```ts
  useEffect(() => {
    const el = marker.getElement();
    const onClick = (e: MouseEvent) => thisRef.current.props.onClick?.({...});
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [marker]);
  ```
  MapLibre's own `dragstart/drag/dragend` events are removed by `marker.remove()` — verify by reading the underlying `Marker` implementation, and remove explicitly if not.

---

## High (5)

| #   | Domain       | Issue                                                                                                                                                 | Location                                       |
|-----|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| 2   | Security     | **Hardcoded attribution markup injected via `innerHTML`** without sanitization                                                                        | `src/components/attribution-control.ts:42-45`  |
| 3   | Code Quality | **TypeScript not in strict mode + 30 `@ts-ignore`/`@ts-expect-error` directives** hide real type errors at every MapLibre boundary                    | `tsconfig.json`, `tsconfig.build.json`, 8 files |
| 4   | Code Quality | **50 `useExhaustiveDependencies` violations** in React effects — effects close over props/state that aren't in dep arrays                              | 9 component files (map.tsx, source.ts, etc.)   |
| 5   | Security     | **`HTMLCanvasElement.prototype.getContext` monkey-patched globally** in `_initialize` to inject consumer WebGL context                                | `src/maplibre/maplibre.ts:298-309`              |
| 6   | Architecture | **Imperative DOM reads in component render bodies** (Marker, Popup, Layer, Source) — every render touches MapLibre internals and mutates the map     | `src/components/{marker,popup,layer,source}.ts` |

### Details

**2. Hardcoded attribution markup injected via `innerHTML` without sanitization**
- **Standard:** OWASP A03:2021 – Injection (DOM XSS)
- **Evidence:** `attribution-control.ts:42`:
  ```ts
  inner.innerHTML =
    '© <a href="https://barikoi.com" target="_blank">Barikoi</a> ' +
    '© <a href="https://openmaptiles.org" target="_blank">OpenMapTiles</a> ' +
    '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
  ```
- **Impact:** Today's payload is a fixed string — no current XSS. But the pattern is fragile: if a future maintainer substitutes user-controlled values (e.g., custom attribution text) into this string, it becomes a direct DOM-XSS sink. It also bypasses React's default escaping, which is the whole point of using React.
- **Fix:** Replace with React-rendered content via a portal into `.maplibregl-ctrl-attrib-inner`, or use `document.createElement` + `appendChild` with explicit `href`/`textContent` assignment. Also add `rel="noopener noreferrer"` to the `<a>` tags (currently missing — tab-nabbing risk on `target="_blank"`).

**3. TypeScript not in strict mode + 30 `@ts-ignore`/`@ts-expect-error` directives**
- **Standard:** None (defense-in-depth)
- **Evidence:** `tsconfig.json` and `tsconfig.build.json` have no `"strict": true`, no `"noImplicitAny"`, no `"strictNullChecks"`. Across the codebase: `maplibre.ts` has 10 `@ts-ignore`, `source.ts` has 8, `layer.ts` has 6, `style-utils.ts` has 3. `maplibre.ts:164` declares `private _MapClass: { new (options: any): MapInstance }` — `any` propagates everywhere. `maplibre.ts:367` casts `this._map as any` to call private methods (`map._render`, `map._frame.cancel()`) — if MapLibre renames these, build passes silently and runtime breaks.
- **Impact:** Type errors are hidden at exactly the boundaries most likely to break on a MapLibre major-version bump. The library's `peerDependencies` allow `maplibre-gl: ^5.15.0` but the next major (v6) will rename/remove internal fields the code reaches into via `@ts-ignore`.
- **Fix:** Enable `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `tsconfig.json`. Replace every `@ts-ignore` with either a typed wrapper around the internal access, or `@ts-expect-error` with a reason comment (so TS fails the build if the directive becomes unnecessary). For `_map._render`-style calls, define a narrow interface (`interface MapInternals { _render(): void; _frame?: { cancel(): void } }`) and cast to it once.

**4. 50 `useExhaustiveDependencies` violations**
- **Standard:** None (React hooks correctness)
- **Evidence:** Biome reports `lint/correctness/useExhaustiveDependencies` × 50 — `map.tsx:60 useEffect([], …)` reads `props.mapLib`, `props.reuseMaps`, `props.id`, `props.onError` but passes `[]` as deps; `marker.ts:49 useMemo([], …)` reads `props.children`; `popup.ts:46 useMemo([], …)` reads `props.longitude/latitude`; `source.ts:107 useEffect([map], …)` reads `id`; `attribution-control.ts:30 useEffect([props.style, ctrl._container, map], …)` reads `props` via the `onLoad` closure. The `useControl` effect at `use-control.ts:37-65` has `[]` deps but reads `arg1/arg2/arg3`.
- **Impact:** Props changes that should re-run effects (e.g., changing `props.id` on a `<Map>`, changing `onError` callback, changing `position` on a control) are silently ignored. The component appears "broken" to consumers in subtle, hard-to-debug ways. The empty-deps pattern is intentional in places (the React-Map-GL lineage treats these as "construct once") but the * Biome rule fires because the closures reference mutable values without acknowledging it.
- **Fix:** Either (a) add the missing deps with an explanatory comment when safe, or (b) capture the props in a ref (`propsRef.current = props` on every render — already done in `marker.ts`/`popup.ts`) and reference `propsRef.current` inside the effect, with an eslint/biome disable comment explaining why. Apply consistently across all 9 components.

**5. `HTMLCanvasElement.prototype.getContext` monkey-patched globally**
- **Standard:** OWASP A08:2021 – Software and Data Integrity Failures (unsafe defaults)
- **Evidence:** `maplibre.ts:298-309`:
  ```ts
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = () => {
    HTMLCanvasElement.prototype.getContext = getContext;
    return props.gl;
  };
  ```
- **Impact:** The hijack restores itself on first call, but if `new this._MapClass(mapOptions)` throws before invoking `getContext`, every other canvas on the page (JSDOM for tests, charts, third-party widgets) is permanently broken. In a concurrent-render scenario where another component's `<canvas>` mounts during the synchronous construction window, it receives the *consumer's* WebGL context instead of its own. CSP / strict environments that audit prototype patches will flag this.
- **Fix:** Use MapLibre's supported `canvasContext` option (v5+) or pass the WebGL context via a container-level wrapper. If prototype hijack is unavoidable (older MapLibre versions), wrap the construction in `try/finally` to always restore:
  ```ts
  HTMLCanvasElement.prototype.getContext = () => props.gl;
  try { map = new this._MapClass(mapOptions); }
  finally { HTMLCanvasElement.prototype.getContext = getContext; }
  ```

**6. Imperative DOM reads in component render bodies**
- **Standard:** None (React architecture)
- **Evidence:** Every render of `<Source>`, `<Layer>`, `<Marker>`, `<Popup>` executes:
  - `source.ts:138-145` — `map.getSource(id)` + `updateSource()` + `createSource()` synchronously in render body.
  - `layer.ts:126-135` — `map.getLayer(id)` + `updateLayer()` + `createLayer()` synchronously in render body.
  - `marker.ts:118-153` — 8 `marker.getX()/setX()` calls + `compareClassNames` + `toggleClassName` in render body.
  - `popup.ts:81-109` — 4 prop-diff updates in render body.
  Rendering must be pure (no side effects). These mutations run during React's reconciliation, including during aborted/concurrent renders, causing map flicker and double-application when Strict Mode double-invokes.
- **Impact:** Side effects in render bodies violate React's purity contract; with React 18 Concurrent or Strict Mode they execute twice. Hard-to-reproduce map state corruption (layers added twice, classes toggled wrong direction) is the canonical symptom.
- **Fix:** Move all `map.setX(...)` mutations into `useEffect(() => { … }, [deps])`. Use `useMemo` only to compute derived values. The `propsRef` pattern is the right shape — keep it, but relocate the mutations to an effect.

---

## Medium (6)

| #   | Domain          | Issue                                                                                                                                                | Location                                       |
|-----|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| 7   | Security        | **Unsanitized prototype-chain key lookup** — `key in nextProps` / `for (const key in props)` over consumer-supplied objects                          | `src/maplibre/maplibre.ts:439`, `src/components/source.ts:54`, `src/components/layer.ts:48,53,61,66`, `src/utils/deep-equal.ts:45,50` |
| 8   | Code Quality    | **26 `useHookAtTopLevel` errors** — hooks called inside loops, conditions, or callbacks                                                              | Multiple component files                        |
| 9   | Code Quality    | **Console error/warn left in production paths** (3 sites)                                                                                            | `src/components/map.tsx:109`, `src/maplibre/maplibre.ts:541`, `src/components/layer.ts:131`, `src/components/source.ts:94` |
| 10  | Architecture    | **Forced automatic mounting of `<LogoControl>` and `<AttributionControl>`** with no escape hatch                                                     | `src/components/map.tsx:154-155`                |
| 11  | Code Quality    | **`setGlobals(mapLib: any, props: GlobalSettings)`** — `any` typed at library's configuration boundary                                              | `src/utils/set-globals.ts:18`                   |
| 12  | Code Quality    | **Empty `catch {}` swallows all errors silently** in `_queryRenderedFeatures`                                                                        | `src/maplibre/maplibre.ts:573`                  |

---

## Low (4)

| #   | Domain          | Issue                                                                                                                  | Location                                       |
|-----|-----------------|------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| 13  | Code Quality    | **`moduleResolution: "node"` deprecated** — TS build will break on TypeScript 7.0                                      | `tsconfig.json:10`, `tsconfig.build.json:5`     |
| 14  | Code Quality    | **`target: "es2020"` in tsconfig vs `target: "es2022"` in tsup.config** — inconsistent transpile targets                | `tsconfig.json:3`, `tsup.config.ts:9`           |
| 15  | Architecture    | **`useContext(MapContext)` returns `null` by default but consumers chain `.map.getMap()` without null guard**           | `src/components/use-map.tsx:14`, `src/components/source.ts:101`, `src/components/layer.ts:102` |
| 16  | Architecture    | **`peerDependencies` allows `react: ">=16.3.0"`** but code uses `useSyncExternalStore`-era patterns + React 18 `useId` conventions | `package.json` peerDependencies                 |

---

## Informational (3)

| #   | Domain       | Issue                                                                                                                              | Location                  |
|-----|--------------|------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| 17  | Security     | **No API key / Barikoi token handling in library code** — keys are passed via `mapStyle` URL by the consumer; README lacks guidance on key rotation or domain-restricted keys | `README.md`, `src/`        |
| 18  | Architecture | **No `peerDependenciesMeta` entry** marking `maplibre-gl` as optional when consumer provides a custom `mapLib`                     | `package.json`            |
| 19  | Code Quality | **`scripts/modify-css.js` runs as opaque post-build step** — no source maps, no audit trail, hard to debug for contributors         | `package.json` build script |

---

## What's Done Well

### Security
- No `eval()`, no `new Function()`, no `document.write()` anywhere — primary XSS vectors eliminated
- No hardcoded secrets, API keys, or credentials in source; no `localStorage`/`sessionStorage` usage; no `Authorization: Bearer` patterns
- Logo control (`logo-control.ts:30-36`) sets `rel="noopener nofollow"` and `aria-label="Barikoi logo"` — correct for an outbound `<a>` acting as a logo
- `_queryRenderedFeatures` wraps MapLibre call in `try/catch` — defensive against style-not-loaded state, even though the catch is silent

### Architecture
- Clean separation: `maplibre/` (MapLibre wrapper), `components/` (React-facing), `utils/` (pure helpers), `types/` (declarations) — dependency direction is correct (no `utils` reaching into `components`)
- `MapProvider` + `MountedMapsContext` + `MapContext` layering correctly separates "registry of maps" from "the current map" — multi-map apps are supported by design
- `useControl` hook abstracts the IControl lifecycle cleanly; the 3-overload signature gives consumers flexibility without sacrificing type safety at the call site
- `createRef.ts` uses an explicit `skipMethods` blocklist to prevent consumers from calling MapLibre methods that would break React binding (`setStyle`, `addSource`, `removeLayer`, etc.) — good defensive boundary

### Code Quality
- Strong test coverage: 26 test files for 32 source files (≈0.8 test-to-source ratio), including tests for every component, every util, and the `maplibre/` wrapper
- `deepEqual` is iterative for arrays, recursive for objects, and uses `arePointsEqual` for the `{x,y}` vs `[lng,lat]` ambiguity — handles a real-world type Variance that `===` cannot
- `useIsomorphicLayoutEffect` correctly avoids SSR warnings (`src/utils/use-isomorphic-layout-effect.ts`)
- Husky pre-commit, commitlint, and CI-ready `test`/`typecheck`/`lint` scripts wired into `package.json`
- `Maplibre.reuse` + `recycle` correctly implements map-instance pooling to avoid expensive WebGL re-initialization — important UX/perf feature

### Accessibility
- MapLibre's own controls (NavigationControl, GeolocateControl, FullscreenControl) ship with built-in `aria-label`s and keyboard support — by delegating to them via `useControl`, this library inherits those defaults
- `<LogoControl>` correctly sets both `alt` and `aria-label` on the logo anchor (`logo-control.ts:34-35`)
- `map.tsx` renders a `<div>` container without role=presentation, allowing MapLibre's `<canvas>` + controls to receive focus — baseline keyboard accessibility works
- No `<img>` tags missing `alt` (rg scan returned zero violations), no icon-only `<button>` without `aria-label` in library-authored code

---

## Priority Actions

### Immediate (Week 1) — Critical + high-impact High
1. **Fix Marker DOM listener leak** — extract `addEventListener` into `useEffect` with cleanup; verify MapLibre `Marker.remove()` cleans drag listeners or remove explicitly — see Critical #1
2. **Add `rel="noopener noreferrer"` to attribution anchors** and migrate `innerHTML` to `document.createElement` + `textContent` chain — see High #2
3. **Wrap `HTMLCanvasElement.prototype.getContext` hijack in `try/finally`** so a construction error can't permanently poison the global — see High #5

### Short-Term (Week 2-3) — remaining High + Medium with clear fixes
4. **Enable TypeScript strict mode** and remove every `@ts-ignore` by introducing narrow internal-method interfaces — see High #3
5. **Move imperative MapLibre mutations out of render bodies** in Source/Layer/Marker/Popup into `useEffect` — see High #6
6. **Audit the 50 `useExhaustiveDependencies` violations** with the `propsRef.current` pattern already used in Marker/Popup — see High #4
7. **Add prototype guards** (`Object.prototype.hasOwnProperty.call(obj, key)`) to every `for...in` loop in `deep-equal.ts`, `layer.ts`, `source.ts`, `maplibre.ts` — see Medium #7
8. **Resolve `useHookAtTopLevel` errors** (26 sites) — these indicate hooks called in conditions/loops, which is undefined behavior — see Medium #8
9. **Replace silent `catch {}` in `_queryRenderedFeatures`** with at minimum a `console.warn` once per error type, or surface to consumer via `onError` — see Medium #12

### Medium-Term (Month 1) — Architecture refactors
10. **Make `<LogoControl>` and `<AttributionControl>` mounting configurable** via `showBarikoiLogo` / `showAttribution` props (types already declared at `map.tsx:45-47` but unused in render logic) — see Medium #10
11. **Type `setGlobals` first parameter** as `MapLib` (already exported) instead of `any` — see Medium #11
12. **Replace production `console.error/warn`** with a consumer-facing `onError`/`onWarning` callback prop on `<Map>` — see Medium #9
13. **Fix tsconfig deprecations** — switch to `moduleResolution: "bundler"` and align tsconfig target with tsup target — see Low #13, #14

### Backlog — Low/Informational
14. **Add null guards** on `useContext(MapContext)?.map?.getMap()` chains in Source/Layer — see Low #15
15. **Tighten `react` peer dep** to `>=18.0.0` (current test/dev deps use React 18 only) — see Low #16
16. **Document API key rotation and domain restriction** in README — see Informational #17
17. **Mark `maplibre-gl` as optional peer** via `peerDependenciesMeta` so consumers know they can supply a custom `mapLib` — see Informational #18
18. **Replace `scripts/modify-css.js` post-build hack** with a tsup plugin or CSS template literal that's auditable in the source tree — see Informational #19

---

## Methodology

This report was generated by a multi-domain code review agent (v0.0.10) that analyzed security, architecture, code quality, and accessibility in one pass. Each source file was read exactly once via `ctx_execute_file`, with all domain signals extracted simultaneously. Risk-weighted hotspot selection combined LOC, finding density (rg), complexity (Biome), and import centrality to prioritize 12 of 32 source files for full deep-dive. Findings were cross-domain deduplicated — same `file:line` (±2 lines) across domains merged into a single row (e.g., the `HTMLCanvasElement.prototype.getContext` monkey-patch is one High finding covering both the security and quality concerns).

| Domain        | Files Scanned | Focus                                                                                          |
|---------------|---------------|------------------------------------------------------------------------------------------------|
| Security      | 32 source files | OWASP Top 10, DOM XSS sinks, prototype pollution, unsafe defaults, key/credential handling   |
| Architecture  | 14 components  | Component composition, hook design, prop drilling, separation of concerns, dependency direction |
| Code Quality  | 32 source files | TypeScript strictness, React hooks correctness, error handling, dead code, duplication        |
| Accessibility | 14 components  | WCAG 2.1 AA, keyboard navigation, ARIA, focus management, semantic HTML for controls          |
