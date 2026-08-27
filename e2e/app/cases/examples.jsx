// MAPLIBRE OFFICIAL EXAMPLES we cover that Barikoi doesn't serve styles/data
// for — each uses open data sources. One URL per case:
//   /?case=examples/hillshade  — hillshade from an open Terrarium DEM
//   /?case=examples/cluster    — clustered GeoJSON points
//   /?case=examples/heatmap    — heatmap layer
// Mirrors: https://maplibre.org/maplibre-gl-js/docs/examples/
import { Source, Layer, Marker } from 'react-bkoi-gl'
import * as React from 'react'
import { TestMap, BARIKOI_STYLE } from '../test-map.jsx'
import { Section } from './map.jsx'

const TERRARIUM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

/* ── Hillshade (maplibre example: "visualize terrain with a hillshade") ── */

export function ExampleHillshade() {
  // Open Terrarium DEM; Barikoi serves no raster-dem.
  return (
    <Section title='Example — hillshade from open Terrarium DEM'>
      <TestMap
        section='hillshade'
        initialViewState={{ longitude: 86.925, latitude: 27.9881, zoom: 12, pitch: 60 }}
      >
        <Source
          id='hillshade-dem'
          type='raster-dem'
          tiles={[TERRARIUM_TILES]}
          encoding='terrarium'
          tileSize={256}
          maxzoom={15}
        />
        <Layer
          id='hillshade-layer'
          type='hillshade'
          source='hillshade-dem'
          paint={{
            'hillshade-exaggeration': 0.6,
            'hillshade-shadow-color': '#473B24',
          }}
        />
      </TestMap>
    </Section>
  )
}

/* ── Cluster (maplibre example: "cluster points") ────────────────────── */

const CITY_POINTS = [
  [90.4125, 23.8103],
  [90.3938, 23.8216],
  [90.3667, 23.7833],
  [90.35, 23.75],
  [89.65, 22.85],
  [91.8314, 22.3265],
  [88.36, 22.5657],
  [90.5, 22.8],
  [89.55, 22.8],
  [91.0, 24.0],
  [90.7, 23.9],
  [89.25, 23.9],
  [88.0, 24.5],
  [90.4, 24.4],
  [92.0, 21.5],
  [88.6, 21.8],
].map(([lng, lat]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] } }))

export function ExampleCluster() {
  // Barikoi base style provides glyphs for the cluster-count symbols.
  return (
    <Section title='Example — clustered points (GeoJSON cluster)'>
      <TestMap
        section='cluster'
        mapStyle={BARIKOI_STYLE('osm_barikoi_v2')}
        initialViewState={{ longitude: 90.2, latitude: 23.2, zoom: 6.5 }}
      >
        <Source
          id='cities'
          type='geojson'
          data={{ type: 'FeatureCollection', features: CITY_POINTS }}
          cluster
          clusterRadius={60}
        >
          <Layer
            id='clusters'
            type='circle'
            source='cities'
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#f28cb1',
              'circle-radius': ['step', ['get', 'point_count'], 15, 5, 20, 15, 25],
            }}
          />
          <Layer
            id='cluster-count'
            type='symbol'
            source='cities'
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
            }}
          />
          <Layer
            id='unclustered-point'
            type='circle'
            source='cities'
            filter={['!', ['has', 'point_count']]}
            paint={{ 'circle-color': '#1a73e8', 'circle-radius': 6 }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

/* ── Heatmap (maplibre example: "heatmap layer") ─────────────────────── */

export function ExampleHeatmap() {
  return (
    <Section title='Example — heatmap layer'>
      <TestMap section='heatmap' mapStyle={BARIKOI_STYLE('osm_barikoi_v2')}>
        <Source
          id='heat-points'
          type='geojson'
          data={{ type: 'FeatureCollection', features: CITY_POINTS }}
        >
          <Layer
            id='heatmap-layer'
            type='heatmap'
            source='heat-points'
            paint={{
              'heatmap-weight': 1,
              'heatmap-intensity': 1,
              'heatmap-radius': 30,
              'heatmap-opacity': 0.8,
            }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

/* ── Animation (maplibre example: "animate a marker") ────────────────── */

const ROUTE = [
  [90.37, 23.8],
  [90.385, 23.805],
  [90.395, 23.812],
  [90.4038, 23.8216],
  [90.412, 23.832],
  [90.42, 23.842],
  [90.428, 23.85],
]

export function ExampleAnimation() {
  const [pos, setPos] = React.useState(ROUTE[0])
  React.useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = () => {
      const t = ((performance.now() - t0) / 12000) % 1 // one loop / 12s
      const i = t * (ROUTE.length - 1)
      const a = ROUTE[Math.floor(i)],
        b = ROUTE[Math.min(ROUTE.length - 1, Math.floor(i) + 1)]
      const f = i - Math.floor(i)
      const lng = a[0] + (b[0] - a[0]) * f
      const lat = a[1] + (b[1] - a[1]) * f
      setPos([lng, lat])
      window.__log({ type: 'anim-pos', lng, lat })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <Section title='Example — animated marker along a route'>
      <TestMap
        section='animation'
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 13 }}
      >
        <Marker longitude={pos[0]} latitude={pos[1]} color='#1a73e8' />
        <Source
          id='route'
          type='geojson'
          data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: ROUTE } }}
        >
          <Layer
            id='route-line'
            type='line'
            source='route'
            paint={{ 'line-color': '#1a73e8', 'line-width': 3 }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

/* ── Video source (maplibre example: "add a video") ─────────────────── */

export function ExampleVideoSource() {
  // Open aerial footage (Wikimedia Commons, CORS *) — mapbox's demo asset
  // blocks hotlinking.
  return (
    <Section title='Example — video source (aerial footage over SF)'>
      <TestMap
        section='video'
        initialViewState={{ longitude: -122.5144, latitude: 37.5629, zoom: 16.5 }}
        mapStyle={{
          version: 8,
          sources: {},
          layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0b1020' } }],
        }}
      >
        <Source
          id='drone'
          type='video'
          urls={[
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/87/Schlossbergbahn.webm/Schlossbergbahn.webm.480p.vp9.webm',
          ]}
          coordinates={[
            [-122.51596391201019, 37.56238816766053],
            [-122.51467645168304, 37.56410183312965],
            [-122.51309394836426, 37.563391708549425],
            [-122.51423120498657, 37.56161849366671],
          ]}
        />
        <Layer id='video-layer' type='raster' source='drone' />
      </TestMap>
    </Section>
  )
}

/* ── fitBounds + pitch/bearing (maplibre examples:
      "fit a map to a bounding box" + "set pitch and bearing") ─────────── */

import { useRef } from 'react'

export function ExampleCameraControls() {
  const mapRef = useRef(null)
  const withMap = fn => () => fn(mapRef.current?.getMap())
  return (
    <Section title='Example — fitBounds + setPitch/setBearing'>
      <div className='map-ui'>
        <button
          data-testid='fit-bangladesh'
          onClick={withMap(m =>
            m.fitBounds(
              [
                [88.0, 20.5],
                [92.7, 26.5],
              ],
              { duration: 800 }
            )
          )}
        >
          Fit Bangladesh
        </button>
        <button data-testid='pitch' onClick={withMap(m => m.easeTo({ pitch: 60 }))}>
          Pitch 60
        </button>
        <button data-testid='bearing' onClick={withMap(m => m.easeTo({ bearing: -30 }))}>
          Bearing -30
        </button>
      </div>
      <TestMap ref={mapRef} section='camera-controls' />
    </Section>
  )
}
