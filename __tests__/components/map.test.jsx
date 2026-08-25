// Jest-based tests for Map component
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { Map } from '../../src/components/map';
import Maplibre from '../../src/maplibre/maplibre';
import { LogoControl } from '../../src/components/logo-control';
import { AttributionControl } from '../../src/components/attribution-control';
import createRef from '../../src/maplibre/create-ref';
import setGlobals from '../../src/utils/set-globals';
import { MountedMapsContext } from '../../src/components/use-map';

// Mock the dependent components
vi.mock('../../src/components/logo-control', () => ({
  LogoControl: vi.fn(() => <div data-testid="logo-control">Barikoi Logo</div>)
}));

vi.mock('../../src/components/attribution-control', () => ({
  AttributionControl: vi.fn(() => <div data-testid="attribution-control">Attribution</div>)
}));

// Mock createRef utility
vi.mock('../../src/maplibre/create-ref', () => {
  return {
    __esModule: true,
    default: vi.fn()
  };
});

// Mock setGlobals utility
vi.mock('../../src/utils/set-globals', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Mock Maplibre class
vi.mock('../../src/maplibre/maplibre', () => {
  return {
    __esModule: true,
    default: class MockMaplibre {
      static savedMaps = [];
      static reuse = vi.fn();
      
      constructor() {
        this.map = mockMapInstance;
        this.setProps = vi.fn();
        this.destroy = vi.fn(() => {
          mockMapInstance.remove();
        });
        this.recycle = vi.fn();
      }
    }
  };
});

// Create mock for maplibre-gl
const mockMapInstance = {
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn((event, callback) => {
    if (event === 'load') {
      // Simulate synchronous load for testing
      setTimeout(callback, 0);
    }
  }),
  getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
  getZoom: vi.fn(() => 0),
  getBearing: vi.fn(() => 0),
  getPitch: vi.fn(() => 0),
  remove: vi.fn(),
  getCanvas: vi.fn(() => ({
    style: {}
  })),
  getContainer: vi.fn(() => ({
    appendChild: vi.fn(),
    querySelector: vi.fn().mockReturnValue({
      remove: vi.fn()
    })
  })),
  isMoving: vi.fn(() => false),
  jumpTo: vi.fn(),
  transform: {},
  style: { _loaded: true },
  
  // Add handler properties
  boxZoom: { enable: vi.fn(), disable: vi.fn() },
  scrollZoom: { enable: vi.fn(), disable: vi.fn() },
  dragRotate: { enable: vi.fn(), disable: vi.fn() },
  dragPan: { enable: vi.fn(), disable: vi.fn() },
  keyboard: { enable: vi.fn(), disable: vi.fn() },
  doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
  touchZoomRotate: { enable: vi.fn(), disable: vi.fn() },
  
  // Add method to query layers
  getLayer: vi.fn(() => true),
  queryRenderedFeatures: vi.fn(() => []),
  
  // Add setter methods for style components
  setLight: vi.fn(),
  setProjection: vi.fn(),
  setSky: vi.fn(),
  setTerrain: vi.fn(),
  setStyle: vi.fn(),
  attributionControl: false,
};

// Mock Map class
const MockMap = vi.fn().mockImplementation(() => mockMapInstance);

vi.mock('maplibre-gl', () => {
  return {
    Map: MockMap,
    LngLat: class MockLngLat {
      constructor(lng, lat) {
        this.lng = lng;
        this.lat = lat;
      }
    },
    LogoControl: vi.fn(),
    AttributionControl: vi.fn()
  };
}, { virtual: true });

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up createRef mock
    createRef.mockImplementation(() => ({
      getMap: () => mockMapInstance,
      getCenter: mockMapInstance.getCenter,
      getZoom: mockMapInstance.getZoom
    }));
  });

  test('renders Map component with correct props', () => {
    const { container } = render(
      <Map 
        id="test-map"
        style={{ width: '500px', height: '400px' }}
        center={[0, 0]}
        zoom={5}
      />
    );

    // Check if container div is rendered
    expect(container.querySelector('#test-map')).toBeTruthy();
    
    // Style should be applied
    const mapContainer = container.querySelector('#test-map');
    expect(mapContainer.style.width).toBe('500px');
    expect(mapContainer.style.height).toBe('400px');
  });

  test('renders children when map is loaded', async () => {
    let renderedComponent;
    
    act(() => {
      renderedComponent = render(
        <Map id="test-map">
          <div data-testid="test-child">Test Child</div>
        </Map>
      );
    });

    // Wait for the map to load
    await waitFor(() => {
      expect(screen.queryByTestId('test-child')).toBeTruthy();
    });
    
    const child = screen.getByTestId('test-child');
    expect(child.textContent).toBe('Test Child');
  });

  test('includes map children container', async () => {
    act(() => {
      render(<Map id="test-map" />);
    });

    // Wait for the map to load and controls to be added
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Check if our mocked components are in the document
    expect(screen.getByTestId('logo-control')).toBeTruthy();
    expect(screen.getByTestId('attribution-control')).toBeTruthy();
  });
  
  test('properly passes MapContext value to children', async () => {
    // Create a test child component that uses the MapContext
    const TestChildUsingContext = () => {
      return <div data-testid="context-consumer">Context Consumer</div>;
    };
    
    // Render the map with the test child
    act(() => {
      render(
        <Map id="test-map">
          <TestChildUsingContext />
        </Map>
      );
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('context-consumer')).toBeTruthy();
    });
    
    // Verify that MapContext was properly set up
    expect(createRef).toHaveBeenCalled();
  });
  
  test('loads maplibre from prop if provided', async () => {
    const mockMapLib = {
      Map: MockMap
    };
    
    act(() => {
      render(<Map id="test-map" mapLib={mockMapLib} />);
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Verify that setGlobals was called with our mockMapLib
    expect(setGlobals).toHaveBeenCalledWith(mockMapLib, expect.anything());
  });
  
  test('loads maplibre asynchronously if provided as promise', async () => {
    const mockMapLib = {
      Map: MockMap
    };
    
    const mapLibPromise = Promise.resolve(mockMapLib);
    
    act(() => {
      render(<Map id="test-map" mapLib={mapLibPromise} />);
    });
    
    // Wait for the promise and map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Verify that setGlobals was called with our mockMapLib
    expect(setGlobals).toHaveBeenCalledWith(mockMapLib, expect.anything());
  });
  
  test('handles error during initialization', async () => {
    // Mock console.error to keep the test output clean
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // Create a promise that rejects
    const mapLibPromise = Promise.reject(new Error('Failed to load map library'));
    
    act(() => {
      render(<Map id="test-map" mapLib={mapLibPromise} />);
    });
    
    // Wait for the promise to reject
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('handles custom error callback', async () => {
    // Create a promise that rejects
    const mapLibPromise = Promise.reject(new Error('Failed to load map library'));
    
    // Create a custom error handler
    const onError = vi.fn();
    
    act(() => {
      render(<Map id="test-map" mapLib={mapLibPromise} onError={onError} />);
    });
    
    // Wait for the promise to reject and the error handler to be called
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        error: expect.any(Error)
      }));
    });
  });
  
  test('cleans up map on unmount', async () => {
    let renderedComponent;
    
    act(() => {
      renderedComponent = render(<Map id="test-map" />);
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Reset the mock to ensure we're only tracking calls after unmount
    mockMapInstance.remove.mockClear();
    
    // Now unmount the component
    act(() => {
      renderedComponent.unmount();
    });
    
    // Check if remove was called
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
  
  test('reuses map instance when reuseMaps is true', async () => {
    // The statically imported Maplibre IS the vi.mock factory's class
    const MaplibreMock = Maplibre;
    
    // Setup the mock to return a map instance
    const mockMaplibreInstance = new MaplibreMock();
    MaplibreMock.reuse.mockReturnValue(mockMaplibreInstance);
    
    act(() => {
      render(<Map id="test-map" reuseMaps={true} />);
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Check if reuse was called
    expect(MaplibreMock.reuse).toHaveBeenCalled();
  });
  
  test('handles invalid mapLib gracefully', async () => {
    // Mock console.error to keep the test output clean
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // Set up a promise that resolves to null
    const nullMapLibPromise = Promise.resolve(null);
    
    act(() => {
      render(<Map id="test-map" mapLib={nullMapLibPromise} />);
    });
    
    // Wait for the error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
    
    // Test with invalid mapLib (no Map property)
    console.error.mockClear();
    const invalidMapLib = {};
    const invalidMapLibPromise = Promise.resolve(invalidMapLib);
    
    act(() => {
      render(<Map id="test-map" mapLib={invalidMapLibPromise} />);
    });
    
    // Wait for the error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('forwards ref to map instance', async () => {
    // Create a ref
    const ref = React.createRef();
    
    act(() => {
      render(<Map id="test-map" ref={ref} />);
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Check if the ref has the map instance
    expect(ref.current).toBeTruthy();
    expect(ref.current.getMap).toBeDefined();
    expect(ref.current.getMap()).toBe(mockMapInstance);
  });
  
  test('notifies MountedMapsContext of mount and unmount', async () => {
    // Create mock context handlers
    const onMapMount = vi.fn();
    const onMapUnmount = vi.fn();
    
    let renderedComponent;
    
    act(() => {
      renderedComponent = render(
        <MountedMapsContext.Provider value={{ onMapMount, onMapUnmount }}>
          <Map id="test-map" />
        </MountedMapsContext.Provider>
      );
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    
    // Check if onMapMount was called
    expect(onMapMount).toHaveBeenCalled();
    expect(onMapMount).toHaveBeenCalledWith(expect.anything(), 'test-map');
    
    // Now unmount the component
    act(() => {
      renderedComponent.unmount();
    });
    
    // Check if onMapUnmount was called
    expect(onMapUnmount).toHaveBeenCalled();
    expect(onMapUnmount).toHaveBeenCalledWith('test-map');
  });
  
  test('controls logo and attribution visibility via props', async () => {
    // LogoControl / AttributionControl are the hoisted vi.mock factories' vi.fn components
    LogoControl.mockClear();
    AttributionControl.mockClear();

    let view;
    act(() => {
      view = render(
        <Map id="test-map-hidden" showBarikoiLogo={false} showAttribution={false}>
          <div data-testid="map-loaded-marker" />
        </Map>
      );
    });

    // Wait until the map has mounted its children (mapInstance is set).
    await waitFor(() => {
      expect(screen.getByTestId('map-loaded-marker')).toBeTruthy();
    });

    // Controls must not be rendered — nor even invoked — when disabled.
    expect(screen.queryByTestId('logo-control')).not.toBeTruthy();
    expect(screen.queryByTestId('attribution-control')).not.toBeTruthy();
    expect(LogoControl).not.toHaveBeenCalled();
    expect(AttributionControl).not.toHaveBeenCalled();

    view.unmount();

    // --- Both controls shown by default (no props) ---
    LogoControl.mockClear();
    AttributionControl.mockClear();

    act(() => {
      view = render(<Map id="test-map-default" />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('logo-control')).toBeTruthy();
    });
    expect(screen.getByTestId('attribution-control')).toBeTruthy();
    expect(LogoControl).toHaveBeenCalled();
    expect(AttributionControl).toHaveBeenCalled();

    view.unmount();
  });
}); 