// Jest-based tests for LogoControl component
import React from 'react';
import { render } from '@testing-library/react';
import { LogoControl } from '../../src/components/logo-control';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';

// Mock dependencies
vi.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn()
}));

describe('LogoControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock mapLib (not used in new implementation, but still required by context)
    mockMapLib = {};
    
    // Track added controls for hasControl mock
    let addedControls = new Set();
    
    // Create mock map
    mockMap = {
      hasControl: vi.fn((ctrl) => addedControls.has(ctrl)),
      addControl: vi.fn(function (ctrl) {
        addedControls.add(ctrl);
        // Simulate MapLibre calling onAdd when control is added
        if (ctrl.onAdd) {
          ctrl.onAdd(mockMap);
        }
      }),
      removeControl: vi.fn((ctrl) => addedControls.delete(ctrl)),
      getMap: vi.fn().mockReturnValue({}),
      getContainer: vi.fn().mockReturnValue(document.createElement('div'))
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

  test('creates a Barikoi anchor with correct attributes', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );

    const control = mockMap.addControl.mock.calls[0][0];
    const anchor = control.onAdd(mockMap);

    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor.className).toBe('maplibregl-ctrl-logo');
    expect(anchor.getAttribute('href')).toBe('https://www.barikoi.com');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('alt')).toBe('Barikoi');
    expect(anchor.getAttribute('aria-label')).toBe('Barikoi logo');
    expect(anchor.getAttribute('rel')).toBe('noopener nofollow');
  });

  test('removes a pre-existing Barikoi logo before adding its own', () => {
    const mapContainer = document.createElement('div');
    const staleLogo = document.createElement('a');
    staleLogo.className = 'maplibregl-ctrl-logo';
    staleLogo.setAttribute('href', 'https://www.barikoi.com');
    mapContainer.appendChild(staleLogo);
    mockMap.getContainer.mockReturnValue(mapContainer);

    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );

    // The stale logo was removed from the map container
    expect(staleLogo.parentNode).toBeNull();
    expect(mapContainer.querySelector('a.maplibregl-ctrl-logo')).toBeNull();
  });

  test('keeps unrelated anchors untouched when removing stale logos', () => {
    const mapContainer = document.createElement('div');
    const other = document.createElement('a');
    other.className = 'maplibregl-ctrl-logo';
    other.setAttribute('href', 'https://example.com'); // different href — not a Barikoi logo
    mapContainer.appendChild(other);
    mockMap.getContainer.mockReturnValue(mapContainer);

    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );

    expect(other.parentNode).toBe(mapContainer);
  });

  test('onRemove clears the container reference', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <LogoControl position="bottom-left" />
      </MapContext.Provider>
    );

    const control = mockMap.addControl.mock.calls[0][0];
    control.onAdd(mockMap);
    expect(control._container).toBeDefined();

    control.onRemove();
    expect(control._container).toBeUndefined();
  });
}); 
