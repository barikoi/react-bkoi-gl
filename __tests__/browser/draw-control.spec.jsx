/* global document */
import { expect, test, vi } from 'vitest'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import * as maplibregl from 'maplibre-gl'
import { Map, DrawControl } from 'react-bkoi-gl'
import { emptyStyle, waitForMapLoad, waitFor } from './utils'

// Real-browser draw flows are timing-sensitive: maplibre-gl-draw connects via
// a 16ms loaded() poll after mount. Give these tests headroom over the 5s default.
vi.setConfig({ testTimeout: 30000 })

test('DrawControl renders its toolbar and applies style to the container', async () => {
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
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        <DrawControl
          position="top-left"
          controls={{ point: true, line_string: false, polygon: false, trash: false }}
          style={{ opacity: 0.5, zIndex: 5 }}
        />
      </Map>
    )
  )

  await waitForMapLoad(mapRef)

  const pointBtn = container.querySelector('.mapbox-gl-draw_point')
  expect(pointBtn, 'draw point tool is rendered').toBeTruthy()
  expect(container.querySelector('.mapbox-gl-draw_trash'), 'trash tool hidden by controls prop').toBeNull()

  // Regression (v3.0.0 fix): the `style` prop must reach the control container.
  // maplibre-gl-draw exposes no _container; the wrapper captures the corner child.
  const ctrlGroup = container.querySelector('.maplibregl-ctrl-top-left .maplibregl-ctrl-group')
  expect(ctrlGroup, 'draw control container captured').toBeTruthy()
  expect(ctrlGroup.style.opacity).toBe('0.5')
  expect(ctrlGroup.style.zIndex).toBe('5')

  await act(() => root.unmount())
  expect(container.querySelector('.mapbox-gl-draw_point'), 'toolbar removed on unmount').toBeNull()
  container.remove()
})

test('DrawControl creates a point from real canvas events', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const mapRef = { current: null }
  const created = []

  await act(() =>
    root.render(
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={emptyStyle}
        initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
       
        showAttribution={false}
      >
        <DrawControl
          position="top-left"
          controls={{ point: true, line_string: false, polygon: false, trash: false }}
          onDrawCreate={(e) => created.push(...(e.features || []))}
        />
      </Map>
    )
  )

  await waitForMapLoad(mapRef)
  const map = mapRef.current.getMap()

  // Draw connects lazily (polls map.loaded()); wait until it has added its
  // sources and attached its canvas listeners, otherwise events are dropped.
  await waitFor(() => Boolean(map.getSource('mapbox-gl-draw-cold')))

  // Activate the point tool, then click the map canvas center:
  // mousedown + mouseup at the same point = draw's click path (DrawPoint.onClick)
  const pointBtn = container.querySelector('.mapbox-gl-draw_point')
  await act(() => {
    pointBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  const canvas = container.querySelector('canvas')
  const rect = canvas.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  await act(() => {
    canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: cx, clientY: cy }))
    canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: cx, clientY: cy }))
  })

  await waitFor(() => created.length > 0)

  expect(created, 'draw.create fired').toHaveLength(1)
  expect(created[0].geometry.type).toBe('Point')

  await act(() => root.unmount())
  container.remove()
})
