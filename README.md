<h1 align="center">react-bkoi-gl | <a href="https://docs.barikoi.com/npm/npm-intro">Docs</a></h1>

<p align="center">
  <a href="https://www.npmjs.com/package/react-bkoi-gl"><img src="https://img.shields.io/npm/v/react-bkoi-gl.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/react-bkoi-gl"><img src="https://img.shields.io/npm/dw/react-bkoi-gl" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/package/react-bkoi-gl"><img src="https://img.shields.io/bundlephobia/min/react-bkoi-gl" alt="Bundle Size"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/react-bkoi-gl" alt="Node.js Version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

## Description

`react-bkoi-gl` is a suite of [React](http://facebook.github.io/react/) components that provides a React API for [Barikoi Maps](https://docs.barikoi.com/docs/maps-api). Built on top of [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), it offers high-performance, customizable map rendering with full TypeScript support.

Powered by <a href="https://barikoi.com/">Barikoi - Maps for Businesses</a>

## Features

- High-performance map rendering using WebGL
- Easy integration with React and Next.js
- Customizable map controls and interactions
- Drawing tools for polygons, lines, and points
- Minimap control for navigation
- Support for GeoJSON, vector tiles, and raster sources
- Full TypeScript support
- Lightweight and optimized for production

## Installation

Using `react-bkoi-gl` requires `react >= 16.3`.

```bash
npm install react-bkoi-gl
```

Or via yarn:

```bash
yarn add react-bkoi-gl
```

Import styles in your application:

```javascript
import "react-bkoi-gl/styles";
```

## Get Barikoi API Key

To access Barikoi's API services, you need to:

1. Register on [Barikoi Developer Dashboard](https://developer.barikoi.com/register)
2. Verify with your phone number
3. Claim your API key

## Quick Start

```tsx
import { Map, Marker, Popup, NavigationControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

const BARIKOI_API_KEY = 'YOUR_BARIKOI_API_KEY';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${BARIKOI_API_KEY}`}
        initialViewState={{
          longitude: 90.3938010872331,
          latitude: 23.821600277500405,
          zoom: 12
        }}
      >
        <Marker longitude={90.3938010872331} latitude={23.821600277500405} color="red" />
        <Popup longitude={90.3938010872331} latitude={23.821600277500405}>
          Hello, Barikoi!
        </Popup>
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
}
```

---

## Components

| Component | Description |
|-----------|-------------|
| [`Map`](#map-component) | Core map component. Must be the parent of all other components. |
| [`Marker`](#marker-component) | Displays a marker at specified coordinates. |
| [`Popup`](#popup-component) | Displays a popup with custom content. |
| [`Source`](#source-component) | Defines a data source (GeoJSON, vector, raster). |
| [`CanvasSource`](#canvas-source-component) | Canvas-based data source for custom overlays. |
| [`Layer`](#layer-component) | Renders data from a source on the map with interactive events. |
| [`NavigationControl`](#navigation-control) | Zoom and rotation controls. |
| [`FullscreenControl`](#fullscreen-control) | Toggle fullscreen mode. |
| [`GeolocateControl`](#geolocate-control) | Center map on user's location. |
| [`ScaleControl`](#scale-control) | Display a scale bar. |
| [`TerrainControl`](#terrain-control) | Add terrain visualization. |
| [`DrawControl`](#draw-control) | Drawing tools for shapes. |
| [`GlobeControl`](#globe-control) | Toggle between 2D map and 3D globe view. |
| [`MinimapControl`](#minimap-control) | Minimap for navigation. |
| [`useMap`](#usemap-hook) | Hook to access map instance. |
| [`useControl`](#usecontrol-hook) | Hook for custom controls. |

---

### Map Component

The core component that renders a Barikoi map. All other components must be children of `Map`.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mapStyle` | `string \| StyleSpecification` | Required | Map style URL or style object |
| `initialViewState` | `object` | - | Initial view state (longitude, latitude, zoom, etc.) |
| `viewState` | `object` | - | Controlled view state |
| `mapLib` | `MapLib \| Promise<MapLib>` | - | Custom map library instance |
| `reuseMaps` | `boolean` | `false` | Reuse map instances for performance |
| `id` | `string` | - | Container element ID |
| `style` | `CSSProperties` | - | Container CSS styles |
| `children` | `ReactNode` | - | Child components |
| `onClick` | `(e: MapLayerMouseEvent) => void` | - | Click handler |
| `onLoad` | `(e: MapLibreEvent) => void` | - | Map load handler |
| `onMoveEnd` | `(e: ViewStateChangeEvent) => void` | - | Move end handler |
| `onZoomEnd` | `(e: ViewStateChangeEvent) => void` | - | Zoom end handler |
| `onError` | `(e: ErrorEvent) => void` | - | Error handler |

