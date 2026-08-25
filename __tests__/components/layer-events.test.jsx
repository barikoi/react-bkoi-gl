// Jest-based tests for Layer events
import React from 'react'
import { render } from '@testing-library/react'
import { Layer } from '../../src/components/layer'
import { MapContext } from '../../src/components/map'

// Mock the assert function
vi.mock('../../src/utils/assert', () => ({
  __esModule: true,
  default: vi.fn((condition, message) => {
    if (!condition) {
      throw new Error(message)
    }
  })
}))

describe('Layer Events', () => {
  let mockMapInstance
  let mapContextValue

  beforeEach(() => {
    vi.clearAllMocks()

    mockMapInstance = {
      on: vi.fn(),
      off: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getLayer: vi.fn(() => null),
      getSource: vi.fn(() => null),
      setLayoutProperty: vi.fn(),
      setPaintProperty: vi.fn(),
      setFilter: vi.fn(),
      setLayerZoomRange: vi.fn(),
      moveLayer: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
      style: { _loaded: true },
    }

    mapContextValue = {
      map: {
        getMap: () => mockMapInstance,
      },
      mapLib: {
        Map: vi.fn(),
      },
    }
  })

  test('registers click event handler when onClick is provided', () => {
    const onClick = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onClick={onClick} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('click', 'test-layer', expect.any(Function))
  })

  test('registers mouseenter event handler when onMouseEnter is provided', () => {
    const onMouseEnter = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseEnter={onMouseEnter} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mouseenter', 'test-layer', expect.any(Function))
  })

  test('registers mouseleave event handler when onMouseLeave is provided', () => {
    const onMouseLeave = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseLeave={onMouseLeave} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mouseleave', 'test-layer', expect.any(Function))
  })

  test('registers mousemove event handler when onMouseMove is provided', () => {
    const onMouseMove = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseMove={onMouseMove} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mousemove', 'test-layer', expect.any(Function))
  })

  test('registers mousedown event handler when onMouseDown is provided', () => {
    const onMouseDown = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseDown={onMouseDown} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mousedown', 'test-layer', expect.any(Function))
  })

  test('registers mouseup event handler when onMouseUp is provided', () => {
    const onMouseUp = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseUp={onMouseUp} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mouseup', 'test-layer', expect.any(Function))
  })

  test('does not register event handlers when no event props are provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" paint={{ 'circle-radius': 8 }} />
      </MapContext.Provider>
    )

    // Should only have styledata event
    const eventTypes = mockMapInstance.on.mock.calls.map(call => call[0])
    expect(eventTypes).not.toContain('click')
    expect(eventTypes).not.toContain('mouseenter')
    expect(eventTypes).not.toContain('mouseleave')
    expect(eventTypes).not.toContain('mousemove')
    expect(eventTypes).not.toContain('mousedown')
    expect(eventTypes).not.toContain('mouseup')
  })

  test('cleanup removes event handlers on unmount', () => {
    const onClick = vi.fn()

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onClick={onClick} />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.off).toHaveBeenCalledWith('click', 'test-layer', expect.any(Function))
  })

  test('removes all event handlers on unmount', () => {
    const onClick = vi.fn()
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer
          id="test-layer"
          type="circle"
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.off).toHaveBeenCalledWith('click', 'test-layer', expect.any(Function))
    expect(mockMapInstance.off).toHaveBeenCalledWith('mouseenter', 'test-layer', expect.any(Function))
    expect(mockMapInstance.off).toHaveBeenCalledWith('mouseleave', 'test-layer', expect.any(Function))
  })
})
