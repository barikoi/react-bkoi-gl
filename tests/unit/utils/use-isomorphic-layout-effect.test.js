// Tests for useIsomorphicLayoutEffect utility (browser/jsdom branch)
import { useEffect, useLayoutEffect } from 'react';
import useIsomorphicLayoutEffect from '../../../src/utils/use-isomorphic-layout-effect';

describe('useIsomorphicLayoutEffect (browser environment)', () => {
  test('returns useLayoutEffect when document is defined', () => {
    expect(typeof document).toBe('object');
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
    expect(useIsomorphicLayoutEffect).not.toBe(useEffect);
  });
});
