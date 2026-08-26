// CONTROLS — grouped per review feedback, ONE URL PER GROUP (A/B/C/D):
//   A /?case=controls-camera — navigation, zoom/flyTo, scale, fullscreen, geolocate
//   B /?case=controls-globe
//   C /?case=controls-minimap (+ /?case=controls-minimap-rect)
//   D /?case=controls-terrain
import { useRef } from 'react'
import { GeolocateControl, GlobeControl, MinimapControl, NavigationControl, ScaleControl, TerrainControl, FullscreenControl } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

/* ── Group A: camera + basic controls ─────────────────────────────── */

function CameraRefDemo() {
  const mapRef = useRef(null)
  const report = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const c = map.getCenter()
    window.__log({
      type: 'ref-report',
      center: { lng: c.lng, lat: c.lat },
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    })
  }
  return (
    <>
      <div className="map-ui">
        <button data-testid="report" onClick={report}>Report</button>
        <button data-testid="zoom-in" onClick={() => mapRef.current?.getMap().zoomIn()}>ZoomIn</button>
        <button data-testid="zoom-out" onClick={() => mapRef.current?.getMap().zoomOut()}>ZoomOut</button>
        <button data-testid="fly" onClick={() => mapRef.current?.getMap().flyTo({ center: [90.4, 23.83], zoom: 15, duration: 400 })}>Fly</button>
      </div>
      <TestMap ref={mapRef} section="camera-ref" />
    </>
  )
}

export function ControlsNavigation() {
  return (
    <Section title="NavigationControl — zoom buttons + compass">
      <TestMap section="navigation">
        <NavigationControl position="top-right" showCompass showZoom visualizePitch />
      </TestMap>
    </Section>
  )
}

export function ControlsCameraRef() {
  return (
    <Section title="MapRef camera — ZoomIn / ZoomOut / FlyTo">
      <CameraRefDemo />
    </Section>
  )
}

export function ControlsScale() {
  return (
    <Section title="ScaleControl — metric (bottom-left)">
      <TestMap section="scale">
        <ScaleControl position="bottom-left" unit="metric" maxWidth={150} />
      </TestMap>
    </Section>
  )
}

export function ControlsFullscreen() {
  return (
    <Section title="FullscreenControl">
      <TestMap section="fullscreen">
        <FullscreenControl position="top-right" />
      </TestMap>
    </Section>
  )
}

export function ControlsGeolocate() {
  // Fake coordinates are injected by Playwright (setGeolocation in fixtures)
  return (
    <Section title="GeolocateControl — dot + accuracy circle">
      <TestMap section="geolocate" initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 10 }}>
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showAccuracyCircle
          onGeolocate={(e) => window.__log({ type: 'geolocate', coords: { lat: e.coords.latitude, lng: e.coords.longitude } })}
        />
      </TestMap>
    </Section>
  )
}

/* ── Group B: globe ────────────────────────────────────────────────── */

export function ControlsGlobe() {
  return (
    <Section title="GlobeControl — projection toggle">
      <TestMap section="globe">
        <GlobeControl position="top-right" onProjectionChange={(isGlobe) => window.__log({ type: 'projection', isGlobe })} />
      </TestMap>
    </Section>
  )
}

/* ── Group C: minimap ──────────────────────────────────────────────── */

export function ControlsMinimap() {
  return (
    <Section title="MinimapControl — full parent style, toggleable">
      <TestMap section="minimap">
        <MinimapControl
          position="bottom-right"
          zoomAdjust={-5}
          toggleable
          initialMinimized={false}
          containerStyle={{ width: '200px', height: '150px' }}
          onToggle={(isMinimized) => window.__log({ type: 'minimap-toggle', isMinimized })}
        />
      </TestMap>
    </Section>
  )
}

export function ControlsMinimapRect() {
  return (
    <Section title="MinimapControl — parent viewport rectangle (parentRect)">
      <TestMap section="minimap-rect">
        <MinimapControl
          position="bottom-right"
          zoomAdjust={-5}
          toggleable={false}
          containerStyle={{ width: '220px', height: '160px' }}
          parentRect={{
            linePaint: { 'line-color': '#ff0000', 'line-width': 2 },
            fillPaint: { 'fill-color': '#ff0000', 'fill-opacity': 0.2 },
          }}
        />
      </TestMap>
    </Section>
  )
}

/* ── Group D: terrain ──────────────────────────────────────────────── */

export function ControlsTerrain() {
  return (
    <Section title="TerrainControl — mount (needs raster-dem source)">
      <TestMap section="terrain">
        <TerrainControl position="top-right" source="terrain-dem" />
      </TestMap>
    </Section>
  )
}
