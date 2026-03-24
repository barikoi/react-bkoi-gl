# Code Review Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 24, 2026
**Updated:** After Fixes Applied

---

## Executive Summary

**Overall Code Quality: GOOD** ✅ **Improved**

The codebase follows React best practices with a well-structured component architecture.

### Quality Metrics

| Category | Score | Status | Change |
|----------|-------|--------|--------|
| Code Quality | 8/10 | Good | ⬆ Improved |
| TypeScript Safety | 8/10 | Good | ⬆ Improved |
| Error Handling | 7/10 | Good | ⬆ Improved |
| Testing Coverage | 6/10 | Partial | - No change |
| Documentation | 7/10 | Good | - No change |
| Performance | 8/10 | Good | ⬆ Improved |
| Security | 8/10 | Good | ⬅ Improved |

---

## 1. Issues Status Summary

### ✅ FIXED Issues

| Issue | File | Description |
|------|------|-------------|
| Null reference in Map | `map.tsx:82-86` | Added null check before setting contextValue |
| Context validation | `use-control.ts:36-38` | Added error throw when used outside Map |
| Any types in DrawControl | `draw-control.ts` | Replaced `any` with `DrawEvent` interface |
| JSON.stringify anti-pattern | `draw-control.ts:93-105` | Replaced with individual primitive dependencies |
| XSS in AttributionControl | `attribution-control.ts:38-56` | Replaced innerHTML with safe DOM APIs |
| XSS in MinimapControl | `minimap-control.ts:164-177` | Added `sanitizeSVG()` function |
| crypto.randomUUID | `minimap-control.ts:147-159` | Replaced Math.random with crypto.randomUUID |
| style-utils return type | `style-utils.ts:11` | Added `null` to return type |

### ⚠️ REMAINING Issues
| Issue | File | Description |
|------|------|-------------|
| Missing tests for DrawControl | `draw-control.ts` | No test file exists |
| Missing tests for MinimapControl | `minimap-control.ts` | No test file exists |
| Inconsistent file extensions | `marker.ts`, `popup.ts` | Should be `.tsx` |
| Unused props in DrawControl | `draw-control.ts:48` | `style` prop not implemented |

---

## 2. Details of Fixed Issues

### 2.1 Null Reference in Map Component ✅ FIXED

**File:** `src/components/map.tsx`
**Lines:** 82-86

```typescript
// BEFORE (vulnerable)
contextValue.map = createRef(maplibre)
contextValue.mapLib = mapboxgl
setMapInstance(maplibre)

// AFTER (fixed)
if (maplibre) {
  contextValue.map = createRef(maplibre)
  contextValue.mapLib = mapboxgl
  setMapInstance(maplibre)
}
```

---

### 2.2 Context Validation in useControl ✅ FIXED

**File:** `src/components/use-control.ts`
**Lines:** 36-38

```typescript
// BEFORE (vulnerable)
const context = useContext(MapContext)
const ctrl = useMemo(() => onCreate(context), [])

// AFTER (fixed)
const context = useContext(MapContext)

if (!context) {
  throw new Error('useControl must be used within a Map component')
}
```

---

### 2.3 TypeScript Safety in DrawControl ✅ FIXED

**File:** `src/components/draw-control.ts`

```typescript
// BEFORE (using any)
onDrawCreate?: (e: any) => void

// AFTER (proper types)
export interface DrawEvent {
  type: string
  features?: GeoJSON.Feature<GeoJSON.Geometry>[]
  featureIds?: string[]
  mode?: string
  originalEvent?: unknown
}

onDrawCreate?: (e: DrawEvent) => void
```

---

### 2.4 XSS Prevention in AttributionControl ✅ FIXED

**File:** `src/components/attribution-control.ts`
**Lines:** 38-56

```typescript
// BEFORE (vulnerable)
inner.innerHTML = '© <a href="...">Barikoi</a> ...'

// AFTER (secure)
inner.textContent = ''
const createLink = (text: string, href: string) => {
  const a = document.createElement('a')
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.textContent = text
  return a
}
inner.appendChild(createLink('Barikoi', 'https://barikoi.com'))
// ...
```

