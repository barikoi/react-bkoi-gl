import type { ErrorEvent } from '../types/events'

/**
 * Surface a non-fatal warning. Routes through the consumer's `onWarning`
 * callback when provided, otherwise falls back to `console.warn`.
 *
 * @param onWarning - The consumer-supplied warning handler (from `<Map>`), if any.
 * @param error - The warning value; coerced to an `Error`.
 * @private
 */
export function emitWarning(
  onWarning: ((e: ErrorEvent) => void) | undefined,
  error: unknown
): void {
  const err = error instanceof Error ? error : new Error(String(error))
  if (onWarning) {
    onWarning({ type: 'error', target: null, originalEvent: null, error: err })
  } else {
    console.warn(err)
  }
}
