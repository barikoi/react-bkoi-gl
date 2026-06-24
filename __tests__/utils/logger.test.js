import { logger, setLogger } from '../../src/utils/logger'

describe('logger', () => {
  let originalWarn
  let originalError

  beforeEach(() => {
    originalWarn = console.warn
    originalError = console.error
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.warn = originalWarn
    console.error = originalError
    // Reset logger to default console implementation
    setLogger({})
  })

  test('uses console.warn/error by default', () => {
    logger.warn('test warning')
    expect(console.warn).toHaveBeenCalledWith('test warning')

    logger.error('test error')
    expect(console.error).toHaveBeenCalledWith('test error')
  })

  test('can configure custom logger', () => {
    const customWarn = jest.fn()
    const customError = jest.fn()

    setLogger({
      warn: customWarn,
      error: customError,
    })

    logger.warn('test warning 2')
    expect(customWarn).toHaveBeenCalledWith('test warning 2')
    expect(console.warn).not.toHaveBeenCalled()

    logger.error('test error 2')
    expect(customError).toHaveBeenCalledWith('test error 2')
    expect(console.error).not.toHaveBeenCalled()
  })

  test('ignores non-function values and falls back to console logger', () => {
    setLogger({
      warn: 'not a function',
      error: null,
    })

    logger.warn('fallback warning')
    expect(console.warn).toHaveBeenCalledWith('fallback warning')

    logger.error('fallback error')
    expect(console.error).toHaveBeenCalledWith('fallback error')
  })
})
