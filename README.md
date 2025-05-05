<h1 align="center">react-bkoi-gl | <a href="https://docs.barikoi.com/npm/npm-intro">Docs</a></h1>

## Description

`react-bkoi-gl` is a suite of [React](http://facebook.github.io/react/) components designed to provide a API for [Barikoi Maps](https://docs.barikoi.com/docs/maps-api). More information in the online documentation.

## Installation

Using `react-bkoi-gl` requires `react >= 16.3`.

To install the package via npm, run the following command:
```bash
npm install react-bkoi-gl
```
Or via yarn:
```bash
yarn add react-bkoi-gl
```

## Components

The package provides the following components:

### Map
The core component for rendering Barikoi maps.
```jsx
import { Map } from 'react-bkoi-gl';

<Map
  mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${BARIKOI_API_KEY}`}
  initialViewState={{
    longitude: 90.36402,
    latitude: 23.823731,
    zoom: 13
  }}
/>
```

### Marker
Add markers to the map.
```jsx
import { Marker } from 'react-bkoi-gl';

<Marker longitude={90.36402} latitude={23.823731} color="red" />
```

### NavigationControl
Adds zoom and rotation controls to the map.
```jsx
import { NavigationControl } from 'react-bkoi-gl';

<NavigationControl position="top-right" />
```

### GeolocateControl
Control for locating the user on the map.
```jsx
import { GeolocateControl } from 'react-bkoi-gl';

<GeolocateControl position="top-right" />
```

### FullscreenControl
Adds a control to toggle the map between fullscreen and normal mode.
```jsx
import { FullscreenControl } from 'react-bkoi-gl';

<FullscreenControl position="top-right" />
```

### ScaleControl
Shows the scale of the current map view.
```jsx
import { ScaleControl } from 'react-bkoi-gl';

<ScaleControl position="bottom-right" />
```

### Source and Layer
Components for adding data sources and visualization layers to the map.
```jsx
import { Source, Layer } from 'react-bkoi-gl';

<Source id="my-data" type="geojson" data={geojsonData}>
  <Layer
    id="my-layer"
    type="circle"
    paint={{
      'circle-radius': 8,
      'circle-color': '#007cbf'
    }}
  />
</Source>
```

### Popup
Displays information in a popup on the map.
```jsx
import { Popup } from 'react-bkoi-gl';

<Popup
  longitude={90.36402}
  latitude={23.823731}
  closeButton={true}
  closeOnClick={true}
>
  <div>Information about this location</div>
</Popup>
```

### TerrainControl
Control for enabling 3D terrain visualization.
```jsx
import { TerrainControl } from 'react-bkoi-gl';

<TerrainControl position="top-right" />
```

### LogoControl and AttributionControl
Controls for displaying the Barikoi logo and attribution information.
```jsx
import { LogoControl, AttributionControl } from 'react-bkoi-gl';

<LogoControl position="bottom-left" />
<AttributionControl position="bottom-right" />
```

## Example

```jsx
import { useRef } from 'react';
import { Map, Marker, FullscreenControl, GeolocateControl, NavigationControl, ScaleControl } from 'react-bkoi-gl';

// Import Styles
import "react-bkoi-gl/styles"

const App = () => {
  const BARIKOI_API_KEY = 'YOUR_BARIKOI_API_KEY_HERE'
  const mapStyle = `https://map.barikoi.com/styles/osm-liberty/style.json?key=${BARIKOI_API_KEY}`
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const initialViewState = {
    longitude: 90.36402,
    latitude: 23.823731,
    minZoom: 4,
    maxZoom: 22,
    zoom: 13,
    bearing: 0,
    pitch: 0,
    antialias: true
  }

  return (
    <div ref={mapContainer} style={containerStyles} >
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        initialViewState={initialViewState}
        doubleClickZoom={false}
        dragRotate={false}
      >
        <Marker longitude={90.36402} latitude={23.823731} color="red" />
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
      </Map>
    </div>
  )
}

// JSX Styles
const containerStyles = {
  width: "100%",
  height: "100vh",
  minHeight: "400px",
  overflow: "hidden",
}

export default App
```

## Get Barikoi API key

To access Barikoi's API services, you need to:
1. Register on [Barikoi Developer Dashboard](https://developer.barikoi.com/register).
2. Verify with your phone number.
3. Claim your API key.

Once registered, you'll be able to access the full suite of Barikoi API services. If you exceed the free usage limits, you'll need to subscribe to a paid plan.

## Testing

To run tests:
```bash
npm test
```

To generate a test coverage report:
```bash
npm run coverage
```

The coverage report will be available in the `coverage/` directory.

## Learning Resources
* [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)

## License
This library is licensed under the MIT License. See the [LICENSE](https://www.npmjs.com/package/LICENSE) file for details.

## Support
For any issues or questions, please contact [support@barikoi.com](mailto:support@barikoi.com).

<img src="https://docs.barikoi.com/img/barikoi-logo-black.svg" height="30" />
