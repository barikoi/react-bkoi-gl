# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`react-bkoi-gl` is a React component library that wraps MapLibre GL JS to provide React components for Barikoi Maps (a Bangladesh-focused mapping service). It follows a similar architecture to `react-map-gl`.

## Commands

```bash
npm run typecheck      # TypeScript validation
npm run build          # Build production bundle (tsup + CSS processing)
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm test               # Run typecheck + Jest tests
npm run coverage       # Run tests with coverage report
```

## Architecture

### Core Components

The library is organized around a `Map` component that provides context to all child components:

```
src/
├── components/
│   ├── map.tsx           # Core Map component, provides MapContext
│   ├── use-map.tsx       # MapProvider context and useMap() hook
│   ├── use-control.ts    # useControl hook for map controls
│   ├── marker.ts         # Marker component
│   ├── popup.ts          # Popup component
│   ├── source.ts         # Source component (GeoJSON, vector, etc.)
│   ├── layer.ts          # Layer component for rendering data
│   └── *-control.ts      # Various map controls (Navigation, Fullscreen, etc.)
├── maplibre/
│   ├── maplibre.ts       # MapLibre wrapper class managing map lifecycle
│   └── create-ref.ts     # Creates MapRef exposing safe map methods
├── types/                # TypeScript type definitions
└── utils/                # Helper utilities
```

### Context Pattern

- `MapContext`: Provides `{ mapLib, map }` to all children - used by Marker, Popup, Layer, Source, and controls
- `MountedMapsContext`: Tracks all mounted maps by ID - used by `useMap()` hook

### MapRef Pattern

The `MapRef` type (from `create-ref.ts`) exposes most MapLibre map methods but explicitly skips methods that would break React bindings:
- `setMaxBounds`, `setMinZoom`, `setMaxZoom`, `setMinPitch`, `setMaxPitch`
- `setRenderWorldCopies`, `setProjection`, `setStyle`
- `addSource`, `removeSource`, `addLayer`, `removeLayer`
- `setLayerZoomRange`, `setFilter`, `setPaintProperty`, `setLayoutProperty`
- `setLight`, `setTerrain`, `setFog`, `remove`

Use `map.getMap()` to access the raw MapLibre instance if needed.

### Component Lifecycle

Components like `Source`, `Layer`, `Marker`, and `Popup`:
1. Access the map via `useContext(MapContext)`
2. Create their MapLibre counterpart in `useMemo`
3. Add to map in `useEffect` (cleanup on unmount)
4. Update props reactively via additional effects

### Testing

- Tests located in `__tests__/` directory
- MapLibre GL is mocked via `__tests__/mocks/maplibre-gl.js`
- Run specific test: `npx jest <test-file-pattern>`

### Git Workflow

- Development happens on `dev` branch
- Use conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `map`, `marker`, `popup`, `layer`, `source`, `controls`, `hooks`, `utils`

### Local Package Testing

Do NOT use `npm link`. Use the tarball method:
```bash
npm run build && npm pack
npm install /path/to/react-bkoi-gl-*.tgz
```

## Key Files

- `src/exports-maplibre-gl.ts`: Main exports - all public components and types
- `src/maplibre/maplibre.ts`: Core wrapper handling props-to-map synchronization, event handling, and view state management
- `src/components/map.tsx`: React Map component with context providers and auto-included LogoControl/AttributionControl
