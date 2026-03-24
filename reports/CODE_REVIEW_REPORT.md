# Code Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 24, 2026

---

## Executive Summary

**Overall Code Quality: GOOD**

The codebase follows React best practices with a well-structured component architecture. However, there are several areas requiring attention, particularly around error handling, TypeScript safety, and the new components (DrawControl, MinimapControl).

### Quality Metrics

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 7/10 | Good |
| TypeScript Safety | 6/10 | Needs Improvement |
| Error Handling | 5/10 | Needs Improvement |
| Testing Coverage | 6/10 | Partial |
| Documentation | 7/10 | Good |
| Performance | 7/10 | Good |

---

## 1. Critical Issues

### 1.1 Potential Null Reference in Map Component

**File:** `src/components/map.tsx`
**Lines:** 41, 84-85
**Severity: CRITICAL**

```typescript
const [mapInstance, setMapInstance] = useState<Maplibre>(null)
// ...
contextValue.map = createRef(maplibre)
contextValue.mapLib = mapboxgl
```

**Issue:** If `maplibre` creation fails but returns `null`, `createRef(maplibre)` returns `null`, and then `contextValue.map` is set to `null`. Subsequent code that uses `contextValue.map` (like in children components) could cause runtime errors.

**Fix:**
```typescript
if (maplibre) {
  contextValue.map = createRef(maplibre)
  contextValue.mapLib = mapboxgl
}
```

---

### 1.2 Missing Dependency Array in useEffect

**File:** `src/components/map.tsx`
**Line:** 49-113
**Severity: HIGH**

```typescript
useEffect(() => {
  // ... map initialization logic
}, []) // Empty dependency array!
```

**Issue:** The effect has no dependencies, which means:
1. `props` changes won't trigger re-initialization
2. ESLint react-hooks/exhaustive-deps will warn
3. May cause stale closure issues if `props.mapLib` changes

**Fix:** Either add dependencies or document the intentional behavior:
```typescript
useEffect(() => {
  // ... map initialization logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

---

## 2. High Priority Issues

### 2.1 Unsafe Type Assertions in draw-control.ts

**File:** `src/components/draw-control.ts`
**Lines:** 20-43, 72-73, 83, 94-95, 111-136
**Severity: HIGH**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
onDrawCreate?: (e: any) => void
// ... multiple any type usages
```

**Issue:** Using `any` type defeats TypeScript's type safety.

**Fix:**
```typescript
export type DrawEvent = {
  type: string
  features?: GeoJSON.Feature[]
}
onDrawCreate?: (e: DrawEvent) => void
```

---

### 2.2 JSON.stringify in useMemo Dependencies

**File:** `src/components/draw-control.ts`
**Lines:** 77-84
**Severity: HIGH**

```typescript
const options = useMemo(
  () => ({
    ...defaultDrawOptions,
    ...drawOptions,
  }),
  [JSON.stringify(drawOptions)]  // Anti-pattern
)
```

**Issue:** `JSON.stringify` in dependencies is a performance anti-pattern and can cause unnecessary re-creations.

**Fix:**
```typescript
const options = useMemo(
  () => ({
    ...defaultDrawOptions,
    ...drawOptions,
  }),
  [drawOptions.displayControlsDefault, drawOptions.controls]
)
```

---

### 2.3 MinimapControl: CSS Injection via innerHTML

**File:** `src/components/minimap-control.ts`
**Lines:** 281-283, 396-427
**Severity: HIGH (Security)**

```typescript
const styleEl = document.createElement('style')
styleEl.innerHTML = this.getContainerStyles()
```

**Issue:** Using `innerHTML` with dynamic values could lead to XSS if values are user-controlled.

**Fix:** Validate/sanitize user inputs or use CSSOM.

---

### 2.4 useControl Hook Missing Context Validation

**File:** `src/components/use-control.ts`
**Lines:** 34, 42-43
**Severity: HIGH**

```typescript
const context = useContext(MapContext)
const { map } = context
if (!map.hasControl(ctrl)) {
```

**Issue:** If `context` is `null` (when used outside MapContext), accessing `context.map` will throw an error.

**Fix:**
```typescript
const context = useContext(MapContext)
if (!context) {
  throw new Error('useControl must be used within a Map component')
}
```

---

## 3. Medium Priority Issues

### 3.1 Inconsistent Error Handling Patterns

**Files:** Multiple components

