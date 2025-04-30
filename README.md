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

### Example

```js
import { useRef } from 'react';
import { Map, FullscreenControl, GeolocateControl, NavigationControl, ScaleControl } from 'react-bkoi-gl';

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
    maxZoom: 30,
    zoom: 13,
    bearing: 0,
    pitch: 0,
    antialias: true
  }

  return (
    <div
      ref={mapContainer} style={containerStyles}
    >
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        initialViewState={initialViewState}
        doubleClickZoom={false}
        dragRotate={false}
      >
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

## Map Features

### Automatic Branding

The Map component automatically includes the following branding elements by default:

- **Barikoi Logo**: Displayed at the bottom-left corner of the map
- **Barikoi Attribution**: Displayed at the bottom-right corner of the map showing "© Barikoi"

If you need to disable these, you can use the following props:

```jsx
<Map
  showBarikoiLogo={false}
  showAttribution={false}
  {...otherProps}
>
  {/* map children */}
</Map>
```

## Get Barikoi API key

To access Barikoi's API services, you need to:
1. Register on [Barikoi Developer Dashboard](https://developer.barikoi.com/register).
2. Verify with your phone number.
3. Claim your API key.

Once registered, you'll be able to access the full suite of Barikoi API services. If you exceed the free usage limits, you'll need to subscribe to a paid plan.

## Learning Resources
* [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)

## License
This library is licensed under the MIT License. See the [LICENSE](https://www.npmjs.com/package/LICENSE) file for details.

## Support
For any issues or questions, please contact [support@barikoi.com](mailto:support@barikoi.com).

<img src="https://docs.barikoi.com/img/barikoi-logo-black.svg" height="30" />
