// Jest-based tests for deep-equal utility
import { deepEqual, arePointsEqual } from '../../../src/utils/deep-equal'

describe('deepEqual', () => {
  test('primitive values', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual('a', 'b')).toBe(false)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(true, false)).toBe(false)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  test('arrays', () => {
    expect(deepEqual([], [])).toBe(true)
    expect(deepEqual([1, 2], [1, 2])).toBe(true)
    expect(deepEqual([1, 2], [2, 1])).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
    expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false)
  })

  test('objects', () => {
    expect(deepEqual({}, {})).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(deepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } })).toBe(true)
    expect(deepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 4 } })).toBe(false)
  })

  test('mixed types', () => {
    expect(deepEqual([1, { a: 2 }], [1, { a: 2 }])).toBe(true)
    expect(deepEqual([1, { a: 2 }], [1, { a: 3 }])).toBe(false)
    expect(deepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
    expect(deepEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false)
  })

  test('array compared with non-array', () => {
    expect(deepEqual([], {})).toBe(false)
    expect(deepEqual({}, [])).toBe(false)
  })

  test('different object types', () => {
    expect(deepEqual(new Date(), new Date())).toBe(true)
    expect(deepEqual(new Date(), {})).toBe(true)
    expect(deepEqual({}, new Date())).toBe(true)
  })

  test('non-objects', () => {
    expect(deepEqual({}, null)).toBe(false)
    expect(deepEqual(null, {})).toBe(false)
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual({}, 1)).toBe(false)
  })
})

describe('arePointsEqual', () => {
  test('array points', () => {
    expect(arePointsEqual([1, 2], [1, 2])).toBe(true)
    expect(arePointsEqual([1, 2], [3, 4])).toBe(false)
  })

  test('object points', () => {
    expect(arePointsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true)
    expect(arePointsEqual({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(false)
  })

  test('mixed point types', () => {
    expect(arePointsEqual([1, 2], { x: 1, y: 2 })).toBe(true)
    expect(arePointsEqual({ x: 1, y: 2 }, [1, 2])).toBe(true)
  })

  test('undefined points', () => {
    expect(arePointsEqual(undefined, undefined)).toBe(true)
    expect(arePointsEqual([1, 2], undefined)).toBe(false)
    expect(arePointsEqual(undefined, [1, 2])).toBe(false)
  })

  test('partial points', () => {
    expect(arePointsEqual({ x: 1 }, { x: 1 })).toBe(true)
    expect(arePointsEqual({ y: 2 }, { y: 2 })).toBe(true)
  })
})
test('objects with different key counts are not equal', () => {
  expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
})
