// Jest-based tests for CanvasSource
import React from 'react'
import { render } from '@testing-library/react'
import { CanvasSource } from '../../src/components/canvas-source'
import { MapContext } from '../../src/components/map'
import { Layer } from '../../src/components/layer'

// Mock the Layer component
jest.mock('../../src/components/layer', () => ({
  Layer: jest.fn(props => <div data-testid="mocked-layer" data-source={props.source} />),
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
    jest.clearAllMocks()

    mockMapInstance = {
      on: jest.fn(),
      off: jest.fn(),
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn(() => null),
      getLayer: jest.fn(() => null),
      getStyle: jest.fn(() => ({ layers: [] })),
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
        <CanvasSource
          id="test-canvas"
          coordinates={coordinates}
          canvas={mockCanvas}
        />
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
          id="test-canvas"
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
        <CanvasSource
          coordinates={coordinates}
          canvas={mockCanvas}
        />
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
        <CanvasSource
          id="test-canvas"
          coordinates={coordinates}
          canvas={mockCanvas}
        >
          <Layer id="test-layer" type="raster" />
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
        <CanvasSource
          id="test-canvas"
          coordinates={coordinates}
          canvas={mockCanvas}
        />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-canvas')
  })

  test('removes dependent layers when source is removed', () => {
    // Add removeLayer to mock
    mockMapInstance.removeLayer = jest.fn()
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
        <CanvasSource
          id="test-canvas"
          coordinates={coordinates}
          canvas={mockCanvas}
        />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('layer1')
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalledWith('layer2')
  })
})
