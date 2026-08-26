// SOURCES & LAYERS cases — one URL per case: /?case=sources-layers/geojson etc.
import { useState } from 'react'
import { CanvasSource, Layer, Source } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

const geojsonData = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Point A' }, geometry: { type: 'Point', coordinates: [90.3938, 23.8216] } },
    { type: 'Feature', properties: { name: 'Point B' }, geometry: { type: 'Point', coordinates: [90.4, 23.83] } },
  ],
}

const polygonData = {
  type: 'Feature',
  properties: { name: 'Polygon Area' },
  geometry: { type: 'Polygon', coordinates: [[[90.38, 23.81], [90.41, 23.81], [90.41, 23.84], [90.38, 23.84], [90.38, 23.81]]] },
}

const cities = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Dhaka', population: 21000000 }, geometry: { type: 'Point', coordinates: [90.3938, 23.8216] } },
    { type: 'Feature', properties: { name: 'Chittagong', population: 4000000 }, geometry: { type: 'Point', coordinates: [91.8317, 22.3569] } },
    { type: 'Feature', properties: { name: 'Khulna', population: 1500000 }, geometry: { type: 'Point', coordinates: [89.5555, 22.8456] } },
  ],
}

export function SourceGeojson() {
  return (
    <Section title="GeoJSON source — circle + fill + line layers">
      <TestMap section="geojson" initialViewState={{ longitude: 90.4, latitude: 23.83, zoom: 12 }}>
        <Source id="points" type="geojson" data={geojsonData}>
          <Layer id="points-layer" type="circle" paint={{ 'circle-radius': 10, 'circle-color': '#007cbf' }} />
        </Source>
        <Source id="polygon" type="geojson" data={polygonData}>
          <Layer id="polygon-fill" type="fill" paint={{ 'fill-color': '#088', 'fill-opacity': 0.4 }} />
          <Layer id="polygon-outline" type="line" paint={{ 'line-color': '#000', 'line-width': 2 }} />
        </Source>
      </TestMap>
    </Section>
  )
}

export function LayerDataDriven() {
  return (
    <Section title="Data-driven styling + filter">
      <TestMap section="data-driven" initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 6 }}>
        <Source id="cities" type="geojson" data={cities}>
          <Layer
            id="cities-circles"
            type="circle"
            paint={{
              'circle-radius': ['*', 0.000001, ['get', 'population']],
              'circle-color': ['interpolate', ['linear'], ['get', 'population'], 1000000, '#51bbd6', 5000000, '#f1f075', 20000000, '#f28cb1'],
            }}
          />
          <Layer
            id="large-cities"
            type="circle"
            filter={['>', ['get', 'population'], 5000000]}
            paint={{ 'circle-radius': 20, 'circle-color': '#ff0000' }}
          />
        </Source>
      </TestMap>
    </Section>
  )
}

export function LayerEvents() {
  const [hovered, setHovered] = useState(false)
  return (
    <Section title="Layer events — hover / click">
      <TestMap section="layer-events">
        <Source id="places" type="geojson" data={geojsonData}>
          <Layer
            id="places-layer"
            type="circle"
            paint={{ 'circle-radius': hovered ? 16 : 8, 'circle-color': hovered ? '#FF0000' : '#007cbf' }}
            onClick={(e) => window.__log({ type: 'layer-click', name: e.features[0].properties.name })}
            onMouseEnter={(e) => {
              setHovered(true)
              window.__log({ type: 'layer-enter' })
            }}
            onMouseLeave={() => {
              setHovered(false)
              window.__log({ type: 'layer-leave' })
            }}
          />
        </Source>
        <span data-testid="hover-state" style={{ display: 'none' }}>{hovered ? 'hovered' : 'idle'}</span>
      </TestMap>
    </Section>
  )
}

export function SourceCanvas() {
  const [canvasEl, setCanvasEl] = useState(null)

  // Map renders children only after the maplibre instance exists, so the
  // canvas commits later than a []-deps effect — draw in the ref callback.
  // Bangladesh flag: green field, red disc slightly left of center.
  const attachCanvas = (canvas) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#006a4e'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#f42a41'
    ctx.beginPath()
    ctx.arc(115, 128, 50, 0, 2 * Math.PI)
    ctx.fill()
    setCanvasEl(canvas)
  }

  return (
    <Section title="CanvasSource — animated raster">
      <TestMap section="canvas">
        <canvas ref={attachCanvas} width={256} height={256} style={{ display: 'none' }} />
        {canvasEl && (
          <CanvasSource
            id="my-canvas"
            coordinates={[[90.38, 23.83], [90.41, 23.83], [90.41, 23.81], [90.38, 23.81]]}
            canvas={canvasEl}
            animate={true}
          >
            <Layer type="raster" paint={{ 'raster-opacity': 0.8 }} />
          </CanvasSource>
        )}
      </TestMap>
    </Section>
  )
}
