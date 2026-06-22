// Jest-based tests for Layer events
import React from 'react'
import { render } from '@testing-library/react'
import { Layer } from '../../src/components/layer'
import { MapContext } from '../../src/components/map'

// Mock the assert function
jest.mock('../../src/utils/assert', () => {
  return jest.fn((condition, message) => {
    if (!condition) {
      throw new Error(message)
    }
  })
})

describe('Layer Events', () => {
  let mockMapInstance
  let mapContextValue

  beforeEach(() => {
    jest.clearAllMocks()

    mockMapInstance = {
      on: jest.fn(),
      off: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getLayer: jest.fn(() => null),
      getSource: jest.fn(() => null),
      setLayoutProperty: jest.fn(),
      setPaintProperty: jest.fn(),
      setFilter: jest.fn(),
      setLayerZoomRange: jest.fn(),
      moveLayer: jest.fn(),
      getCanvas: jest.fn(() => ({ style: {} })),
      style: { _loaded: true },
    }

    mapContextValue = {
      map: {
        getMap: () => mockMapInstance,
      },
      mapLib: {
        Map: jest.fn(),
      },
    }
  })

  test('registers click event handler when onClick is provided', () => {
    const onClick = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onClick={onClick} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('click', 'test-layer', expect.any(Function))
  })

  test('registers mouseenter event handler when onMouseEnter is provided', () => {
    const onMouseEnter = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseEnter={onMouseEnter} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mouseenter', 'test-layer', expect.any(Function))
  })

  test('registers mouseleave event handler when onMouseLeave is provided', () => {
    const onMouseLeave = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseLeave={onMouseLeave} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mouseleave', 'test-layer', expect.any(Function))
  })

  test('registers mousemove event handler when onMouseMove is provided', () => {
    const onMouseMove = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseMove={onMouseMove} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mousemove', 'test-layer', expect.any(Function))
  })

  test('registers mousedown event handler when onMouseDown is provided', () => {
    const onMouseDown = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onMouseDown={onMouseDown} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.on).toHaveBeenCalledWith('mousedown', 'test-layer', expect.any(Function))
  })

  test('registers mouseup event handler when onMouseUp is provided', () => {
    const onMouseUp = jest.fn()

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
    const onClick = jest.fn()

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer id="test-layer" type="circle" onClick={onClick} />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.off).toHaveBeenCalledWith('click', 'test-layer', expect.any(Function))
  })

  test('removes all event handlers on unmount', () => {
    const onClick = jest.fn()
    const onMouseEnter = jest.fn()
    const onMouseLeave = jest.fn()

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
