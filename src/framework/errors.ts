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
 * Converts any thrown value into a message suitable for display.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
