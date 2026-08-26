/* global document */
import { expect, test } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import * as maplibregl from 'maplibre-gl'
import { Map, NavigationControl, ScaleControl } from 'react-bkoi-gl'
import { emptyStyle, waitForMapLoad, actUntil } from './utils'

// Follows react-map-gl's controls.spec.jsx: sequential re-renders on one Map.
test('Controls render and are removed with the map', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const mapRef = { current: null }

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    )
  )
  await waitForMapLoad(mapRef)

  expect(
    container.querySelector('.maplibregl-ctrl-zoom-in'),
    'Rendered <NavigationControl />'
  ).toBeTruthy()
  expect(
    container.querySelector('.maplibregl-ctrl-zoom-out'),
    'Zoom-out button rendered'
  ).toBeTruthy()
  expect(
    container.querySelector('.maplibregl-ctrl-compass'),
    'Compass hidden with showCompass={false}'
  ).toBeNull()

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        <ScaleControl position="bottom-left" />
      </Map>
    )
  )
  expect(
    container.querySelector('.maplibregl-ctrl-scale'),
    'Rendered <ScaleControl />'
  ).toBeTruthy()
  expect(
    container.querySelector('.maplibregl-ctrl-zoom-in'),
    'NavigationControl removed after swap'
  ).toBeNull()

  await act(() => root.unmount())
  expect(
    container.querySelector('.maplibregl-ctrl-scale'),
    'ScaleControl removed on unmount'
  ).toBeNull()
})

test('NavigationControl zoom-in button eases the camera', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const mapRef = { current: null }

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 10 }}
       
        showAttribution={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    )
  )
  await waitForMapLoad(mapRef)
  const map = mapRef.current.getMap()

  const zoomBefore = map.getZoom()
  const zoomInBtn = container.querySelector('.maplibregl-ctrl-zoom-in')
  await act(() => {
    zoomInBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  // zoomIn eases the camera — wait for the animation to settle
  await actUntil((resolve) => {
    map.once('zoomend', () => resolve())
  })

  expect(map.getZoom()).toBeCloseTo(zoomBefore + 1, 5)

  await act(() => root.unmount())

  // Full cleanup: canvas and control containers leave the DOM
  expect(container.querySelector('canvas'), 'canvas removed after unmount').toBeNull()
  expect(container.querySelector('.maplibregl-ctrl'), 'ctrl containers removed after unmount').toBeNull()
})
