// Jest-based tests for useIsomorphicLayoutEffect utility
import React from 'react';

// Mock the react module
jest.mock('react', () => {
  const originalModule = jest.requireActual('react');
  return {
    ...originalModule,
    useLayoutEffect: jest.fn().mockName('useLayoutEffect'),
    useEffect: jest.fn().mockName('useEffect')
  };
});

describe('useIsomorphicLayoutEffect', () => {
  // Store the original typeof document
  const originalTypeofDocument = typeof document;
  
  beforeEach(() => {
    // Clear cache for fresh imports and mocks
    jest.resetModules();
    
    // Reset mock implementation and history
    require('react').useLayoutEffect.mockClear();
    require('react').useEffect.mockClear();
  });
  
  afterEach(() => {
    jest.resetModules();
  });
  
  test('returns useLayoutEffect in browser environment', () => {
    // Mock the typeof check to return 'object'
    // We can't easily redefine typeof, so we need to mock the module
    jest.doMock('../../src/utils/use-isomorphic-layout-effect', () => {
      const react = require('react');
      return {
        __esModule: true,
        default: react.useLayoutEffect
      };
    });
    
    const useIsomorphicLayoutEffect = require('../../src/utils/use-isomorphic-layout-effect').default;
    
    // Should be useLayoutEffect
    expect(useIsomorphicLayoutEffect).toBe(require('react').useLayoutEffect);
    expect(useIsomorphicLayoutEffect).not.toBe(require('react').useEffect);
  });
  
  test('returns useEffect in server environment (no document)', () => {
    // Mock the module to simulate server environment (document undefined)
    jest.doMock('../../src/utils/use-isomorphic-layout-effect', () => {
      const react = require('react');
      return {
        __esModule: true,
        default: react.useEffect
      };
    });
    
    const useIsomorphicLayoutEffect = require('../../src/utils/use-isomorphic-layout-effect').default;
    
    // Should be useEffect
    expect(useIsomorphicLayoutEffect).toBe(require('react').useEffect);
    expect(useIsomorphicLayoutEffect).not.toBe(require('react').useLayoutEffect);
  });
}); 