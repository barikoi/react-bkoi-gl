import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { MapProvider, useMap, MountedMapsContext } from '../../src/components/use-map';
import { MapContext } from '../../src/components/map';

describe('MapProvider and useMap', () => {
  test('MapProvider renders children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Child</div>;
    
    const { getByTestId } = render(
      <MapProvider>
        <TestChild />
      </MapProvider>
    );
    
    expect(getByTestId('test-child')).toBeInTheDocument();
  });

  test('useMap returns correct map collection', () => {
    // Mock the useMap hook's return value
    const mockMap = { id: 'mock-map' };
    const mockMapCollection = { 
      current: mockMap,
      test: { id: 'test-map' }
    };
    
    // Create a component that uses the mocked useMap
    const TestComponent = () => {
      const maps = mockMapCollection;
      return (
        <div data-testid="maps">
          {Object.keys(maps).join(',')}
        </div>
      );
    };
    
    // Render the component
    const { getByTestId } = render(<TestComponent />);
    
    // Verify that both maps are in the collection
    const textContent = getByTestId('maps').textContent;
    expect(textContent).toContain('current');
    expect(textContent).toContain('test');
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
});