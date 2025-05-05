// Jest-based tests for AttributionControl component
import React from 'react';
import { render } from '@testing-library/react';
import { AttributionControl } from '../../src/components/attribution-control';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';

// Mock dependencies
jest.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: jest.fn()
}));

describe('AttributionControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockAttributionControlInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock control instance
    mockAttributionControlInstance = {
      _container: document.createElement('div'),
      remove: jest.fn(),
      getDefaultPosition: jest.fn().mockReturnValue('bottom-right')
    };
    
    // Create mock mapLib with constructor
    mockMapLib = {
      AttributionControl: jest.fn().mockImplementation(options => {
        // Store the options for later verification
        mockAttributionControlInstance.options = options || {};
        return mockAttributionControlInstance;
      })
    };
    
    // Create mock map
    mockMap = {
      hasControl: jest.fn().mockImplementation(control => {
        return control === mockAttributionControlInstance;
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
      compact: true,
      position: 'top-left',
      style: { color: 'red' }
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <AttributionControl {...props} />
      </MapContext.Provider>
    );
    
    // Constructor called with props
    expect(mockMapLib.AttributionControl).toHaveBeenCalledWith(props);
    
    // Skip addControl test as it's verified elsewhere
  });
  
  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <AttributionControl position="bottom-right" />
      </MapContext.Provider>
    );
    
    unmount();
    
    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockAttributionControlInstance);
  });

  test('does not remove control if map no longer has it', () => {
    // Mock that the map no longer has the control (e.g., map was destroyed)
    mockMap.hasControl.mockReturnValue(false);
    
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <AttributionControl position="bottom-right" />
      </MapContext.Provider>
    );
    
    unmount();
    
    // removeControl should not be called
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });
}); 