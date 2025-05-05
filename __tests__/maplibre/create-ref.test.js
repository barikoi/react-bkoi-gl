// Jest-based tests for create-ref.ts
import createRef, { MapRef } from '../../src/maplibre/create-ref';

describe('createRef', () => {
  let mockMapInstance;
  let mockMaplibre;

  beforeEach(() => {
    // Create a mock map instance with various methods
    mockMapInstance = {
      setMaxBounds: jest.fn(),
      setMinZoom: jest.fn(),
      setMaxZoom: jest.fn(),
      setStyle: jest.fn(),
      addSource: jest.fn(),
      removeSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      setPaintProperty: jest.fn(),
      setLayerZoomRange: jest.fn(),
      remove: jest.fn(),
      
      // Non-skipped methods that should be included
      getCenter: jest.fn(),
      getZoom: jest.fn(),
      getBearing: jest.fn(),
      getPitch: jest.fn(),
      flyTo: jest.fn(),
      easeTo: jest.fn(),
      jumpTo: jest.fn(),
      fitBounds: jest.fn(),
      
      // Private methods that should be excluded
      _update: jest.fn(),
      _render: jest.fn(),
      
      // Event methods that should be excluded
      fire: jest.fn(),
      setEventedParent: jest.fn(),
    };
    
    // Create mock Maplibre instance
    mockMaplibre = {
      map: mockMapInstance
    };
  });
  
  test('returns null when mapInstance is null', () => {
    const result = createRef(null);
    expect(result).toBeNull();
  });
  
  test('creates a MapRef object with getMap method', () => {
    const result = createRef(mockMaplibre);
    
    expect(result).toBeTruthy();
    expect(typeof result.getMap).toBe('function');
    expect(result.getMap()).toBe(mockMapInstance);
  });
  
  test('excludes skipped methods', () => {
    const result = createRef(mockMaplibre);
    
    // These methods should be excluded
    expect(result.setMaxBounds).toBeUndefined();
    expect(result.setMinZoom).toBeUndefined();
    expect(result.setMaxZoom).toBeUndefined();
    expect(result.setStyle).toBeUndefined();
    expect(result.addSource).toBeUndefined();
    expect(result.removeSource).toBeUndefined();
    expect(result.addLayer).toBeUndefined();
    expect(result.removeLayer).toBeUndefined();
    expect(result.setPaintProperty).toBeUndefined();
    expect(result.setLayerZoomRange).toBeUndefined();
    expect(result.remove).toBeUndefined();
  });
  
  test('includes non-skipped methods with proper binding', () => {
    const result = createRef(mockMaplibre);
    
    // These methods should be included and bound to the map instance
    expect(typeof result.getCenter).toBe('function');
    expect(typeof result.getZoom).toBe('function');
    expect(typeof result.getBearing).toBe('function');
    expect(typeof result.getPitch).toBe('function');
    expect(typeof result.flyTo).toBe('function');
    expect(typeof result.easeTo).toBe('function');
    expect(typeof result.jumpTo).toBe('function');
    expect(typeof result.fitBounds).toBe('function');
    
    // Test that the method is correctly bound by calling it
    result.getCenter();
    expect(mockMapInstance.getCenter).toHaveBeenCalled();
    
    result.flyTo({ center: [0, 0] });
    expect(mockMapInstance.flyTo).toHaveBeenCalledWith({ center: [0, 0] });
  });
  
  test('excludes private methods and event methods', () => {
    const result = createRef(mockMaplibre);
    
    // Private methods should be excluded
    expect(result._update).toBeUndefined();
    expect(result._render).toBeUndefined();
    
    // Event methods should be excluded
    expect(result.fire).toBeUndefined();
    expect(result.setEventedParent).toBeUndefined();
  });
  
  test('handles inheritance by including methods from prototype chain', () => {
    // Create a prototype chain
    const baseProto = {
      baseMethod: jest.fn()
    };
    
    const derivedProto = Object.create(baseProto);
    derivedProto.derivedMethod = jest.fn();
    
    // Create a map instance with prototype chain
    const mapWithProto = Object.create(derivedProto);
    
    // Add methods directly to the instance
    mapWithProto.instanceMethod = jest.fn();
    
    // Add the methods we want to check for
    for (const key in mockMapInstance) {
      if (typeof mockMapInstance[key] === 'function') {
        mapWithProto[key] = mockMapInstance[key];
      }
    }
    
    // Set up Maplibre instance with this map
    const maplibreWithProto = {
      map: mapWithProto
    };
    
    const result = createRef(maplibreWithProto);
    
    // Methods from the prototype chain should be included
    expect(typeof result.baseMethod).toBe('function');
    expect(typeof result.derivedMethod).toBe('function');
    expect(typeof result.instanceMethod).toBe('function');
    
    // Test calling methods from prototype chain
    result.baseMethod();
    expect(mapWithProto.baseMethod).toHaveBeenCalled();
    
    result.derivedMethod();
    expect(mapWithProto.derivedMethod).toHaveBeenCalled();
  });
}); 