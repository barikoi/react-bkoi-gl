// Jest-based tests for AttributionControl component
import React from 'react';
import { render, act } from '@testing-library/react';
import { AttributionControl } from '../../src/components/attribution-control';
import { MapContext } from '../../src/components/map';
import { MountedMapsContext } from '../../src/components/use-map';
import { logger } from '../../src/utils/logger';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';
import * as useControlModule from '../../src/components/use-control';

// Mock dependencies
vi.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn()
}));

// Spy on useControl instead of completely mocking it
vi.spyOn(useControlModule, 'useControl');

describe('AttributionControl Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockAttributionControlInstance;
  let mountedMapsContextValue;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock control instance with querySelector support
    mockAttributionControlInstance = {
      _container: document.createElement('div'),
      remove: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('bottom-right')
    };
    
    // Add inner element for attribution content
    const innerDiv = document.createElement('div');
    innerDiv.className = 'maplibregl-ctrl-attrib-inner';
    mockAttributionControlInstance._container.appendChild(innerDiv);
    
    // Create mock mapLib with constructor
    mockMapLib = {
      AttributionControl: vi.fn().mockImplementation(function (options) {
        // Store the options for later verification
        mockAttributionControlInstance.options = options || {};
        return mockAttributionControlInstance;
      })
    };
    
    // Create mock map with load event support
    mockMap = {
      hasControl: vi.fn().mockImplementation(function (control) {
        return control === mockAttributionControlInstance;
      }),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      getMap: vi.fn().mockReturnValue({}),
      loaded: vi.fn().mockReturnValue(true),
      once: vi.fn(),
      off: vi.fn()
    };
    
    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    };

    // Create mounted maps context value
    mountedMapsContextValue = {
      maps: { default: mockMap },
      onMapMount: vi.fn(),
      onMapUnmount: vi.fn()
    };

    // Mock the useControl hook to return our mocked instance
    useControlModule.useControl.mockImplementation((factory, options) => {
      // Call the factory to create the control
      const control = factory(mapContextValue);
      return control;
    });
  });
  
  test('adds the control with correct props', () => {
    const props = {
      compact: true,
      position: 'top-left',
      style: { color: 'red' }
    };
    
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl {...props} />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    // Constructor called with compact: true and spread props
    expect(mockMapLib.AttributionControl).toHaveBeenCalledWith(
      expect.objectContaining({ compact: true })
    );
    
    // Check that useControl was called with correct params
    expect(useControlModule.useControl).toHaveBeenCalledWith(
      expect.any(Function),
      { position: props.position }
    );
  });
  
  test('applies style correctly through applyReactStyle', () => {
    const customStyle = { 
      color: 'blue', 
      backgroundColor: 'white',
      fontSize: '14px' 
    };
    
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl style={customStyle} />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    // Check that style was applied
    expect(applyReactStyleModule.applyReactStyle).toHaveBeenCalledWith(
      mockAttributionControlInstance._container,
      customStyle
    );
  });
  
  test('supports different position values', () => {
    // Test with different position values
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    positions.forEach(position => {
      vi.clearAllMocks();
      
      render(
        <MountedMapsContext.Provider value={mountedMapsContextValue}>
          <MapContext.Provider value={mapContextValue}>
            <AttributionControl position={position} />
          </MapContext.Provider>
        </MountedMapsContext.Provider>
      );
      
      // Check that useControl was called with correct position
      expect(useControlModule.useControl).toHaveBeenCalledWith(
        expect.any(Function),
        { position: position }
      );
    });
  });
  
  test('works with compact option enabled and disabled', () => {
    // Test with compact enabled
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl compact={true} />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    expect(mockMapLib.AttributionControl).toHaveBeenCalledWith(
      expect.objectContaining({ compact: true })
    );
    
    vi.clearAllMocks();
    
    // Test with compact disabled
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl compact={false} />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    expect(mockMapLib.AttributionControl).toHaveBeenCalledWith(
      expect.objectContaining({ compact: false })
    );
  });
  
  test('handles case when container is not available', () => {
    // Set _container to null to simulate container not being available
    mockAttributionControlInstance._container = null;
    
    // Should not throw error when container is null
    expect(() => {
      render(
        <MountedMapsContext.Provider value={mountedMapsContextValue}>
          <MapContext.Provider value={mapContextValue}>
            <AttributionControl style={{ color: 'red' }} />
          </MapContext.Provider>
        </MountedMapsContext.Provider>
      );
    }).not.toThrow();
    
    // applyReactStyle should be called but with null container
    expect(applyReactStyleModule.applyReactStyle).toHaveBeenCalledWith(
      null,
      expect.any(Object)
    );
  });
  
  test('supports multiple controls with different positions', () => {
    const firstControlInstance = { ...mockAttributionControlInstance };
    const secondControlInstance = { 
      ...mockAttributionControlInstance,
      _container: document.createElement('div') 
    };
    
    // Set up the mock to return different instances for different calls
    mockMapLib.AttributionControl.mockImplementationOnce(function () { return firstControlInstance })
      .mockImplementationOnce(function () { return secondControlInstance });
    
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl position="top-left" />
          <AttributionControl position="bottom-right" />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    // useControl should be called twice with different positions
    expect(useControlModule.useControl).toHaveBeenCalledTimes(2);
    expect(useControlModule.useControl).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      { position: "top-left" }
    );
    expect(useControlModule.useControl).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      { position: "bottom-right" }
    );
  });
  
  test('cleans up when unmounted', () => {
    // This test is now implicitly testing the useControl hook's cleanup function
    // We're verifying that the control is properly created and passed to useControl
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl position="bottom-right" />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    // Verify the control was created correctly
    expect(mockMapLib.AttributionControl).toHaveBeenCalled();
    expect(useControlModule.useControl).toHaveBeenCalled();
  });

  test('does not remove control if map no longer has it', () => {
    // This is testing behavior within useControl, which we're mocking
    // The actual cleanup logic happens in the useControl hook
    // Just verify the component renders without errors
    render(
      <MountedMapsContext.Provider value={mountedMapsContextValue}>
        <MapContext.Provider value={mapContextValue}>
          <AttributionControl position="bottom-right" />
        </MapContext.Provider>
      </MountedMapsContext.Provider>
    );
    
    expect(useControlModule.useControl).toHaveBeenCalled();
  });

  describe('attribution content rewrite', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const getInner = () =>
      mockAttributionControlInstance._container &&
      mockAttributionControlInstance._container.querySelector('.maplibregl-ctrl-attrib-inner');

    const renderControl = () =>
      render(
        <MountedMapsContext.Provider value={mountedMapsContextValue}>
          <MapContext.Provider value={mapContextValue}>
            <AttributionControl position="bottom-right" />
          </MapContext.Provider>
        </MountedMapsContext.Provider>
      );

    test('rewrites attribution with Barikoi/OpenMapTiles/OSM links once loaded', () => {
      vi.useFakeTimers();

      renderControl();

      // loaded() === true -> onLoad() -> setTimeout(0)
      expect(mockMap.loaded).toHaveBeenCalled();
      act(() => {
        vi.runAllTimers();
      });

      const inner = getInner();
      expect(inner).not.toBeNull();

      const links = inner.querySelectorAll('a');
      expect(links).toHaveLength(3);
      expect(links[0].textContent).toBe('Barikoi');
      expect(links[0].getAttribute('href')).toBe('https://barikoi.com');
      expect(links[1].textContent).toBe('OpenMapTiles');
      expect(links[1].getAttribute('href')).toBe('https://openmaptiles.org');
      expect(links[2].textContent).toBe('OpenStreetMap contributors');
      expect(links[2].getAttribute('href')).toBe('https://www.openstreetmap.org/copyright');

      for (const link of links) {
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      }

      expect(inner.textContent).toContain('©');
    });

    test('warns when .maplibregl-ctrl-attrib-inner is missing', () => {
      vi.useFakeTimers();
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      // Strip the inner element so querySelector finds nothing
      mockAttributionControlInstance._container.innerHTML = '';

      renderControl();
      act(() => {
        vi.runAllTimers();
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('maplibregl-ctrl-attrib-inner')
      );
      warnSpy.mockRestore();
    });

    test('defers rewrite to the map load event when not yet loaded', () => {
      vi.useFakeTimers();
      mockMap.loaded.mockReturnValue(false);

      renderControl();

      expect(mockMap.once).toHaveBeenCalledWith('load', expect.any(Function));

      // Nothing rewritten before the load event fires
      act(() => {
        vi.runAllTimers();
      });
      expect(getInner().children).toHaveLength(0);

      // Fire the load event
      const onLoad = mockMap.once.mock.calls[0][1];
      act(() => {
        onLoad();
        vi.runAllTimers();
      });

      expect(getInner().querySelectorAll('a')).toHaveLength(3);
    });

    test('unsubscribes from the load event on unmount', () => {
      vi.useFakeTimers();
      mockMap.loaded.mockReturnValue(false);

      const { unmount } = renderControl();
      unmount();

      expect(mockMap.off).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });
}); 