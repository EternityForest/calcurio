/**
 * Raised when a calculator definition cannot be used safely.
 */
export class CalculatorDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalculatorDefinitionError';
  }
}

/**
 * Raised when a table definition cannot be used safely.
 */
export class TableDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableDefinitionError';
  }
}

/**
 * Raised when a saved state cannot be applied to a calculator.
 */
export class StateLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateLoadError';
  }
}

/**
 * Raised when bookmark storage is unreadable or unwritable.
 */
export class BookmarkStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BookmarkStorageError';
  }
}

/**
 * Raised when user text is not a finite number.
 */
export class NumberFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NumberFormatError';
  }
}

/**
 * Converts any thrown value into a message suitable for display. Thrown values
 * are not always `Error`s: WebAssembly and Emscripten reject with plain objects
 * such as `ExitStatus`, and `String(value)` would flatten those to the useless
 * `"[object Object]"`. Prefer a readable `name`/`message`, then JSON, and only
 * fall back to `String` for primitives.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const record = error as { name?: unknown; message?: unknown };
    const message = typeof record.message === 'string' ? record.message : '';
    const name = typeof record.name === 'string' ? record.name : '';
    if (message !== '') {
      return name !== '' && name !== 'Error' ? `${name}: ${message}` : message;
    }
    const json = stringify(error);
    if (json !== undefined && json !== '{}') {
      return json;
    }
  }
  return String(error);
}

/** JSON for a value, or undefined when it cannot be serialized (circular). */
function stringify(value: object): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}
