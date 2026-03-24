# Code Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 24, 2026
**Reviewer:** Comprehensive Code Review

---

## Executive Summary

**Overall Code Quality: GOOD**

The react-bkoi-gl codebase is a well-structured React component library that wraps MapLibre GL JS for Barikoi Maps. The architecture follows established patterns from react-map-gl and demonstrates good understanding of React lifecycle management, context patterns, and TypeScript integration.

### Quality Metrics

| Category | Score | Status | Notes |
|----------|-------|--------|-------|
| Code Quality | 8/10 | Good | Clean architecture, consistent patterns |
| TypeScript Safety | 7/10 | Good | Some `@ts-ignore` comments, could be improved |
| React Patterns | 8/10 | Good | Proper hooks usage, context patterns |
| Error Handling | 7/10 | Good | Basic error handling present |
| Testing Coverage | 7/10 | Good | Tests now exist for DrawControl and MinimapControl |
| Documentation | 6/10 | Fair | JSDoc comments present but inconsistent |
| Performance | 8/10 | Good | memo, useMemo, useCallback used appropriately |
| Security | 8/10 | Good | XSS prevention implemented, URL validation added |

---

## 1. Issues Found by Severity

### Critical Issues

**None identified.** The codebase has no critical security vulnerabilities or data loss risks.

---

### High Severity Issues

#### H1: Type Safety - Excessive `@ts-ignore` Comments

**Files:** Multiple files
**Severity:** High

The codebase contains numerous `@ts-ignore` and `@ts-expect-error` comments that suppress TypeScript errors rather than addressing the underlying type issues.

**Locations:**
- `src/components/map.tsx:76-77` - attributionControl
- `src/maplibre/maplibre.ts:228-229` - _container access
- `src/maplibre/maplibre.ts:234-235` - _resizeObserver
- `src/maplibre/maplibre.ts:264-265` - _update
- `src/maplibre/maplibre.ts:291-292` - getContext override
- `src/components/source.ts:24-25` - map.style access
- `src/components/draw-control.ts:3-4` - maplibre-gl-draw types

**Recommendation:** Create proper type declarations for internal MapLibre properties or extend the type definitions to avoid suppression.

---

#### H2: Missing Dependencies in useEffect Hooks

**File:** `src/components/marker.ts`
**Lines:** 67-74
**Severity:** High

The Marker component has a useEffect hook that updates callbackRef without a dependency array.

```typescript
useEffect(() => {
  callbackRef.current = {
    onClick: props.onClick,
    onDragStart: props.onDragStart,
    onDrag: props.onDrag,
    onDragEnd: props.onDragEnd,
  }
})  // Missing dependency array
```

**Recommendation:** Add proper dependency array or document why it is intentionally empty.

---

#### H3: Props Mutation in Render Phase

**File:** `src/components/scale-control.ts`
**Lines:** 30-35
**Severity:** High

The ScaleControl component mutates control options directly in the component body (render phase) rather than in useEffect.

```typescript
if (props.maxWidth !== undefined && props.maxWidth !== prevProps.maxWidth) {
  ctrl.options.maxWidth = props.maxWidth
}
if (props.unit !== undefined && props.unit !== prevProps.unit) {
  ctrl.setUnit(props.unit)
}
```

**Recommendation:** Move this logic into a useEffect hook to avoid side effects during render.

---

### Medium Severity Issues

#### M1: Potential Memory Leak in Map Component

**File:** `src/components/map.tsx`
**Lines:** 49-114
**Severity:** Medium

The maplibre variable is declared outside the promise chain and may not be properly cleaned up in all error scenarios.

**Recommendation:** Ensure proper cleanup in all code paths or use AbortController pattern.

---

#### M2: Inconsistent File Extensions

**Files:**
- `src/components/marker.ts`
- `src/components/popup.ts`
- `src/components/source.ts`
- `src/components/layer.ts`

**Severity:** Medium

Files containing JSX should use `.tsx` extension. Several component files use `.ts` despite containing JSX syntax.

**Recommendation:** Rename files to use `.tsx` extension for consistency.

---

#### M3: Global Type References Without Declarations

**File:** `src/components/popup.ts`
**Lines:** 44, 47
**Severity:** Medium

The popup component references `maplibregl.MapMouseEvent` without proper type imports.

**Recommendation:** Import the type properly or add a global type declaration.

---

#### M4: Shallow Options Merging in DrawControl

**File:** `src/components/draw-control.ts`
**Lines:** 91-103
**Severity:** Medium

The options merge uses a shallow merge for the `controls` object, which means user controls replace defaults completely.

**Recommendation:** Implement a deep merge for nested objects like `controls`.

---

#### M5: Minimap Class Complexity

**File:** `src/components/minimap-control.ts`
**Lines:** 193-695
**Severity:** Medium

