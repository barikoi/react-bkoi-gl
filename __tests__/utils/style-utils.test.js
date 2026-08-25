// Jest-based tests for style-utils
import { normalizeStyle } from '../../src/utils/style-utils';

describe('normalizeStyle function', () => {
  test('returns null if style is falsy', () => {
    expect(normalizeStyle(null)).toBeNull();
    expect(normalizeStyle(undefined)).toBeNull();
    expect(normalizeStyle(false)).toBeNull();
  });

  test('returns string style as is', () => {
    const stringStyle = 'mapbox://styles/mapbox/streets-v11';
    expect(normalizeStyle(stringStyle)).toBe(stringStyle);
  });

  test('returns style without layers as is', () => {
    const styleWithoutLayers = { version: 8, sources: {} };
    expect(normalizeStyle(styleWithoutLayers)).toBe(styleWithoutLayers);
  });

  test('converts immutable style to plain object', () => {
    const immutableStyle = {
      toJS: vi.fn().mockReturnValue({ 
        version: 8, 
        sources: {},
        layers: []
      })
    };
    
    const result = normalizeStyle(immutableStyle);
    
    expect(immutableStyle.toJS).toHaveBeenCalled();
    expect(result).toEqual({
      version: 8,
      sources: {},
      layers: []
    });
  });

  test('removes interactive property from layers', () => {
    const style = {
      version: 8,
      sources: {},
      layers: [
        { id: 'layer1', type: 'fill', interactive: true }
      ]
    };
    
    const result = normalizeStyle(style);
    
    expect(result.layers[0]).not.toHaveProperty('interactive');
    expect(result.layers[0]).toEqual({ id: 'layer1', type: 'fill' });
  });

  test('expands layer refs', () => {
    const style = {
      version: 8,
      sources: {},
      layers: [
        { 
          id: 'base', 
          type: 'fill',
          source: 'source1',
          'source-layer': 'layer1',
          filter: ['==', 'property', 'value'],
          layout: { visibility: 'visible' } 
        },
        { 
          id: 'derived', 
          ref: 'base', 
          paint: { 'fill-color': 'red' } 
        }
      ]
    };
    
    const result = normalizeStyle(style);
    
    // The second layer should have its ref expanded
    expect(result.layers[1]).not.toHaveProperty('ref');
    expect(result.layers[1]).toEqual({
      id: 'derived',
      type: 'fill',
      source: 'source1',
      'source-layer': 'layer1',
      filter: ['==', 'property', 'value'],
      layout: { visibility: 'visible' },
      paint: { 'fill-color': 'red' }
    });
  });

  test('handles both interactive and ref in the same layer', () => {
    const style = {
      version: 8,
      sources: {},
      layers: [
        { 
          id: 'base', 
          type: 'fill',
          source: 'source1' 
        },
        { 
          id: 'derived', 
          ref: 'base', 
          interactive: true,
          paint: { 'fill-color': 'red' } 
        }
      ]
    };
    
    const result = normalizeStyle(style);
    
    expect(result.layers[1]).not.toHaveProperty('ref');
    expect(result.layers[1]).not.toHaveProperty('interactive');
    expect(result.layers[1]).toEqual({
      id: 'derived',
      type: 'fill',
      source: 'source1',
      paint: { 'fill-color': 'red' }
    });
  });

  test('does not mutate the original style object', () => {
    const style = {
      version: 8,
      sources: {},
      layers: [
        { id: 'layer1', interactive: true }
      ]
    };
    
    const originalLayers = [...style.layers];
    
    normalizeStyle(style);
    
    // Original style should not be modified
    expect(style.layers).toEqual(originalLayers);
    expect(style.layers[0].interactive).toBe(true);
  });
}); 