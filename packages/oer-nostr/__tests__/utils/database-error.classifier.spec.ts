import {
  DatabaseErrorClassifier,
  PostgresErrorCode,
} from '../../src/utils/database-error.classifier';

describe('DatabaseErrorClassifier', () => {
  describe('isDuplicateKeyError', () => {
    it('should identify duplicate key errors', () => {
      const error = { code: '23505' };
      expect(DatabaseErrorClassifier.isDuplicateKeyError(error)).toBe(true);
    });

    it('should return false for non-duplicate errors', () => {
      const error = { code: '23503' };
      expect(DatabaseErrorClassifier.isDuplicateKeyError(error)).toBe(false);
    });

    it('should return false for objects without code property', () => {
      const error = { message: 'Some error' };
      expect(DatabaseErrorClassifier.isDuplicateKeyError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(DatabaseErrorClassifier.isDuplicateKeyError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(DatabaseErrorClassifier.isDuplicateKeyError(undefined)).toBe(
        false,
      );
    });

    it('should return false for primitives', () => {
      expect(DatabaseErrorClassifier.isDuplicateKeyError('error')).toBe(false);
      expect(DatabaseErrorClassifier.isDuplicateKeyError(123)).toBe(false);
      expect(DatabaseErrorClassifier.isDuplicateKeyError(true)).toBe(false);
    });

    it('should handle Error objects with code property', () => {
      const error = new Error('Duplicate key') as Error & { code: string };
      error.code = PostgresErrorCode.UNIQUE_VIOLATION;
      expect(DatabaseErrorClassifier.isDuplicateKeyError(error)).toBe(true);
    });
  });

  describe('isForeignKeyViolation', () => {
    it('should identify foreign key violations', () => {
      const error = { code: '23503' };
      expect(DatabaseErrorClassifier.isForeignKeyViolation(error)).toBe(true);
    });

    it('should return false for non-foreign-key errors', () => {
      const error = { code: '23505' };
      expect(DatabaseErrorClassifier.isForeignKeyViolation(error)).toBe(false);
    });
  });

  describe('isNotNullViolation', () => {
    it('should identify not-null violations', () => {
      const error = { code: '23502' };
      expect(DatabaseErrorClassifier.isNotNullViolation(error)).toBe(true);
    });

    it('should return false for non-not-null errors', () => {
      const error = { code: '23505' };
      expect(DatabaseErrorClassifier.isNotNullViolation(error)).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error instances', () => {
      const error = new Error('Test error message');
      expect(DatabaseErrorClassifier.extractErrorMessage(error)).toBe(
        'Test error message',
      );
    });

    it('should convert non-Error objects to string', () => {
      const error = { code: '23505', detail: 'duplicate key' };
      expect(DatabaseErrorClassifier.extractErrorMessage(error)).toBe(
        '[object Object]',
      );
    });

    it('should handle string errors', () => {
      const error = 'Simple error message';
      expect(DatabaseErrorClassifier.extractErrorMessage(error)).toBe(
        'Simple error message',
      );
    });

    it('should handle number errors', () => {
      const error = 404;
      expect(DatabaseErrorClassifier.extractErrorMessage(error)).toBe('404');
    });

    it('should handle null', () => {
      expect(DatabaseErrorClassifier.extractErrorMessage(null)).toBe('null');
    });

    it('should handle undefined', () => {
      expect(DatabaseErrorClassifier.extractErrorMessage(undefined)).toBe(
        'undefined',
      );
    });
  });

  describe('extractStackTrace', () => {
    it('should extract stack from Error instances', () => {
      const error = new Error('Test error');
      const stack = DatabaseErrorClassifier.extractStackTrace(error);
      expect(stack).toBeDefined();
      expect(stack).toContain('Error: Test error');
    });

    it('should return undefined for non-Error objects', () => {
      const error = { code: '23505' };
      expect(DatabaseErrorClassifier.extractStackTrace(error)).toBeUndefined();
    });

    it('should return undefined for primitives', () => {
      expect(
        DatabaseErrorClassifier.extractStackTrace('error'),
      ).toBeUndefined();
      expect(DatabaseErrorClassifier.extractStackTrace(123)).toBeUndefined();
      expect(DatabaseErrorClassifier.extractStackTrace(null)).toBeUndefined();
      expect(
        DatabaseErrorClassifier.extractStackTrace(undefined),
      ).toBeUndefined();
    });

    it('should handle Error instances without stack', () => {
      const error = new Error('Test') as Error & { stack?: string };
      delete error.stack;
      expect(DatabaseErrorClassifier.extractStackTrace(error)).toBeUndefined();
    });
  });

  describe('PostgresErrorCode enum', () => {
    it('should have correct error codes', () => {
      expect(PostgresErrorCode.UNIQUE_VIOLATION).toBe('23505');
      expect(PostgresErrorCode.FOREIGN_KEY_VIOLATION).toBe('23503');
      expect(PostgresErrorCode.NOT_NULL_VIOLATION).toBe('23502');
    });
  });
});
