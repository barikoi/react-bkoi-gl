// Jest-based tests for useControl hook
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useControl } from '../../src/components/use-control';
import { MapContext } from '../../src/components/map';

describe('useControl Hook', () => {
  let mockMap;
  let mockContext;
  let mockControl;
  
  beforeEach(() => {
    mockControl = {
      remove: jest.fn()
    };
    
    mockMap = {
      hasControl: jest.fn().mockReturnValue(false),
      addControl: jest.fn(),
      removeControl: jest.fn()
    };
    
    mockContext = {
      map: mockMap,
      mapLib: {}
    };
  });
  
  const wrapper = ({ children }) => (
    <MapContext.Provider value={mockContext}>
      {children}
    </MapContext.Provider>
  );
  
  test('adds control to map during initialization', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    
    // Execute
    const { result } = renderHook(() => useControl(onCreate), { wrapper });
    
    // Verify
    expect(onCreate).toHaveBeenCalledWith(mockContext);
    expect(mockMap.addControl).toHaveBeenCalledWith(mockControl, undefined);
    expect(result.current).toBe(mockControl);
  });
  
  test('adds control with position option', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    const options = { position: 'top-left' };
    
    // Execute
    renderHook(() => useControl(onCreate, options), { wrapper });
    
    // Verify
    expect(mockMap.addControl).toHaveBeenCalledWith(mockControl, 'top-left');
  });
  
  test('calls onAdd function after adding control', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    const onAdd = jest.fn();
    const onRemove = jest.fn();
    const options = { position: 'bottom-right' };
    
    // Execute
    renderHook(() => useControl(onCreate, onAdd, onRemove, options), { wrapper });
    
    // Verify
    expect(onAdd).toHaveBeenCalledWith(mockContext);
    expect(onRemove).not.toHaveBeenCalled();
  });
  
  test('overloaded version with onRemove as second parameter', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    const onRemove = jest.fn();
    const options = { position: 'bottom-right' };
    
    // Execute
    renderHook(() => useControl(onCreate, onRemove, options), { wrapper });
    
    // Verify
    expect(mockMap.addControl).toHaveBeenCalledWith(mockControl, 'bottom-right');
    expect(onRemove).not.toHaveBeenCalled(); // Not called until unmount
  });
  
  test('overloaded version with options as second parameter', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    const options = { position: 'bottom-right' };
    
    // Execute
    renderHook(() => useControl(onCreate, options), { wrapper });
    
    // Verify
    expect(mockMap.addControl).toHaveBeenCalledWith(mockControl, 'bottom-right');
  });
  
  test('removes control when component unmounts', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    const onRemove = jest.fn();
    
    // Setup removeControl to fire when called
    mockMap.removeControl.mockImplementation((control) => {
      // This simulates what would happen in the real map
      return true;
    });
    
    // Execute
    const { unmount } = renderHook(() => useControl(onCreate, onRemove), { wrapper });
    
    // Set hasControl to return true so remove will be called
    mockMap.hasControl.mockReturnValue(true);
    
    // Unmount to trigger cleanup
    unmount();
    
    // Verify
    expect(onRemove).toHaveBeenCalledWith(mockContext);
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockControl);
  });
  
  test('does not try to remove control if map no longer has it', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    mockMap.hasControl.mockReturnValue(false);
    
    // Execute
    const { unmount } = renderHook(() => useControl(onCreate), { wrapper });
    
    // Unmount to trigger cleanup
    unmount();
    
    // Verify
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });
  
  test('avoids adding control twice if already on map', () => {
    // Setup
    const onCreate = jest.fn().mockReturnValue(mockControl);
    mockMap.hasControl.mockReturnValue(true);
    
    // Execute
    renderHook(() => useControl(onCreate), { wrapper });
    
    // Verify
    expect(mockMap.addControl).not.toHaveBeenCalled();
  });
}); 