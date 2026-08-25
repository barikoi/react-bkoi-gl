// @vitest-environment node
// Tests for useIsomorphicLayoutEffect utility (server/node branch — no jsdom,
// so `typeof document === 'undefined'` and the real useEffect fallback runs).
import { useEffect, useLayoutEffect } from 'react';
import useIsomorphicLayoutEffect from '../../src/utils/use-isomorphic-layout-effect';

describe('useIsomorphicLayoutEffect (server environment)', () => {
  test('returns useEffect when document is undefined', () => {
    expect(typeof document).toBe('undefined');
    expect(useIsomorphicLayoutEffect).toBe(useEffect);
    expect(useIsomorphicLayoutEffect).not.toBe(useLayoutEffect);
  });
});