And all [MapLibre Map options](https://maplibre.org/maplibre-gl-js/docs/API/types/MapOptions/).

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, MapRef } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useRef } from 'react';

function MapExample() {
  const mapRef = useRef<MapRef>(null);

  const handleMoveEnd = (e) => {
    const map = mapRef.current?.getMap();
    if (map) {
      console.log('Center:', map.getCenter());
      console.log('Zoom:', map.getZoom());
    }
  };

  return (
    <Map
      ref={mapRef}
      mapStyle="https://map.barikoi.com/styles/osm-liberty/style.json?key=YOUR_API_KEY"
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12,
        pitch: 0,
        bearing: 0
      }}
      style={{ width: '100%', height: '100vh' }}
      doubleClickZoom={false}
      dragRotate={true}
      onMoveEnd={handleMoveEnd}
    >
      {/* Child components go here */}
    </Map>
  );
}
```

</details>

---

### Marker Component

Displays a marker on the map at specified coordinates.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `longitude` | `number` | Required | Longitude of the marker |
| `latitude` | `number` | Required | Latitude of the marker |
| `color` | `string` | - | Marker color |
| `draggable` | `boolean` | `false` | Enable dragging |
| `offset` | `[number, number]` | - | Pixel offset |
| `anchor` | `string` | `'center'` | Marker anchor position |
| `scale` | `number` | `1` | Marker scale |
| `rotation` | `number` | `0` | Rotation in degrees |
| `rotationAlignment` | `string` | `'auto'` | Rotation alignment mode |
| `pitchAlignment` | `string` | `'auto'` | Pitch alignment mode |
| `popup` | `Popup` | - | Popup to show on click |
| `onClick` | `(e: MarkerEvent) => void` | - | Click handler |
| `onDragStart` | `(e: MarkerDragEvent) => void` | - | Drag start handler |
| `onDrag` | `(e: MarkerDragEvent) => void` | - | Drag handler |
| `onDragEnd` | `(e: MarkerDragEvent) => void` | - | Drag end handler |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, Marker } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useState } from 'react';

function MarkerExample() {
  const [marker, setMarker] = useState({
    lng: 90.3938,
    lat: 23.8216
  });

  const onDragEnd = (e) => {
    setMarker({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    });
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* Simple marker */}
      <Marker longitude={90.3938} latitude={23.8216} color="red" />

      {/* Draggable marker */}
      <Marker
        longitude={marker.lng}
        latitude={marker.lat}
        color="blue"
        draggable
        onDragEnd={onDragEnd}
      />

      {/* Custom marker with React children */}
      <Marker longitude={90.40} latitude={23.83}>
        <div style={{
          backgroundColor: '#fff',
          padding: '5px 10px',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}>
          Custom Marker
        </div>
      </Marker>
    </Map>
  );
}
```

</details>

---

### Popup Component

Displays a popup with custom content at specified coordinates.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `longitude` | `number` | Required | Longitude of the popup |
| `latitude` | `number` | Required | Latitude of the popup |
| `anchor` | `string` | - | Popup anchor position |
| `offset` | `number \| [number, number]` | - | Pixel offset |
| `className` | `string` | - | CSS class name |
| `maxWidth` | `string` | `'240px'` | Maximum width |
| `closeButton` | `boolean` | `true` | Show close button |
| `closeOnClick` | `boolean` | `true` | Close on map click |
| `onOpen` | `() => void` | - | Open handler |
| `onClose` | `() => void` | - | Close handler |
| `children` | `ReactNode` | - | Popup content |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, Marker, Popup } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useState } from 'react';

