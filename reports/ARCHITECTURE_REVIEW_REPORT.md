# Architecture Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Review Date:** March 24, 2026
**Reviewer:** Architecture Analysis

---

## Executive Summary

### Architectural Health Assessment: GOOD (7.8/10)

The react-bkoi-gl library demonstrates a well-structured architecture that follows established patterns from react-map-gl. The codebase shows strong pattern consistency across most components, with clear separation of concerns and proper abstraction layers.

| Assessment Category | Score | Status |
|---------------------|-------|--------|
| Pattern Compliance | 8.5/10 | Good |
| SOLID Principles | 7.5/10 | Good |
| Type Safety | 8/10 | Good |
| Module Boundaries | 8/10 | Good |
| Maintainability | 7/10 | Moderate |
| Test Coverage | 7.5/10 | Good |

### Key Strengths
- Consistent control pattern using `useControl` hook
- Well-defined context hierarchy (MapContext, MountedMapsContext)
- Proper MapRef abstraction preventing React binding breakage
- Comprehensive type definitions
- Security-conscious implementations (SVG sanitization, URL validation)

### Key Concerns
- Large files (maplibre.ts: 589 lines, minimap-control.ts: 710 lines)
- Some components lack memo wrapping consistency
- DrawControl options shallow merge behavior
- Source/Layer components bypass React lifecycle patterns

---

## 1. Pattern Compliance Analysis

### 1.1 Control Pattern (Score: 9/10)

All control components consistently use the `useControl` hook pattern:

```
Pattern Structure:
+-----------------+
| Control Component|
+--------+--------+
         |
         v
+-----------------+
| useControl Hook |
+--------+--------+
         |
         v
+-----------------+
| MapContext      |
+-----------------+
```

**Compliant Controls:**

| Component | File | Pattern Compliance |
|-----------|------|-------------------|
| NavigationControl | `/src/components/navigation-control.ts` | Full |
| ScaleControl | `/src/components/scale-control.ts` | Full |
| FullscreenControl | `/src/components/fullscreen-control.ts` | Full |
| GeolocateControl | `/src/components/geolocate-control.ts` | Full |
| TerrainControl | `/src/components/terrain-control.ts` | Full |
| AttributionControl | `/src/components/attribution-control.ts` | Full |
| LogoControl | `/src/components/logo-control.ts` | Full |
| DrawControl | `/src/components/draw-control.ts` | Full |
| MinimapControl | `/src/components/minimap-control.ts` | Full |

**Pattern Implementation:**

```typescript
// Standard control pattern (navigation-control.ts, lines 15-27)
function _NavigationControl(props: NavigationControlProps) {
  const ctrl = useControl(({ mapLib }) => new mapLib.NavigationControl(props), {
    position: props.position,
  })

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style)
  }, [props.style])

  return null
}

export const NavigationControl: React.FC<NavigationControlProps> = memo(_NavigationControl)
```

### 1.2 Context Pattern (Score: 9/10)

**Context Hierarchy:**

```
MapProvider (MountedMapsContext)
    |
    +--- Map (MapContext)
            |
            +--- Controls (via useControl)
            +--- Marker (via useContext)
            +--- Popup (via useContext)
            +--- Source (via useContext)
            +--- Layer (via useContext)
```

**MapContext** (`/src/components/map.tsx`, lines 15-20):
```typescript
export type MapContextValue = {
  mapLib: MapLib
  map: MapRef
}

export const MapContext = React.createContext<MapContextValue>(null)
```

**MountedMapsContext** (`/src/components/use-map.tsx`, lines 7-13):
```typescript
type MountedMapsContextValue = {
  maps: { [id: string]: MapRef }
  onMapMount: (map: MapRef, id: string) => void
  onMapUnmount: (id: string) => void
}

export const MountedMapsContext = React.createContext<MountedMapsContextValue>(null)
```

**useMap Hook Pattern** (`/src/components/use-map.tsx`, lines 59-68):
```typescript
export function useMap(): MapCollection {
  const maps = useContext(MountedMapsContext)?.maps
  const currentMap = useContext(MapContext)

  const mapsWithCurrent = useMemo(() => {
    return { ...maps, current: currentMap?.map }
  }, [maps, currentMap])

  return mapsWithCurrent as MapCollection
}
```

### 1.3 MapRef Pattern (Score: 9/10)

