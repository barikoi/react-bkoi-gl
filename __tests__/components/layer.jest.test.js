import React from 'react';
import { render } from '@testing-library/react';
import { Layer } from '../../src/components/layer';
import { MapContext } from '../../src/components/map';

describe('Layer Component', () => {
  let mockMap;
  let mockMapInstance;
  let mapContextValue;
  let forceUpdateCallback;

  beforeEach(() => {
    forceUpdateCallback = null;
    
    // Create mock map instance
    mockMapInstance = {
      on: jest.fn((event, callback) => {
        if (event === 'styledata') {
          forceUpdateCallback = callback;
        }
      }),
      off: jest.fn(),
      getLayer: jest.fn(() => false),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      setLayoutProperty: jest.fn(),
      setPaintProperty: jest.fn(),
      setFilter: jest.fn(),
      setLayerZoomRange: jest.fn(),
      moveLayer: jest.fn(),
      getSource: jest.fn(() => true),
      style: { _loaded: true }
    };

    mockMap = {
      getMap: jest.fn(() => mockMapInstance)
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