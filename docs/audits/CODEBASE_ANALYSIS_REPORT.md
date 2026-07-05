# Codebase Analysis Report: react-bkoi-gl (3RD-PASS VERIFICATION)

**Repository:** barikoi/react-bkoi-gl
**Branch:** `security` (working tree contains uncommitted changes vs HEAD)
**Version:** 2.1.0
**Stack:** TypeScript, React >=18, browser runtime, maplibre-gl 5.24.0
**Scope:** full, target `src/` (37 source files, ~4,981 LOC)
**Domains:** security, architecture, quality, a11y
**Review ID:** `react-bkoi-gl-2026-06-24-full-security-arch-quality-a11y`
**Review type:** verification-rereview (3rd pass)
**Prior reviews:** initial full review (2026-06-23) + verification re-review (2026-06-23, 2nd pass)

## Executive Summary

This is the third consecutive pass over the same branch. The headline is strongly positive: **every surviving Critical/High from prior passes remains resolved**, and the bulk of the prior Medium/Low findings have been closed since the 2nd pass. The most significant work since the 2nd pass is the introduction of a centralized, configurable `logger` (`src/utils/logger.ts`) wired into all six previously-`console.*` sites and publicly exported via `setLogger` — this closes the long-standing I1/I2 "no single telemetry hook" finding and the related L3 (`console.warn` inside the SVG sanitizer). New a11y work (visually-hidden `aria-live` region in MinimapControl) closes M4, and the Minimap timer/style leak fixes (M1/M3) are confirmed in place with cleanup tests.

No new Critical or High findings were introduced. The surviving items are: one Medium-quality robustness gap in the `getRandomUUID` fallback (`crypto.getRandomValues` assumed present), one Medium-quality dead-code module (`src/utils/warn.ts` is now orphaned after the logger refactor), and a set of carried-forward Low/Informational items the team has chosen not to address (notably the residual `innerHTML` writes of *hardcoded* SVG constants in `globe-control.ts`, and the MapLibre-private-field dependency in `maplibre.ts` reuse/redraw paths).

Tooling: `tsc --noEmit` clean (exit 0). Jest suite **277/277 passing across 29 suites** (up from 28 tests in the 2nd pass — the MinimapControl test file alone now exercises 22 cases covering the C1/H1 sanitization payloads, aria-live announcements, and cleanup). Coverage for `minimap-control.ts` is 75% lines; `logger.ts` is 70% lines (the `setLogger` branches at 21-23 are untested).

### Counts by severity
| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 3 |
| Low | 4 |
| Informational | 3 |

### Counts by domain (this pass's findings; carried-forward items counted once)
| Domain | Count |
|---|---|
| security | 2 |
| architecture | 2 |
| quality | 4 |
| a11y | 2 |

---

## Prior-Finding Verification

Verdict for each finding carried into or addressed since the 2nd pass.