The MapRef pattern properly protects React bindings by skipping dangerous methods:

**Protected Methods** (`/src/maplibre/create-ref.ts`, lines 5-26):
```typescript
const skipMethods = [
  'setMaxBounds', 'setMinZoom', 'setMaxZoom', 'setMinPitch', 'setMaxPitch',
  'setRenderWorldCopies', 'setProjection', 'setStyle',
  'addSource', 'removeSource', 'addLayer', 'removeLayer',
  'setLayerZoomRange', 'setFilter', 'setPaintProperty', 'setLayoutProperty',
  'setLight', 'setTerrain', 'setFog', 'remove',
] as const
```

This ensures that React-managed state cannot be corrupted by direct map method calls.

### 1.4 Component Lifecycle Pattern (Score: 7/10)

**Standard Pattern (Marker, Popup):**
```typescript
// marker.ts - follows proper lifecycle
const marker = useMemo(() => new mapLib.Marker(options), [])

useEffect(() => {
  // Setup
  marker.addTo(map.getMap())
  return () => marker.remove() // Cleanup
}, [])
```

**Non-Standard Pattern (Source, Layer):**

Source and Layer components use a render-phase side effect pattern:

```typescript
// source.ts, lines 120-127 - Pattern Concern
let source = map && map.style && map.getSource(id)
if (source) {
  updateSource(source, props, propsRef.current)  // Side effect in render
} else {
  source = createSource(map, id, props)
}
propsRef.current = props
```

**Impact:** This pattern works but violates React's rules about side effects in render. While it functions correctly due to the synchronous nature of the operations, it could cause issues with React's concurrent features in the future.

---

## 2. SOLID Principles Assessment

### 2.1 Single Responsibility Principle (SRP) - Score: 7/10

| Component | Responsibility | Lines | Assessment |
|-----------|---------------|-------|------------|
| Map | Lifecycle + Context | 155 | Good |
| Maplibre | Map wrapper | 589 | Too large |
| useControl | Control hook | 68 | Excellent |
| MinimapControl | Control + Minimap class | 710 | Too large |
| DrawControl | Draw control | 261 | Good |
| Source | Source management | 142 | Good |
| Layer | Layer management | 123 | Good |

**Violation: Maplibre class** (`/src/maplibre/maplibre.ts`)

The Maplibre class handles multiple responsibilities:
- Map initialization (lines 269-335)
- ViewState management (lines 396-414)
- Settings management (lines 421-432)
- Style management (lines 435-486)
- Event handling (lines 504-587)
- Map reuse/recycling (lines 212-267)

**Violation: Minimap class** (`/src/components/minimap-control.ts`)

The Minimap class handles:
- Container creation and styling (lines 292-384)
- Interaction configuration (lines 386-395)
- Toggle button management (lines 397-469)
- Responsive sizing (lines 471-526)
- Map synchronization (lines 643-694)

### 2.2 Open/Closed Principle (OCP) - Score: 9/10

The architecture is highly extensible:

1. **useControl Hook** allows easy addition of new controls without modifying core code
2. **MapLib interface** allows alternative map libraries
3. **Event callbacks** are all optional props

**Extension Point Example:**
```typescript
// Adding a new control requires only implementing the pattern
function _MyCustomControl(props: MyCustomControlProps) {
  const ctrl = useControl(
    ({ mapLib }) => new MyCustomMapLibControl(props),
    { position: props.position }
  )
  return null
}
```

### 2.3 Liskov Substitution Principle (LSP) - Score: 9/10

All control components are substitutable through the `IControl` interface:

```typescript
// types/lib.ts - all controls implement IControl
export type {
  IControl,
  ControlPosition,
  // ...
} from 'maplibre-gl'
```

### 2.4 Interface Segregation Principle (ISP) - Score: 8/10

Props interfaces are well-segregated:

```typescript
// Each control has its own props type
export type NavigationControlProps = NavigationControlOptions & {
  position?: ControlPosition
  style?: React.CSSProperties
}

export type ScaleControlProps = ScaleControlOptions & {
  unit?: string
  maxWidth?: number
  position?: ControlPosition
  style?: React.CSSProperties
}
```

