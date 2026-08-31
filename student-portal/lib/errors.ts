/** True if `value` is a real Error (or subclass, e.g. ApiError) rather than an unknown catch value. */
export function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

/** Safe display message for an unknown catch value, falling back when it isn't an Error or has no message. */
export function errorMessage(value: unknown, fallback: string): string {
  return isErrorLike(value) && value.message ? value.message : fallback;
}