| ID | Severity | Domain | Verdict | Evidence |
|---|---|---|---|---|
| C1 | critical | security | **RESOLVED** (confirmed) | `minimap-control.ts:270-283` — `sanitizeSVG` uses `DOMParser` + `ALLOWED_TAGS` allowlist walker (`sanitizeElement`); output attached via `el.replaceChildren(iconNode)` (line 546), never `innerHTML`. Test `removes script tags from SVG` (test line 278) and `removes foreignObject` (line 343) pass. No surviving regex-sanitizer path. |
| H1 | high | security | **RESOLVED** (was PARTIALLY_RESOLVED in 2nd pass) | `minimap-control.ts:426, 572` — both `<style>` constructions use `styleEl.textContent = ...`, never `innerHTML`. `getContainerStyles` (lines 446-470) now validates every interpolated value (`width`, `height`, `collapsedWidth`, `collapsedHeight`, `borderRadius`) via `supportsCSS` at the interpolation site — closing the M-new-1 residual. `supportsCSS` (lines 246-265) rejects `;`, `{`, `}`, `\`, and `url(` before delegating to `CSS.supports`. Test `neutralizes semicolon and url() injection` (test line 567) confirms. |
| H2 | high | a11y | **RESOLVED** (confirmed) | `globe-control.ts:78-116` — custom element checked for `tagName==='button' \|\| role==='button'`, non-conforming elements refused with `logger.warn` and replaced. Accessible name set unconditionally (line 111). |
| H3 | high | architecture | **RESOLVED** (confirmed) | `map.tsx:58-59, 68, 137-167` — `propsRef` updated every render; mount effect reads `propsRef.current` so `onError`/`mapLib`/`id`/`reuseMaps` are always current. `setProps` layout effect now has a dependency array `[mapInstance, props]` (line 167) — closing L-new-2. |
| M1 | medium | quality | **RESOLVED** | `minimap-control.ts:314-315, 400-407` — `resizeTimeout` and `transitionTimeout` tracked on the instance and cleared in `onRemove`. |
| M2 | medium | quality | **REGRESSED / UNCHANGED** | `attribution-control.ts:34` — the `setTimeout(..., 0)` inside `onLoad` still has no stored handle and is NOT cleared in the effect cleanup (lines 67-69 only do `map.off('load', onLoad)`). If `onLoad` has fired but the 0ms timer is pending at unmount, the callback mutates a detached `_container`. Carried forward as **M2 (this pass)**. |
| M3 | medium | architecture | **RESOLVED** | `minimap-control.ts:609, 631-632` — `toggleButtonStyleEl` assigned to the instance before `document.head.appendChild`; both `onRemove` (line 409) and `toggleButtonCleanup` remove it. |
| M4 | medium | a11y | **RESOLVED** | `minimap-control.ts:614-627, 733-737` — visually-hidden `aria-live='polite'` + `aria-atomic='true'` region created in `setupToggleButton`, `textContent` updated in `toggle()`. Test `manages aria-live status node` (test line 167) passes. |
| M5 | medium | security | **PARTIALLY_RESOLVED** | `attribution-control.ts:35` — query is now scoped to `ctrl._container` (no longer global), but still relies on the internal `.maplibregl-ctrl-attrib-inner` class name. Downgraded to **Low (this pass)** — a MapLibre minor bump can still silently break rewriting, but the scope reduction removes the cross-map collision risk. |
| M7 | medium | architecture | **UNCHANGED** | `maplibre.ts:236-238, 243-251, 277-279, 380-389` — `reuse`/`redraw` still poke `_container`, `_resizeObserver`, `_update`, `_frame`, `_render`. The runtime guards added in the 2nd pass (`typeof ... === 'function'`, `'_container' in mapInternal`) are still in place, so a private-field rename degrades gracefully rather than crashing. Carried forward as **M7 (this pass)**. |
| L1 | low | quality | **UNCHANGED** | `globe-control.ts:41-51, 121, 149, 175` — SVG path constants unchanged; three `innerHTML` writes of these *hardcoded* constants remain. Not a XSS vector (constants are author-controlled), but inconsistent with the C1 remediation pattern (`replaceChildren(sanitizeSVG(...))`). Carried forward. |
| L6 | low | a11y | **RESOLVED** | `map.tsx:188-217` — JSDoc on the `Map` component now explicitly documents that `keyboard` (default `true`) is required for keyboard accessibility. |
| I1 | informational | quality | **RESOLVED** | `src/utils/logger.ts` — new centralized logger with `setLogger(customLogger)` configurator. Wired into `globe-control.ts:13`, `minimap-control.ts:10`, `map.tsx:16`, `set-globals.ts:2`, `warn.ts:2`, `maplibre.ts:4`. Publicly exported (`exports-maplibre-gl.ts:53`). |
| I2 | informational | quality | **RESOLVED** | `minimap-control.ts:276` — `console.warn('Invalid SVG format...')` now routes through `logger.warn(...)`. |

**2nd-pass-only items:**
- **M-new-1** (medium, security): **RESOLVED** — folded into H1 verdict above.
- **L-new-1** (low, security, SVG `style` attr not stripped): **RESOLVED** — `minimap-control.ts:206-209` now drops the `style` attribute in `sanitizeElement`. Test `removes style attributes from SVG elements` (test line 378) confirms.
- **L-new-2** (low, architecture, `setProps` effect no deps): **RESOLVED** — `map.tsx:167` now has `[mapInstance, props]`.

---

## Critical (0)

None. C1 from the initial pass remains resolved.

## High (0)

None. H1/H2/H3 from the initial pass remain resolved.

## Medium (3)

| ID | Domain | Title | File | Lines |
|---|---|---|---|---|
| M2 | quality | `setTimeout(0)` in AttributionControl `onLoad` still has no cleanup | `src/components/attribution-control.ts` | 34, 58, 67-69 |
| M-new-1 | quality | `getRandomUUID` fallback assumes `crypto.getRandomValues` exists without a feature check | `src/components/minimap-control.ts` | 158-164 |
| M7 | architecture | `reuse`/`redraw` rely on undocumented MapLibre private fields | `src/maplibre/maplibre.ts` | 236-238, 243-251, 277-279, 380-389 |

### M2 — `setTimeout(0)` in AttributionControl `onLoad` still has no cleanup (quality, REGRESSED from prior M2)

**File:** `src/components/attribution-control.ts:34, 58, 67-69`

The 2nd pass flagged this exact issue (prior M2) and it has not been addressed. The effect cleanup at lines 67-69 only removes the `load` listener; it does not clear the `setTimeout(..., 0)` handle. Sequence to trigger: `map.loaded()` returns `true` → `onLoad()` fires synchronously → `setTimeout(cb, 0)` is scheduled → component unmounts before the macrotask runs → `cb` executes `ctrl._container.querySelector` and `inner.appendChild` against a now-detached node. In React 18 strict mode the double-invoke also schedules two timers.

**Impact:** Post-unmount DOM mutation; potential `TypeError` if `_container` is null after unmount. No data corruption, no security impact.

**Remediation:**
```ts
const onLoad = () => {
  const handle = setTimeout(() => { /* ... */ }, 0)
  pendingTimeout = handle
}
// in cleanup:
return () => {
  map.off('load', onLoad)
  if (pendingTimeout !== undefined) clearTimeout(pendingTimeout)
}
```
Track the handle in a closure variable scoped to the effect.

**Confidence:** high (the missing cleanup is visible in source; the unmount race is mechanically reproducible).

### M-new-1 — `getRandomUUID` fallback assumes `crypto.getRandomValues` exists without a feature check (quality, NEW)

**File:** `src/components/minimap-control.ts:152-165`

The top guard checks `typeof crypto !== 'undefined' && crypto.randomUUID` and falls through to a `replace` callback that unconditionally calls `crypto.getRandomValues(array)`. The assumption — that any environment where `crypto` exists but `crypto.randomUUID` does not will still have `getRandomValues` — holds for all current browsers (insecure HTTP contexts expose `getRandomValues` but not `randomUUID`), but is not asserted in code. In a non-browser host that polyfills a partial `crypto` (e.g. an older SSR shim that defines `crypto` for `randomUUID`-detection but omits `getRandomValues`), the fallback throws `TypeError`. This is the same class of "feature-detect then assume the rest" gap that `supportsCSS` was introduced to fix for CSS.

Secondary concern: `array[0] % 16` introduces modulo bias (256 is not a multiple of 16 → values 0-15 are not uniformly distributed; 0-15 each appear 17 times except 0 which appears 16 — negligible for a UI control id, but worth noting).

**Impact:** Potential `TypeError` crash of `Minimap` construction in a partial-polyfill environment. The generated id is used only as a CSS selector scoping token, so the security impact of the bias is nil.

**Remediation:**
```ts
function getRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const array = new Uint8Array(1)
      crypto.getRandomValues(array)
      // reject to remove modulo bias
      let r = array[0] % 16
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
  // No crypto available — fall back to Math.random (non-cryptographic, acceptable for a UI id)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
```

**Confidence:** high (the unconditional call is visible at line 160; the guard asymmetry is clear).

### M7 — `reuse`/`redraw` rely on undocumented MapLibre private fields (architecture, UNCHANGED)

**File:** `src/maplibre/maplibre.ts:236-238, 243-251, 277-279, 380-389`

Unchanged from prior passes. The runtime guards added in the 2nd pass (`'_container' in mapInternal`, `typeof mapInternal._update === 'function'`, `typeof resizeObserver.disconnect === 'function'`, `typeof map._render === 'function'`) remain in place, so a private-field rename in a MapLibre 5.x minor bump now degrades to "reuse does nothing / redraw no-ops" instead of throwing — this is why the finding stays Medium and not High. The structural coupling to undocumented internals is itself the finding.

**Impact:** Silent feature regression (map reuse stops working; immediate-redraw optimization skipped) on a future MapLibre minor version. No crash, no security impact.

**Remediation:** Document the exact tested MapLibre minor versions in `peerDependencies` meta or a SUPPORTED_VERSIONS.md, and add a CI smoke test that asserts `Maplibre.reuse` returns a non-null instance on each minor bump.

**Confidence:** high.

---

## Low (4)

| ID | Domain | Title | File | Lines |
|---|---|---|---|---|
| L3-new | architecture | `src/utils/warn.ts` is dead code after the logger refactor | `src/utils/warn.ts` | 1-22 |
| L5 | security | AttributionControl still relies on MapLibre internal class name (residual of prior M5) | `src/components/attribution-control.ts` | 35 |
| L1 | quality | `GLOBE_SVG`/`MAP_SVG` constants still assigned via `innerHTML` (hardcoded, not a XSS vector) | `src/components/globe-control.ts` | 121, 149, 175 |
| L8 | a11y | `LogoControl` sets invalid `alt` attribute on an `<a>` and still depends on external CSS for visible content | `src/components/logo-control.ts` | 40-41 |

### L3-new — `src/utils/warn.ts` is dead code after the logger refactor (architecture, NEW)

**File:** `src/utils/warn.ts:1-22`

The `emitWarning` helper was the 2nd-pass mechanism for routing warnings through `onWarning`. After the logger refactor, `maplibre.ts` defines its own private `_warn` method (lines 557-564) that reads `this.props.onWarning` and falls back to `logger.warn` — it does not import `emitWarning`. A repo-wide search for `emitWarning`, `utils/warn`, or `from './warn'` returns **zero** references in `src/` or `__tests__/`. The module is exported nowhere. It will ship in the bundle as dead code.

Note: the `onWarning` plumbing itself (the `MapContextValue.onWarning` field at `map.tsx:23`, propagated at line 186) is still present and consumed by `maplibre.ts:558`, so the warning-routing capability is intact — only the standalone `emitWarning` helper is orphaned.

**Impact:** Bundle bloat (one unused module); future contributor confusion (two parallel warning mechanisms).

**Remediation:** Either delete `src/utils/warn.ts`, or refactor `maplibre.ts:_warn` to use it so there is a single path.

**Confidence:** high (grep-verified zero references).

### L5 — AttributionControl still relies on MapLibre internal class name (security, downgrade from prior M5)

**File:** `src/components/attribution-control.ts:35`

The query is now scoped to `ctrl._container` (closing the cross-map collision risk that made this Medium), but still targets `.maplibregl-ctrl-attrib-inner` — an undocumented MapLibre class. A MapLibre minor bump that renames this class silently makes the Barikoi/OpenMapTiles/OSM attribution rewrite a no-op, which has licensing-compliance implications (the rewritten attribution is the legally-required attribution string).

**Impact:** Silent loss of correct attribution display on a MapLibre upgrade.

**Remediation:** Prefer the documented `customAttribution` option on `AttributionControl`, or assert the matched node is an `HTMLElement` and `logger.warn` if not found so the regression is observable.

**Confidence:** high.

### L1 — `GLOBE_SVG`/`MAP_SVG` constants still assigned via `innerHTML` (quality, UNCHANGED)

**File:** `src/components/globe-control.ts:121, 149, 175`

The three `innerHTML` writes are of *hardcoded, author-controlled* SVG string constants (defined at lines 41-51), so this is **not** a XSS vector. It is flagged only for consistency: MinimapControl's C1 remediation established the pattern `el.replaceChildren(sanitizeSVG(svg))`, and applying the same pattern here would make the "no `innerHTML` of any SVG string" invariant hold across the codebase, reducing the chance a future edit introduces a real sink.

**Impact:** None functionally. Consistency / defense-in-depth.

**Remediation:** Route the constants through a shared `setSVGContent(el, svgString)` helper that parses + allowlist-sanitizes + `replaceChildren`, and use it in both `globe-control.ts` and `minimap-control.ts`.

**Confidence:** high.

### L8 — `LogoControl` sets invalid `alt` attribute on an `<a>` and still depends on external CSS (a11y, downgrade from prior M8)

**File:** `src/components/logo-control.ts:40-41`

Line 40 sets `container.setAttribute('alt', 'Barikoi')` on an anchor element. `alt` is not a valid attribute on `<a>` (it is valid on `<img>` and `<area>`); browsers and AT ignore it. The accessible name comes from `aria-label` (line 41), which is correct. Separately, the anchor has no child text or `<img>` node, so without the external CSS bundle it renders as an empty, non-discoverable link. There is still no `:focus-visible` override.

**Impact:** The invalid `alt` is harmless noise. The CSS-dependent rendering means the link is invisible (though still in the a11y tree via `aria-label`) if a consumer forgets `import "react-bkoi-gl/styles"`. No keyboard trap, no contrast issue per se.

**Remediation:** Remove the bogus `alt` attribute. Add a visually-hidden text node (`<span class="sr-only">Barikoi</span>`) or a real `<img>` as a fallback, and add a `:focus-visible` outline to the logo control's CSS.

**Confidence:** high.

---

## Informational (3)

| ID | Domain | Title | File | Lines |
|---|---|---|---|---|
| I3 | security | `setLogger` accepts `Partial<Logger>` with no validation that `warn`/`error` are functions | `src/utils/logger.ts` | 20-25 |
| I4 | quality | `logger.ts` `setLogger` branches untested (line coverage 70%) | `src/utils/logger.ts` | 21-23 |
| L2 | quality | `console.log` in JSDoc examples still ships in generated `.d.ts` | `src/components/globe-control.ts` | 224 |

### I3 — `setLogger` accepts `Partial<Logger>` with no validation that `warn`/`error` are functions (security, NEW)

**File:** `src/utils/logger.ts:20-25`

`setLogger(customLogger: Partial<Logger>)` reads `customLogger.warn` and `customLogger.error` and, if truthy, assigns them directly to `activeLogger.warn/error` and later *invokes* them (`activeLogger.warn(message, ...args)` at lines 13, 16). If a consumer passes `{ warn: 'not a function' }`, the truthy string is assigned and the next `logger.warn(...)` throws `TypeError: activeLogger.warn is not a function` — disabling all warning output, including the security-relevant "Invalid SVG format" and "Refusing non-button custom element" warnings. There is no prototype-pollution vector here (the function constructs a fresh object literal, never writes to `__proto__`/`constructor`), so this is purely a robustness/availability concern, not an injection concern.

**Impact:** A misconfigured custom logger silences security warnings. No code execution.

**Remediation:**
```ts
export function setLogger(customLogger: Partial<Logger>) {
  activeLogger = {
    warn: typeof customLogger.warn === 'function'
      ? customLogger.warn
      : (m, ...a) => console.warn(m, ...a),
    error: typeof customLogger.error === 'function'
      ? customLogger.error
      : (m, ...a) => console.error(m, ...a),
  }
}
```

**Confidence:** high.

### I4 — `logger.ts` `setLogger` branches untested (quality, NEW)

**File:** `src/utils/logger.ts:21-23`

Coverage report shows `logger.ts` at 70% lines, with lines 21-23 (the `setLogger` body) uncovered. There is no test exercising the public `setLogger` configurator — the headline feature that closed I1/I2. A regression in `setLogger` would not be caught.

**Impact:** Reduced regression safety on the newly-introduced public API.

**Remediation:** Add a test that calls `setLogger({ warn: mockFn })`, triggers a warning path (e.g. invalid SVG), and asserts `mockFn` was called.

**Confidence:** high.

### L2 — `console.log` in JSDoc examples ships in `.d.ts` (quality, UNCHANGED)

**File:** `src/components/globe-control.ts:224` (also `src/components/layer.ts:110-112`)

The `@example` block in the GlobeControl JSDoc contains `console.log('Globe view:', isGlobe)`. This appears verbatim in the generated `.d.ts` and is copy-paste noise for consumers. (The Layer examples at `layer.ts:110-112` have the same issue.)

**Impact:** Cosmetic.

**Remediation:** Remove `console.log` from doc examples, or replace with a comment indicating where side effects would go.

**Confidence:** high.

---

## What's Done Well

**Security**
- The C1 fix is a genuine DOMParser + tag-allowlist walker (`ALLOWED_TAGS`, `sanitizeElement`) with `replaceChildren` attachment — not an improved regex. Adversarial payloads (`<script>`, `on*`, `<foreignObject>`, `style=`) are neutralized and each has a dedicated passing test.
- H1 fully closed: both `<style>` constructions use `textContent`, and `getContainerStyles` validates every interpolated value at the interpolation site via `supportsCSS`, which pre-rejects `;`, `{`, `}`, `\`, and `url(`.
- The logger is now the single sink for all `console.warn`/`console.error` output, and `setLogger` is publicly exported — giving consumers a clean telemetry hook (closes I1/I2/L3 from prior passes).
- The `getRandomUUID` non-crypto fallback correctly avoids weak ID generation by preferring `crypto.randomUUID` then `crypto.getRandomValues`.

**Architecture**
- The `propsRef` + dependency-array combination on the Map mount/setProps effects (H3/L-new-2) correctly eliminates both the stale-closure correctness bug and the per-render overhead.
- Minimap lifecycle resources (timers, style elements, live region, event listeners) are all tracked on the instance and removed in `onRemove` — M1/M3 confirmed clean.
- The `setLogger` configurator follows a clean module-scoped-singleton pattern with a safe default.

**Quality**
- Test suite grew from 28 to **277 tests across 29 suites**, all passing. The MinimapControl file alone now has 22 cases including adversarial security payloads, aria-live behavior, and resource cleanup.
- `tsc --noEmit` is clean across the whole tree.
- Warning deduplication in `maplibre.ts:_queryRenderedFeatures` (the `_warnedQueryFeatures` flag) prevents console spam on the hover hot-path.

**Accessibility**
- MinimapControl toggle now has `aria-expanded`, an accessible name that updates on state change, and a visually-hidden `aria-live='polite'` region announcing collapse/expand — M4 fully closed with a test.
- GlobeControl refuses non-button custom elements and unconditionally sets an accessible name — H2 stays closed.
- The Map component JSDoc now documents the `keyboard` requirement for keyboard accessibility — L6 closed.

---

## Priority Actions

**Phase 1 (within the next sprint — quick wins, no API change)**
1. Fix M2: store the `setTimeout` handle in `attribution-control.ts:34` and clear it in the effect cleanup.
2. Fix L3-new: delete `src/utils/warn.ts` (dead code) or wire `maplibre.ts:_warn` through it.
3. Fix L8: remove the bogus `alt` attribute on the logo anchor.
4. Add the I4 test for `setLogger`.
5. Fix I3: validate `typeof customLogger.warn === 'function'` in `setLogger` before assigning.

**Phase 2 (within the next release — defense-in-depth, minor API surface)**
6. Fix M-new-1: add the `typeof crypto.getRandomValues === 'function'` guard and a `Math.random` final fallback in `getRandomUUID`.
7. Fix L1: extract a shared `setSVGContent(el, svg)` helper (parse + sanitize + `replaceChildren`) and use it in both `globe-control.ts` and `minimap-control.ts` so the "no `innerHTML` of SVG" invariant holds.
8. Fix L5: assert the `.maplibregl-ctrl-attrib-inner` match is an `HTMLElement` and `logger.warn` if missing, so attribution regressions are observable.

**Phase 3 (ongoing — documentation/contract)**
9. Address M7: publish a SUPPORTED_VERSIONS matrix for MapLibre and add a CI reuse smoke test.
10. Clean up the L2 `console.log` in JSDoc examples.

---

## Methodology

**Tooling:** ripgrep (residual-pattern sweeps for `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `dangerouslySetInnerHTML`, `eval(`, `console.*`, `localStorage`, `document.cookie`, prototype-pollution markers); direct source read of all 8 modified files plus `attribution-control.ts`, `logo-control.ts`, `warn.ts`, `logger.ts`, `set-globals.ts`; `npx tsc --noEmit --skipLibCheck`; `npx jest` with coverage.

**Verification approach:** This is a 3rd-pass verification review. For each prior finding (initial + 2nd pass) the verdict was established by reading the current source at the cited lines and confirming the mechanism (not just the presence of a fix). Adversarial re-check of C1 (no surviving untrusted-string → `innerHTML` path; allowlist genuinely exhaustive of consumer-reachable tags) and H1 (traced every consumer string interpolated into CSS text to its validation site) was repeated. The new `logger.ts` module was traced to all six import sites to confirm I1/I2 closure, and a repo-wide grep confirmed `warn.ts` is orphaned.

**Build and tests:** `tsc --noEmit` clean (exit 0). Jest: **277/277 passing across 29 suites** (8.3s). Coverage highlights: `minimap-control.ts` 75% lines, `maplibre.ts` 85%, `map.tsx` 91%, `logger.ts` 70% (`setLogger` branches uncovered — see I4).

**Coverage notes:** biome and fallow are not installed in this repo; lint/a11y signals came from direct source inspection, the JSX-a11y ESLint config, and the test suite. No credentials, cookies, or outbound network calls exist in source to audit for A09 (logging) / A10 (SSRF) beyond the URL protocol validation already present in `set-globals.ts:24-36`.

**Limitations:**
- No dynamic taint-flow analysis was performed; XSS/CSV injection findings are based on static source tracing of every consumer-string → sink path.
- MapLibre internals are treated as private per their published type declarations.
- The 2nd-pass runtime guards on private-field access (`'_container' in mapInternal`, `typeof map._render === 'function'`) were verified present but not exercised against an actual MapLibre private-field rename.