**Minor Violation:** DrawControlProps could be further segregated:
```typescript
// draw-control.ts, lines 44-63 - many optional callbacks
export type DrawControlProps = DrawControlOptions & {
  position?: ControlPosition
  onDrawCreate?: (e: DrawEvent) => void
  onDrawDelete?: (e: DrawEvent) => void
  onDrawUpdate?: (e: DrawEvent) => void
  onDrawSelectionChange?: (e: DrawEvent) => void
  onDrawModeChange?: (e: DrawEvent) => void
  onDrawCombine?: (e: DrawEvent) => void
  onDrawUncombine?: (e: DrawEvent) => void
  onDrawRender?: (e: DrawEvent) => void
}
```

### 2.5 Dependency Inversion Principle (DIP) - Score: 8/10

Good abstraction through MapLib interface:

```typescript
// types/lib.ts, lines 54-84
export interface MapLib {
  supported?: (options: unknown) => boolean
  Map: { new (options: MapOptions): Map }
  Marker: { new (options: MarkerOptions): Marker }
  Popup: { new (options: PopupOptions): Popup }
  // ... all maplibre-gl constructors
}
```

Components depend on abstractions, not concrete implementations.

---

## 3. Issues Found

### 3.1 HIGH Impact Issues

#### Issue 1: Large Class Files
**Files:**
- `/src/maplibre/maplibre.ts` (589 lines)
- `/src/components/minimap-control.ts` (710 lines)

**Impact:** Maintainability, readability, testing difficulty

**Recommendation:** Split into focused modules:
- Maplibre -> MaplibreCore, ViewStateManager, StyleManager, EventManager
- Minimap -> MinimapCore, MinimapUI, MinimapSync

### 3.2 MEDIUM Impact Issues

#### Issue 2: Render-Phase Side Effects in Source/Layer
**Files:**
- `/src/components/source.ts` (lines 120-127)
- `/src/components/layer.ts` (lines 106-116)

**Impact:** Potential issues with React concurrent mode

**Recommendation:** Move to useEffect or useLayoutEffect

#### Issue 3: Inconsistent Memo Usage
**Files:**
- `/src/components/source.ts` - Not memoized
- `/src/components/layer.ts` - Not memoized

**Impact:** Unnecessary re-renders

**Recommendation:** Wrap with memo() for consistency

#### Issue 4: Shallow Merge in DrawControl Options
**File:** `/src/components/draw-control.ts` (lines 91-103)

```typescript
const options = useMemo<DrawControlOptions>(
  () => ({
    ...defaultDrawOptions,
    ...drawOptions,  // Shallow merge - loses default controls
  }),
  [/* deps */]
)
```

**Impact:** User-provided controls completely override defaults

**Recommendation:** Deep merge for nested objects like `controls`

### 3.3 LOW Impact Issues

#### Issue 5: Missing Dependency in ScaleControl
**File:** `/src/components/scale-control.ts` (lines 30-35)

```typescript
// Props update happens outside useEffect
if (props.maxWidth !== undefined && props.maxWidth !== prevProps.maxWidth) {
  ctrl.options.maxWidth = props.maxWidth
}
```

**Impact:** Updates happen during render phase

**Recommendation:** Move to useEffect

#### Issue 6: Type Assertion in Events
**File:** `/src/components/popup.ts` (lines 44-48)

```typescript
const onOpen = (e: maplibregl.MapMouseEvent) => {
  props.onOpen?.(e as unknown as PopupEvent)  // Double assertion
}
```

**Impact:** Type safety degradation

**Recommendation:** Create proper event type mappings

#### Issue 7: Global Counter Pattern
**Files:**
- `/src/components/source.ts` (line 21: `sourceCounter`)
- `/src/components/layer.ts` (line 80: `layerCounter`)

**Impact:** Potential for ID collisions in SSR scenarios

**Recommendation:** Use useId() hook or include component-specific prefix

---

## 4. Module Boundaries and Dependencies

### 4.1 Dependency Graph

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
    |
    +--- utils/
            +--- deep-equal.ts (independent)
            +--- transform.ts ---> types/internal, maplibre.ts
            +--- style-utils.ts ---> types/style-spec
            +--- set-globals.ts (independent)
