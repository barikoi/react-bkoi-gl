/* global document */
import { expect, test } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import * as maplibregl from 'maplibre-gl'
import { Map } from 'react-bkoi-gl'
import { emptyStyle, waitForMapLoad, actUntil } from './utils'

test('Map renders with real maplibre-gl and applies initialViewState', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const mapRef = { current: null }

  let onloadCalled = 0
  const onLoad = () => onloadCalled++

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
        showBarikoiLogo={false}
        showAttribution={false}
        onLoad={onLoad}
      />
    )
  )

  await waitForMapLoad(mapRef)

  // onLoad fires after the style settles — wait for it explicitly instead of
  // racing isStyleLoaded()
  await actUntil((resolve) => {
    if (onloadCalled > 0) resolve()
  })
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })

  expect(mapRef.current, 'Map is created').toBeTruthy()
  const map = mapRef.current.getMap()
  expect(map.getCenter().lng).toBeCloseTo(90.3938, 6)
  expect(map.getCenter().lat).toBeCloseTo(23.8216, 6)
  expect(map.getZoom()).toBe(12)
  expect(onloadCalled, 'onLoad is called exactly once').toBe(1)

  // Controlled camera update via props
  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        longitude={90.0}
        latitude={23.0}
        zoom={14}
        showBarikoiLogo={false}
        showAttribution={false}
      />
    )
  )

  expect(map.getCenter().lng).toBeCloseTo(90.0, 6)
  expect(map.getCenter().lat).toBeCloseTo(23.0, 6)
  expect(map.getZoom()).toBe(14)

  // No double-firing of the synthetic load event
  expect(onloadCalled, 'onLoad is called exactly once').toBe(1)

  await act(() => root.unmount())
  container.remove()
})

test('Map canvas exists inside the container', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const mapRef = { current: null }

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 10 }}
        showBarikoiLogo={false}
        showAttribution={false}
      />
    )
  )

  await waitForMapLoad(mapRef)

  const canvas = container.querySelector('canvas')
  expect(canvas, 'map canvas is rendered').toBeTruthy()
  expect(canvas.width).toBeGreaterThan(0)

  await act(() => root.unmount())
  container.remove()
})
