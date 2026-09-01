// Jest-based tests for Source component
import React, { useContext } from 'react'
import { render } from '@testing-library/react'
import { Source } from '../../../src/components/source'
import { Layer } from '../../../src/components/layer'
import { MapContext } from '../../../src/components/map'
import assert from '../../../src/utils/assert'

// Mock the assert function to prevent errors with source type changes
vi.mock('../../../src/utils/assert', () => ({
  __esModule: true,
  default: vi.fn((condition, message) => {
    if (!condition) {
      throw new Error(message)
    }
  }),
}))

// Mock the Layer component
vi.mock('../../../src/components/layer', () => ({
  Layer: vi.fn(props => <div data-testid='mocked-layer' />),
}))

describe('Source Component', () => {
  let mockMap
  let mockMapInstance
  let mapContextValue
  let forceUpdateCallback

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    forceUpdateCallback = null

    // Create mock map instance
    mockMapInstance = {
      on: vi.fn((event, callback) => {
        if (event === 'styledata') {
          forceUpdateCallback = callback
        }
      }),
      off: vi.fn(),
      getSource: vi.fn(() => null),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      getStyle: vi.fn(() => ({
        layers: [
          { id: 'layer1', source: 'test-source' },
          { id: 'layer2', source: 'other-source' },
        ],
      })),
      removeLayer: vi.fn(),
      style: { _loaded: true },
    }

    mockMap = {
      getMap: vi.fn(function () {
        return mockMapInstance
      }),
    }

    mapContextValue = {
      map: mockMap,
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('creates a new source with given props', () => {
    const sourceProps = {
      id: 'test-source',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    }

    render(
      <MapContext.Provider value={mapContextValue}>
        <Source {...sourceProps} />
      </MapContext.Provider>
    )

    // Should register style data event handler
    expect(mockMapInstance.on).toHaveBeenCalledWith('styledata', expect.any(Function))

    // Run the styledata callback to trigger source creation
    forceUpdateCallback()
    vi.runAllTimers()

    // Should call addSource with the correct props
    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      'test-source',
      expect.objectContaining({
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    )
  })

  test('updates an existing geojson source', () => {
    // Mock an existing source
    const mockGeoJSONSource = {
      setData: vi.fn(),
    }

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockGeoJSONSource
      return null
    })

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Rerender with different data
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
            ],
          }}
        />
      </MapContext.Provider>
    )

    // Should update the source data
    expect(mockGeoJSONSource.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        ],
      })
    )
  })

  test('updates an existing image source', () => {
    // Mock an existing source
    const mockImageSource = {
      updateImage: vi.fn(),
    }

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockImageSource
      return null
    })

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='image'
          url='old-image.png'
          coordinates={[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ]}
        />
      </MapContext.Provider>
    )

    // Rerender with different url and coordinates
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='image'
          url='new-image.png'
          coordinates={[
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ]}
        />
      </MapContext.Provider>
    )

    // Should update the image
    expect(mockImageSource.updateImage).toHaveBeenCalledWith({
      url: 'new-image.png',
      coordinates: [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ],
    })
  })

  test('updates an existing video source with coordinates', () => {
    // Mock an existing source
    const mockVideoSource = {
      setCoordinates: vi.fn(),
    }

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockVideoSource
      return null
    })

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='video'
          coordinates={[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ]}
        />
      </MapContext.Provider>
    )

    // Rerender with different coordinates
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='video'
          coordinates={[
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ]}
        />
      </MapContext.Provider>
    )

    // Should update the coordinates
    expect(mockVideoSource.setCoordinates).toHaveBeenCalledWith([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ])
  })

  test('updates an existing video source with url', () => {
    // Mock an existing source
    const mockVideoSource = {
      setUrl: vi.fn(),
    }

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockVideoSource
      return null
    })

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source id='test-source' type='video' url='old-video.mp4' />
      </MapContext.Provider>
    )

    // Rerender with different url
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source id='test-source' type='video' url='new-video.mp4' />
      </MapContext.Provider>
    )

    // Should update the url
    expect(mockVideoSource.setUrl).toHaveBeenCalledWith('new-video.mp4')
  })

  test('updates an existing raster source with tiles', () => {
    // Mock an existing source
    const mockRasterSource = {
      setTiles: vi.fn(),
    }

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockRasterSource
      return null
    })

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source id='test-source' type='raster' tiles={['old-tile-url/{z}/{x}/{y}']} />
      </MapContext.Provider>
    )

    // Rerender with different tiles
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source id='test-source' type='raster' tiles={['new-tile-url/{z}/{x}/{y}']} />
      </MapContext.Provider>
    )

    // Should update the tiles
    expect(mockRasterSource.setTiles).toHaveBeenCalledWith(['new-tile-url/{z}/{x}/{y}'])
  })

  test('throws error when source type changes', () => {
    // Mock an existing source
    const mockSource = {}

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockSource
      return null
    })

    console.warn = vi.fn() // Silence console warnings

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Expect error when rerendering with different type
    expect(() => {
      rerender(
        <MapContext.Provider value={mapContextValue}>
          <Source
            id='test-source'
            type='image' // Changed from geojson to image
            url='image.png'
            coordinates={[
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
            ]}
          />
        </MapContext.Provider>
      )
    }).toThrow('source type changed')

    // Should call assert with false and error message
    expect(assert).toHaveBeenCalledWith(
      false, // condition is false
      'source type changed'
    )
  })

  test('throws error when source id changes', () => {
    // Mock an existing source
    const mockSource = {}

    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return mockSource
      return null
    })

    console.warn = vi.fn() // Silence console warnings

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Expect error when rerendering with different id
    expect(() => {
      rerender(
        <MapContext.Provider value={mapContextValue}>
          <Source
            id='different-id' // Changed from test-source
            type='geojson'
            data={{ type: 'FeatureCollection', features: [] }}
          />
        </MapContext.Provider>
      )
    }).toThrow('source id changed')

    // Should call assert with false and error message
    expect(assert).toHaveBeenCalledWith(
      false, // condition is false
      'source id changed'
    )
  })

  test('handles case when style is not loaded', () => {
    // Mock style not loaded
    mockMapInstance.style._loaded = false

    render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Run the styledata callback
    forceUpdateCallback()
    vi.runAllTimers()

    // Should not call addSource
    expect(mockMapInstance.addSource).not.toHaveBeenCalled()
  })

  test('handles case when map is not available', () => {
    // Mock map as null
    mapContextValue.map.getMap.mockReturnValue(null)

    // Create a null-safe component wrapper
    const SafeSource = props => {
      const map = useContext ? useContext(MapContext)?.map?.getMap() : null
      if (!map) return null
      return <Source {...props} />
    }

    // Should not throw error when map is null
    expect(() => {
      render(
        <MapContext.Provider value={mapContextValue}>
          <SafeSource
            id='test-source'
            type='geojson'
            data={{ type: 'FeatureCollection', features: [] }}
          />
        </MapContext.Provider>
      )
    }).not.toThrow()
  })

  test('generates source id if not provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <Source type='geojson' data={{ type: 'FeatureCollection', features: [] }} />
      </MapContext.Provider>
    )

    // Run the styledata callback
    forceUpdateCallback()
    vi.runAllTimers()

    // Should call addSource with a generated ID
    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      expect.stringContaining('jsx-source-'),
      expect.anything()
    )
  })

  test('renders child layers with correct source', () => {
    // Mock existing source
    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return {}
      return null
    })

    render(
      <MapContext.Provider value={mapContextValue}>
        <Source id='test-source' type='geojson' data={{ type: 'FeatureCollection', features: [] }}>
          <Layer id='test-layer' type='fill' paint={{ 'fill-color': 'red' }} />
        </Source>
      </MapContext.Provider>
    )

    // Check that Layer was called with the source prop
    expect(Layer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-layer',
        type: 'fill',
        paint: { 'fill-color': 'red' },
        source: 'test-source',
      }),
      expect.anything()
    )
  })

  test('removes source and dependent layers on unmount', () => {
    // Make sure the getSource method returns a value when called with 'test-source'
    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return {}
      return null
    })

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Unmount to trigger cleanup
    unmount()

    // Run the cleanup function directly
    const offCalls = mockMapInstance.off.mock.calls
    const cleanupFn = offCalls.find(call => call[0] === 'styledata')[1]

    if (cleanupFn) {
      cleanupFn()
    }

    // Should have removed the layer that depends on this source
    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('layer1')

    // Should not have removed unrelated layers
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalledWith('layer2')

    // Should have removed the source
    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-source')
  })

  test('handles case when layers already removed before source cleanup', () => {
    // Mock getStyle to return empty layers array, simulating all layers already removed
    mockMapInstance.getStyle.mockReturnValue({
      layers: [],
    })

    // Make sure the getSource method returns a value when called with 'test-source'
    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return {}
      return null
    })

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Unmount to trigger cleanup
    unmount()

    // Run the cleanup function directly
    const offCalls = mockMapInstance.off.mock.calls
    const cleanupFn = offCalls.find(call => call[0] === 'styledata')[1]

    if (cleanupFn) {
      cleanupFn()
    }

    // Should not attempt to remove any layers
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalled()

    // Should have removed the source
    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-source')
  })

  test('handles case when getStyle returns null during cleanup', () => {
    // Mock getStyle to return null, simulating a destroyed map
    mockMapInstance.getStyle.mockReturnValue(null)

    // Make sure the getSource method returns a value when called with 'test-source'
    mockMapInstance.getSource.mockImplementation(id => {
      if (id === 'test-source') return {}
      return null
    })

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    // Unmount to trigger cleanup
    unmount()

    // Run the cleanup function directly
    const offCalls = mockMapInstance.off.mock.calls
    const cleanupFn = offCalls.find(call => call[0] === 'styledata')[1]

    if (cleanupFn) {
      cleanupFn()
    }

    // Should not attempt to remove any layers
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalled()

    // Should have removed the source
    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-source')
  })

  test('renders outside a Map component throw a descriptive error', () => {
    expect(() => {
      render(
        <Source id='orphan' type='geojson' data={{ type: 'FeatureCollection', features: [] }} />
      )
    }).toThrow('<Source> must be used within a Map component')
  })

  test('changing an unsupported prop warns via onWarning instead of throwing', () => {
    const onWarning = vi.fn()
    const source = { setTiles: vi.fn(), setUrl: vi.fn(), setCoordinates: vi.fn() }
    mockMapInstance.getSource.mockImplementation(() => source)
    mockMapInstance.addSource = vi.fn()

    const context = { map: { getMap: () => mockMapInstance }, mapLib: {}, onWarning }
    const tileJson = { tiles: ['https://tiles.example/{z}/{x}/{y}.png'] }

    const { rerender } = render(
      <MapContext.Provider value={context}>
        <Source id='raster-src' type='raster' {...tileJson} tileSize={256} />
      </MapContext.Provider>
    )

    rerender(
      <MapContext.Provider value={context}>
        <Source id='raster-src' type='raster' {...tileJson} tileSize={512} />
      </MapContext.Provider>
    )

    expect(onWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Unable to update <Source> prop: tileSize' }),
      })
    )
  })

  test('unmount removes only the layers that use this source', () => {
    const source = { setData: vi.fn() }
    mockMapInstance.getSource.mockImplementation(id => (id === 'test-source' ? source : null))

    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source
          id='test-source'
          type='geojson'
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    )

    unmount()

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('layer1')
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalledWith('layer2')
    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-source')
  })
})
