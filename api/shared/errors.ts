/**
 * Helpers for the `unknown` values TypeScript hands us in `catch` blocks.
 *
 * A thrown value is not guaranteed to be an `Error`, so reach for these instead
 * of casting — `error.message` on a rejected non-Error is a runtime crash inside
 * the error handler itself.
 */

/** The message of a thrown value, falling back to its string form. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/** The stack of a thrown value, when it is a real `Error`. */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Read a named property off a thrown value without asserting its shape.
 * Useful for driver-specific fields such as MongoDB's numeric `code`.
 */
export function getErrorProperty(error: unknown, key: string): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  return (error as Record<string, unknown>)[key];
}
