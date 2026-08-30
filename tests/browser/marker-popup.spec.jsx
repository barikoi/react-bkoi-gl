/* global document */
import { expect, test } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import * as maplibregl from 'maplibre-gl'
import { Map, Marker, Popup } from 'react-bkoi-gl'
import { emptyStyle, waitForMapLoad, waitFor } from './utils'

test('Marker renders at the given position', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const markerRef = { current: null }
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
        <Marker ref={markerRef} longitude={90.3938} latitude={23.8216} />
      </Map>
    )
  )

  await waitForMapLoad(mapRef)

  expect(markerRef.current, 'Marker is created').toBeTruthy()
  expect(markerRef.current.getLngLat().lng).toBeCloseTo(90.3938, 6)
  expect(markerRef.current.getLngLat().lat).toBeCloseTo(23.8216, 6)

  const markerEl = document.querySelector('.maplibregl-marker')
  expect(markerEl, 'marker element is in the DOM').toBeTruthy()

  await act(() => root.unmount())
  container.remove()
})

test('Popup opens with content and closes', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  let showPopup = true

  await act(() =>
    root.render(
      <Map
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        {showPopup && (
          <Popup longitude={90.3938} latitude={23.8216} closeButton={false}>
            <div data-testid="popup-content">Hello Barikoi</div>
          </Popup>
        )}
      </Map>
    )
  )

  // Popup content is portaled into the map container — poll until opened
  await waitFor(() => Boolean(document.querySelector('[data-testid="popup-content"]')))
  const content = document.querySelector('[data-testid="popup-content"]')
  expect(content, 'popup content is rendered').toBeTruthy()
  expect(content.textContent).toBe('Hello Barikoi')

  // Remove the popup — portal content unmounts
  showPopup = false
  await act(() =>
    root.render(
      <Map
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      />
    )
  )
  await waitFor(() => !document.querySelector('[data-testid="popup-content"]'))
  expect(document.querySelector('[data-testid="popup-content"]')).toBeNull()

  await act(() => root.unmount())
  container.remove()
})