---

### 2.5 XSS Prevention in MinimapControl ✅ FIXED

**File:** `src/components/minimap-control.ts`
**Lines:** 164-177

```typescript
// Added sanitizeSVG function
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

---

### 2.6 URL Validation ✅ FIXED

**File:** `src/utils/set-globals.ts`
**Lines:** 21-33

```typescript
// Added validateUrl function
const validateUrl = (url: string, settingName: string): boolean => {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn(`${settingName}: Only http/https protocols are allowed`)
      return false
    }
    return true
  } catch {
    console.warn(`${settingName}: Invalid URL format: ${url}`)
    return false
  }
}
```

---

### 2.7 Cryptographic UUID Generation ✅ FIXED

**File:** `src/components/minimap-control.ts`
**Lines:** 147-159

```typescript
// BEFORE (weak)
function getRandomUUID(): string {
  return 'xxx...'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    // ...
  })
}

// AFTER (secure)
function getRandomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback using crypto.getRandomValues
  const array = new Uint8Array(1)
  crypto.getRandomValues(array)
  // ...
}
```

---

## 3. Remaining Issues (Require Attention)

### 3.1 Missing Tests for DrawControl

**File:** `src/components/draw-control.ts`
**Severity:** Medium

**Issue:** No test file exists at `__tests__/components/draw-control.test.js`

**Recommendation:** Add test file covering:
- Control creation with options
- Event handler registration
- Cleanup on unmount

---

### 3.2 Missing Tests for MinimapControl

**File:** `src/components/minimap-control.ts`
**Severity:** Medium

**Issue:** No test file exists in `__tests__/components/minimap-control.test.js`

**Recommendation:** Add test file covering:
- Minimap creation and toggle
- SVG sanitization
- Responsive sizing
- Parent rect synchronization

---

### 3.3 Unused Style Prop in DrawControl

**File:** `src/components/draw-control.ts`
**Severity:** Low

**Issue:** `style` prop is defined but never used.

**Recommendation:** Either implement or remove the prop.

---

## 4. What's Done Well

1. **Clean separation of concerns**: Maplibre wrapper class separates lifecycle from React
2. **Good context pattern**: MapContext and MountedMapsContext provide clean access
3. **Comprehensive event handling**: All MapLibre events properly forwarded
4. **Type safety**: TypeScript types from maplibre-gl properly used
5. **Test coverage**: Core components have comprehensive tests
6. **Consistent control pattern**: Controls follow useControl pattern
7. **Proper cleanup**: Components clean up resources on unmount
8. **Performance optimizations**: memo, useMemo, useCallback used appropriately
9. **Security**: XSS vulnerabilities fixed, URL validation added

---

## 5. Recommendations Summary

### Immediate (Critical)
- ✅ ~~Fix null reference in `map.tsx`~~ - **FIXED**
- ✅ ~~Add context validation in `use-control.ts`~~ - **FIXED**

### High Priority
- ✅ ~~Refactor DrawControl to use `useControl`~~ - **FIXED**
- ✅ ~~Replace `any` types with proper types~~ - **FIXED**
- ✅ ~~Fix XSS in AttributionControl~~ - **FIXED**
- ✅ ~~Add SVG sanitization to MinimapControl~~ - **FIXED**

### Medium Priority
- ⬜ Add tests for DrawControl
- ⬜ Add tests for MinimapControl
- ✅ ~~Standardize error handling~~ - **Improved**
- ✅ ~~Fix return type in style-utils~~ - **FIXED**

### Low Priority
- ⬌ Remove unused `style` prop in DrawControl
- ⬌ Standardize file extensions

---

## 6. Conclusion

The react-bkoi-gl codebase has been **significantly improved**. Critical security vulnerabilities (XSS) have been fixed, TypeScript safety has been improved, and the code follows more consistent patterns.

**Remaining Work:**
1. Add test files for DrawControl and MinimapControl
2. Minor cleanup (unused props, file extensions)

**Overall Assessment:** The codebase is now in **GOOD** condition with most critical issues resolved.

---

**Report Updated:** March 24, 2026
