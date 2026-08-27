// SOURCES & LAYERS cases — one URL per case: /?case=sources-layers/geojson etc.
import { useState } from 'react'
import { CanvasSource, Layer, Source } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

const geojsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Point A' },
      geometry: { type: 'Point', coordinates: [90.3938, 23.8216] },
    },
    {
      type: 'Feature',
      properties: { name: 'Point B' },
      geometry: { type: 'Point', coordinates: [90.4, 23.83] },
    },
  ],
}

const polygonData = {
  type: 'Feature',
  properties: { name: 'Polygon Area' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [90.38, 23.81],
        [90.41, 23.81],
        [90.41, 23.84],
        [90.38, 23.84],
        [90.38, 23.81],
      ],
    ],
  },
}

const cities = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Dhaka', population: 21000000 },
      geometry: { type: 'Point', coordinates: [90.3938, 23.8216] },
    },
    {
      type: 'Feature',
      properties: { name: 'Chittagong', population: 4000000 },
      geometry: { type: 'Point', coordinates: [91.8317, 22.3569] },
    },
    {
      type: 'Feature',
      properties: { name: 'Khulna', population: 1500000 },
      geometry: { type: 'Point', coordinates: [89.5555, 22.8456] },
    },
  ],
}

export function SourceGeojson() {
  return (
    <Section title='GeoJSON source — circle + fill + line layers'>
      <TestMap section='geojson' initialViewState={{ longitude: 90.4, latitude: 23.83, zoom: 12 }}>
        <Source id='points' type='geojson' data={geojsonData}>
          <Layer
            id='points-layer'
            type='circle'
            paint={{ 'circle-radius': 10, 'circle-color': '#007cbf' }}
          />
        </Source>
        <Source id='polygon' type='geojson' data={polygonData}>
          <Layer
            id='polygon-fill'
            type='fill'
            paint={{ 'fill-color': '#088', 'fill-opacity': 0.4 }}
          />
          <Layer
            id='polygon-outline'
            type='line'
            paint={{ 'line-color': '#000', 'line-width': 2 }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

export function LayerDataDriven() {
  return (
    <Section title='Data-driven styling — city size + color by population'>
      <TestMap
        section='data-driven'
        initialViewState={{ longitude: 90.2, latitude: 23.2, zoom: 5.8 }}
      >
        <Source id='cities' type='geojson' data={cities}>
          {/* Radius AND color scale with population — Dhaka dwarfs the rest */}
          <Layer
            id='cities-circles'
            type='circle'
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'population'],
                1000000,
                8,
                5000000,
                18,
                20000000,
                34,
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'population'],
                1000000,
                '#51bbd6',
                5000000,
                '#f1f075',
                20000000,
                '#f28cb1',
              ],
              'circle-stroke-color': '#333',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.85,
            }}
          />
          {/* Filter layer: only cities over 5M get the red ring */}
          <Layer
            id='large-cities'
            type='circle'
            filter={['>', ['get', 'population'], 5000000]}
            paint={{
              'circle-radius': 44,
              'circle-color': 'transparent',
              'circle-stroke-color': '#d7191c',
            }}
          />
          <Layer
            id='city-labels'
            type='symbol'
            layout={{
              'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['get', 'population']]],
              'text-size': 13,
              'text-offset': [0, 0.8],
              'text-anchor': 'top',
            }}
            paint={{ 'text-halo-color': '#fff', 'text-halo-width': 1.5 }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

export function LayerEvents() {
  const [hovered, setHovered] = useState(false)
  const [name, setName] = useState('')
  return (
    <Section title='Layer events — hover a point (grows + turns red), click for its name'>
      {/* Visible badge shows the live hover/click state */}
      <div
        data-testid='hover-badge'
        style={{
          position: 'absolute',
          top: 56,
          left: 12,
          zIndex: 5,
          background: hovered ? '#FF0000' : '#007cbf',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        {hovered ? `Hovering: ${name || '…'}` : 'Hover a point'}
      </div>
      <TestMap section='layer-events'>
        <Source id='places' type='geojson' data={geojsonData}>
          <Layer
            id='places-layer'
            type='circle'
            paint={{
              'circle-radius': hovered ? 22 : 10,
              'circle-color': hovered ? '#FF0000' : '#007cbf',
              'circle-stroke-color': '#fff',
              'circle-stroke-width': hovered ? 3 : 1,
            }}
            onClick={e =>
              window.__log({ type: 'layer-click', name: e.features[0].properties.name })
            }
            onMouseEnter={e => {
              setHovered(true)
              setName(e.features?.[0]?.properties?.name ?? '')
              window.__log({ type: 'layer-enter' })
            }}
            onMouseLeave={() => {
              setHovered(false)
              window.__log({ type: 'layer-leave' })
            }}
          />
        </Source>
        <span data-testid='hover-state' style={{ display: 'none' }}>
          {hovered ? 'hovered' : 'idle'}
        </span>
      </TestMap>
    </Section>
  )
}

export function SourceCanvas() {
  const [canvasEl, setCanvasEl] = useState(null)

  // Map renders children only after the maplibre instance exists, so the
  // canvas commits later than a []-deps effect — draw in the ref callback.
  // Animated Bangladesh flag: green field, red disc, sine "wave" sweep.
  const attachCanvas = canvas => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const draw = t => {
      const wave = x => Math.sin(x / 22 + t / 280) * 3.2
      ctx.clearRect(0, 0, 256, 256)
      // green field with a vertical wave shading
      for (let x = 0; x < 256; x += 4) {
        const y = wave(x)
        ctx.fillStyle = '#006a4e'
        ctx.fillRect(x, 8 + y, 4, 240)
        ctx.fillStyle = 'rgba(255,255,255,0.10)'
        ctx.fillRect(x, 8 + y, 4, 10)
      }
      // red disc, gently bobbing with the wave at its center
      const cx = 115,
        cy = 128 + wave(115)
      ctx.fillStyle = '#f42a41'
      ctx.beginPath()
      ctx.arc(cx, cy, 50, 0, 2 * Math.PI)
      ctx.fill()
      // Throttled animation evidence log (every ~30 frames, not 60/s)
      if (!((t / 16) | 0) % 30) window.__log({ type: 'canvas-frame' })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    setCanvasEl(canvas)
    return () => cancelAnimationFrame(raf)
  }

  return (
    <Section title='CanvasSource — animated raster'>
      <TestMap section='canvas'>
        <canvas ref={attachCanvas} width={256} height={256} style={{ display: 'none' }} />
        {canvasEl && (
          <CanvasSource
            id='my-canvas'
            coordinates={[
              [90.38, 23.83],
              [90.41, 23.83],
              [90.41, 23.81],
              [90.38, 23.81],
            ]}
            canvas={canvasEl}
            animate={true}
          >
            <Layer type='raster' paint={{ 'raster-opacity': 0.8 }} />
          </CanvasSource>
        )}
      </TestMap>
    </Section>
  )
}
