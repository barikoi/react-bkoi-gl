# Architecture Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 24, 2026

---

## Executive Summary

**Architectural Impact: MEDIUM**

react-bkoi-gl follows a well-established pattern similar to react-map-gl, wrapping MapLibre GL JS with React components. The architecture is generally sound with clear separation of concerns, but there are several areas requiring attention for long-term maintainability and consistency.

### Assessment Summary

| Category | Score | Status |
|----------|-------|--------|
| Pattern Compliance | 8/10 | Good |
| SOLID Compliance | 7/10 | Partial |
| Type Safety | 7/10 | Partial |
| Dependency Management | 8/10 | Good |
| Extensibility | 8/10 | Good |
| Maintainability | 6/10 | Needs Improvement |

---

## 1. Architecture Overview

### 1.1 Directory Structure

```
src/
├── components/           # React components (18 files)
│   ├── map.tsx          # Core Map component with context
│   ├── use-map.tsx      # MapProvider context + useMap hook
│   ├── use-control.ts   # Generic control hook
│   ├── marker.ts        # Marker component
│   ├── popup.ts         # Popup component
│   ├── source.ts        # Source component
│   ├── layer.ts         # Layer component
│   ├── *-control.ts     # Various map controls (8 files)
│   ├── draw-control.ts  # NEW: Drawing control
│   └── minimap-control.ts # NEW: Minimap control
├── maplibre/            # MapLibre wrapper layer
│   ├── maplibre.ts      # Core wrapper class
│   └── create-ref.ts    # MapRef factory
├── types/               # TypeScript definitions
│   ├── common.ts
│   ├── events.ts
│   ├── internal.ts
│   ├── lib.ts
│   └── style-spec.ts
├── utils/               # Helper utilities
│   ├── apply-react-style.ts
│   ├── assert.ts
│   ├── compare-class-names.ts
│   ├── deep-equal.ts
│   ├── set-globals.ts
│   ├── style-utils.ts
│   ├── transform.ts
│   └── use-isomorphic-layout-effect.ts
├── index.ts             # Main entry point
└── exports-maplibre-gl.ts # Public exports
```

### 1.2 Architectural Layers

```
+--------------------------------------------------+
|              Application Layer                    |
|         (User's React Application)               |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|           Component Layer (React)                 |
|  Map, Marker, Popup, Source, Layer, Controls     |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|           Abstraction Layer                       |
|        Maplibre class + MapRef                    |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|           External Library                        |
|             MapLibre GL JS                        |
+--------------------------------------------------+
```

---

## 2. Pattern Compliance Analysis

### 2.1 Context Pattern

**Status: Well Implemented**

The library uses React Context effectively for state distribution:

**File:** `src/components/map.tsx` (Lines 23-28)

```typescript
export const MapContext = React.createContext<{
  mapLib?: MapLib
  map?: MapRef
}>({})
```

**Assessment:**
- **Strengths:** Clear separation between single-map context (MapContext) and multi-map tracking (MountedMapsContext)
- **Weaknesses:** The `MountedMapsContext` can be null, requiring null checks

### 2.2 Control Pattern

**Status: Consistent Implementation**

Controls follow a uniform pattern using the `useControl` hook:

**Compliance Score:** 8/10

**Violations Found:**

| Finding ID | File | Issue |
|------------|------|-------|
| PATTERN-001 | `src/components/draw-control.ts` | Does NOT use `useControl` hook - directly accesses MapContext |
| PATTERN-002 | `src/components/minimap-control.ts` | Uses `useControl` but contains extensive inline class definition |

### 2.3 Component Lifecycle Pattern

**Status: Generally Consistent**

Most components follow the established lifecycle pattern:
1. Access map via `useContext(MapContext)`
2. Create MapLibre counterpart in `useMemo`
3. Add to map in `useEffect` with cleanup
4. Update props reactively via additional effects

**Exception:** DrawControl uses a different pattern with direct map access.

---

## 3. SOLID Principles Assessment

### 3.1 Single Responsibility Principle (SRP)

**Score: 7/10**

| Component | Responsibility | SRP Compliance |
|-----------|---------------|----------------|
| Map | Map lifecycle + context + event handling | Partial - handles too many concerns |
| Maplibre (wrapper) | Props-to-map sync + events + view state | **Violation** - 589 lines, multiple responsibilities |
| Minimap | Control + container creation + styling + sync | **Violation** - 689 lines, should be split |
| Source | Source management only | Compliant |
| Layer | Layer management only | Compliant |
| use-control | Control hook abstraction | Compliant |