function PopupExample() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* Standalone popup */}
      {showPopup && (
        <Popup
          longitude={90.3938}
          latitude={23.8216}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          <div>
            <h3>Dhaka</h3>
            <p>Capital of Bangladesh</p>
          </div>
        </Popup>
      )}

      {/* Marker with attached popup */}
      <Marker longitude={90.40} latitude={23.83} color="red">
        <Popup>
          <div>Popup attached to marker</div>
        </Popup>
      </Marker>
    </Map>
  );
}
```

</details>

---

### Source Component

Defines a data source for the map. Supports GeoJSON, vector tiles, raster tiles, image, and video sources.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique source identifier |
| `type` | `string` | Source type: `'geojson'`, `'vector'`, `'raster'`, `'image'`, `'video'` |
| `data` | `object \| string` | GeoJSON data or URL (for geojson type) |
| `url` | `string` | Tile URL (for vector/raster) |
| `tiles` | `string[]` | Tile URLs array |
| `tileSize` | `number` | Tile size in pixels |
| `coordinates` | `array` | Image coordinates (for image type) |
| `children` | `ReactNode` | Layer components using this source |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, Source, Layer } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function SourceExample() {
  const geojsonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Point A' },
        geometry: {
          type: 'Point',
          coordinates: [90.3938, 23.8216]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Point B' },
        geometry: {
          type: 'Point',
          coordinates: [90.40, 23.83]
        }
      }
    ]
  };

  const lineData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [90.3938, 23.8216],
        [90.40, 23.83],
        [90.41, 23.84]
      ]
    }
  };

  const polygonData = {
    type: 'Feature',
    properties: { name: 'Polygon Area' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [90.39, 23.82],
        [90.41, 23.82],
        [90.41, 23.84],
        [90.39, 23.84],
        [90.39, 23.82]
      ]]
    }
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.40,
        latitude: 23.83,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* GeoJSON point source */}
      <Source id="points" type="geojson" data={geojsonData}>
        <Layer
          id="points-layer"
          type="circle"
          paint={{
            'circle-radius': 10,
            'circle-color': '#007cbf'
          }}
        />
      </Source>

      {/* GeoJSON line source */}
      <Source id="line" type="geojson" data={lineData}>
        <Layer
          id="line-layer"
          type="line"
          paint={{
            'line-width': 3,
            'line-color': '#ff0000'
          }}
        />
      </Source>

      {/* GeoJSON polygon source */}
      <Source id="polygon" type="geojson" data={polygonData}>
        <Layer
          id="polygon-fill"
          type="fill"
          paint={{
            'fill-color': '#088',
            'fill-opacity': 0.4
          }}
        />
        <Layer
          id="polygon-outline"
          type="line"
          paint={{
            'line-color': '#000',
            'line-width': 2
          }}
        />
      </Source>

      {/* Raster tile source */}
      <Source
        id="satellite"
        type="raster"
        tiles={['https://example.com/tiles/{z}/{x}/{y}.png']}
        tileSize={256}
      >
        <Layer id="satellite-layer" type="raster" />
      </Source>
    </Map>
  );
}
```

</details>

---

### Layer Component

