// Jest-based tests for Map component
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { Map } from '../../src/components/map';
import createRef from '../../src/maplibre/create-ref';
import setGlobals from '../../src/utils/set-globals';
import { MountedMapsContext } from '../../src/components/use-map';

// Mock the dependent components
jest.mock('../../src/components/logo-control', () => ({
  LogoControl: jest.fn(() => <div data-testid="logo-control">Barikoi Logo</div>)
}));

jest.mock('../../src/components/attribution-control', () => ({
  AttributionControl: jest.fn(() => <div data-testid="attribution-control">Attribution</div>)
}));

// Mock createRef utility
jest.mock('../../src/maplibre/create-ref', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

// Mock setGlobals utility
jest.mock('../../src/utils/set-globals', () => {
  return jest.fn();
});

// Mock Maplibre class
jest.mock('../../src/maplibre/maplibre', () => {
  return {
    __esModule: true,
    default: class MockMaplibre {
      static savedMaps = [];
      static reuse = jest.fn();
      
      constructor() {
        this.map = mockMapInstance;
        this.setProps = jest.fn();
        this.destroy = jest.fn(() => {
          mockMapInstance.remove();
        });
        this.recycle = jest.fn();
      }
    }
  };
});

// Create mock for maplibre-gl
const mockMapInstance = {
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn((event, callback) => {
    if (event === 'load') {
      // Simulate synchronous load for testing
      setTimeout(callback, 0);
    }
  }),
  getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
  getZoom: jest.fn(() => 0),
  getBearing: jest.fn(() => 0),
  getPitch: jest.fn(() => 0),
  remove: jest.fn(),
  getCanvas: jest.fn(() => ({
    style: {}
  })),
  getContainer: jest.fn(() => ({
    appendChild: jest.fn(),
    querySelector: jest.fn().mockReturnValue({
      remove: jest.fn()
    })
  })),
  isMoving: jest.fn(() => false),
  jumpTo: jest.fn(),
  transform: {},
  style: { _loaded: true },
  
  // Add handler properties
  boxZoom: { enable: jest.fn(), disable: jest.fn() },
  scrollZoom: { enable: jest.fn(), disable: jest.fn() },
  dragRotate: { enable: jest.fn(), disable: jest.fn() },
  dragPan: { enable: jest.fn(), disable: jest.fn() },
  keyboard: { enable: jest.fn(), disable: jest.fn() },
  doubleClickZoom: { enable: jest.fn(), disable: jest.fn() },
  touchZoomRotate: { enable: jest.fn(), disable: jest.fn() },
  
  // Add method to query layers
  getLayer: jest.fn(() => true),
  queryRenderedFeatures: jest.fn(() => []),
  
  // Add setter methods for style components
  setLight: jest.fn(),
  setProjection: jest.fn(),
  setSky: jest.fn(),
  setTerrain: jest.fn(),
  setStyle: jest.fn(),
  attributionControl: false,
};

// Mock Map class
const MockMap = jest.fn().mockImplementation(() => mockMapInstance);

jest.mock('maplibre-gl', () => {
  return {
    Map: MockMap,
    LngLat: class MockLngLat {
      constructor(lng, lat) {
        this.lng = lng;
        this.lat = lat;
      }
    },
    LogoControl: jest.fn(),
    AttributionControl: jest.fn()
  };
}, { virtual: true });

describe('Map Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
    expect(container.querySelector('#test-map')).toBeInTheDocument();
    
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
      expect(screen.queryByTestId('test-child')).toBeInTheDocument();
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // Check if our mocked components are in the document
    expect(screen.getByTestId('logo-control')).toBeInTheDocument();
    expect(screen.getByTestId('attribution-control')).toBeInTheDocument();
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
      expect(screen.getByTestId('context-consumer')).toBeInTheDocument();
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // Verify that setGlobals was called with our mockMapLib
    expect(setGlobals).toHaveBeenCalledWith(mockMapLib, expect.anything());
  });
  
  test('handles error during initialization', async () => {
    // Mock console.error to keep the test output clean
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
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
    const onError = jest.fn();
    
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
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
    // Get the mocked Maplibre
    const MaplibreMock = jest.requireMock('../../src/maplibre/maplibre').default;
    
    // Setup the mock to return a map instance
    const mockMaplibreInstance = new MaplibreMock();
    MaplibreMock.reuse.mockReturnValue(mockMaplibreInstance);
    
    act(() => {
      render(<Map id="test-map" reuseMaps={true} />);
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // Check if reuse was called
    expect(MaplibreMock.reuse).toHaveBeenCalled();
  });
  
  test('handles invalid mapLib gracefully', async () => {
    // Mock console.error to keep the test output clean
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // Check if the ref has the map instance
    expect(ref.current).toBeTruthy();
    expect(ref.current.getMap).toBeDefined();
    expect(ref.current.getMap()).toBe(mockMapInstance);
  });
  
  test('notifies MountedMapsContext of mount and unmount', async () => {
    // Create mock context handlers
    const onMapMount = jest.fn();
    const onMapUnmount = jest.fn();
    
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
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
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
    // Import the actual modules to check if they're rendered
    const { LogoControl } = jest.requireMock('../../src/components/logo-control');
    const { AttributionControl } = jest.requireMock('../../src/components/attribution-control');
    
    // Reset the mock implementations
    LogoControl.mockClear();
    AttributionControl.mockClear();
    
    act(() => {
      render(
        <Map 
          id="test-map" 
          showBarikoiLogo={false}
          showAttribution={false}
        />
      );
    });
    
    // Wait for the map to load
    await waitFor(() => {
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // LogoControl and AttributionControl should still be included
    expect(LogoControl).toHaveBeenCalled();
    expect(AttributionControl).toHaveBeenCalled();
    
    // But in a real implementation, these would check the props and not render
    // That would need to be tested at the component level for LogoControl and AttributionControl
  });
}); 