Different error handling patterns:
- `map.tsx`: Custom `onError` callback with fallback to `console.error`
- `maplibre.ts`: Silent catch with `console.error`
- `source.ts`: Assert function that throws errors
- `layer.ts`: try/catch with `console.warn`

**Recommendation:** Standardize error handling approach:
1. Create a centralized error handling utility
2. Define consistent error types
3. Consider using error boundaries for React components

---

### 3.2 Missing Tests for New Components

**Files:**
- `src/components/draw-control.ts` - No test file
- `src/components/minimap-control.ts` - No test file

**Recommendation:** Add comprehensive tests:
- Test initialization and cleanup
- Test callback invocations
- Test prop updates
- Test error scenarios

---

### 3.3 Style Property Type Issue

**File:** `src/utils/style-utils.ts`
**Line:** 12-13

```typescript
export function normalizeStyle(
  style: string | StyleSpecification | ImmutableLike<StyleSpecification>
): string | StyleSpecification {
  if (!style) {
    return null  // Returns null but return type doesn't include null
  }
}
```

**Fix:**
```typescript
export function normalizeStyle(
  style: string | StyleSpecification | ImmutableLike<StyleSpecification>
): string | StyleSpecification | null {
```

---

### 3.4 Counter-based IDs Not Safe for SSR

**Files:**
- `src/components/source.ts` (line 21)
- `src/components/layer.ts` (line 80)

```typescript
let sourceCounter = 0
const id = useMemo(() => props.id || `jsx-source-${sourceCounter++}`, [])
```

**Issue:** Counter-based IDs can cause hydration mismatches during SSR.

**Fix:**
```typescript
const id = useMemo(() => props.id || `jsx-source-${useId()}`, [])
```

---

### 3.5 Missing Documentation for Exported Types

**File:** `src/exports-maplibre-gl.ts`

Exported types like `MinimapInteractions`, `ParentRectConfig` lack JSDoc documentation.

**Fix:**
```typescript
/**
 * Configuration for minimap interactions.
 */
export type MinimapInteractions = Record<MapInteractions, boolean>
```

---

## 4. Low Priority Issues

### 4.1 Console Statements in Production Code

**Files:** Multiple

```typescript
console.error(error)  // map.tsx:98
console.warn(`Unable to update <Source> prop: ${changedKey}`)  // source.ts:78
console.warn(error)  // layer.ts:112
```

**Recommendation:** Use a configurable logger or remove in production builds.

---

### 4.2 Hardcoded Strings

**File:** `src/components/logo-control.ts`
**Lines:** 36-42

```typescript
container.href = 'https://www.barikoi.com'
container.target = '_blank'
```

**Recommendation:** Consider making the URL configurable via props.

---

### 4.3 Magic Numbers in minimap-control.ts

**File:** `src/components/minimap-control.ts`
**Lines:** 196-219

```typescript
zoomAdjust: -4,
collapsedWidth: '29px',
collapsedHeight: '29px',
```

**Recommendation:** Extract to named constants for clarity.

---

### 4.4 Unused Props in DrawControl

**File:** `src/components/draw-control.ts`
**Line:** 17

```typescript
style?: React.CSSProperties  // Never used in component
```

**Recommendation:** Either implement or remove the unused prop.

---

### 4.5 Inconsistent Component File Extensions

Some components use `.ts` while others use `.tsx`:
- `map.tsx` (uses JSX)
- `marker.ts` (uses JSX via createPortal but has .ts extension)
- `popup.ts` (uses JSX via createPortal but has .ts extension)

**Recommendation:** Rename `.ts` files containing JSX to `.tsx` for consistency.

---

## 5. Component-Specific Reviews

### 5.1 Map Component (`map.tsx`)

**Strengths:**
- Proper context provider setup
- Good lifecycle management
- Handles map reuse/recycling

**Issues:**
- Large component (220+ lines)
- Null reference potential
- Missing dependency array

### 5.2 Source Component (`source.ts`)

**Strengths:**
- Clean prop-to-source synchronization
- Proper cleanup on unmount
- Support for multiple source types

**Issues:**
- Counter-based IDs for SSR
- Render-side side effects

### 5.3 Layer Component (`layer.ts`)

**Strengths:**
- Reactive prop updates via deep equality checks
- Proper layer lifecycle management
- Support for `before` prop for layer ordering