Renders data from a source on the map. Supports all MapLibre layer types.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique layer identifier |
| `type` | `string` | Layer type: `'fill'`, `'line'`, `'circle'`, `'symbol'`, `'raster'`, `'heatmap'`, `'hillshade'`, `'background'` |
| `source` | `string` | Source ID (inherited from parent Source) |
| `source-layer` | `string` | Source layer (for vector sources) |
| `paint` | `object` | Paint properties |
| `layout` | `object` | Layout properties |
| `filter` | `array` | Filter expression |
| `minzoom` | `number` | Minimum zoom level |
| `maxzoom` | `number` | Maximum zoom level |
| `beforeId` | `string` | Insert before this layer ID |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, Source, Layer } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function LayerExample() {
  const cities = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Dhaka', population: 21000000 }, geometry: { type: 'Point', coordinates: [90.3938, 23.8216] } },
      { type: 'Feature', properties: { name: 'Chittagong', population: 4000000 }, geometry: { type: 'Point', coordinates: [91.8317, 22.3569] } },
      { type: 'Feature', properties: { name: 'Khulna', population: 1500000 }, geometry: { type: 'Point', coordinates: [89.5555, 22.8456] } }
    ]
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 6
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Source id="cities" type="geojson" data={cities}>
        {/* Circle layer with data-driven styling */}
        <Layer
          id="cities-circles"
          type="circle"
          paint={{
            'circle-radius': ['*', 0.000001, ['get', 'population']],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'population'],
              1000000, '#51bbd6',
              5000000, '#f1f075',
              20000000, '#f28cb1'
            ],
            'circle-opacity': 0.8
          }}
        />

        {/* Symbol layer for labels */}
        <Layer
          id="cities-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular'],
            'text-offset': [0, 2],
            'text-anchor': 'top'
          }}
          paint={{
            'text-color': '#000',
            'text-halo-color': '#fff',
            'text-halo-width': 1
          }}
        />

        {/* Filtered layer */}
        <Layer
          id="large-cities"
          type="circle"
          filter={['>', ['get', 'population'], 5000000]}
          paint={{
            'circle-radius': 20,
            'circle-color': '#ff0000',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }}
        />
      </Source>
    </Map>
  );
}
```

</details>

---

### Navigation Control

Adds zoom and rotation controls to the map.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `showCompass` | `boolean` | `true` | Show compass button |
| `showZoom` | `boolean` | `true` | Show zoom buttons |
| `visualizePitch` | `boolean` | `false` | Visualize pitch in compass |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, NavigationControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function NavigationExample() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <NavigationControl position="top-right" showCompass showZoom visualizePitch />
    </Map>
  );
}
```

</details>

---

### Fullscreen Control

Adds a button to toggle fullscreen mode.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `container` | `HTMLElement` | - | Custom fullscreen container |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, FullscreenControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function FullscreenExample() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <FullscreenControl position="top-right" />
    </Map>
  );
}
```

</details>

---

### Geolocate Control

Centers the map on the user's current location.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `positionOptions` | `object` | `{ enableHighAccuracy: true }` | Geolocation options |
| `fitBoundsOptions` | `object` | `{ maxZoom: 15 }` | Fit bounds options |
| `trackUserLocation` | `boolean` | `false` | Track user location |
| `showAccuracyCircle` | `boolean` | `true` | Show accuracy circle |
| `showUserLocation` | `boolean` | `true` | Show user location marker |
| `onGeolocate` | `(e: GeolocateResultEvent) => void` | - | Geolocate success handler |
| `onError` | `(e: GeolocateErrorEvent) => void` | - | Error handler |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, GeolocateControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function GeolocateExample() {
  const onGeolocate = (e) => {
    console.log('User location:', e.coords);
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showAccuracyCircle
        onGeolocate={onGeolocate}
      />
    </Map>
  );
}
```

</details>

---

### Scale Control

Displays a scale bar on the map.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'bottom-left'` | Control position |
| `maxWidth` | `number` | `100` | Maximum width in pixels |
| `unit` | `string` | `'metric'` | Unit: `'imperial'`, `'metric'`, or `'nautical'` |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, ScaleControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function ScaleExample() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <ScaleControl position="bottom-left" unit="metric" maxWidth={150} />
    </Map>
  );
}
```

</details>

---

### Terrain Control

Adds terrain visualization to the map.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `source` | `string \| object` | - | Terrain source |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, TerrainControl, Source, Layer } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function TerrainExample() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12,
        pitch: 60
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Source
        id="terrain"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />
      <TerrainControl source="terrain" />
    </Map>
  );
}
```

</details>

---

### Draw Control

Adds drawing tools for creating and editing polygons, lines, and points.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-left'` | Control position |
| `displayControlsDefault` | `boolean` | `false` | Show all controls by default |
| `controls` | `object` | `{ polygon: true, trash: true }` | Control visibility |
| `styles` | `array` | - | Custom draw styles |
| `modes` | `object` | - | Custom draw modes |
| `defaultMode` | `string` | `'simple_select'` | Default drawing mode |
| `onDrawCreate` | `(e: DrawEvent) => void` | - | Feature created handler |
| `onDrawDelete` | `(e: DrawEvent) => void` | - | Feature deleted handler |
| `onDrawUpdate` | `(e: DrawEvent) => void` | - | Feature updated handler |
| `onDrawSelectionChange` | `(e: DrawEvent) => void` | - | Selection change handler |
| `onDrawModeChange` | `(e: DrawEvent) => void` | - | Mode change handler |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, DrawControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useState } from 'react';