```

### 4.2 Circular Dependency Check

No circular dependencies detected. The module structure is clean with unidirectional dependencies.

### 4.3 External Dependencies

```json
{
  "dependencies": {
    "@maplibre/maplibre-gl-style-spec": "^24.4.1",
    "maplibre-gl": "^5.15.0",
    "maplibre-gl-draw": "^1.6.9"
  },
  "peerDependencies": {
    "react": ">=16.3.0",
    "react-dom": ">=16.3.0"
  }
}
```

---

## 5. Type Safety Architecture

### 5.1 Type Organization

```
src/types/
    +--- lib.ts      -> MapLibre GL type re-exports
    +--- events.ts   -> Event type definitions
    +--- common.ts   -> ViewState, Point, LngLat, etc.
    +--- style-spec.ts -> Style specification types
    +--- internal.ts -> Internal types (TransformLike, Source implementations)
```

### 5.2 Type Safety Assessment

| Area | Score | Notes |
|------|-------|-------|
| Component Props | 9/10 | Well-typed with proper interfaces |
| Event Handlers | 8/10 | Some type assertions used |
| Generic Usage | 8/10 | Good use of generics in useControl |
| Export Types | 9/10 | All public types exported |

### 5.3 Type Safety Examples

**Good Pattern:**
```typescript
// use-control.ts - Generic constraint
export function useControl<T extends IControl>(
  onCreate: (context: MapContextValue) => T,
  opts?: ControlOptions
): T
```

**Area for Improvement:**
```typescript
// maplibre.ts - Multiple @ts-ignore comments
// @ts-ignore - accessing private _container property for reuse functionality
map._container = container
```

---

## 6. Recommendations for Improvement

### 6.1 High Priority

1. **Split Large Classes**
   - Refactor `Maplibre` class into focused modules
   - Extract `Minimap` class into separate files

2. **Fix Render-Phase Side Effects**
   - Move Source/Layer updates to useEffect
   ```typescript
   // Recommended pattern:
   useEffect(() => {
     if (source) {
       updateSource(source, props, propsRef.current)
     }
   }, [props])
   ```

### 6.2 Medium Priority

3. **Implement Deep Merge for DrawControl**
   ```typescript
   const options = useMemo<DrawControlOptions>(() => ({
     ...defaultDrawOptions,
     ...drawOptions,
     controls: {
       ...defaultDrawOptions.controls,
       ...drawOptions.controls,
     },
   }), [drawOptions])
   ```

4. **Add memo() to Source and Layer**
   ```typescript
   export const Source = memo(_Source)
   export const Layer = memo(_Layer)
   ```

5. **Use React.useId() for Source/Layer IDs**
   ```typescript
   const generatedId = useId()
   const id = useMemo(() => props.id || `jsx-source-${generatedId}`, [props.id, generatedId])
   ```

### 6.3 Low Priority

6. **Improve Event Type Mappings**
   - Create proper type guards for event types
   - Remove double type assertions

7. **Add JSDoc Comments**
   - Document complex functions in maplibre.ts
   - Add examples to control components

---

## 7. Long-Term Implications

### 7.1 Maintainability

**Positive:**
- Consistent patterns make onboarding easier
- Clear separation between React and MapLibre concerns
- Well-defined type contracts

**Concerns:**
- Large files will become harder to maintain as features are added
- Technical debt in Source/Layer components may cause issues with future React versions

### 7.2 Scalability

**Positive:**
- Control pattern easily supports new controls
- Context pattern supports multiple maps

**Concerns:**
- Maplibre class may need significant refactoring for new features
- Minimap class complexity will grow with new options

### 7.3 Testing

**Current State:**
- 26 test files with good coverage
- Tests for DrawControl and MinimapControl added
- Mock patterns are consistent

**Recommendations:**
- Add integration tests for context interactions
- Add visual regression tests for controls
- Consider adding performance tests for map operations

---

## 8. Conclusion

The react-bkoi-gl library demonstrates solid architectural principles with consistent patterns across components. The control pattern using the `useControl` hook is well-implemented, and the context hierarchy provides clean separation of concerns.

### Summary of Findings

| Category | Status | Action Required |
|----------|--------|-----------------|
| Pattern Compliance | Good | Minor fixes to Source/Layer |
| SOLID Principles | Good | Refactor large classes |
| Type Safety | Good | Reduce type assertions |
| Module Boundaries | Excellent | None |
| Maintainability | Moderate | Split large files |

### Priority Action Items

1. **Immediate:** None - architecture is stable
2. **Short-term:** Split Maplibre and Minimap classes
3. **Long-term:** Refactor Source/Layer to proper patterns

---

**Report Generated:** March 24, 2026
**Architecture Review Version:** 2.0
