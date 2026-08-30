"use client";

// Zero worker config on purpose: validates the library's automatic worker URL
// registration (self-contained worker asset emitted by the app's bundler).
import { useRef } from 'react'
import { Map } from 'react-bkoi-gl'
import 'react-bkoi-gl/styles'

export default function MapView() {
  const booted = useRef(false)
  return (
    <Map
      mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`}
      initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
      style={{ width: '100vw', height: '100vh' }}
      onLoad={() => { window.__READY = true }}
      onIdle={() => { if (!booted.current) { booted.current = true } ; window.__IDLE = true }}
    />
  )
}