function DrawExample() {
  const [features, setFeatures] = useState([]);

  const onDrawCreate = (e) => {
    console.log('Created features:', e.features);
    setFeatures(e.features);
  };

  const onDrawUpdate = (e) => {
    console.log('Updated features:', e.features);
    setFeatures(e.features);
  };

  const onDrawDelete = (e) => {
    console.log('Deleted features:', e.features);
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <DrawControl
        position="top-left"
        controls={{
          polygon: true,
          line_string: true,
          point: true,
          trash: true,
          combine_features: false,
          uncombine_features: false
        }}
        onDrawCreate={onDrawCreate}
        onDrawUpdate={onDrawUpdate}
        onDrawDelete={onDrawDelete}
      />
    </Map>
  );
}
```

</details>

---

### Minimap Control

Displays a small overview map for navigation.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `center` | `[number, number]` | - | Initial center coordinates |
| `zoomAdjust` | `number` | `-4` | Zoom offset from parent |
| `lockZoom` | `number` | - | Lock to specific zoom level |
| `pitchAdjust` | `boolean` | `false` | Sync pitch with parent |
| `style` | `string \| StyleSpecification` | - | Custom minimap style |
| `containerStyle` | `object` | - | Custom container styles |
| `toggleable` | `boolean` | `true` | Allow toggling minimap |
| `initialMinimized` | `boolean` | `false` | Start minimized |
| `responsive` | `boolean` | `true` | Enable responsive sizing |
| `interactions` | `object` | - | Interaction configuration |
| `parentRect` | `object` | - | Parent rectangle styling |
| `onToggle` | `(isMinimized: boolean) => void` | - | Toggle callback |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, MinimapControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function MinimapExample() {
  const onToggle = (isMinimized) => {
    console.log('Minimap minimized:', isMinimized);
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <MinimapControl
        position="bottom-right"
        zoomAdjust={-5}
        toggleable
        initialMinimized={false}
        containerStyle={{
          width: '200px',
          height: '150px'
        }}
        parentRect={{
          linePaint: {
            'line-color': '#FF0000',
            'line-width': 2
          },
          fillPaint: {
            'fill-color': '#0000FF',
            'fill-opacity': 0.1
          }
        }}
        interactions={{
          dragPan: true,
          scrollZoom: false
        }}
        onToggle={onToggle}
      />
    </Map>
  );
}
```

</details>

---

### Globe Control

Toggle between 2D map and 3D globe view (requires MapLibre GL 3.x+).

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Control position |
| `buttonClassName` | `string` | `'maplibregl-ctrl-globe'` | Button CSS class |
| `buttonTitle` | `string` | `'Toggle Globe View'` | Button tooltip |
| `buttonStyle` | `CSSProperties` | - | Custom button styles |
| `onProjectionChange` | `(isGlobe: boolean) => void` | - | Projection change handler |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, GlobeControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function GlobeExample() {
  const handleProjectionChange = (isGlobe) => {
    console.log('Globe view:', isGlobe);
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <GlobeControl
        position="top-right"
        onProjectionChange={handleProjectionChange}
      />
    </Map>
  );
}
```

</details>

---

### Canvas Source

Render custom HTML canvas elements as map layers.

<details>
<summary><strong>Props</strong></summary>

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique source identifier |
| `coordinates` | `[[lng,lat], [lng,lat], [lng,lat], [lng,lat]]` | Corner coordinates (top-left, top-right, bottom-right, bottom-left) |
| `canvas` | `HTMLCanvasElement` | The canvas element to render |
| `animate` | `boolean` | Whether to animate the canvas |
| `children` | `ReactNode` | Child Layer components |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, CanvasSource, Layer } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useRef, useEffect } from 'react';

function CanvasExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 100, 255, 0.5)';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(128, 128, 50, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <canvas ref={canvasRef} width={256} height={256} style={{ display: 'none' }} />
      {canvasRef.current && (
        <CanvasSource
          id="my-canvas"
          coordinates={[
            [90.38, 23.83],
            [90.41, 23.83],
            [90.41, 23.81],
            [90.38, 23.81]
          ]}
          canvas={canvasRef.current}
          animate={true}
        >
          <Layer type="raster" paint={{ 'raster-opacity': 0.8 }} />
        </CanvasSource>
      )}
    </Map>
  );
}
```

