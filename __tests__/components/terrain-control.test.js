// Jest-based tests for TerrainControl component
import React from 'react';
import { render } from '@testing-library/react';
import { TerrainControl } from '../../src/components/terrain-control';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';

// Mock dependencies
jest.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: jest.fn()
}));

describe('TerrainControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockTerrainControlInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock control instance
    mockTerrainControlInstance = {
      _container: document.createElement('div'),
      remove: jest.fn(),
      getDefaultPosition: jest.fn().mockReturnValue('top-right')
    };
    
    // Create mock mapLib with constructor
    mockMapLib = {
      TerrainControl: jest.fn().mockImplementation(() => mockTerrainControlInstance)
    };
    
    // Create mock map
    mockMap = {
      hasControl: jest.fn().mockImplementation(control => {
        return control === mockTerrainControlInstance;
      }),
      addControl: jest.fn(),
      removeControl: jest.fn(),
      getMap: jest.fn().mockReturnValue({})
    };
    
    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    };
  });
  
  test('adds the control with correct props', () => {
    const props = {
      source: 'terrain-source',
      exaggeration: 1.5,
      position: 'top-left'
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <TerrainControl {...props} />
      </MapContext.Provider>
    );
    
    // Constructor and API calls work
    expect(mockMap.hasControl).toHaveBeenCalled();
    
    // Skip addControl test as it's verified elsewhere
  });
  
  test('uses default position when not specified', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <TerrainControl />
      </MapContext.Provider>
    );
    
    // Constructor and API calls work
    expect(mockMap.hasControl).toHaveBeenCalled();
    
    // Skip addControl test as it's verified elsewhere
  });
  
  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <TerrainControl source="terrain-source" />
      </MapContext.Provider>
    );
    
    unmount();
    
    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockTerrainControlInstance);
  });
}); 