The Minimap class is quite large (500+ lines) and handles multiple responsibilities.

**Recommendation:** Consider extracting into smaller, focused classes or utility functions.

---

### Low Severity Issues

#### L1: Unused Props in DrawControl

**File:** `src/components/draw-control.ts`
**Severity:** Low

A `style` prop could be accepted (consistent with other controls) but is not implemented.

---

#### L2: Console Warnings in Production Code

**Files:** Multiple
**Severity:** Low

Console statements should be replaced with a proper logging mechanism.

---

#### L3: Magic Numbers

**File:** `src/components/minimap-control.ts`
**Severity:** Low

Several magic numbers are used for default values without named constants.

---

#### L4: TypeScript strictNullChecks Not Enabled

**File:** `tsconfig.json`
**Severity:** Low

The tsconfig.json does not enable `strict` mode.

---

## 2. What's Done Well

### Architecture and Design

1. **Clean Separation of Concerns**: The Maplibre wrapper class cleanly separates the MapLibre GL lifecycle from React component lifecycle.

2. **Context Pattern**: Well-implemented context pattern with `MapContext` and `MountedMapsContext`.

3. **Consistent Control Pattern**: All controls follow the same `useControl` hook pattern.

4. **MapRef Abstraction**: The `createRef` function properly exposes safe map methods.

### React Best Practices

5. **Performance Optimizations**: Appropriate use of `memo`, `useMemo`, `useCallback`.

6. **Proper Cleanup**: Components properly clean up resources in useEffect cleanup functions.

7. **Portal Pattern**: Marker and Popup components correctly use React portals.

8. **Ref Forwarding**: Components properly forward refs for imperative access.

### Security

9. **XSS Prevention**: SVG sanitization in MinimapControl prevents XSS attacks.

10. **URL Validation**: The setGlobals utility validates URLs.

11. **Safe DOM Manipulation**: AttributionControl uses DOM APIs instead of innerHTML.

### Testing

12. **Comprehensive Test Coverage**: Tests exist for all major components including DrawControl and MinimapControl.

---

## 3. Recommendations Summary

### Immediate (Should Fix)

| Priority | Issue | File | Recommendation |
|----------|-------|------|----------------|
| High | Props mutation in render | scale-control.ts | Move to useEffect |
| High | Missing dependency array | marker.ts:67-74 | Add proper dependencies |
| High | Type safety | Multiple | Reduce @ts-ignore usage |

### Short Term (Nice to Have)

| Priority | Issue | File | Recommendation |
|----------|-------|------|----------------|
| Medium | File extensions | Multiple | Rename .ts to .tsx |
| Medium | Deep merge options | draw-control.ts | Implement deep merge |
| Medium | Large class | minimap-control.ts | Extract to smaller modules |

### Long Term (Future Improvements)

| Priority | Issue | File | Recommendation |
|----------|-------|------|----------------|
| Low | Logging | Multiple | Replace console with logger |
| Low | Strict mode | tsconfig.json | Enable strict TypeScript |
| Low | Documentation | All | Add comprehensive JSDoc |

---

## 4. Test Coverage Analysis

### Existing Tests (All Passing)

| Component | Test File | Status |
|-----------|-----------|--------|
| Map | map.test.js | Covered |
| Marker | marker.test.js | Covered |
| Popup | popup.test.js | Covered |
| Source | source.test.js | Covered |
| Layer | layer.test.js | Covered |
| NavigationControl | navigation-control.test.js | Covered |
| GeolocateControl | geolocate-control.test.js | Covered |
| ScaleControl | scale-control.test.js | Covered |
| FullscreenControl | fullscreen-control.test.js | Covered |
| AttributionControl | attribution-control.test.js | Covered |
| LogoControl | logo-control.test.js | Covered |
| TerrainControl | terrain-control.test.js | Covered |
| DrawControl | draw-control.test.js | Covered (New) |
| MinimapControl | minimap-control.test.js | Covered (New) |

---

## 5. Conclusion

The react-bkoi-gl codebase is in **GOOD** condition. The architecture is well-designed with clean separation between React components and the underlying MapLibre GL library.

### Key Strengths
- Clean, consistent architecture
- Good test coverage (now includes DrawControl and MinimapControl)
- Proper security measures implemented
- Performance-conscious design

### Key Areas for Improvement
- Reduce TypeScript suppression comments
- Fix render-phase side effects
- Improve file naming consistency
- Consider enabling TypeScript strict mode

### Overall Assessment

The project is production-ready with minor improvements recommended. The recent additions (DrawControl and MinimapControl) follow established patterns and include appropriate tests.

---

**Report Generated:** March 24, 2026
**Codebase Version:** v2.0.1
**Files Reviewed:** 35 source files, 28 test files