</details>

---

## Layer Events

The Layer component supports interactive mouse events:

<details>
<summary><strong>Available Events</strong></summary>

| Prop | Type | Description |
|------|------|-------------|
| `onClick` | `(e: MapLayerMouseEvent) => void` | Fired when layer is clicked |
| `onMouseEnter` | `(e: MapLayerMouseEvent) => void` | Fired when mouse enters layer |
| `onMouseLeave` | `() => void` | Fired when mouse leaves layer |
| `onMouseMove` | `(e: MapLayerMouseEvent) => void` | Fired when mouse moves over layer |
| `onMouseDown` | `(e: MapLayerMouseEvent) => void` | Fired on mouse button press |
| `onMouseUp` | `(e: MapLayerMouseEvent) => void` | Fired on mouse button release |
| `onContextMenu` | `(e: MapLayerMouseEvent) => void` | Fired on right-click |
| `onDoubleClick` | `(e: MapLayerMouseEvent) => void` | Fired on double-click |

</details>

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, Source, Layer } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useState } from 'react';

function InteractiveLayerExample() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const geojsonData = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Dhaka' }, geometry: { type: 'Point', coordinates: [90.3938, 23.8216] } }
    ]
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Source id="places" type="geojson" data={geojsonData}>
        <Layer
          id="places-layer"
          type="circle"
          paint={{
            'circle-radius': hoveredFeature ? 12 : 8,
            'circle-color': hoveredFeature ? '#FF0000' : '#007cbf'
          }}
          onClick={(e) => {
            console.log('Clicked:', e.features[0].properties.name);
          }}
          onMouseEnter={(e) => {
            setHoveredFeature(e.features[0]);
          }}
          onMouseLeave={() => {
            setHoveredFeature(null);
          }}
        />
      </Source>
    </Map>
  );
}
```

</details>

---

## Hooks

### useMap Hook

Access map instances from any component within the MapProvider.

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, useMap, MapProvider } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

function MapButtons() {
  const { current: map } = useMap();

  const zoomIn = () => {
    map?.zoomIn();
  };

  const zoomOut = () => {
    map?.zoomOut();
  };

  const flyTo = () => {
    map?.flyTo({
      center: [90.40, 23.83],
      zoom: 15,
      duration: 2000
    });
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
      <button onClick={zoomIn}>Zoom In</button>
      <button onClick={zoomOut}>Zoom Out</button>
      <button onClick={flyTo}>Fly to Location</button>
    </div>
  );
}

function App() {
  return (
    <MapProvider>
      <Map
        mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
        initialViewState={{
          longitude: 90.3938,
          latitude: 23.8216,
          zoom: 12
        }}
        style={{ width: '100%', height: '100vh' }}
      />
      <MapButtons />
    </MapProvider>
  );
}
```

</details>

---

### useControl Hook

Create custom map controls.

<details>
<summary><strong>Example</strong></summary>

```tsx
import { Map, useControl } from 'react-bkoi-gl';
import { useControl as useMapControl } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";

class CustomControl {
  onAdd(map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'custom-control';
    this.container.textContent = 'Custom Control';
    this.container.style.cssText = `
      background: white;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
    `;
    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

function CustomControlComponent() {
  useControl(() => new CustomControl(), { position: 'top-left' });
  return null;
}

function App() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      <CustomControlComponent />
    </Map>
  );
}
```

</details>

---

## Events

The Map component supports various event callbacks:

<details>
<summary><strong>Available Events</strong></summary>

### Mouse Events
- `onClick` - Map click
- `onDblClick` - Double click
- `onMouseDown` - Mouse down
- `onMouseUp` - Mouse up
- `onMouseMove` - Mouse move
- `onMouseEnter` - Mouse enter
- `onMouseLeave` - Mouse leave
- `onMouseOver` - Mouse over
- `onMouseOut` - Mouse out
- `onContextMenu` - Right click

### Touch Events
- `onTouchStart` - Touch start
- `onTouchEnd` - Touch end
- `onTouchMove` - Touch move
- `onTouchCancel` - Touch cancel

