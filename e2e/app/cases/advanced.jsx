// ADVANCED cases — remaining docs.barikoi.com/examples patterns:
// live-real-time-data, measure-distance, measure-polygon-area.
// (animate-point-along-line is already covered by examples/animation.)
// Each is deterministic (preset coordinates + readouts) so specs assert
// real values, not pixels.
import { useEffect, useState } from 'react'
import { Layer, Marker, Source } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

// turf.distance equivalent (haversine, same R) — inline so the e2e host
// does not need a turf dependency just to mirror the docs example.
const R = 6371008.8
const rad = (deg) => (deg * Math.PI) / 180
function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const dPhi = rad(lat2 - lat1)
  const dLambda = rad(lng2 - lng1)
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLambda / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// turf.area ring formula (spherical excess) for one closed ring.
function ringAreaMeters(ring) {
  if (ring.length < 3) return 0
  let total = 0
  for (let i = 0; i < ring.length; i++) {
    const [l1, p1] = ring[i]
    const [l2, p2] = ring[(i + 1) % ring.length]
    total += (rad(l2) - rad(l1)) * (2 + Math.sin(rad(p1)) + Math.sin(rad(p2)))
  }
  return Math.abs((total * R * R) / 2)
}

// Live "real-time" feed: a timer calls setData with fresh GeoJSON, exactly
// like a WebSocket handler would — the library contract is that replacing
// the `data` prop re-renders the source without remounting it.
export function AdvancedLiveData() {
  const [points, setPoints] = useState([[90.3938, 23.8216], [90.385, 23.815]])

  useEffect(() => {
    const feed = [
      [90.402, 23.828],
      [90.408, 23.834],
      [90.415, 23.841],
      [90.421, 23.848],
      [90.428, 23.855],
    ]
    let n = 0
    const t = setInterval(() => {
      if (n >= feed.length) {
        clearInterval(t)
        return
      }
      // Capture BEFORE setState and keep the updater pure — React StrictMode
      // double-invokes updaters, and reading the mutable `n` inside one
      // appends the wrong (or undefined) coordinate.
      const coord = feed[n]
      n++
      setPoints(prev => [...prev, coord])
      window.__log({ type: 'feed', count: 2 + n })
    }, 600)
    return () => clearInterval(t)
  }, [])

  return (
    <Section title='Live real-time data — timer-driven setData appends points'>
      <div className='map-ui'>
        <span data-testid='feed-count'>{points.length} points</span>
      </div>
      <TestMap section='live-data'>
        <Source
          id='live'
          type='geojson'
          data={{
            type: 'FeatureCollection',
            features: points.map(c => ({
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: c },
            })),
          }}
        >
          <Layer
            id='live-points'
            type='circle'
            paint={{ 'circle-radius': 8, 'circle-color': '#e61e41' }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

// Measure distance between two preset points (turf.distance equivalent).
const DIST_A = [90.3938, 23.8216]
const DIST_B = [90.4, 23.83]

export function AdvancedMeasureDistance() {
  const [placed, setPlaced] = useState([])
  const meters = placed.length === 2 ? haversineMeters(placed[0], placed[1]) : null
  useEffect(() => {
    if (meters != null) window.__log({ type: 'distance', meters })
  }, [meters])

  return (
    <Section title='Measure distance — place A and B, haversine between them'>
      <div className='map-ui'>
        <button
          data-testid='place-a'
          onClick={() => setPlaced(p => [DIST_A, p[1]].filter(Boolean))}
        >
          Place A
        </button>
        <button
          data-testid='place-b'
          onClick={() => setPlaced(p => [p[0], DIST_B].filter(Boolean))}
        >
          Place B
        </button>
        <button data-testid='clear-measure' onClick={() => setPlaced([])}>
          Clear
        </button>
        <span data-testid='distance-readout'>
          {meters != null ? `${(meters / 1000).toFixed(2)} km` : 'place two points'}
        </span>
      </div>
      <TestMap section='measure-distance'>
        {placed.length > 0 && (
          <Source
            id='measure'
            type='geojson'
            data={{
              type: 'FeatureCollection',
              features: [
                ...placed.map(c => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: c },
                })),
                ...(placed.length === 2
                  ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: placed } }]
                  : []),
              ],
            }}
          >
            <Layer id='measure-line' type='line' paint={{ 'line-color': '#333', 'line-width': 2, 'line-dasharray': [2, 2] }} />
          </Source>
        )}
        {placed.map((c, i) => (
          <Marker key={i} longitude={c[0]} latitude={c[1]} color={i === 0 ? '#007cbf' : '#e61e41'} />
        ))}
      </TestMap>
    </Section>
  )
}

// Measure polygon area from preset vertices (turf.area equivalent).
const AREA_RING = [
  [90.39, 23.82],
  [90.4, 23.82],
  [90.4, 23.83],
  [90.39, 23.83],
]

export function AdvancedMeasureArea() {
  const [n, setN] = useState(0)
  const ring = AREA_RING.slice(0, n)
  const area = ring.length >= 3 ? ringAreaMeters(ring) : null
  useEffect(() => {
    if (area != null) window.__log({ type: 'area', meters: area })
  }, [area])

  return (
    <Section title='Measure polygon area — add vertices, spherical ring area'>
      <div className='map-ui'>
        <button data-testid='add-vertex' onClick={() => setN(v => Math.min(v + 1, 4))}>
          Add vertex
        </button>
        <button data-testid='reset-area' onClick={() => setN(0)}>
          Reset
        </button>
        <span data-testid='area-readout'>
          {area != null ? `${(area / 1e6).toFixed(4)} km²` : 'add 3+ vertices'}
        </span>
      </div>
      <TestMap section='measure-area'>
        {ring.length > 0 && (
          <Source
            id='area'
            type='geojson'
            data={{
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
            }}
          >
            <Layer id='area-fill' type='fill' paint={{ 'fill-color': '#007cbf', 'fill-opacity': 0.25 }} />
            <Layer id='area-outline' type='line' paint={{ 'line-color': '#007cbf', 'line-width': 2 }} />
          </Source>
        )}
        {ring.map((c, i) => (
          <Marker key={i} longitude={c[0]} latitude={c[1]} color='#007cbf' />
        ))}
      </TestMap>
    </Section>
  )
}