**Issues:**
- Counter-based IDs for SSR
- Render-side side effects

### 5.4 Marker Component (`marker.ts`)

**Strengths:**
- Good use of `createPortal` for DOM rendering
- Proper use of `forwardRef` and `memo`
- Event handler pattern using refs

**Issues:**
- Multiple useEffect calls could be consolidated

### 5.5 Popup Component (`popup.ts`)

**Strengths:**
- Good use of `createPortal`
- Proper lifecycle management

**Issues:**
- Type augmentation without declaration
- Multiple useEffect calls

### 5.6 DrawControl (`draw-control.ts`)

**Strengths:**
- Comprehensive event handling
- Good default options

**Issues:**
- Does NOT use `useControl` pattern
- Excessive use of `any` types
- JSON.stringify anti-pattern
- Missing tests

### 5.7 MinimapControl (`minimap-control.ts`)

**Strengths:**
- Feature-rich implementation
- Good customization options

**Issues:**
- Very large file (689 lines)
- innerHTML usage for CSS injection
- Non-cryptographic UUID generation
- Missing tests

---

## 6. Testing Coverage Analysis

### Existing Tests

| Component | Test File | Coverage |
|-----------|-----------|----------|
| Map | `__tests__/components/map.test.js` | Good |
| Marker | `__tests__/components/marker.test.js` | Good |
| Popup | `__tests__/components/popup.test.js` | Good |
| Source | `__tests__/components/source.test.js` | Good |
| Layer | `__tests__/components/layer.test.js` | Good |
| Controls | `__tests__/components/*-control.test.js` | Good |
| DrawControl | **Missing** | None |
| MinimapControl | **Missing** | None |

### Test Quality Assessment

**Strengths:**
- Comprehensive mocking of MapLibre GL
- Good coverage of component lifecycle
- Event handling tests

**Weaknesses:**
- No integration tests
- Missing tests for new components
- Limited edge case testing

---

## 7. Performance Considerations

### 7.1 Good Practices

- Use of `memo()` on all control components
- Use of `useMemo()` for expensive computations
- Use of `useCallback()` for context callbacks
- Deep equality checks to prevent unnecessary updates

### 7.2 Potential Issues

1. **Deep equality checks** can be expensive for frequently updating props
2. **JSON.stringify** in dependency arrays
3. **Map recycling** adds complexity but improves performance

---

## 8. Recommendations Summary

### Immediate (Critical)
1. Fix null reference potential in `map.tsx`
2. Add context validation in `use-control.ts`

### High Priority
3. Refactor DrawControl to use `useControl` pattern
4. Replace `any` types with proper type definitions
5. Fix JSON.stringify anti-pattern in DrawControl
6. Add input sanitization to MinimapControl

### Medium Priority
7. Add tests for DrawControl and MinimapControl
8. Standardize error handling across components
9. Fix return type in `style-utils.ts`
10. Use `useId` for SSR-safe IDs

### Low Priority
11. Remove console statements in production
12. Standardize file extensions
13. Add JSDoc documentation for exported types
14. Extract magic numbers to constants

---

## 9. What's Done Well

1. **Clean separation of concerns**: The Maplibre wrapper class separates map lifecycle management from React component logic
2. **Good context pattern**: MapContext and MountedMapsContext provide clean access to map instances
3. **Comprehensive event handling**: All MapLibre events are properly mapped and forwarded
4. **Type safety**: Good use of TypeScript types from maplibre-gl
5. **Test coverage**: Core components have comprehensive test coverage
6. **Consistent control pattern**: Most controls follow the same useControl pattern
7. **Proper cleanup**: Components properly clean up resources on unmount
8. **Performance optimizations**: Uses memo, useMemo, useCallback appropriately
9. **Documentation**: CLAUDE.md provides good guidance for contributors

---

## 10. Conclusion

The react-bkoi-gl codebase demonstrates good overall code quality with established patterns and proper React practices. The main areas for improvement are:

1. **Type Safety**: Reduce usage of `any` types, especially in DrawControl
2. **Pattern Consistency**: Ensure all controls follow the useControl pattern
3. **Testing**: Add tests for new components
4. **Error Handling**: Standardize error handling approach
5. **Security**: Address innerHTML usage and input validation

Addressing these issues will significantly improve the maintainability and reliability of the codebase.

---

**Report Generated:** March 24, 2026
**Confidence Level:** High