### Movement Events
- `onMoveStart` - Movement start
- `onMove` - Movement
- `onMoveEnd` - Movement end
- `onDragStart` - Drag start
- `onDrag` - Drag
- `onDragEnd` - Drag end
- `onZoomStart` - Zoom start
- `onZoom` - Zoom
- `onZoomEnd` - Zoom end
- `onRotateStart` - Rotation start
- `onRotate` - Rotation
- `onRotateEnd` - Rotation end
- `onPitchStart` - Pitch start
- `onPitch` - Pitch
- `onPitchEnd` - Pitch end

### Map State Events
- `onLoad` - Map loaded
- `onRender` - Frame rendered
- `onIdle` - Map idle
- `onError` - Error occurred
- `onResize` - Map resized
- `onRemove` - Map removed
- `onData` - Data loaded
- `onStyleData` - Style data loaded
- `onSourceData` - Source data loaded

</details>

<details>
<summary><strong>Event Example</strong></summary>

```tsx
import { Map, Marker } from 'react-bkoi-gl';
import "react-bkoi-gl/styles";
import { useState } from 'react';

function EventExample() {
  const [center, setCenter] = useState({ lng: 90.3938, lat: 23.8216 });

  const onClick = (e) => {
    console.log('Clicked at:', e.lngLat);
    setCenter({ lng: e.lngLat.lng, lat: e.lngLat.lat });
  };

  const onMoveEnd = (e) => {
    console.log('Move ended, viewState:', e.viewState);
  };

  const onLoad = (e) => {
    console.log('Map loaded!');
  };

  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
      initialViewState={{
        longitude: 90.3938,
        latitude: 23.8216,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
      onClick={onClick}
      onMoveEnd={onMoveEnd}
      onLoad={onLoad}
    >
      <Marker longitude={center.lng} latitude={center.lat} color="red" />
    </Map>
  );
}
```

</details>

---

## MapRef Methods

Access the underlying map instance through the ref:

<details>
<summary><strong>Available Methods</strong></summary>

```tsx
const mapRef = useRef<MapRef>(null);

// Get the underlying MapLibre instance
const map = mapRef.current?.getMap();

// Common methods:
map.getCenter()           // Get map center
map.getZoom()             // Get zoom level
map.getBearing()          // Get bearing
map.getPitch()            // Get pitch
map.getBounds()           // Get bounds

map.setCenter([lng, lat]) // Set center
map.setZoom(zoom)         // Set zoom
map.setBearing(bearing)   // Set bearing
map.setPitch(pitch)       // Set pitch

map.flyTo(options)        // Fly to location
map.jumpTo(options)       // Jump to location
map.easeTo(options)       // Ease to location

map.zoomIn()              // Zoom in
map.zoomOut()             // Zoom out

map.resize()              // Resize map
map.remove()              // Remove map
```

</details>

---

## Styling

The library uses MapLibre GL JS styles. Import the styles in your application:

```tsx
import "react-bkoi-gl/styles";
```

### Available Map Styles

- `osm-liberty` - Default street style
- `osm_barikoi_v2` - Barikoi street style

```tsx
const mapStyle = `https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`;
const mapStyle = `https://map.barikoi.com/styles/osm_barikoi_v2/style.json?key=${API_KEY}`;
```

---

## TypeScript

Full TypeScript support is included. All types are exported:

```tsx
import type {
  MapProps,
  MapRef,
  MarkerProps,
  PopupProps,
  SourceProps,
  CanvasSourceProps,
  LayerProps,
  MapLayerMouseEvent,
  ViewStateChangeEvent,
  DrawControlProps,
  GlobeControlProps,
  MinimapControlOptions
} from 'react-bkoi-gl';
```

---

## Local Development

Do NOT use `npm link`. Use the tarball method:

```bash
npm run build && npm pack
npm install /path/to/react-bkoi-gl-*.tgz
```

---

## Documentation & Resources

- [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)
- [Barikoi Business API](https://docs.barikoi.com/api)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-native/ios/latest/documentation/maplibre/)
- [Interactive Examples](https://docs.barikoi.com/examples)

---

## License

MIT License. See [LICENSE](https://www.npmjs.com/package/LICENSE) for details.

## Support

For issues or questions, contact [support@barikoi.com](mailto:support@barikoi.com).

<img src="https://docs.barikoi.com/img/barikoi-logo-black.svg" height="30" />
