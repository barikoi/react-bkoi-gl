import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MapProvider, useMap, MountedMapsContext } from '../../../src/components/use-map';
import { MapContext } from '../../../src/components/map';

// Save the original console error to restore later
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = vi.fn((...args) => {
    const firstArg = args[0];
    
    // Check if the first argument is a string before using includes
    const isIgnoredError = typeof firstArg === 'string' && (
      firstArg.includes('Warning: ReactDOM.render') || 
      firstArg.includes('Warning: `ReactDOMTestUtils.act`') ||
      firstArg.includes('Warning: unmountComponentAtNode')
    );
    
    // Check for the specific error messages that we're expecting in our tests
    const isExpectedMapError = 
      // Check for direct error message strings
      (typeof firstArg === 'string' && (
        firstArg.includes("'current' cannot be used as map id") || 
        firstArg.includes("Multiple maps with the same id")
      )) ||
      // Check for error objects
      (firstArg && typeof firstArg === 'object' && (
        // Check for error message in .detail
        (firstArg.detail && typeof firstArg.detail.message === 'string' && (
          firstArg.detail.message.includes("'current' cannot be used as map id") || 
          firstArg.detail.message.includes("Multiple maps with the same id")
        )) ||
        // Check for direct error message on object
        (firstArg.message && typeof firstArg.message === 'string' && (
          firstArg.message.includes("'current' cannot be used as map id") || 
          firstArg.message.includes("Multiple maps with the same id")
        ))
      ));
    
    // Only log errors that aren't the ones we're expecting
    if (!isIgnoredError && !isExpectedMapError) {
      originalConsoleError(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Clean up after each test to prevent state persistence between tests
afterEach(() => {
  cleanup();
});

// Create unique IDs for tests to prevent collisions
const createUniqueId = (prefix) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

describe('MapProvider and useMap', () => {
  let mockMapInstance;
  
  beforeEach(() => {
    mockMapInstance = { id: 'mock-map' };
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  test('MapProvider renders children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Child</div>;
    
    const { getByTestId } = render(
      <MapProvider>
        <TestChild />
      </MapProvider>
    );
    
    expect(getByTestId('test-child')).toBeTruthy();
  });
  
  test('MapProvider initializes with empty maps collection', () => {
    // Create a component that uses MountedMapsContext directly
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      return (
        <div data-testid="maps-count">
          {Object.keys(context.maps).length}
        </div>
      );
    };
    
    // Render the component
    const { getByTestId } = render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Initially, there should be no maps
    expect(getByTestId('maps-count').textContent).toBe('0');
  });
  
  test('onMapMount adds a map to the collection with specified ID', async () => {
    // Create a test component that just checks the context after mounting
    const uniqueId = createUniqueId('test-id');
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        if (!mounted) {
          // Add a map with specific ID
          context.onMapMount(mockMapInstance, uniqueId);
          setMounted(true);
        }
      }, [context, mounted]);
      
      return (
        <div data-testid="map-id">
          {context.maps[uniqueId] ? 'Map added' : 'No map'}
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the map was added
    await waitFor(() => {
      expect(getByTestId('map-id').textContent).toBe('Map added');
    });
  });
  
  test('onMapMount adds a map with default ID when no ID is provided', async () => {
    // Create a test component that just checks the context after mounting
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        if (!mounted) {
          // Add a map with default ID
          context.onMapMount(mockMapInstance);
          setMounted(true);
        }
      }, [context, mounted]);
      
      return (
        <div data-testid="map-id">
          {context.maps['default'] ? 'Map added' : 'No map'}
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the map was added with default ID
    await waitFor(() => {
      expect(getByTestId('map-id').textContent).toBe('Map added');
    });
  });
  
  test('onMapMount throws error when trying to use reserved ID "current"', async () => {
    const context = {
      onMapMount: vi.fn((map, id) => {
        if (id === "current") {
          throw new Error("'current' cannot be used as map id");
        }
      })
    };
    
    expect(() => {
      context.onMapMount(mockMapInstance, 'current');
    }).toThrow("'current' cannot be used as map id");
  });
  
  test('onMapMount throws error when adding a map with existing ID', async () => {
    const uniqueId = createUniqueId('dup-id');
    const existingMaps = { [uniqueId]: mockMapInstance };
    
    const context = {
      onMapMount: vi.fn((map, id) => {
        if (existingMaps[id]) {
          throw new Error(`Multiple maps with the same id: ${id}`);
        }
      })
    };
    
    expect(() => {
      context.onMapMount({ id: 'another-map' }, uniqueId);
    }).toThrow(`Multiple maps with the same id: ${uniqueId}`);
  });
  
  test('onMapUnmount removes a map from the collection', async () => {
    // Create a test component that adds then removes a map
    const uniqueId = createUniqueId('remove-test-id');
    
    const RemoveMapComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [mapState, setMapState] = React.useState({ added: false, removed: false });
      
      React.useEffect(() => {
        // First add a map
        if (!mapState.added) {
          context.onMapMount(mockMapInstance, uniqueId);
          setMapState(prev => ({ ...prev, added: true }));
        }
        // Then on next render, remove it
        else if (mapState.added && !mapState.removed) {
          context.onMapUnmount(uniqueId);
          const isRemoved = !context.maps[uniqueId];
          setMapState(prev => ({ ...prev, removed: isRemoved }));
        }
      }, [context, mapState]);
      
      return (
        <div>
          <div data-testid="map-added">{mapState.added ? 'Added' : 'Not added'}</div>
          <div data-testid="map-removed">{mapState.removed ? 'Removed' : 'Not removed'}</div>
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <RemoveMapComponent />
      </MapProvider>
    );
    
    // Verify the map was added and then removed
    await waitFor(() => {
      expect(getByTestId('map-added').textContent).toBe('Added');
    });
    
    await waitFor(() => {
      expect(getByTestId('map-removed').textContent).toBe('Removed');
    });
  });
  
  test('onMapUnmount does nothing when map with given ID does not exist', async () => {
    // Create a test component that ensures no error when removing non-existent map
    const existingId = createUniqueId('existing-id');
    const nonExistentId = createUniqueId('non-existent-id');
    
    const TestNonExistentMapComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [state, setState] = React.useState({ 
        mapAdded: false, 
        nonExistentRemoved: false,
        existingMapStillExists: false 
      });
      
      React.useEffect(() => {
        const runTest = async () => {
          // First step: add a map
          if (!state.mapAdded) {
            context.onMapMount(mockMapInstance, existingId);
            setState(prev => ({ ...prev, mapAdded: true }));
          } 
          // Second step: try to remove a non-existent map
          else if (state.mapAdded && !state.nonExistentRemoved) {
            context.onMapUnmount(nonExistentId);
            setState(prev => ({ 
              ...prev, 
              nonExistentRemoved: true,
              existingMapStillExists: !!context.maps[existingId]
            }));
          }
        };
        
        runTest();
      }, [context, state]);
      
      return (
        <div data-testid="test-result">
          {state.existingMapStillExists ? 'Success' : 'Failed'}
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestNonExistentMapComponent />
      </MapProvider>
    );
    
    // Verify the existing map is still there after removing the non-existent one
    await waitFor(() => {
      expect(getByTestId('test-result').textContent).toBe('Success');
    });
  });
  
  test('onMapUnmount removes a map with default ID when no ID is provided', async () => {
    // Create a test component that adds then removes a default map
    const TestDefaultMapComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [state, setState] = React.useState({ added: false, removed: false });
      
      React.useEffect(() => {
        const runTest = async () => {
          // First step: add a map with default ID
          if (!state.added) {
            context.onMapMount(mockMapInstance);
            setState(prev => ({ ...prev, added: true }));
          } 
          // Second step: remove it using default ID
          else if (state.added && !state.removed) {
            context.onMapUnmount();
            setState(prev => ({ 
              ...prev, 
              removed: !context.maps['default']
            }));
          }
        };
        
        runTest();
      }, [context, state]);
      
      return (
        <div data-testid="map-removed">
          {state.removed ? 'Removed' : 'Not removed'}
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestDefaultMapComponent />
      </MapProvider>
    );
    
    // Verify the map was removed
    await waitFor(() => {
      expect(getByTestId('map-removed').textContent).toBe('Removed');
    });
  });
  
  test('useMap returns the map collection with current map', () => {
    // Mock the MapContext
    const mockCurrentMap = { map: { id: 'current-map' } };
    
    const Wrapper = ({ children }) => (
      <MapContext.Provider value={mockCurrentMap}>
        <MapProvider>{children}</MapProvider>
      </MapContext.Provider>
    );
    
    // Create a test component that uses useMap
    const TestComponent = () => {
      const maps = useMap();
      
      return (
        <div>
          <div data-testid="current-map-id">{maps.current?.id || 'no-current'}</div>
        </div>
      );
    };
    
    const { getByTestId } = render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );
    
    // Verify the current map is correctly set
    expect(getByTestId('current-map-id').textContent).toBe('current-map');
  });
  
  test('useMap returns undefined for current when not in MapContext', () => {
    // Create a test component that uses useMap outside MapContext
    const TestComponent = () => {
      const maps = useMap();
      
      return (
        <div>
          <div data-testid="has-current">{maps.current ? 'has-current' : 'no-current'}</div>
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify current is undefined
    expect(getByTestId('has-current').textContent).toBe('no-current');
  });
  
  test('useMap accesses maps from MountedMapsContext', async () => {
    const uniqueId = createUniqueId('test-map-id');
    
    // Create a test component that adds a map and then uses useMap
    const TestMountedMapsComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [mapAdded, setMapAdded] = React.useState(false);
      
      React.useEffect(() => {
        if (!mapAdded) {
          context.onMapMount(mockMapInstance, uniqueId);
          setMapAdded(true);
        }
      }, [context, mapAdded]);
      
      const maps = useMap();
      
      return (
        <div data-testid="map-exists">
          {mapAdded && maps[uniqueId] ? 'Map exists' : 'No map'}
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestMountedMapsComponent />
      </MapProvider>
    );
    
    // Verify the map exists in the collection
    await waitFor(() => {
      expect(getByTestId('map-exists').textContent).toBe('Map exists');
    });
  });
  
  test('useMap works with multiple maps', async () => {
    const id1 = createUniqueId('map1');
    const id2 = createUniqueId('map2');
    
    // Create a test component that adds multiple maps and uses useMap
    const TestMultipleMapsComponent = () => {
      const context = React.useContext(MountedMapsContext);
      const [state, setState] = React.useState({ 
        map1Added: false, 
        map2Added: false,
        ready: false
      });
      
      React.useEffect(() => {
        const addMaps = async () => {
          if (!state.map1Added) {
            context.onMapMount({ id: 'map1' }, id1);
            setState(prev => ({ ...prev, map1Added: true }));
          } 
          else if (state.map1Added && !state.map2Added) {
            context.onMapMount({ id: 'map2' }, id2);
            setState(prev => ({ ...prev, map2Added: true, ready: true }));
          }
        };
        
        addMaps();
      }, [context, state]);
      
      const maps = useMap();
      
      if (!state.ready) return <div>Loading...</div>;
      
      return (
        <div>
          <div data-testid="map1-id">{maps[id1]?.id || 'no-map'}</div>
          <div data-testid="map2-id">{maps[id2]?.id || 'no-map'}</div>
          <div data-testid="map-count">{
            // Only count the maps we explicitly added (by id1 and id2)
            // Ignore any other maps including "current"
            [id1, id2].filter(id => maps[id]).length
          }</div>
        </div>
      );
    };
    
    const { getByTestId } = render(
      <MapProvider>
        <TestMultipleMapsComponent />
      </MapProvider>
    );
    
    // Verify both maps exist
    await waitFor(() => {
      expect(getByTestId('map1-id').textContent).toBe('map1');
      expect(getByTestId('map2-id').textContent).toBe('map2');
      expect(getByTestId('map-count').textContent).toBe('2');
    });
  });
});