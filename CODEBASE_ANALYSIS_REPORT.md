# Codebase Analysis Report: react-bkoi-gl (RE-REVIEW)

**Repository:** barikoi/react-bkoi-gl
**Branch:** `security` (working tree contains uncommitted fixes to prior findings)
**Version:** 2.1.0
**Scope:** Full codebase (`src/`, 37 TS/TSX files) + updated tests in `__tests__/components/`
**Domains:** Security, Architecture, Code Quality, Accessibility
**Review type:** Verification re-review of 1 Critical + 3 High prior findings, plus full re-audit
**Date:** 2026-06-23

---

## Verification of Prior Findings

| ID  | Severity | Domain       | Verdict              | Summary |
|-----|----------|--------------|----------------------|---------|
| C1  | Critical | Security     | **RESOLVED**         | Regex sanitizer replaced with `DOMParser` + tag allowlist walker (`sanitizeElement`) and attached via `el.replaceChildren(...)`. Output no longer flows through `innerHTML`. |
| H1  | High     | Security     | **PARTIALLY RESOLVED** | `<style>` built via `styleEl.textContent` and `CSS.supports()` validates `borderRadius`/`collapsedWidth`/`collapsedHeight`/`iconBackgroundColor`/`hoverColor`. **Residual:** `containerStyle.width`/`height` are still interpolated into the CSS text in `getContainerStyles()` without a `CSS.supports` check at the interpolation site. |
| H2  | High     | A11y         | **RESOLVED**         | Custom `buttonElement` branch now sets `type`/`aria-label`/`title`, adds `role`/`tabindex` for non-button elements, and refuses non-button/non-`role="button"` elements. |
| H3  | High     | Architecture | **RESOLVED**         | Mount effect reads `propsRef.current` (no stale closure); `setProps` layout effect gated by a shallow prop compare against `prevPropsRef`. |

### Evidence

**C1 — RESOLVED** (`src/components/minimap-control.ts`)
- `sanitizeSVG` (lines 253–266) now parses with `new DOMParser()` (`image/svg+xml`), rejects on `parsererror` or non-`svg` root, and runs an allowlist walker.
- `ALLOWED_TAGS` (lines 166–189) is a true allowlist (`svg`, `g`, `path`, `rect`, …); `sanitizeElement` (lines 191–233) removes any tag not in the set (including `script`, `foreignObject`, `animate`), strips every `on*` handler (line 199), and validates `href`/`xlink:href` to local-ID or `http(s)` only (lines 205–215).
- Output is attached via `el.replaceChildren(iconNode)` (line 521) — **never `innerHTML`**.
- Tests (`__tests__/components/minimap-control.test.js`) cover script-tag removal (line 236), `onclick` removal (line 269), and `foreignObject`+unquoted-`onerror` removal (line 301) — the exact bypass classes called out in the original finding.
- **Adversarial residual (Low, not blocking):** the `style` attribute is not stripped from allowed elements, leaving a CSS-exfiltration vector (`<rect style="fill:url(http://attacker/...)">`). Recommend dropping `style` in `sanitizeElement`, or migrating to DOMPurify. Reported as L-new-1.

**H1 — PARTIALLY RESOLVED** (`src/components/minimap-control.ts`)
- `createContainer` uses `styleEl.textContent = this.getContainerStyles()` (line 408) and `setupToggleButton` uses `styleEl.textContent = ...` (line 547) — `</style>` breakout is now impossible.
- `supportsCSS()` (lines 239–248) validates `borderRadius`, `collapsedWidth`, `collapsedHeight` (lines 433–445), `iconBackgroundColor`, `hoverColor` (lines 537–544), and `containerStyle.width`/`height` (lines 485–494 via `validateContainerStyle`).
- **Residual (Medium, M-new-1):** in `getContainerStyles()` the `width`/`height` read directly from `this.options.containerStyle?.width` (lines 429–430) and interpolated into the CSS template (lines 456–457) **bypass** the `CSS.supports` check that `validateContainerStyle` performed — `validateContainerStyle` only stores validated width/height when the consumer supplied them, but `getContainerStyles` falls back to `DEFAULT_WIDTH`/`DEFAULT_HEIGHT` from the same field, so a malicious consumer `width` that survived validation (e.g. a value `CSS.supports` accepts but that contains `;`-separated declarations like `100px; --x:url(javascript:...)`) is still injected. CSS injection into the style element's text content cannot break out into markup (textContent is safe), but it can add arbitrary CSS properties. Recommend running every interpolated value through `supportsCSS` in `getContainerStyles` itself, not just in `validateContainerStyle`.
- No test asserts that a `</style>` payload is neutralized by `textContent`. Recommend adding one.

