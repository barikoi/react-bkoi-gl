// Jest-based tests for LogoControl component
import React from 'react';
import { render } from '@testing-library/react';
import { LogoControl } from '../../src/components/logo-control';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';

// Mock dependencies
jest.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: jest.fn()
}));

describe('LogoControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock mapLib (not used in new implementation, but still required by context)
    mockMapLib = {};
    
    // Track added controls for hasControl mock
    let addedControls = new Set();
    
    // Create mock map
    mockMap = {
      hasControl: jest.fn((ctrl) => addedControls.has(ctrl)),
      addControl: jest.fn((ctrl) => {
        addedControls.add(ctrl);
        // Simulate MapLibre calling onAdd when control is added
        if (ctrl.onAdd) {
          ctrl.onAdd(mockMap);
        }
      }),
      removeControl: jest.fn((ctrl) => addedControls.delete(ctrl)),
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
      position: 'bottom-right',
      style: { color: 'red' }
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl {...props} />
      </MapContext.Provider>
    );
    
    // Control added to map with position
    expect(mockMap.addControl).toHaveBeenCalledWith(
      expect.objectContaining({
        onAdd: expect.any(Function),
        onRemove: expect.any(Function)
      }),
      'bottom-right'
    );
    
    // Get the control that was added
    const addedControl = mockMap.addControl.mock.calls[0][0];
    
    // Verify onAdd creates the correct element
    const container = addedControl.onAdd(mockMap);
    expect(container.tagName).toBe('A');
    expect(container.className).toBe('maplibregl-ctrl-logo');
    expect(container.href).toBe('https://www.barikoi.com/');
    
    // Now _container should be set
    expect(addedControl._container).toBe(container);
    
    // Style applied (applyReactStyle is called after onAdd via useEffect)
    const { applyReactStyle } = applyReactStyleModule;
    expect(applyReactStyle).toHaveBeenCalledWith(
      container,
      { color: 'red' }
    );
  });
  
  test('creates control without errors', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl />
      </MapContext.Provider>
    );
    
    // Control should be added successfully
    expect(mockMap.addControl).toHaveBeenCalled();
    
    // Get the control that was added
    const addedControl = mockMap.addControl.mock.calls[0][0];
    
    // Should have both onAdd and onRemove methods
    expect(addedControl.onAdd).toBeDefined();
    expect(addedControl.onRemove).toBeDefined();
  });
  
  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );
    
    // Get the control that was added
    const addedControl = mockMap.addControl.mock.calls[0][0];
    
    unmount();
    
    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(addedControl);
  });
}); 
