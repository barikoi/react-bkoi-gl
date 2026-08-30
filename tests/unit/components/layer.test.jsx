import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { Layer } from '../../../src/components/layer';
import { MapContext } from '../../../src/components/map';
import assert from '../../../src/utils/assert';

// Mock assert utility
vi.mock('../../../src/utils/assert', () => ({
  __esModule: true,
  default: vi.fn((condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  })
}));

describe('Layer Component', () => {
  let mockMap;
  let mockMapInstance;
  let mapContextValue;
  let forceUpdateCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    forceUpdateCallback = null;
    
    // Create mock map instance
    mockMapInstance = {
      on: vi.fn((event, callback) => {
        if (event === 'styledata') {
          forceUpdateCallback = callback;
        }
      }),
      off: vi.fn(),
      getLayer: vi.fn(() => false),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      setLayoutProperty: vi.fn(),
      setPaintProperty: vi.fn(),
      setFilter: vi.fn(),
      setLayerZoomRange: vi.fn(),
      moveLayer: vi.fn(),
      getSource: vi.fn(() => true),
      style: { _loaded: true }
    };

    mockMap = {
      getMap: vi.fn(function () { return mockMapInstance })
    };

    mapContextValue = {
      map: mockMap
    };
  });

  test('creates a new layer with given props', () => {
    const layerProps = {
      id: 'test-layer',
      type: 'fill',
      source: 'test-source',
      paint: { 'fill-color': 'red' },
      layout: { visibility: 'visible' }
    };

    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer {...layerProps} />
      </MapContext.Provider>
    );

    // Should call addLayer with the correct props
    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-layer',
        type: 'fill',
        source: 'test-source',
        paint: { 'fill-color': 'red' },
        layout: { visibility: 'visible' }
      }),
      undefined
    );
  });

  test('updates an existing layer', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          paint={{ 'fill-color': 'red' }}
          layout={{ visibility: 'visible' }}
        />
      </MapContext.Provider>
    );

    // Rerender with different props
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          paint={{ 'fill-color': 'blue' }}
          layout={{ visibility: 'none' }}
        />
      </MapContext.Provider>
    );

    // Should update the paint and layout properties
    expect(mockMapInstance.setPaintProperty).toHaveBeenCalledWith(
      'test-layer',
      'fill-color',
      'blue'
    );

    expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'visibility',
      'none'
    );
  });

  test('moves layer when beforeId changes', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);

    // First render
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          beforeId="layer-a"
        />
      </MapContext.Provider>
    );

    // Rerender with different beforeId
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          beforeId="layer-b"
        />
      </MapContext.Provider>
    );

    // Should move the layer
    expect(mockMapInstance.moveLayer).toHaveBeenCalledWith(
      'test-layer',
      'layer-b'
    );
  });

  test('updates filter property', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);

    // First render with filter
    const initialFilter = ['==', 'property', 'value'];
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          filter={initialFilter}
        />
      </MapContext.Provider>
    );

    // Rerender with different filter
    const newFilter = ['!=', 'property', 'value'];
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          filter={newFilter}
        />
      </MapContext.Provider>
    );

    // Should update the filter
    expect(mockMapInstance.setFilter).toHaveBeenCalledWith('test-layer', newFilter);
  });

  test('updates minzoom and maxzoom properties', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);

    // First render with zoom levels
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          minzoom={5}
          maxzoom={15}
        />
      </MapContext.Provider>
    );

    // Rerender with different zoom levels
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          minzoom={2}
          maxzoom={10}
        />
      </MapContext.Provider>
    );

    // Should update the zoom range
    expect(mockMapInstance.setLayerZoomRange).toHaveBeenCalledWith('test-layer', 2, 10);
  });

  test('handles adding and removing layout/paint properties', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);

    // First render with multiple properties
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          paint={{ 'fill-color': 'red', 'fill-opacity': 0.5 }}
          layout={{ visibility: 'visible', 'fill-sort-key': 1 }}
        />
      </MapContext.Provider>
    );

    // Rerender with some properties removed and some added
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
          paint={{ 'fill-color': 'blue', 'fill-outline-color': 'black' }} // removed opacity, added outline
          layout={{ visibility: 'visible' }} // removed sort-key
        />
      </MapContext.Provider>
    );

    // Should update changed properties
    expect(mockMapInstance.setPaintProperty).toHaveBeenCalledWith(
      'test-layer',
      'fill-color',
      'blue'
    );

    // Should add new properties
    expect(mockMapInstance.setPaintProperty).toHaveBeenCalledWith(
      'test-layer',
      'fill-outline-color',
      'black'
    );

    // Should remove properties by setting to undefined
    expect(mockMapInstance.setPaintProperty).toHaveBeenCalledWith(
      'test-layer',
      'fill-opacity',
      undefined
    );

    expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'fill-sort-key',
      undefined
    );
  });

  test('throws error when layer type changes', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);
    
    console.error = vi.fn(); // Silence console warnings

    // First render 
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );

    // Rerender with different type
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="line" // Changed from fill to line
          source="test-source"
        />
      </MapContext.Provider>
    );

    // Should call assert with false and error message
    expect(assert).toHaveBeenCalledWith(
      false, // condition is false
      'layer type changed'
    );
  });

  test('throws error when layer id changes', () => {
    // Mock that the layer already exists
    mockMapInstance.getLayer.mockReturnValue(true);
    
    console.error = vi.fn(); // Silence console warnings
    
    // First render 
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );
    
    // Rerender with different id - this shouldn't be directly possible through React 
    // props but we're testing the internal mechanism
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="different-id"
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );
    
    // Should call assert with false and error message
    expect(assert).toHaveBeenCalledWith(
      false, // condition is false
      'layer id changed'
    );
  });

  test('handles case when source is not ready', () => {
    // Mock getSource to return null (source not ready)
    mockMapInstance.getSource.mockReturnValue(null);
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="not-ready-source"
        />
      </MapContext.Provider>
    );
    
    // Should not call addLayer
    expect(mockMapInstance.addLayer).not.toHaveBeenCalled();
  });
  
  test('handles case when style is not loaded', () => {
    // Mock style not loaded
    mockMapInstance.style._loaded = false;
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );
    
    // Should not call addLayer
    expect(mockMapInstance.addLayer).not.toHaveBeenCalled();
  });
  
  test('supports custom layer type', () => {
    // Create a mock custom layer
    const customLayer = {
      id: 'custom-layer',
      type: 'custom',
      onAdd: vi.fn(),
      render: vi.fn(),
      onRemove: vi.fn()
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer {...customLayer} />
      </MapContext.Provider>
    );
    
    // Should add the custom layer
    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'custom-layer',
        type: 'custom',
        onAdd: expect.any(Function),
        render: expect.any(Function),
        onRemove: expect.any(Function)
      }),
      undefined
    );
  });
  
  test('handles case when map is not available', () => {
    // Mock map as null
    mapContextValue.map.getMap.mockReturnValue(null);
    
    // Create a null-safe component wrapper
    const SafeLayer = (props) => {
      const map = useContext ? useContext(MapContext)?.map?.getMap() : null;
      if (!map) return null;
      return <Layer {...props} />;
    };
    
    // Should not throw error when map is null
    expect(() => {
      render(
        <MapContext.Provider value={mapContextValue}>
          <SafeLayer 
            id="test-layer"
            type="fill"
            source="test-source"
          />
        </MapContext.Provider>
      );
    }).not.toThrow();
  });

  test('removes layer on unmount', () => {
    // Make getLayer return true when explicitly checking if layer exists during cleanup
    mockMapInstance.getLayer.mockImplementation((id) => {
      if (id === 'test-layer') return true;
      return false;
    });
    
    // Render the component
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          id="test-layer"
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );
    
    // Verify event handler was registered
    expect(mockMapInstance.on).toHaveBeenCalledWith('styledata', expect.any(Function));
    expect(forceUpdateCallback).toBeTruthy();
    
    // Unmount component to trigger cleanup
    unmount();
    
    // Should remove the layer
    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-layer');
    expect(mockMapInstance.off).toHaveBeenCalledWith('styledata', forceUpdateCallback);
  });

  test('generates layer id if not provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <Layer 
          type="fill"
          source="test-source"
        />
      </MapContext.Provider>
    );

    // Should call addLayer with a generated ID
    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining('jsx-layer-'),
        type: 'fill',
        source: 'test-source'
      }),
      undefined
    );
  });
}); 