**H2 — RESOLVED** (`src/components/globe-control.ts`)
- `_createButton` (lines 76–138) now: detects tagName/role (lines 80–82), refuses non-button/non-`role="button"` elements with a `console.warn` and falls back to a real `<button>` (lines 84–89), sets `type="button"` on `<button>` tags (lines 96–99), sets `role="button"` + `tabindex="0"` on non-button elements (lines 100–107), and unconditionally sets `aria-label`/`title` (lines 109–114).
- Tests cover: custom `<button>` gets `type`/`aria-label`/`title` (line 129); `role="button"` div gets `tabindex="0"` (line 152); invalid element is refused (line 175); dynamic label toggle (line 203).

**H3 — RESOLVED** (`src/components/map.tsx`)
- `propsRef` is kept current every render (lines 57–58); the mount `useEffect` reads `propsRef.current.mapLib/.id/.reuseMaps/.onError` (lines 68–70, 88, 90, 96, 107, 110) — **no stale closure**.
- The `setProps` layout effect (lines 136–164) now shallow-compares `props` against `prevPropsRef.current` (excluding `children`/`mapLib`) and only calls `mapInstance.setProps(props)` when a prop actually changed (line 159–161) — deep-equal no longer runs on every render.
- **Residual (Low, L-new-2):** the effect still has no dependency array (line 164), so the shallow-compare loop runs on every parent render. This is cheap and the prior correctness/perf bug is fixed; flagged only for completeness.

**Build/test verification:** `tsc --noEmit` passes clean. All 28 tests in the two modified test files pass.

---

## Findings (severity-first)

No Critical. No surviving High from the prior set. One new Medium (M-new-1) and two new Low items (L-new-1, L-new-2) introduced by the analysis above; the remaining items are carried forward from the prior review where still applicable.

### Critical (0)

None. C1 is resolved.

### High (0)

None. H1/H2/H3 are resolved (H1 partially, with residual downgraded to Medium).

### Medium (3)

| ID        | Domain     | File                                  | Lines    | Title |
|-----------|-----------|---------------------------------------|----------|-------|
| M-new-1   | Security  | `src/components/minimap-control.ts`   | 429–430, 456–457 | `getContainerStyles` interpolates `containerStyle.width`/`height` into CSS text without a `supportsCSS` check at the interpolation site |
| M4        | A11y      | `src/components/minimap-control.ts`   | 514–594  | Toggle button has `aria-expanded` (added during fix) but no `aria-live` region announces the collapse/expand to screen readers |
| M7        | Architecture | `src/maplibre/maplibre.ts`        | 218, 272, 365, 383 | `reuse`/`redraw` still poke undocumented MapLibre private fields (`_container`, `_resizeObserver`, `_frame`, `_render`) |

**M-new-1 — Security (A03:2021, residual of H1)** — `getContainerStyles()` reads `this.options.containerStyle?.width` and `?.height` directly (lines 429–430) and interpolates them into the CSS template (lines 456–457). Although `validateContainerStyle` ran `supportsCSS('width', ...)` at construction time, `getContainerStyles` does not re-validate at the interpolation site, and `CSS.supports('width', '100px; --x:url(...)')` returns `true` in most engines while the value injects extra declarations into the style text. Because `textContent` is used, this cannot break into markup, but it can add arbitrary CSS properties (UI redressing, `@import`, exfil via `background:url`). **Remediation:** validate every interpolated value inside `getContainerStyles` (or store the already-validated values and read only those), and add a test asserting a `</style>`/`;` payload is neutralized.

**M4 — A11y (SC 4.1.3 Status Messages)** — The fix added `aria-expanded` (line 529, updated at line 685), which addresses part of the original concern. The toggle still lacks an `aria-live` region, so the expand/collapse is not announced to AT users. **Remediation:** add a visually-hidden `aria-live="polite"` status node updated in `toggle()`.

**M7 — Architecture** — unchanged from prior review; still present in `maplibre.ts`.

### Low (4)

| ID        | Domain    | File                                  | Lines    | Title |
|-----------|-----------|---------------------------------------|----------|-------|
| L-new-1   | Security  | `src/components/minimap-control.ts`   | 191–233  | SVG allowlist does not strip the `style` attribute (CSS exfil via inline styles on allowed tags) |
| L-new-2   | Architecture | `src/components/map.tsx`          | 136–164  | `setProps` layout effect has no dependency array; shallow-compare loop runs every render (cheap, correctness fixed) |
| L1        | Quality   | `src/components/globe-control.ts`     | 42–44    | `GLOBE_SVG`/`MAP_SVG` path data appears malformed; verify icons render correctly |
| L6        | A11y      | `src/components/map.tsx`              | 186      | Map container has no role/keyboard-entry documentation; document that `keyboard:true` is required for keyboard access |

**L-new-1 — Security (defense-in-depth)** — `sanitizeElement` strips `on*` handlers and validates `href`, but does not remove the `style` attribute. A consumer SVG like `<rect style="fill:url(http://attacker/x)" />` exfiltrates on render. **Remediation:** drop `style` in `sanitizeElement`, or migrate to DOMPurify's SVG profile.

