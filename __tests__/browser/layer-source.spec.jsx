/* global document */
import { expect, test } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import * as maplibregl from 'maplibre-gl'
import { Map, Source, Layer } from 'react-bkoi-gl'
import { geojsonStyle, waitForMapLoad } from './utils'

test('Source + Layer render a real GeoJSON feature', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const mapRef = { current: null }

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={geojsonStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        <Source id="extra" type="geojson" data={geojsonStyle.sources.points.data} />
        <Layer
          id="extra-circle"
          type="circle"
          source="extra"
          paint={{ 'circle-radius': 6, 'circle-color': '#ff0000' }}
        />
      </Map>
    )
  )

  await waitForMapLoad(mapRef)

  const map = mapRef.current.getMap()

  // Wait until the layer has been added and is queryable
  await act(async () => {
    for (let i = 0; i < 20 && !map.getLayer('extra-circle'); i++) {
      await new Promise((r) => setTimeout(r, 50))
    }
  })

  expect(map.getSource('extra'), 'GeoJSON source is registered').toBeTruthy()
  expect(map.getLayer('extra-circle'), 'circle layer is registered').toBeTruthy()

  // The rendered layer actually draws the feature (real WebGL pipeline)
  const features = map.queryRenderedFeatures({
    layers: ['extra-circle'],
  })
  expect(features, 'feature is rendered by the real maplibre pipeline').toHaveLength(1)
  expect(features[0].geometry.coordinates[0]).toBeCloseTo(90.3938, 5)
  expect(features[0].geometry.coordinates[1]).toBeCloseTo(23.8216, 5)

  await act(() => root.unmount())
  container.remove()
})
