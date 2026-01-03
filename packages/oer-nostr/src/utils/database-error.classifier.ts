/**
 * PostgreSQL error codes for common constraint violations.
 */
export enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
}

/**
 * Utility for classifying and identifying database errors.
 */
export class DatabaseErrorClassifier {
  /**
   * Checks if an error is a PostgreSQL unique constraint violation (duplicate key).
   *
   * @param error - Unknown error object to classify
   * @returns True if the error is a duplicate key violation
   */
  static isDuplicateKeyError(error: unknown): boolean {
    return this.hasPostgresErrorCode(error, PostgresErrorCode.UNIQUE_VIOLATION);
  }

  /**
   * Checks if an error is a PostgreSQL foreign key violation.
   *
   * @param error - Unknown error object to classify
   * @returns True if the error is a foreign key violation
   */
  static isForeignKeyViolation(error: unknown): boolean {
    return this.hasPostgresErrorCode(
      error,
      PostgresErrorCode.FOREIGN_KEY_VIOLATION,
    );
  }

  /**
   * Checks if an error is a PostgreSQL not-null constraint violation.
   *
   * @param error - Unknown error object to classify
   * @returns True if the error is a not-null violation
   */
  static isNotNullViolation(error: unknown): boolean {
    return this.hasPostgresErrorCode(
      error,
      PostgresErrorCode.NOT_NULL_VIOLATION,
    );
  }

  /**
   * Type guard to check if error has a specific PostgreSQL error code.
   */
  private static hasPostgresErrorCode(
    error: unknown,
    code: PostgresErrorCode,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === code
    );
  }

  /**
   * Extracts error message from unknown error object.
   */
  static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Extracts stack trace from unknown error object.
   */
  static extractStackTrace(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }
}