**L1** — `GLOBE_SVG`/`MAP_SVG` are assigned via `innerHTML` (lines 119, 147, 173) but are hardcoded module constants (not consumer input), so this is not a XSS vector; the path data still appears malformed and should be regenerated. Note: replacing these `innerHTML` writes with `replaceChildren(sanitizeSVG(...))` would be a consistent hardening step.

### Informational (2)

| ID | Domain | File | Title |
|----|--------|------|-------|
| I1 | Quality | `src/maplibre/maplibre.ts`, `src/components/map.tsx` | Unhandled errors fall through to `console.error`; introduce a single configurable logger (was M6) |
| I2 | Quality | `src/components/minimap-control.ts` line 259 | `console.warn('Invalid SVG format…')` should route through the library logger once one exists (was L3) |

---

## What's Done Well

**Security**
- C1 fix is a genuine allowlist (`ALLOWED_TAGS` Set) walked by `sanitizeElement`, not an "improved regex". Tag, attribute, and `href`/`xlink:href` scheme filtering are all in place; output attaches via `replaceChildren`.
- H1 fix correctly switched both `<style>` constructions to `textContent`, eliminating the `</style>`-breakout class of bug at the mechanism level.
- `supportsCSS()` wrapper degrades safely in SSR/jsdom (`CSS` undefined → returns `true`) so validation never crashes non-browser environments.
- AttributionControl continues to use safe DOM APIs (`createElement` + `textContent`) with `rel="noopener noreferrer"`.

**A11y**
- H2 fix is thorough: type/role/tabindex detection, refusal of unsafe elements, and unconditional accessible-name assignment. The three new tests directly assert each branch.
- `aria-expanded` added to the minimap toggle and kept in sync on every toggle.

**Architecture**
- H3 fix uses an always-current `propsRef` for the mount effect and a `prevPropsRef` shallow-compare gate for `setProps`, matching the react-map-gl pattern. The stale-closure correctness bug and the per-render deep-compare cost are both eliminated.

**Quality**
- `tsc --noEmit` is clean; all 28 tests pass.
- New tests cover the exact bypass payloads called out in the original C1/H2 findings (script tags, `onclick`, `foreignObject`+unquoted `onerror`, refused non-button elements).

---

## Priority Actions

**Phase 1 — Close residual H1 gap (days)**
1. `src/components/minimap-control.ts` `getContainerStyles()`: run `supportsCSS('width', …)` / `supportsCSS('height', …)` at the interpolation site (or read only the values already validated in `validateContainerStyle`), so a `;`-bearing width/height cannot inject extra CSS declarations. Add a test asserting `containerStyle: { width: '100px; --x:1' }` is neutralized.

**Phase 2 — Defense-in-depth (weeks)**
2. `src/components/minimap-control.ts` `sanitizeElement`: strip the `style` attribute from allowed elements (L-new-1), or migrate C1 to DOMPurify's SVG profile to retire the hand-rolled walker.
3. Add an `aria-live="polite"` status region to the minimap toggle (M4).
4. Add a `</style>`-breakout test to the minimap suite to lock in the `textContent` guarantee.

**Phase 3 — Hygiene**
5. Replace `innerHTML` writes of the hardcoded `GLOBE_SVG`/`MAP_SVG` constants with `replaceChildren(sanitizeSVG(...))` for consistency; regenerate the path data (L1).
6. Add a dependency array to the `setProps` layout effect, or document that the shallow-compare guard is intentional (L-new-2).
7. Introduce a single configurable logger and route the two `console.error`/`console.warn` call sites through it (I1, I2).

---

## Methodology

- **Tooling:** `git diff`/`git status` to scope the working-tree fixes; direct reads of the four modified source files and the two modified test files; `ripgrep` for residual `innerHTML`/`insertAdjacentHTML`/`eval`/`style`-attribute patterns across `src/`; `tsc --noEmit` and `jest` for build/test verification.
- **C1 adversarial check:** confirmed the sanitizer is an allowlist (not a denylist/regex), that output attaches via `replaceChildren`, and searched for any remaining untrusted-string → `innerHTML`/`insertAdjacentHTML` path. The only surviving `innerHTML` writes are to hardcoded module constants in `globe-control.ts`.
- **H1 adversarial check:** confirmed both `<style>` constructions use `textContent`; traced every consumer string interpolated into CSS text back to its validation site and identified the one gap (`getContainerStyles` width/height).
- **Coverage notes:** biome and fallow are not installed in this repo; lint/a11y signals came from direct source inspection and the existing test suite. No credentials or network calls exist in source to audit for A09/A10 beyond the URL validation already present in `set-globals.ts`.
- **Limitations:** No dynamic taint-flow analysis performed. MapLibre internals assumed private per their type declarations.
