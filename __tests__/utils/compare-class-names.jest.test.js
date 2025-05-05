// Jest-based tests for compare-class-names utility
import { compareClassNames } from '../../src/utils/compare-class-names';

describe('compareClassNames function', () => {
  test('returns null if classNames are identical', () => {
    expect(compareClassNames('class1 class2', 'class1 class2')).toBeNull();
  });

  test('returns null if both classNames are undefined', () => {
    expect(compareClassNames(undefined, undefined)).toBeNull();
  });

  test('returns null if both classNames are empty', () => {
    expect(compareClassNames('', '')).toBeNull();
  });

  test('returns array of differences when classes are added', () => {
    const result = compareClassNames('class1', 'class1 class2');
    expect(result).toEqual(['class2']);
  });

  test('returns array of differences when classes are removed', () => {
    const result = compareClassNames('class1 class2', 'class1');
    expect(result).toEqual(['class2']);
  });

  test('returns array of differences when classes are both added and removed', () => {
    const result = compareClassNames('class1 class2', 'class1 class3');
    // Order doesn't matter for the test, but ensure both differences are captured
    expect(result).toContain('class2');
    expect(result).toContain('class3');
    expect(result.length).toBe(2);
  });

  test('handles whitespace correctly', () => {
    const result = compareClassNames('class1  class2', 'class1 class2');
    expect(result).toBeNull();
  });

  test('handles empty string to valid classes', () => {
    const result = compareClassNames('', 'class1 class2');
    expect(result).toEqual(['class1', 'class2']);
  });

  test('handles valid classes to empty string', () => {
    const result = compareClassNames('class1 class2', '');
    expect(result).toEqual(['class1', 'class2']);
  });

  test('handles undefined to valid classes', () => {
    const result = compareClassNames(undefined, 'class1 class2');
    expect(result).toEqual(['class1', 'class2']);
  });

  test('handles valid classes to undefined', () => {
    const result = compareClassNames('class1 class2', undefined);
    expect(result).toEqual(['class1', 'class2']);
  });

  test('ignores duplicated classes in the same string', () => {
    const result = compareClassNames('class1 class1', 'class1');
    expect(result).toBeNull();
  });

  test('handles class order differently', () => {
    const result = compareClassNames('class1 class2', 'class2 class1');
    expect(result).toBeNull();
  });
}); 