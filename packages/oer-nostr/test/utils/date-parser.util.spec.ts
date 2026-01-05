import {
  parseDate,
  getLatestDate,
  createDateFields,
  extractDatesFromMetadata,
} from '../../src/utils/date-parser.util';

describe('date-parser.util', () => {
  describe('parseDate', () => {
    it('should parse ISO 8601 date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toContain('2024-01-15');
    });

    it('should parse ISO 8601 datetime string', () => {
      const result = parseDate('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should parse Unix timestamp in seconds', () => {
      const timestamp = 1705320000; // 2024-01-15T12:00:00Z
      const result = parseDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp * 1000);
    });

    it('should parse Unix timestamp in milliseconds', () => {
      const timestamp = 1705320000000; // 2024-01-15T12:00:00Z in ms
      const result = parseDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('should return null for null value', () => {
      expect(parseDate(null)).toBeNull();
    });

    it('should return null for undefined value', () => {
      expect(parseDate(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDate('')).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(parseDate('not-a-date')).toBeNull();
    });

    it('should return null for object', () => {
      expect(parseDate({ date: '2024-01-15' })).toBeNull();
    });
  });

  describe('getLatestDate', () => {
    it('should return the latest date from multiple dates', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-20');
      const date3 = new Date('2024-01-15');

      const result = getLatestDate(date1, date2, date3);
      expect(result).toBe(date2);
    });

    it('should handle null values in the mix', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-20');

      const result = getLatestDate(date1, null, date2, null);
      expect(result).toBe(date2);
    });

    it('should return null if all dates are null', () => {
      const result = getLatestDate(null, null, null);
      expect(result).toBeNull();
    });

    it('should return null for empty arguments', () => {
      const result = getLatestDate();
      expect(result).toBeNull();
    });

    it('should return the single date if only one provided', () => {
      const date = new Date('2024-01-15');
      const result = getLatestDate(date);
      expect(result).toBe(date);
    });
  });

  describe('createDateFields', () => {
    it('should create DateFields from valid date values', () => {
      const result = createDateFields('2024-01-10', '2024-01-15', '2024-01-20');

      expect(result.created).toBeInstanceOf(Date);
      expect(result.published).toBeInstanceOf(Date);
      expect(result.modified).toBeInstanceOf(Date);
      expect(result.latest).toBeInstanceOf(Date);
      expect(result.latest?.toISOString()).toContain('2024-01-20');
    });

    it('should handle null values', () => {
      const result = createDateFields(null, '2024-01-15', null);

      expect(result.created).toBeNull();
      expect(result.published).toBeInstanceOf(Date);
      expect(result.modified).toBeNull();
      expect(result.latest).toBeInstanceOf(Date);
    });

    it('should return all nulls when no valid dates', () => {
      const result = createDateFields(null, null, null);

      expect(result.created).toBeNull();
      expect(result.published).toBeNull();
      expect(result.modified).toBeNull();
      expect(result.latest).toBeNull();
    });

    it('should handle mixed date formats', () => {
      const result = createDateFields(
        '2024-01-10',
        1705320000, // Unix timestamp
        '2024-01-20T10:00:00Z',
      );

      expect(result.created).toBeInstanceOf(Date);
      expect(result.published).toBeInstanceOf(Date);
      expect(result.modified).toBeInstanceOf(Date);
      expect(result.latest).toBeInstanceOf(Date);
    });
  });

  describe('extractDatesFromMetadata', () => {
    it('should extract dates from metadata object', () => {
      const metadata = {
        dateCreated: '2024-01-10',
        datePublished: '2024-01-15',
        dateModified: '2024-01-20',
      };

      const result = extractDatesFromMetadata(metadata);

      expect(result.created).toBeInstanceOf(Date);
      expect(result.published).toBeInstanceOf(Date);
      expect(result.modified).toBeInstanceOf(Date);
      expect(result.latest?.toISOString()).toContain('2024-01-20');
    });

    it('should return all nulls for null metadata', () => {
      const result = extractDatesFromMetadata(null);

      expect(result.created).toBeNull();
      expect(result.published).toBeNull();
      expect(result.modified).toBeNull();
      expect(result.latest).toBeNull();
    });

    it('should handle metadata with missing date fields', () => {
      const metadata = {
        title: 'Test Resource',
        datePublished: '2024-01-15',
      };

      const result = extractDatesFromMetadata(metadata);

      expect(result.created).toBeNull();
      expect(result.published).toBeInstanceOf(Date);
      expect(result.modified).toBeNull();
      expect(result.latest).toBeInstanceOf(Date);
    });

    it('should handle empty metadata object', () => {
      const result = extractDatesFromMetadata({});

      expect(result.created).toBeNull();
      expect(result.published).toBeNull();
      expect(result.modified).toBeNull();
      expect(result.latest).toBeNull();
    });
  });
});
