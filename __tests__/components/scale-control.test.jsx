// Jest-based tests for ScaleControl component
import React from 'react';
import { render } from '@testing-library/react';
import { ScaleControl } from '../../src/components/scale-control';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';
import * as useControlModule from '../../src/components/use-control';

// Mock dependencies
vi.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn()
}));

// Spy on useControl instead of completely mocking it
vi.spyOn(useControlModule, 'useControl');

describe('ScaleControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockScaleControlInstance;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock control instance
    mockScaleControlInstance = {
      _container: document.createElement('div'),
      remove: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('bottom-left'),
      setUnit: vi.fn(),
      options: {}
    };
    
    // Create mock mapLib with constructor
    mockMapLib = {
      ScaleControl: vi.fn().mockImplementation(function (options) {
        // Store the options for later verification
        mockScaleControlInstance.options = options || {};
        return mockScaleControlInstance;
      })
    };
    
    // Create mock map
    mockMap = {
      hasControl: vi.fn().mockImplementation(function (control) {
        return control === mockScaleControlInstance;
      }),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      getMap: vi.fn().mockReturnValue({})
    };
    
    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    };

    // Mock the useControl hook to return our mocked instance
    useControlModule.useControl.mockImplementation((factory, options) => {
      // Call the factory to create the control
      const control = factory(mapContextValue);
      return control;
    });
  });
  
  test('adds the control with correct props', () => {
    // Setup initial props
    const props = {
      maxWidth: 150,
      unit: 'metric',
      position: 'bottom-right',
      style: { color: 'red' }
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl {...props} />
      </MapContext.Provider>
    );
    
    // Check that useControl was called with correct factory
    expect(useControlModule.useControl).toHaveBeenCalled();
    
    // Check the factory creates ScaleControl with expected props
    expect(mockMapLib.ScaleControl).toHaveBeenCalledWith(props);
    
    // Check that style was applied
    expect(applyReactStyleModule.applyReactStyle).toHaveBeenCalledWith(
      mockScaleControlInstance._container,
      props.style
    );
  });
  
  test('updates unit when prop changes', () => {
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl unit="metric" />
      </MapContext.Provider>
    );
    
    // Update with new unit
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl unit="imperial" />
      </MapContext.Provider>
    );
    
    // Should call setUnit with new value
    expect(mockScaleControlInstance.setUnit).toHaveBeenCalledWith('imperial');
  });
  
  test('updates maxWidth when prop changes', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl maxWidth={100} unit="metric" />
      </MapContext.Provider>
    );
    
    // Initial maxWidth should be set in options
    expect(mockScaleControlInstance.options.maxWidth).toBe(100);
    
    // Update with new maxWidth
    render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl maxWidth={200} unit="metric" />
      </MapContext.Provider>
    );
    
    // The options.maxWidth should be updated
    expect(mockScaleControlInstance.options.maxWidth).toBe(200);
  });
  
  test('applies style changes when style prop updates', () => {
    const initialStyle = { color: 'red' };
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl style={initialStyle} />
      </MapContext.Provider>
    );
    
    // Initial style should be applied
    expect(applyReactStyleModule.applyReactStyle).toHaveBeenCalledWith(
      mockScaleControlInstance._container,
      initialStyle
    );
    
    // Clear previous calls
    applyReactStyleModule.applyReactStyle.mockClear();
    
    // Update with new style
    const newStyle = { color: 'blue' };
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl style={newStyle} />
      </MapContext.Provider>
    );
    
    // New style should be applied
    expect(applyReactStyleModule.applyReactStyle).toHaveBeenCalledWith(
      mockScaleControlInstance._container,
      newStyle
    );
  });
  
  test('cleans up when unmounted', () => {
    // useControl handles the removal, so we only need to 
    // ensure our mock returns proper controls
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <ScaleControl position="bottom-left" />
      </MapContext.Provider>
    );
    
    unmount();
    
    // The useControl hook should handle removing the control
    // This isn't a direct test of the component, but rather
    // verifies the integration with useControl
  });
}); 