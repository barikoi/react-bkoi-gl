# Architecture Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Review Date:** March 25, 2026
**Previous Review:** March 25, 2026 (Initial)
**Reviewer:** Architecture Analysis - Follow-up Review

---

## Executive Summary

### Architectural Health Assessment: GOOD (8.2/10) - STABLE

The react-bkoi-gl library maintains its architectural health from the previous review. All previously fixed issues remain fixed, and the two remaining issues continue to be present. The codebase demonstrates strong pattern consistency and proper React integration.

| Assessment Category | Previous Score | Current Score | Status | Change |
|---------------------|----------------|---------------|--------|--------|
| Pattern Compliance | 9/10 | 9/10 | Good | No Change |
| SOLID Principles | 7.5/10 | 7.5/10 | Good | No Change |
| Type Safety | 8.5/10 | 8.5/10 | Good | No Change |
| Module Boundaries | 8/10 | 8/10 | Good | No Change |
| Maintainability | 7.5/10 | 7.5/10 | Moderate | No Change |
| Test Coverage | 7.5/10 | 7.5/10 | Good | No Change |

### Key Strengths
- Consistent control pattern using `useControl` hook
- Well-defined context hierarchy (MapContext, MountedMapsContext)
- Proper MapRef abstraction preventing React binding breakage
- Comprehensive type definitions
- Security-conscious implementations (SVG sanitization in minimap-control.ts, CSS validation)
- Consistent memo usage across all components
- Proper deep merge for nested configuration objects
- React.useId() for SSR-safe unique IDs

### Key Concerns
- Large files remain (maplibre.ts: 587 lines, minimap-control.ts: 720 lines)
- Source/Layer components still bypass React lifecycle patterns (render-phase side effects)

---

## Issue Status Verification

### Previously Fixed Issues - ALL CONFIRMED FIXED

| Issue # | Description | Impact | Status | Verification |
|---------|-------------|--------|--------|--------------|
| 3 | Inconsistent Memo Usage in Source and Layer | MEDIUM | **FIXED** | Confirmed: Both wrapped with `memo()` at lines 149 and 148 respectively |
| 4 | Shallow Merge in DrawControl Options | MEDIUM | **FIXED** | Confirmed: Deep merge implemented at lines 98-114 |
| 5 | Missing Dependency in ScaleControl | LOW | **FIXED** | Confirmed: Props updates in useEffect at lines 31-38 |
| 6 | Type Assertion in Events (popup.ts) | LOW | **FIXED** | Confirmed: Proper `MapMouseEventBase` import from types/lib.ts at line 7 |
| 7 | Global Counter Pattern in source.ts and layer.ts | LOW | **FIXED** | Confirmed: `useId()` hook used at lines 89 and 106 respectively |

### Previously Present Issues - STILL PRESENT

| Issue # | Description | Impact | Status | Verification |
|---------|-------------|--------|--------|--------------|
| 1 | Large Class Files | HIGH | **STILL PRESENT** | Confirmed: 587 lines (maplibre.ts), 720 lines (minimap-control.ts) |
| 2 | Render-Phase Side Effects in Source/Layer | MEDIUM | **STILL PRESENT** | Confirmed: Side effects at lines 127-133 (source.ts) and 130-143 (layer.ts) |

---

## Detailed Issue Analysis

### Issue 1: Large Class Files - STILL PRESENT

**Files:**
- `/Users/bro/Desktop/sarika/react-b-gl/react-bkoi-gl/src/maplibre/maplibre.ts` (587 lines)
- `/Users/bro/Desktop/sarika/react-b-gl/react-bkoi-gl/src/components/minimap-control.ts` (720 lines)

**Analysis:**

The `Maplibre` class (maplibre.ts) continues to handle multiple responsibilities:
- Map initialization and configuration
- ViewState management and synchronization
- Settings management (zoom, pitch, bounds, projection)
- Style management and diffing
- Style components (light, sky, projection, terrain)
- Event handling (pointer, camera, other events)
- Map reuse/recycling
- Hover state tracking

The `Minimap` class (minimap-control.ts) continues to handle:
- Container creation and styling (lines 301-393)
- Interaction configuration (lines 395-404)
- Toggle button management (lines 406-478)
- Responsive sizing (lines 480-535)
- Map synchronization (lines 652-705)
- Parent rectangle overlay (lines 571-650)

**Recommendation:** Split into focused modules:
- Maplibre -> MaplibreCore, ViewStateManager, StyleManager, EventManager
- Minimap -> MinimapCore, MinimapUI, MinimapSync

---

### Issue 2: Render-Phase Side Effects in Source/Layer - STILL PRESENT

**Files:**
- `/Users/bro/Desktop/sarika/react-b-gl/react-bkoi-gl/src/components/source.ts`
- `/Users/bro/Desktop/sarika/react-b-gl/react-bkoi-gl/src/components/layer.ts`