**Recommendation:** Split into focused classes:
- `MapInitializer` - handles map creation
- `ViewStateController` - handles camera/view state
- `StyleManager` - handles style updates
- `EventHandlerRegistry` - handles event subscriptions

### 3.2 Open/Closed Principle (OCP)

**Score: 8/10**

The architecture is generally open for extension through:
- Custom controls via `IControl` interface
- Custom sources/layers through MapLibre's APIs
- Event callback props

**Issue:** The `skipMethods` array in `create-ref.ts` is hardcoded.

### 3.3 Liskov Substitution Principle (LSP)

**Score: 9/10**

No significant LSP violations found.

### 3.4 Interface Segregation Principle (ISP)

**Score: 8/10**

**Issue:** `MapCallbacks` interface is large with many optional methods (30+ event handlers).

**Recommendation:** Split into focused interfaces:
- `PointerEventCallbacks`
- `CameraEventCallbacks`
- `DataEventCallbacks`

### 3.5 Dependency Inversion Principle (DIP)

**Score: 6/10**

**Issue:** Components have tight coupling to MapLibre GL JS implementation details.

---

## 4. Dependency Analysis

### 4.1 Dependency Graph

```
react-bkoi-gl
    |
    +-- maplibre-gl (^5.15.0) [PRODUCTION]
    |       +-- @maplibre/maplibre-gl-style-spec
    |
    +-- @maplibre/maplibre-gl-style-spec (^24.4.1) [PRODUCTION]
    |
    +-- maplibre-gl-draw (^1.6.9) [PRODUCTION]
    |
    +-- react (>=16.3.0) [PEER]
    |
    +-- react-dom (>=16.3.0) [PEER]
```

### 4.2 Dependency Risk Assessment

| Package | Version | Risk Level | Notes |
|---------|---------|------------|-------|
| maplibre-gl | ^5.15.0 | Low | Actively maintained, stable API |
| @maplibre/maplibre-gl-style-spec | ^24.4.1 | Low | Stable specification package |
| maplibre-gl-draw | ^1.6.9 | **Medium** | Third-party, less frequent updates |

### 4.3 Circular Dependency Check

**Result: No Circular Dependencies Found**

---

## 5. Component Architecture Review

### 5.1 Map Component (Core)

**File:** `src/components/map.tsx`

**Architecture Pattern:** Container Component with Context Provider

**Strengths:**
- Properly manages map lifecycle
- Provides context to children
- Handles map reuse/recycling
- Auto-includes required controls (Logo, Attribution)

**Weaknesses:**
- Large component (220+ lines)
- Mixes presentation with logic
- `ref` handling could be cleaner

### 5.2 Control Components

**Pattern Consistency Analysis:**

| Control | Uses useControl | Props Pattern | Style Support |
|---------|-----------------|---------------|---------------|
| NavigationControl | Yes | Standard | Yes |
| ScaleControl | Yes | Standard | Yes |
| FullscreenControl | Yes | Standard | Yes |
| GeolocateControl | Yes | Standard | Yes |
| TerrainControl | Yes | Standard | Yes |
| AttributionControl | Yes | Standard | Yes |
| LogoControl | Yes | Standard | Yes |
| **DrawControl** | **No** | Non-standard | No |
| MinimapControl | Yes | Extended | No |

### 5.3 Source and Layer Components

**Status: Well Architected**

**Strengths:**
- Clean prop-to-source synchronization
- Proper cleanup on unmount
- Support for multiple source types
- Reactive prop updates via deep equality checks

---

## 6. Type System Analysis

### 6.1 Type Organization

```
types/
├── common.ts      # Basic types (ViewState, Point, LngLat)
├── events.ts      # Event types (MapCallbacks, etc.)
├── internal.ts    # Internal implementation types
├── lib.ts         # MapLibre library types
└── style-spec.ts  # Style specification types
```

### 6.2 Type Safety Assessment

**Score: 7/10**

**Issues Found:**

