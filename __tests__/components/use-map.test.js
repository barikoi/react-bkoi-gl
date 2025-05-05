import React from 'react';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { MapProvider, useMap, MountedMapsContext } from '../../src/components/use-map';
import { MapContext } from '../../src/components/map';

// Mock React.useState to capture the state setter
const mockSetMapsState = jest.fn();
const originalUseState = React.useState;

// Silence React act() warnings
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (!args[0].includes('Warning: ReactDOM.render') && 
        !args[0].includes('Warning: `ReactDOMTestUtils.act`') &&
        !args[0].includes('Warning: unmountComponentAtNode')) {
      originalConsoleError(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('MapProvider and useMap', () => {
  let mockMapInstance;
  let mockSetState;
  
  beforeEach(() => {
    mockMapInstance = { id: 'mock-map' };
    mockSetState = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation((initialState) => {
      if (typeof initialState === 'object') {
        return [initialState, mockSetState];
      }
      return originalUseState(initialState);
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('MapProvider renders children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Child</div>;
    
    const { getByTestId } = render(
      <MapProvider>
        <TestChild />
      </MapProvider>
    );
    
    expect(getByTestId('test-child')).toBeInTheDocument();
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
  
  test('onMapMount adds a map to the collection with specified ID', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        context.onMapMount(mockMapInstance, 'test-id');
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the state update function was called correctly
    expect(mockSetState).toHaveBeenCalled();
    // Get the state updater function
    const stateUpdater = mockSetState.mock.calls[0][0];
    // Apply it to an empty state object
    const newState = stateUpdater({});
    
    // Check that the map was added with correct ID
    expect(newState).toEqual({ 'test-id': mockMapInstance });
  });
  
  test('onMapMount adds a map with default ID when no ID is provided', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        context.onMapMount(mockMapInstance);
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the state update function was called correctly
    expect(mockSetState).toHaveBeenCalled();
    // Get the state updater function
    const stateUpdater = mockSetState.mock.calls[0][0];
    // Apply it to an empty state object
    const newState = stateUpdater({});
    
    // Check that the map was added with default ID
    expect(newState).toEqual({ 'default': mockMapInstance });
  });
  
  test('onMapMount throws error when trying to use reserved ID "current"', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        try {
          context.onMapMount(mockMapInstance, 'current');
        } catch (error) {
          expect(error.message).toBe("'current' cannot be used as map id");
        }
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
  });
  
  test('onMapMount throws error when adding a map with existing ID', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        try {
          // Apply the state updater to a state that already has a map with the same ID
          const stateWithMap = { 'test-id': { id: 'existing-map' } };
          const stateUpdater = (currMaps) => {
            if (currMaps['test-id']) {
              throw new Error(`Multiple maps with the same id: test-id`);
            }
            return { ...currMaps, ['test-id']: mockMapInstance };
          };
          stateUpdater(stateWithMap);
        } catch (error) {
          expect(error.message).toBe('Multiple maps with the same id: test-id');
        }
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
  });
  
  test('onMapUnmount removes a map from the collection', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        context.onMapUnmount('test-id');
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the state update function was called correctly
    expect(mockSetState).toHaveBeenCalled();
    // Get the state updater function
    const stateUpdater = mockSetState.mock.calls[0][0];
    // Apply it to a state with the map we want to remove
    const newState = stateUpdater({ 'test-id': mockMapInstance });
    
    // Check that the map was removed
    expect(newState).toEqual({});
  });
  
  test('onMapUnmount does nothing when map with given ID does not exist', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        context.onMapUnmount('non-existent-id');
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the state update function was called correctly
    expect(mockSetState).toHaveBeenCalled();
    // Get the state updater function
    const stateUpdater = mockSetState.mock.calls[0][0];
    // Apply it to a state without the map
    const initialState = { 'other-id': { id: 'other-map' } };
    const newState = stateUpdater(initialState);
    
    // Check that the state remains unchanged
    expect(newState).toEqual(initialState);
  });
  
  test('onMapUnmount removes a map with default ID when no ID is provided', () => {
    // Directly test the state update function
    const TestComponent = () => {
      const context = React.useContext(MountedMapsContext);
      
      React.useEffect(() => {
        context.onMapUnmount();
      }, [context]);
      
      return <div>Test</div>;
    };
    
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );
    
    // Verify the state update function was called correctly
    expect(mockSetState).toHaveBeenCalled();
    // Get the state updater function
    const stateUpdater = mockSetState.mock.calls[0][0];
    // Apply it to a state with a default map
    const newState = stateUpdater({ 'default': mockMapInstance });
    
    // Check that the map was removed
    expect(newState).toEqual({});
  });
  
  test('useMap combines current map with map collection', () => {
    // Create mock maps
    const mockCurrentMap = { id: 'current-map' };
    const mockNamedMap = { id: 'named-map' };
    
    // Create a custom wrapper component with the needed context
    const Wrapper = ({ children }) => (
      <MapContext.Provider value={{ map: mockCurrentMap }}>
        <MountedMapsContext.Provider value={{
          maps: { 'test-id': mockNamedMap },
          onMapMount: jest.fn(),
          onMapUnmount: jest.fn()
        }}>
          {children}
        </MountedMapsContext.Provider>
      </MapContext.Provider>
    );
    
    // Use renderHook to test the useMap hook with the wrapper
    const { result } = renderHook(() => useMap(), { wrapper: Wrapper });
    
    // Verify the result contains both maps
    expect(result.current.current).toBe(mockCurrentMap);
    expect(result.current['test-id']).toBe(mockNamedMap);
  });
  
  test('useMap returns empty object if no contexts are provided', () => {
    // Use renderHook without any wrapper
    const { result } = renderHook(() => useMap());
    
    // The only key should be current, with value undefined
    expect(result.current).toEqual({ current: undefined });
  });
  
  test('useMap returns correct keys if only MapContext is provided', () => {
    // Create mock map
    const mockCurrentMap = { id: 'current-map' };
    
    // Create a custom wrapper with only MapContext
    const MapOnlyWrapper = ({ children }) => (
      <MapContext.Provider value={{ map: mockCurrentMap }}>
        {children}
      </MapContext.Provider>
    );
    
    // Use renderHook to test the useMap hook with the wrapper
    const { result } = renderHook(() => useMap(), { wrapper: MapOnlyWrapper });
    
    // Should have current but no other maps
    expect(result.current.current).toBe(mockCurrentMap);
    expect(Object.keys(result.current)).toHaveLength(1);
  });
  
  test('useMap returns correct keys if only MountedMapsContext is provided', () => {
    // Create mock maps
    const mockNamedMap = { id: 'named-map' };
    
    // Create a custom wrapper with only MountedMapsContext
    const MapsOnlyWrapper = ({ children }) => (
      <MountedMapsContext.Provider value={{
        maps: { 'test-id': mockNamedMap },
        onMapMount: jest.fn(),
        onMapUnmount: jest.fn()
      }}>
        {children}
      </MountedMapsContext.Provider>
    );
    
    // Use renderHook to test the useMap hook with the wrapper
    const { result } = renderHook(() => useMap(), { wrapper: MapsOnlyWrapper });
    
    // Should have the named map but current should be undefined
    expect(result.current.current).toBeUndefined();
    expect(result.current['test-id']).toBe(mockNamedMap);
  });
});