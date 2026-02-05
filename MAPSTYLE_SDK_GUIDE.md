# MapStyle SDK Guide

A comprehensive guide for using the Barikoi MapStyle SDK with `react-bkoi-gl` in different projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Available Map Styles](#available-map-styles)
4. [Basic Usage](#basic-usage)
5. [Advanced Usage](#advanced-usage)
6. [Integration Examples](#integration-examples)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)

---

## Overview

The MapStyle SDK provides convenient constants for accessing Barikoi's predefined map styles. Instead of memorizing complex URLs, you can use simple, readable constants.

**Key Benefits:**
- Type-safe style URLs
- Auto-complete support in IDEs
- Centralized style management
- Easy switching between map styles

---

## Installation

### Install the Package

```bash
npm install react-bkoi-gl
```

Or with yarn:

```bash
yarn add react-bkoi-gl
```

### Peer Dependencies

Ensure you have the required peer dependencies installed:

```bash
npm install react react-dom
```

---

## Available Map Styles

The SDK provides the following predefined map styles:

| Style Constant | Style Name | Best Use Case |
|---------------|-----------|---------------|
| `MapStyle.LIGHT` | Barikoi Light | Dashboards, web apps, default interface |
| `MapStyle.DARK` | Barikoi Dark Mode | Admin panels, logistics, dark UIs |
| `MapStyle.GREEN` | Barikoi Green | Eco apps, agriculture, tourism |
| `MapStyle.PLANET` | Planet Map | Real estate, urban planning |
| `MapStyle.OSM.LIBERTY` | OSM Liberty | Open-data projects, minimal design |

---

## Basic Usage

### 1. Import MapStyle

```tsx
import { Map, MapStyle } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';
```

### 2. Use with Map Component

The API key must be appended to the style URL as a query parameter:

```tsx
function App() {
  const apiKey = 'YOUR_BARIKOI_API_KEY';

  return (
    <Map
      mapStyle={`${MapStyle.LIGHT}?key=${apiKey}`}
      initialViewState={{
        longitude: 90.36402,
        latitude: 23.823731,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

### 3. Helper Function for Style URLs

Create a helper function to append the API key:

```tsx
import { MapStyle } from 'react-bkoi-gl';

const getMapStyle = (styleUrl: string, apiKey: string) => {
  return `${styleUrl}?key=${apiKey}`;
};

// Usage
<Map
  mapStyle={getMapStyle(MapStyle.DARK, apiKey)}
  initialViewState={/* ... */}
  style={{ width: '100%', height: '100vh' }}
/>
```

---

## Advanced Usage

### Dynamic Style Switching

Create a style switcher component:

```tsx
import { useState } from 'react';
import { Map, MapStyle } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

function App() {
  const [currentStyle, setCurrentStyle] = useState(MapStyle.LIGHT);
  const apiKey = 'YOUR_BARIKOI_API_KEY';

  return (
    <div>
      <div className="style-switcher">
        <button onClick={() => setCurrentStyle(MapStyle.LIGHT)}>Light</button>
        <button onClick={() => setCurrentStyle(MapStyle.DARK)}>Dark</button>
        <button onClick={() => setCurrentStyle(MapStyle.GREEN)}>Green</button>
        <button onClick={() => setCurrentStyle(MapStyle.PLANET)}>Planet</button>
        <button onClick={() => setCurrentStyle(MapStyle.OSM.LIBERTY)}>OSM Liberty</button>
      </div>

      <Map
        mapStyle={`${currentStyle}?key=${apiKey}`}
        initialViewState={{
          longitude: 90.36402,
          latitude: 23.823731,
          zoom: 13,
        }}
        style={{ width: '100%', height: '90vh' }}
      />
    </div>
  );
}
```

### Custom Style Configuration

Create a style configuration object:

```tsx
import { MapStyle } from 'react-bkoi-gl';

const styleConfig = {
  dashboard: MapStyle.LIGHT,
  adminPanel: MapStyle.DARK,
  ecoTracking: MapStyle.GREEN,
  realEstate: MapStyle.PLANET,
  openData: MapStyle.OSM.LIBERTY,
};

function MapView({ useCase, apiKey }: { useCase: keyof typeof styleConfig; apiKey: string }) {
  return (
    <Map
      mapStyle={`${styleConfig[useCase]}?key=${apiKey}`}
      // ... other props
    />
  );
}
```

### TypeScript Support

The SDK exports `MapStyleType` for type safety:

```tsx
import { MapStyle, type MapStyleType } from 'react-bkoi-gl';

const selectedStyle: MapStyleType = MapStyle.DARK;

// Function that accepts only valid MapStyle values
function setMapStyle(style: MapStyleType) {
  console.log(`Setting style to: ${style}`);
}

setMapStyle(MapStyle.LIGHT); // OK
setMapStyle('invalid-url'); // TypeScript error
```

---

## Integration Examples

### React (Vite)

```tsx
// src/App.tsx
import { Map, MapStyle } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

function App() {
  const apiKey = import.meta.env.VITE_BARIKOI_API_KEY;

  return (
    <Map
      mapStyle={`${MapStyle.DARK}?key=${apiKey}`}
      initialViewState={{
        longitude: 90.36402,
        latitude: 23.823731,
        zoom: 13,
      }}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default App;
```

### Next.js

```tsx
// app/map/page.tsx
'use client';

import { Map, MapStyle } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_BARIKOI_API_KEY;

  return (
    <Map
      mapStyle={`${MapStyle.GREEN}?key=${apiKey}`}
      initialViewState={{
        longitude: 90.36402,
        latitude: 23.823731,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

### Create React App

```tsx
// src/App.js
import React from 'react';
import { Map, MapStyle } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

function App() {
  const apiKey = process.env.REACT_APP_BARIKOI_API_KEY;

  return (
    <Map
      mapStyle={`${MapStyle.PLANET}?key=${apiKey}`}
      initialViewState={{
        longitude: 90.36402,
        latitude: 23.823731,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}

export default App;
```

### With Additional Controls

```tsx
import {
  Map,
  MapStyle,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
} from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

function MapWithControls() {
  const apiKey = 'YOUR_API_KEY';

  return (
    <Map
      mapStyle={`${MapStyle.OSM.LIBERTY}?key=${apiKey}`}
      initialViewState={{
        longitude: 90.36402,
        latitude: 23.823731,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Marker longitude={90.36402} latitude={23.823731} color="red" />
      <Popup longitude={90.36402} latitude={23.823731}>
        <div>
          <h3>Dhaka</h3>
          <p>Capital of Bangladesh</p>
        </div>
      </Popup>
      <NavigationControl position="top-right" />
      <FullscreenControl position="top-right" />
      <ScaleControl position="bottom-left" />
    </Map>
  );
}
```

---

## API Reference

### MapStyle Object

```typescript
const MapStyle = {
  LIGHT: string,
  DARK: string,
  GREEN: string,
  PLANET: string,
  OSM: {
    LIBERTY: string,
  },
}
```

### MapStyleType

Type union of all available style URLs:

```typescript
type MapStyleType =
  | "https://map.barikoi.com/styles/barikoi-light/style.json"
  | "https://map.barikoi.com/styles/barikoi-dark-mode/style.json"
  | "https://map.barikoi.com/styles/barkoi_green/style.json"
  | "https://map.barikoi.com/styles/planet_map/style.json"
  | "https://map.barikoi.com/styles/osm-liberty/style.json";
```

---

## Best Practices

### 1. Environment Variables for API Keys

Store your API key in environment variables:

```bash
# .env.local
VITE_BARIKOI_API_KEY=your_actual_api_key_here
```

```tsx
const apiKey = import.meta.env.VITE_BARIKOI_API_KEY;
```

### 2. Create a Helper Function

Make a reusable helper to append the API key:

```tsx
// utils/mapHelper.ts
import { MapStyle } from 'react-bkoi-gl';

export const getMapStyle = (styleUrl: string, apiKey: string) => {
  return `${styleUrl}?key=${apiKey}`;
};

// Usage
import { MapStyle } from 'react-bkoi-gl';
import { getMapStyle } from './utils/mapHelper';

<Map
  mapStyle={getMapStyle(MapStyle.DARK, apiKey)}
  // ... other props
/>
```

### 3. Centralize Style Configuration

Create a dedicated configuration file:

```tsx
// config/mapStyles.ts
import { MapStyle } from 'react-bkoi-gl';

export const MAP_STYLES = {
  DEFAULT: MapStyle.LIGHT,
  DARK_MODE: MapStyle.DARK,
  ECO: MapStyle.GREEN,
} as const;

export const getStyledMapUrl = (styleUrl: string, apiKey: string) => {
  return `${styleUrl}?key=${apiKey}`;
};
```

### 4. Style Selection Based on Context

```tsx
function MapView({ theme, useCase, apiKey }: {
  theme: 'light' | 'dark';
  useCase: 'eco' | 'urban';
  apiKey: string;
}) {
  const getStyle = () => {
    if (useCase === 'eco') return MapStyle.GREEN;
    return theme === 'dark' ? MapStyle.DARK : MapStyle.LIGHT;
  };

  return <Map mapStyle={`${getStyle()}?key=${apiKey}`} {...otherProps} />;
}
```

### 5. Custom Style Namespacing

```tsx
// styles/index.ts
import { MapStyle } from 'react-bkoi-gl';

export const APP_MAP_STYLES = {
  DASHBOARD: MapStyle.LIGHT,
  ANALYTICS: MapStyle.DARK,
  ENVIRONMENTAL: MapStyle.GREEN,
  PROPERTY: MapStyle.PLANET,
  COMMUNITY: MapStyle.OSM.LIBERTY,
};

// Helper to create styled URL
export const createMapStyle = (styleUrl: string, apiKey: string) => {
  return `${styleUrl}?key=${apiKey}`;
};
```

---

## Troubleshooting

### Issue: Map not loading with MapStyle constant

**Solution:** Ensure you're appending the API key to the style URL:

```tsx
// Correct
<Map
  mapStyle={`${MapStyle.LIGHT}?key=${apiKey}`}
  // ... other props
/>

// Incorrect - missing API key
<Map
  mapStyle={MapStyle.LIGHT}
  // ... other props
/>
```

### Issue: TypeScript errors with MapStyle

**Solution:** Import the `MapStyleType` for proper typing:

```tsx
import { MapStyle, type MapStyleType } from 'react-bkoi-gl';
```

### Issue: Styles not applying

**Solution:** Ensure you import the CSS:

```tsx
import 'react-bkoi-gl/styles';
```

### Issue: "Property 'accessToken' does not exist" error

**Solution:** The Map component doesn't have an `accessToken` prop. Append the API key to the mapStyle URL instead:

```tsx
// Incorrect
<Map mapStyle={MapStyle.DARK} accessToken={apiKey} />

// Correct
<Map mapStyle={`${MapStyle.DARK}?key=${apiKey}`} />
```

---

## Getting an API Key

To use Barikoi maps:

1. Register at [Barikoi Developer Dashboard](https://developer.barikoi.com/register)
2. Verify your phone number
3. Claim your API key
4. Use it in your application

---

## Additional Resources

- [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)
- [react-bkoi-gl GitHub Repository](https://github.com/barikoi/react-bkoi-gl)
- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [LOCAL_TESTING.md](./LOCAL_TESTING.md) - Local development guide

---

## Version History

| Version | Changes |
|---------|---------|
| 2.0.1+ | Added MapStyle SDK with predefined constants |
