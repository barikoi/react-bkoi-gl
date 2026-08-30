// CONTROLS — grouped per review feedback, ONE URL PER GROUP (A/B/C/D):
//   A /?case=controls-camera — navigation, zoom/flyTo, scale, fullscreen, geolocate
//   B /?case=controls-globe
//   C /?case=controls-minimap (+ /?case=controls-minimap-rect)
//   D /?case=controls-terrain
import { useRef } from 'react'
import {
  GeolocateControl,
  GlobeControl,
  Layer,
  MinimapControl,
  NavigationControl,
  ScaleControl,
  Source,
  TerrainControl,
  FullscreenControl,
} from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

// Open elevation data: AWS Terrain Tiles (Terrarium encoding, open data).
const TERRARIUM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

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
      <div className='map-ui'>
        <button data-testid='report' onClick={report}>
          Report
        </button>
        <button data-testid='zoom-in' onClick={() => mapRef.current?.getMap().zoomIn()}>
          ZoomIn
        </button>
        <button data-testid='zoom-out' onClick={() => mapRef.current?.getMap().zoomOut()}>
          ZoomOut
        </button>
        <button
          data-testid='fly'
          onClick={() =>
            mapRef.current?.getMap().flyTo({ center: [90.4, 23.83], zoom: 15, duration: 400 })
          }
        >
          Fly
        </button>
      </div>
      <TestMap ref={mapRef} section='camera-ref' />
    </>
  )
}

export function ControlsNavigation() {
  return (
    <Section title='NavigationControl — zoom buttons + compass'>
      <TestMap section='navigation'>
        <NavigationControl position='top-right' showCompass showZoom visualizePitch />
      </TestMap>
    </Section>
  )
}

export function ControlsCameraRef() {
  return (
    <Section title='MapRef camera — ZoomIn / ZoomOut / FlyTo'>
      <CameraRefDemo />
    </Section>
  )
}

export function ControlsScale() {
  return (
    <Section title='ScaleControl — metric (bottom-left)'>
      <TestMap section='scale'>
        <ScaleControl position='bottom-left' unit='metric' maxWidth={150} />
      </TestMap>
    </Section>
  )
}

export function ControlsFullscreen() {
  return (
    <Section title='FullscreenControl'>
      <TestMap section='fullscreen'>
        <FullscreenControl position='top-right' />
      </TestMap>
    </Section>
  )
}

export function ControlsGeolocate() {
  // Fake coordinates are injected by Playwright (setGeolocation in fixtures)
  return (
    <Section title='GeolocateControl — dot + accuracy circle'>
      <TestMap
        section='geolocate'
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 10 }}
      >
        <GeolocateControl
          position='top-right'
          trackUserLocation
          showAccuracyCircle
          onGeolocate={e =>
            window.__log({
              type: 'geolocate',
              coords: { lat: e.coords.latitude, lng: e.coords.longitude },
            })
          }
        />
      </TestMap>
    </Section>
  )
}

/* ── Group B: globe (official maplibre "globe with atmosphere" example) ── */

// Replicates https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-an-atmosphere/ —
// open EOx s2cloudless satellite raster, globe projection, atmosphere blend.
export function ControlsGlobe() {
  return (
    <Section title='GlobeControl — globe + atmosphere (open EOx satellite)'>
      <TestMap
        section='globe'
        initialViewState={{ longitude: 30, latitude: 15, zoom: 0.8 }}
        mapStyle={{
          version: 8,
          projection: { type: 'globe' },
          sources: {
            satellite: {
              type: 'raster',
              tiles: [
                'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
              ],
            },
          },
          layers: [{ id: 'Satellite', type: 'raster', source: 'satellite' }],
          sky: {
            'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
          },
        }}
      >
        <GlobeControl
          position='top-right'
          onProjectionChange={isGlobe => window.__log({ type: 'projection', isGlobe })}
        />
      </TestMap>
    </Section>
  )
}

/* ── Group C: minimap ──────────────────────────────────────────────── */

export function ControlsMinimap() {
  return (
    <Section title='MinimapControl — full parent style, toggleable'>
      <TestMap section='minimap'>
        <MinimapControl
          position='bottom-right'
          zoomAdjust={-5}
          toggleable
          initialMinimized={false}
          containerStyle={{ width: '200px', height: '150px' }}
          onToggle={isMinimized => window.__log({ type: 'minimap-toggle', isMinimized })}
        />
      </TestMap>
    </Section>
  )
}

export function ControlsMinimapRect() {
  return (
    <Section title='MinimapControl — parent viewport rectangle (parentRect)'>
      <TestMap section='minimap-rect'>
        <MinimapControl
          position='bottom-right'
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

/* ── Group D: terrain + 3D buildings ─────────────────────────────── */

// Basemap from the official "display buildings in 3D" example:
// https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
// (OpenFreeMap bright + planet vector buildings as fill-extrusion), plus
// the open Terrarium DEM via TerrainControl — Kathmandu shows both relief
// and buildings at the review angle (zoom 16.65 / bearing 34.2 / pitch 72).
const OPENFREEMAP_BRIGHT = 'https://tiles.openfreemap.org/styles/bright'

export function ControlsTerrain() {
  return (
    <Section title='Terrain + 3D buildings (OpenFreeMap + Terrarium DEM)'>
      <TestMap
        section='terrain'
        mapStyle={OPENFREEMAP_BRIGHT}
        initialViewState={{
          longitude: 85.318,
          latitude: 27.712,
          zoom: 16.65,
          bearing: 34.2,
          pitch: 72,
        }}
      >
        <Source id='openfreemap' type='vector' url='https://tiles.openfreemap.org/planet' />
        <Layer
          id='3d-buildings'
          type='fill-extrusion'
          source='openfreemap'
          source-layer='building'
          minzoom={15}
          filter={['!=', ['get', 'hide_3d'], true]}
          paint={{
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0,
              'lightgray',
              200,
              'royalblue',
              400,
              'lightblue',
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              16,
              ['get', 'render_height'],
            ],
            'fill-extrusion-base': [
              'case',
              ['>=', ['get', 'zoom'], 16],
              ['get', 'render_min_height'],
              0,
            ],
          }}
        />
        <Source
          id='terrain-dem'
          type='raster-dem'
          tiles={[TERRARIUM_TILES]}
          encoding='terrarium'
          tileSize={256}
          maxzoom={15}
        />
        <TerrainControl position='top-right' source='terrain-dem' />
      </TestMap>
    </Section>
  )
}
