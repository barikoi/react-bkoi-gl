// Jest-based tests for Source component
import React from 'react';
import { render, act } from '@testing-library/react';
import { Source } from '../../src/components/source';
import { Layer } from '../../src/components/layer';
import { MapContext } from '../../src/components/map';

// Mock the assert function to prevent errors with source type changes
jest.mock('../../src/utils/assert', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the Layer component
jest.mock('../../src/components/layer', () => ({
  Layer: jest.fn(props => <div data-testid="mocked-layer" />)
}));

describe('Source Component', () => {
  let mockMap;
  let mockMapInstance;
  let mapContextValue;
  let forceUpdateCallback;

  beforeEach(() => {
    jest.useFakeTimers();
    forceUpdateCallback = null;
    
    // Create mock map instance
    mockMapInstance = {
      on: jest.fn((event, callback) => {
        if (event === 'styledata') {
          forceUpdateCallback = callback;
        }
      }),
      off: jest.fn(),
      getSource: jest.fn(() => null),
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getStyle: jest.fn(() => ({
        layers: [
          { id: 'layer1', source: 'test-source' },
          { id: 'layer2', source: 'other-source' },
        ]
      })),
      removeLayer: jest.fn(),
      style: { _loaded: true }
    };

    mockMap = {
      getMap: jest.fn(() => mockMapInstance)
    };

    mapContextValue = {
      map: mockMap
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('creates a new source with given props', () => {
    const sourceProps = {
      id: 'test-source',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    };

    render(
      <MapContext.Provider value={mapContextValue}>
        <Source {...sourceProps} />
      </MapContext.Provider>
    );

    // Should register style data event handler
    expect(mockMapInstance.on).toHaveBeenCalledWith('styledata', expect.any(Function));
    
    // Advance timers to trigger the forceUpdate
    act(() => {
      forceUpdateCallback();
      jest.runAllTimers();
    });

    // Should call addSource with the correct props
    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      'test-source',
      expect.objectContaining({
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
    );
  });

  test('updates an existing geojson source', () => {
    // Mock an existing source
    const mockGeoJSONSource = {
      setData: jest.fn()
    };
    
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return mockGeoJSONSource;
      return null;
    });

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="geojson"
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    );

    // Rerender with different data
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="geojson"
          data={{ 
            type: 'FeatureCollection', 
            features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }] 
          }}
        />
      </MapContext.Provider>
    );

    // Should update the source data
    expect(mockGeoJSONSource.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection', 
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }]
      })
    );
  });

  test('updates an existing image source', () => {
    // Mock an existing source
    const mockImageSource = {
      updateImage: jest.fn()
    };
    
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return mockImageSource;
      return null;
    });

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="image"
          url="old-image.png"
          coordinates={[[0, 0], [1, 0], [1, 1], [0, 1]]}
        />
      </MapContext.Provider>
    );

    // Rerender with different url and coordinates
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="image"
          url="new-image.png"
          coordinates={[[0, 0], [2, 0], [2, 2], [0, 2]]}
        />
      </MapContext.Provider>
    );

    // Should update the image
    expect(mockImageSource.updateImage).toHaveBeenCalledWith({
      url: 'new-image.png',
      coordinates: [[0, 0], [2, 0], [2, 2], [0, 2]]
    });
  });

  test('updates other source types', () => {
    // Test coordinates update for video source
    const mockVideoSource = {
      setCoordinates: jest.fn()
    };
    
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return mockVideoSource;
      return null;
    });

    // First render for video source with coordinates
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="video"
          coordinates={[[0, 0], [1, 0], [1, 1], [0, 1]]}
        />
      </MapContext.Provider>
    );

    // Update video source coordinates
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="video"
          coordinates={[[0, 0], [2, 0], [2, 2], [0, 2]]}
        />
      </MapContext.Provider>
    );

    expect(mockVideoSource.setCoordinates).toHaveBeenCalledWith(
      [[0, 0], [2, 0], [2, 2], [0, 2]]
    );

    // Test URL update for video source
    const mockUrlSource = {
      setUrl: jest.fn()
    };
    
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return mockUrlSource;
      return null;
    });

    // First render for video source with url
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="video"
          url="old-url"
        />
      </MapContext.Provider>
    );

    // Update video source url
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="video"
          url="new-url"
        />
      </MapContext.Provider>
    );

    expect(mockUrlSource.setUrl).toHaveBeenCalledWith("new-url");

    // Test tiles update for raster source
    const mockTilesSource = {
      setTiles: jest.fn()
    };
    
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return mockTilesSource;
      return null;
    });

    // First render for raster source with tiles
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="raster"
          tiles={["old-tile-url/{z}/{x}/{y}"]}
        />
      </MapContext.Provider>
    );

    // Update raster source tiles
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="raster"
          tiles={["new-tile-url/{z}/{x}/{y}"]}
        />
      </MapContext.Provider>
    );

    expect(mockTilesSource.setTiles).toHaveBeenCalledWith(["new-tile-url/{z}/{x}/{y}"]);
  });

  test('generates source id if not provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          type="geojson"
          data={{ type: 'FeatureCollection', features: [] }}
        />
      </MapContext.Provider>
    );

    // Advance timers to trigger the forceUpdate
    act(() => {
      forceUpdateCallback();
      jest.runAllTimers();
    });

    // Should call addSource with a generated ID
    expect(mockMapInstance.addSource).toHaveBeenCalledWith(
      expect.stringContaining('jsx-source-'),
      expect.anything()
    );
  });

  test('renders child layers with correct source', () => {
    // Mock existing source
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return {};
      return null;
    });

    render(
      <MapContext.Provider value={mapContextValue}>
        <Source 
          id="test-source"
          type="geojson"
          data={{ type: 'FeatureCollection', features: [] }}
        >
          <Layer id="test-layer" type="fill" paint={{ 'fill-color': 'red' }} />
        </Source>
      </MapContext.Provider>
    );

    // Check that Layer was called with the source prop
    expect(Layer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-layer',
        type: 'fill',
        paint: { 'fill-color': 'red' },
        source: 'test-source'
      }),
      expect.anything()
    );
  });

  test('removes source and dependent layers on unmount', () => {
    // Make sure the getSource method returns a value when called with 'test-source'
    mockMapInstance.getSource.mockImplementation((id) => {
      if (id === 'test-source') return {}; 
      return null;
    });
    
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Source id="test-source" type="geojson" data={{ type: 'FeatureCollection', features: [] }} />
      </MapContext.Provider>
    );

    // Unmount to trigger cleanup
    unmount();
    
    // Trigger the styledata event callback to ensure cleanup runs
    act(() => {
      if (forceUpdateCallback) forceUpdateCallback();
      jest.runAllTimers();
    });
    
    // Force the cleanup effect to run
    const allUnmountEffects = mockMapInstance.off.mock.calls.filter(
      call => call[0] === 'styledata'
    );
    
    if (allUnmountEffects.length > 0) {
      const cleanupFn = allUnmountEffects[0][1];
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
    
    // Should have removed the layer that depends on this source
    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('layer1');
    
    // Should not have removed unrelated layers
    expect(mockMapInstance.removeLayer).not.toHaveBeenCalledWith('layer2');
    
    // Should have removed the source
    expect(mockMapInstance.removeSource).toHaveBeenCalledWith('test-source');
  });
}); 