**Current Implementation (source.ts lines 126-133):**
```typescript
const mapInternal = map as unknown as MapInternalProperties
let source = map && mapInternal.style && map.getSource(id)
if (source) {
  updateSource(source, props, propsRef.current)  // Side effect during render
} else {
  source = createSource(map, id, props)
}
propsRef.current = props
```

**Current Implementation (layer.ts lines 130-143):**
```typescript
const mapInternal = map as unknown as MapInternalProperties
const layer = map && mapInternal.style && map.getLayer(id)
if (layer) {
  try {
    updateLayer(map, id, props, propsRef.current)  // Side effect during render
  } catch (error) {
    console.warn(error)
  }
} else {
  createLayer(map, id, props)
}
propsRef.current = props
```

**Impact:** This pattern works but violates React's rules about side effects in render. It could cause issues with React's concurrent features in the future.

**Recommendation:** Move to useEffect or useLayoutEffect (requires careful consideration of initialization order - child layers must be created after parent sources).

---

## Pattern Compliance Analysis

### 3.1 Control Pattern (Score: 9/10)

All control components consistently use the `useControl` hook pattern:

| Component | File | Lines | Pattern Compliance |
|-----------|------|-------|-------------------|
| NavigationControl | navigation-control.ts | ~50 | Full |
| ScaleControl | scale-control.ts | 48 | Full |
| FullscreenControl | fullscreen-control.ts | ~50 | Full |
| GeolocateControl | geolocate-control.ts | ~100 | Full |
| TerrainControl | terrain-control.ts | ~50 | Full |
| AttributionControl | attribution-control.ts | ~50 | Full |
| LogoControl | logo-control.ts | ~50 | Full |
| DrawControl | draw-control.ts | 294 | Full |
| MinimapControl | minimap-control.ts | 721 | Full |

### 3.2 Component Pattern (Score: 9/10)

All major components follow consistent patterns:

| Component | memo() | useId() | Proper Lifecycle |
|-----------|--------|---------|------------------|
| Map | N/A (context provider) | N/A | Yes |
| Marker | Yes | N/A | Yes |
| Popup | Yes | N/A | Yes |
| Source | Yes | Yes | Partial (render-phase effects) |
| Layer | Yes | Yes | Partial (render-phase effects) |

### 3.3 Context Pattern (Score: 10/10)

The context hierarchy is well-designed:

```
MapContext (provides: map, mapLib)
    |
    +--- Marker
    +--- Popup
    +--- Source
    |       |
    |       +--- Layer (via cloneElement)
    +--- All Controls

MountedMapsContext (provides: maps registry)
    |
    +--- useMap() hook
```

---

## SOLID Principles Assessment

### 4.1 Single Responsibility Principle (SRP) - Score: 7/10

| Component | Responsibility | Lines | Assessment |
|-----------|---------------|-------|------------|
| Map | Lifecycle + Context | ~155 | Good |
| Maplibre | Map wrapper | 587 | Too large - multiple responsibilities |
| useControl | Control hook | 68 | Excellent |
| MinimapControl | Control + Minimap class | 720 | Too large - multiple responsibilities |
| DrawControl | Draw control | 294 | Good |
| Source | Source management | 150 | Good |
| Layer | Layer management | 149 | Good |
| Marker | Marker management | 175 | Good |
| Popup | Popup management | 106 | Good |

### 4.2 Open/Closed Principle - Score: 9/10

Excellent extensibility via:
- `useControl` hook allows easy addition of new controls
- `MapLib` interface allows alternative map libraries
- Component composition pattern (Source -> Layer)

### 4.3 Liskov Substitution Principle - Score: 9/10

All controls implement `IControl` interface from MapLibre GL, ensuring they can be substituted for any other control.

### 4.4 Interface Segregation Principle - Score: 8/10

Well-segregated props interfaces:
- `MarkerProps` extends `MarkerOptions`
- `PopupProps` extends `PopupOptions`
- Control props extend their respective option types

Minor issue: `MaplibreProps` is a large interface combining ViewState, MapCallbacks, and styling options.

### 4.5 Dependency Inversion Principle - Score: 8/10

Good abstraction via:
- `MapLib` interface abstracts the underlying map library
- Context provides dependency injection for map and mapLib
- `MapRef` abstraction hides implementation details

---

## Module Boundaries and Dependencies

### 5.1 Dependency Graph

