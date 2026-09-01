// Jest-based tests for CanvasSource
import React from 'react'
import { render } from '@testing-library/react'
import { CanvasSource } from '../../../src/components/canvas-source'
import { MapContext } from '../../../src/components/map'
import { Layer } from '../../../src/components/layer'

// Mock the Layer component
vi.mock('../../../src/components/layer', () => ({
  Layer: vi.fn(props => <div data-testid='mocked-layer' data-source={props.source} />),
}))

describe('CanvasSource', () => {
  let mockMapInstance
  let mapContextValue

  const mockCanvas = document.createElement('canvas')
  mockCanvas.width = 256
  mockCanvas.height = 256

  const coordinates = [
    [90.38, 23.83], // top-left
    [90.41, 23.83], // top-right
    [90.41, 23.81], // bottom-right
    [90.38, 23.81], // bottom-left
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    mockMapInstance = {
      on: vi.fn(),
      off: vi.fn(),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      getSource: vi.fn(() => null),
      getLayer: vi.fn(() => null),
      getStyle: vi.fn(() => ({ layers: [] })),
      isStyleLoaded: vi.fn(() => true),
      style: { _loaded: true },
    }

    mapContextValue = {
      map: {
        getMap: () => mockMapInstance,
      },
    }
  })

  test('creates canvas source with required props', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='test-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      'test-canvas',
      expect.objectContaining({
        type: 'canvas',
        coordinates,
        canvas: mockCanvas,
      })
    )
  })

  test('supports animate option', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource
          id='test-canvas'
          coordinates={coordinates}
          canvas={mockCanvas}
          animate={true}
        />
      </MapContext.Provider>
    )

    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      'test-canvas',
      expect.objectContaining({
        animate: true,
      })
    )
  })

  test('generates id if not provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      expect.stringContaining('canvas-source'),
      expect.objectContaining({
        type: 'canvas',
      })
    )
  })

  test('renders children with source prop', () => {
    mockMapInstance.getSource.mockReturnValue({ type: 'canvas' })

    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='test-canvas' coordinates={coordinates} canvas={mockCanvas}>
          <Layer id='test-layer' type='raster' />
        </CanvasSource>
      </MapContext.Provider>
    )

    expect(Layer).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test-canvas',
      }),
      expect.anything()
    )
  })

  test('removes source on unmount', () => {
    // Mock source as existing so cleanup runs
    mockMapInstance.getSource.mockReturnValue({ type: 'canvas' })

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='test-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-canvas')
  })

  test('removes dependent layers when source is removed', () => {
    // Add removeLayer to mock
    mockMapInstance.removeLayer = vi.fn()
    // Mock source as existing so cleanup runs
    mockMapInstance.getSource.mockReturnValue({ type: 'canvas' })
    mockMapInstance.getStyle.mockReturnValue({
      layers: [
        { id: 'layer1', source: 'test-canvas' },
        { id: 'layer2', source: 'other-source' },
      ],
    })

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='test-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('layer1')
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalledWith('layer2')
  })

  test('retries until style load completes (v3 race regression)', () => {
    // Race: styledata fires while isStyleLoaded() is still false (v6 can
    // report false even at 'load' time) — the source must still be added
    // when 'load' fires (v3 lost this race and never added the source).
    const listeners = {}
    let styleLoaded = false
    const racingMap = {
      ...mockMapInstance,
      on: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      once: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      off: vi.fn(),
      isStyleLoaded: vi.fn(() => styleLoaded),
      addSource: vi.fn(),
    }
    mapContextValue = { map: { getMap: () => racingMap } }

    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='racing-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    // Early styledata: style not loaded yet → addSource deferred
    listeners.styledata[0]()
    expect(racingMap.addSource).not.toHaveBeenCalled()

    // Map 'load' fires (isStyleLoaded still false in v6) → source added
    listeners.load[0]()
    expect(racingMap.addSource).toHaveBeenCalledWith(
      'racing-canvas',
      expect.objectContaining({ type: 'canvas' })
    )
  })

  test('styledata after the style loads adds the source via the re-armed listener', () => {
    const listeners = {}
    let styleLoaded = false
    const lateMap = {
      ...mockMapInstance,
      on: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      once: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      off: vi.fn(),
      isStyleLoaded: vi.fn(() => styleLoaded),
      addSource: vi.fn(),
    }
    mapContextValue = { map: { getMap: () => lateMap } }

    render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='late-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    // First styledata: not loaded yet → deferred
    listeners.styledata[0]()
    expect(lateMap.addSource).not.toHaveBeenCalled()

    // Style completes; the same listener now adds the source
    styleLoaded = true
    listeners.styledata[0]()
    expect(lateMap.addSource).toHaveBeenCalledWith(
      'late-canvas',
      expect.objectContaining({ type: 'canvas' })
    )
  })

  test('rerender with new coordinates calls setCoordinates on the source', () => {
    const source = { setCoordinates: vi.fn() }
    mockMapInstance.getSource.mockImplementation(() => source)

    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='coord-canvas' coordinates={coordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    const nextCoordinates = [
      [91.38, 24.83],
      [91.41, 24.83],
      [91.41, 24.81],
      [91.38, 24.81],
    ]
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='coord-canvas' coordinates={nextCoordinates} canvas={mockCanvas} />
      </MapContext.Provider>
    )

    expect(source.setCoordinates).toHaveBeenCalledWith(nextCoordinates)
  })

  test('renders children only after the async style load (regression)', async () => {
    // Source added asynchronously on 'load' — children must appear once the
    // source lands (v3 returned null forever with no re-render).
    const listeners = {}
    let added = false
    const racingMap = {
      ...mockMapInstance,
      on: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      once: vi.fn((event, handler) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      off: vi.fn(),
      isStyleLoaded: vi.fn(() => false),
      addSource: vi.fn(() => {
        added = true
      }),
      getSource: vi.fn(() => (added ? { type: 'canvas' } : null)),
    }
    mapContextValue = { map: { getMap: () => racingMap } }

    const { container } = render(
      <MapContext.Provider value={mapContextValue}>
        <CanvasSource id='late-canvas' coordinates={coordinates} canvas={mockCanvas}>
          <Layer id='late-layer' type='raster' />
        </CanvasSource>
      </MapContext.Provider>
    )

    // Before load: no children
    expect(container.querySelector('[data-testid="mocked-layer"]')).toBeNull()

    // After 'load': source added, children render with the source id
    const { act } = await import('@testing-library/react')
    act(() => {
      listeners.load[0]()
    })
    const layer = container.querySelector('[data-testid="mocked-layer"]')
    expect(layer).not.toBeNull()
    expect(layer.getAttribute('data-source')).toBe('late-canvas')
  })
})
