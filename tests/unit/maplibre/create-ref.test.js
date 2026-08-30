// Jest-based tests for create-ref.ts
import createRef, { MapRef } from '../../../src/maplibre/create-ref';

describe('createRef', () => {
  let mockMapInstance;
  let mockMaplibre;

  beforeEach(() => {
    // Create a mock map instance with various methods
    mockMapInstance = {
      setMaxBounds: vi.fn(),
      setMinZoom: vi.fn(),
      setMaxZoom: vi.fn(),
      setStyle: vi.fn(),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayerZoomRange: vi.fn(),
      remove: vi.fn(),
      
      // Non-skipped methods that should be included
      getCenter: vi.fn(),
      getZoom: vi.fn(),
      getBearing: vi.fn(),
      getPitch: vi.fn(),
      flyTo: vi.fn(),
      easeTo: vi.fn(),
      jumpTo: vi.fn(),
      fitBounds: vi.fn(),
      
      // Private methods that should be excluded
      _update: vi.fn(),
      _render: vi.fn(),
      
      // Event methods that should be excluded
      fire: vi.fn(),
      setEventedParent: vi.fn(),
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
      baseMethod: vi.fn()
    };
    
    const derivedProto = Object.create(baseProto);
    derivedProto.derivedMethod = vi.fn();
    
    // Create a map instance with prototype chain
    const mapWithProto = Object.create(derivedProto);
    
    // Add methods directly to the instance
    mapWithProto.instanceMethod = vi.fn();
    
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