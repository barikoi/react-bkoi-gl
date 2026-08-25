import { emitWarning } from '../../src/utils/warn';
import { logger } from '../../src/utils/logger';

describe('emitWarning', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('routes to the onWarning callback when provided', () => {
    const onWarning = vi.fn();
    const error = new Error('transient');

    emitWarning(onWarning, error);

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        error,
      })
    );
  });

  test('wraps non-Error values in an Error', () => {
    const onWarning = vi.fn();

    emitWarning(onWarning, 'string failure');

    expect(onWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
      })
    );
    const { error } = onWarning.mock.calls[0][0];
    expect(error.message).toBe('string failure');
  });

  test('keeps Error instances unwrapped', () => {
    const onWarning = vi.fn();
    const error = new Error('original');

    emitWarning(onWarning, error);

    expect(onWarning.mock.calls[0][0].error).toBe(error);
  });

  test('falls back to logger.warn when no onWarning callback', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const error = new Error('fallback');

    emitWarning(undefined, error);

    expect(warnSpy).toHaveBeenCalledWith(error);
  });

  test('coerces non-Error values before logging fallback', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    emitWarning(undefined, { weird: true });

    expect(warnSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(warnSpy.mock.calls[0][0].message).toBe('[object Object]');
  });
});
