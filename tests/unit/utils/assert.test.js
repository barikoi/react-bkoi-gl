// Jest-based tests for assert utility
import assert from '../../../src/utils/assert'

describe('assert utility', () => {
  test('does not throw error when condition is true', () => {
    expect(() => {
      assert(true, 'This should not throw')
    }).not.toThrow()
  })

  test('does not throw error when condition is truthy', () => {
    expect(() => {
      assert(1, 'This should not throw')
    }).not.toThrow()

    expect(() => {
      assert({}, 'This should not throw')
    }).not.toThrow()

    expect(() => {
      assert([], 'This should not throw')
    }).not.toThrow()

    expect(() => {
      assert('string', 'This should not throw')
    }).not.toThrow()
  })

  test('throws error with provided message when condition is false', () => {
    const errorMessage = 'Condition is false'
    expect(() => {
      assert(false, errorMessage)
    }).toThrow(errorMessage)
  })

  test('throws error with provided message when condition is falsy', () => {
    const errorMessage = 'Condition is falsy'

    expect(() => {
      assert(0, errorMessage)
    }).toThrow(errorMessage)

    expect(() => {
      assert('', errorMessage)
    }).toThrow(errorMessage)

    expect(() => {
      assert(null, errorMessage)
    }).toThrow(errorMessage)

    expect(() => {
      assert(undefined, errorMessage)
    }).toThrow(errorMessage)

    expect(() => {
      assert(NaN, errorMessage)
    }).toThrow(errorMessage)
  })

  test('error thrown is an instance of Error', () => {
    try {
      assert(false, 'test error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('test error')
    }
  })
})
