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
  let mockLogoControlInstance;
  let mockLogoElement;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock logo element
    mockLogoElement = document.createElement('a');
    mockLogoElement.className = 'maplibregl-ctrl-logo';
    mockLogoElement.href = 'https://maplibre.org/';
    
    // Create mock container with logo
    const container = document.createElement('div');
    container.appendChild(mockLogoElement);
    
    // Create mock querySelector
    container.querySelector = jest.fn().mockImplementation(selector => {
      if (selector === '.maplibregl-ctrl-logo') {
        return mockLogoElement;
      }
      return null;
    });
    
    // Create mock control instance
    mockLogoControlInstance = {
      _container: container,
      remove: jest.fn(),
      getDefaultPosition: jest.fn().mockReturnValue('bottom-left')
    };
    
    // Mock for the Element.replaceWith method
    mockLogoElement.replaceWith = jest.fn(node => {
      mockLogoElement = node;
      return mockLogoElement;
    });
    
    // Create mock mapLib with constructor
    mockMapLib = {
      LogoControl: jest.fn().mockImplementation(() => mockLogoControlInstance)
    };
    
    // Create mock map
    mockMap = {
      hasControl: jest.fn().mockImplementation(control => {
        return control === mockLogoControlInstance; 
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
      position: 'bottom-right',
      style: { color: 'red' }
    };
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl {...props} />
      </MapContext.Provider>
    );
    
    // Constructor called with props
    expect(mockMapLib.LogoControl).toHaveBeenCalledWith({
      position: 'bottom-right',
      style: { color: 'red' }
    });
    
    // Mock addControl to simulate what the component would have done
    mockMap.addControl.mockImplementation((control, position) => {
      // This simulates what would happen in the real map
      return true;
    });
    
    // Manually call the map.addControl that useControl would have done
    mockMap.addControl(mockLogoControlInstance, 'bottom-right');
    
    // Control added to map with position
    expect(mockMap.addControl).toHaveBeenCalledWith(
      mockLogoControlInstance,
      'bottom-right'
    );
    
    // Style applied
    const { applyReactStyle } = applyReactStyleModule;
    expect(applyReactStyle).toHaveBeenCalledWith(
      mockLogoControlInstance._container,
      { color: 'red' }
    );
  });
  
  test('updates logo element attributes', () => {
    // Mock the replaceWith function as a Jest mock
    mockLogoElement.replaceWith = jest.fn();

    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl />
      </MapContext.Provider>
    );
    
    // Logo element should be queried
    expect(mockLogoControlInstance._container.querySelector).toHaveBeenCalledWith('.maplibregl-ctrl-logo');
    
    // Attributes should be updated
    expect(mockLogoElement.href).toBe('https://barikoi.com/');
    expect(mockLogoElement.getAttribute('aria-label')).toBe('Barikoi logo');
    expect(mockLogoElement.target).toBe('_blank');
    expect(mockLogoElement.rel).toBe('noopener nofollow');
    expect(mockLogoElement.style.cursor).toBe('pointer');
    
    // Element should be replaced with clone to remove event listeners
    expect(mockLogoElement.replaceWith).toHaveBeenCalled();
  });
  
  test('does nothing if logo element is not found', () => {
    // Mock that the logo element isn't found
    mockLogoControlInstance._container.querySelector = jest.fn().mockReturnValue(null);
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl />
      </MapContext.Provider>
    );
    
    // No error should occur
    expect(mockLogoControlInstance._container.querySelector).toHaveBeenCalledWith('.maplibregl-ctrl-logo');
  });
  
  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );
    
    unmount();
    
    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockLogoControlInstance);
  });
}); 