```
exports-maplibre-gl.ts
    |
    +--- components/
    |       +--- map.tsx ---> MapContext
    |       +--- use-map.tsx ---> MountedMapsContext
    |       +--- use-control.ts ---> MapContext
    |       +--- *-control.ts ---> use-control
    |       +--- marker.ts ---> MapContext
    |       +--- popup.ts ---> MapContext
    |       +--- source.ts ---> MapContext
    |       +--- layer.ts ---> MapContext
    |       +--- draw-control.ts ---> MapContext
    |       +--- minimap-control.ts ---> use-control
    |
    +--- maplibre/
    |       +--- maplibre.ts (independent)
    |       +--- create-ref.ts ---> maplibre.ts
    |
    +--- types/
    |       +--- lib.ts ---> maplibre-gl
    |       +--- events.ts ---> common.ts, maplibre-gl
    |       +--- common.ts ---> maplibre-gl
    |       +--- style-spec.ts
    |       +--- internal.ts
    |
    +--- utils/
            +--- deep-equal.ts (independent)
            +--- transform.ts ---> types/internal, maplibre.ts
            +--- style-utils.ts ---> types/style-spec
            +--- set-globals.ts (independent)
            +--- apply-react-style.ts (independent)
            +--- compare-class-names.ts (independent)
            +--- assert.ts (independent)
            +--- use-isomorphic-layout-effect.ts (independent)
```

### 5.2 Circular Dependency Check

No circular dependencies detected. The module structure is clean with unidirectional dependencies.

---

## Type Safety Architecture

### 6.1 Type Organization

```
src/types/
    +--- lib.ts      -> MapLibre GL type re-exports (includes MapMouseEventBase)
    +--- events.ts   -> Event type definitions
    +--- common.ts   -> ViewState, Point, LngLat, etc.
    +--- style-spec.ts -> Style specification types
    +--- internal.ts -> Internal types (TransformLike, Source implementations)
```

### 6.2 Type Safety Assessment

| Area | Score | Notes |
|------|-------|-------|
| Component Props | 9/10 | Well-typed with proper interfaces |
| Event Handlers | 8.5/10 | Improved with proper type imports |
| Generic Usage | 8/10 | Good use of generics in useControl |
| Export Types | 9/10 | All public types exported |

---

## Security Assessment

### Positive Security Implementations

1. **SVG Sanitization (minimap-control.ts lines 170-183):**
```typescript
function sanitizeSVG(svgString: string): string {
  const svgPattern = /^<svg[^>]*>[\s\S]*<\/svg>$/i
  if (!svgPattern.test(svgString)) {
    console.warn('Invalid SVG format, using default icon')
    return DEFAULT_ICON
  }
  return svgString
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}
```

2. **CSS Validation (minimap-control.ts lines 372-393):**
```typescript
private validateContainerStyle(style?: Record<string, string>): Record<string, string> {
  // Uses CSS.supports() for validation
  if (style.width) {
    validated.width = CSS.supports('width', style.width) ? style.width : defaults.width
  }
  // ...
}
```

3. **UUID Generation (minimap-control.ts lines 153-165):** Uses crypto API for secure random IDs.

---

## Test Coverage

The test suite continues to pass with all 247 tests covering:
- 26 test files
- All major components
- DrawControl deep merge behavior
- Source/Layer memoization and ID generation
- Minimap functionality

---

## Recommendations for Improvement

### High Priority

1. **Split Large Classes**
   - Refactor `Maplibre` class into focused modules:
     - `MaplibreCore` - initialization and lifecycle
     - `ViewStateManager` - view state synchronization
     - `StyleManager` - style diffing and components
     - `EventManager` - event handling
   - Extract `Minimap` class into separate files:
     - `MinimapCore` - main control logic
     - `MinimapUI` - container, styles, toggle button
     - `MinimapSync` - map synchronization

### Medium Priority

2. **Fix Render-Phase Side Effects in Source/Layer**
   - Move updates to useEffect or useLayoutEffect
   - This requires careful consideration of initialization order
   - Consider using a ref-based state machine approach

### Low Priority

3. **Continue Reducing @ts-ignore Usage**
   - Document why each @ts-ignore is necessary
   - Consider contributing types to DefinitelyTyped

4. **Extract Large Interfaces**
   - Split `MaplibreProps` into smaller, focused interfaces
   - Consider using utility types for composition

---

## Conclusion

The react-bkoi-gl library maintains its architectural integrity with all previously fixed issues remaining resolved. The codebase demonstrates:

### Confirmed Fixes (All Still Working)
1. Consistent memo() usage across all components
2. Deep merge for DrawControl options
3. Proper useEffect for ScaleControl prop updates
4. Proper type imports for event handlers
5. React.useId() for unique IDs (SSR-safe)

### Remaining Work
1. Split large class files (Maplibre: 587 lines, Minimap: 720 lines)
2. Fix render-phase side effects in Source/Layer

### Issue Resolution Summary

| Status | Count | Percentage |
|--------|-------|------------|
| Fixed | 5 | 71% |
| Still Present | 2 | 29% |
| New Issues | 0 | 0% |
| **Total** | **7** | **100%** |

The architecture is stable and maintainable. The remaining issues are larger refactoring tasks that should be planned carefully to avoid breaking changes.

---

**Report Generated:** March 25, 2026
**Architecture Review Version:** 3.0
**Previous Version:** 2.2 (March 25, 2026)
**Branch:** dev-sarika