1. **Overuse of `any` type** in `draw-control.ts`:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
onDrawCreate?: (e: any) => void
```

2. **Loose typing in Maplibre wrapper:**
```typescript
// @ts-ignore - dynamically accessing event handler from props
const cb = this.props[otherEvents[e.type]]
```

3. **DrawControlOptions is too permissive:**
```typescript
export type DrawControlOptions = Record<string, unknown>
```

---

## 7. Performance Considerations

### 7.1 Re-render Optimization

**Good Practices:**
- Use of `memo()` on all control components
- Use of `useMemo()` for expensive computations
- Use of `useCallback()` for context callbacks

**Potential Issues:**

1. **JSON.stringify in dependency array** (`draw-control.ts`):
```typescript
[JSON.stringify(drawOptions)]  // Anti-pattern
```

2. **Deep equality checks on every render** (`maplibre.ts`)

### 7.2 Memory Management

**Status: Good**

- Map recycling implemented via `Maplibre.savedMaps`
- Proper cleanup in `useEffect` return functions
- Event listener cleanup on unmount

---

## 8. Findings and Recommendations

### 8.1 High Priority Findings

#### ARCH-001: DrawControl Pattern Violation

**Severity: High**
**Category: Pattern Compliance**
**File:** `src/components/draw-control.ts`

**Issue:** DrawControl does not follow the established control pattern. It directly accesses MapContext instead of using the useControl hook.

**Recommendation:** Refactor to use useControl hook.

---

#### ARCH-002: MinimapControl Complexity

**Severity: Medium**
**Category: Single Responsibility Principle**
**File:** `src/components/minimap-control.ts`

**Issue:** The Minimap class (689 lines) handles too many responsibilities.

**Recommendation:** Extract into focused modules:
```
components/minimap/
├── index.ts              # Main export
├── minimap-control.tsx   # React component
├── minimap-core.ts       # Core Minimap class
├── minimap-container.ts  # Container creation and styling
├── toggle-button.ts      # Toggle button logic
└── parent-rect.ts        # Parent rectangle overlay
```

---

#### ARCH-003: Maplibre Wrapper Size

**Severity: Medium**
**Category: Single Responsibility Principle**
**File:** `src/maplibre/maplibre.ts`

**Issue:** The Maplibre class is 589 lines and handles multiple responsibilities.

**Recommendation:** Extract handlers into separate classes.

---

### 8.2 Medium Priority Findings

#### ARCH-004: Type Safety in DrawControl

**Severity: Medium**
**Category: Type Safety**
**File:** `src/components/draw-control.ts`

**Issue:** Multiple uses of `any` type with eslint-disable comments.

**Recommendation:** Define proper types for draw events.

---

#### ARCH-005: Missing Abstract Control Base

**Severity: Medium**
**Category: Open/Closed Principle**

**Issue:** Each control component has similar boilerplate code.

**Recommendation:** Create a generic control wrapper factory.

---

#### ARCH-006: Dynamic Property Access

**Severity: Medium**
**Category: Type Safety**
**File:** `src/maplibre/maplibre.ts`

**Issue:** Dynamic method invocation via string concatenation.

**Recommendation:** Use a mapping object for setters.

---

### 8.3 Low Priority Findings

#### ARCH-007: Large MapCallbacks Interface

**Severity: Low**
**Category: Interface Segregation**

**Recommendation:** Split into focused interfaces.

---

#### ARCH-008: Test Coverage

**Severity: Low**
**Category: Quality Assurance**

**Issue:** New components (DrawControl, MinimapControl) lack test files.

**Recommendation:** Add test files for new components.

---

## 9. Action Items Summary

### Immediate (This Sprint)
1. Refactor DrawControl to use useControl hook (ARCH-001)
2. Add type definitions for maplibre-gl-draw events (ARCH-004)

### Short-Term (Next 2 Sprints)
3. Split MinimapControl into modules (ARCH-002)
4. Create generic control factory utility (ARCH-005)
5. Add tests for new components (ARCH-008)

### Long-Term (Next Quarter)
6. Refactor Maplibre wrapper into focused classes (ARCH-003)
7. Split MapCallbacks interface (ARCH-007)
8. Replace dynamic property access with mapping (ARCH-006)

---

## 10. Conclusion

The react-bkoi-gl library has a solid architectural foundation based on established patterns from react-map-gl.

**Strengths:**
- Clean separation between React components and MapLibre GL JS
- Consistent use of React Context for state distribution
- Well-organized type system
- Proper lifecycle management
- No circular dependencies

**Areas for Improvement:**
- DrawControl pattern inconsistency
- MinimapControl and Maplibre class complexity
- Type safety in newer components
- Test coverage for new features

---

**Report Generated:** March 24, 2026
**Confidence Level:** High
