import React from 'react'
import { Map } from 'react-bkoi-gl'
import 'react-bkoi-gl/styles'

// Zero worker config: validates the library's automatic worker URL
// registration under webpack 5 asset emission.
export default function App() {
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${process.env.REACT_APP_BARIKOI_API_KEY}`}
      initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
      style={{ width: '100vw', height: '100vh' }}
      onLoad={() => { window.__READY = true }}
      onIdle={() => { window.__IDLE = true }}
    />
  )
}
