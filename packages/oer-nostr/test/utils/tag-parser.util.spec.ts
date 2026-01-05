import {
  parseColonSeparatedTags,
  extractTagValues,
  findTagValue,
  parseBoolean,
  parseBigInt,
} from '../../src/utils/tag-parser.util';

describe('Tag Parser Utilities', () => {
  describe('parseColonSeparatedTags', () => {
    it('should parse simple key-value tags', () => {
      const tags = [
        ['type', 'LearningResource'],
        ['name', 'Photosynthesis Diagram'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        type: 'LearningResource',
        name: 'Photosynthesis Diagram',
      });
    });

    it('should parse two-level nested tags', () => {
      const tags = [
        ['learningResourceType:id', 'http://w3id.org/kim/hcrt/image'],
        ['license:id', 'https://creativecommons.org/licenses/by-sa/4.0/'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        learningResourceType: {
          id: 'http://w3id.org/kim/hcrt/image',
        },
        license: {
          id: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
      });
    });

    it('should parse three-level tags with full nesting', () => {
      const tags = [
        ['learningResourceType:prefLabel:en', 'Image'],
        ['learningResourceType:prefLabel:de', 'Bild'],
        ['learningResourceType:id', 'http://w3id.org/kim/hcrt/image'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        learningResourceType: {
          prefLabel: {
            en: 'Image',
            de: 'Bild',
          },
          id: 'http://w3id.org/kim/hcrt/image',
        },
      });
    });

    it('should handle mixed simple and nested tags', () => {
      const tags = [
        ['type', 'LearningResource'],
        ['learningResourceType:id', 'http://w3id.org/kim/hcrt/image'],
        ['learningResourceType:prefLabel:en', 'Image'],
        ['name', 'Test Resource'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        type: 'LearningResource',
        learningResourceType: {
          id: 'http://w3id.org/kim/hcrt/image',
          prefLabel: {
            en: 'Image',
          },
        },
        name: 'Test Resource',
      });
    });

    it('should parse deeply nested tags with 4+ levels', () => {
      const tags = [
        ['organization:address:postalCode:value', '12345'],
        ['organization:address:city', 'New York'],
        ['organization:name', 'Example Org'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        organization: {
          address: {
            postalCode: {
              value: '12345',
            },
            city: 'New York',
          },
          name: 'Example Org',
        },
      });
    });

    it('should merge multiple tags with shared prefixes', () => {
      const tags = [
        ['author:name', 'John'],
        ['author:email', 'john@example.com'],
        ['author:contact:phone', '555-1234'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        author: {
          name: 'John',
          email: 'john@example.com',
          contact: {
            phone: '555-1234',
          },
        },
      });
    });

    it('should skip invalid tags', () => {
      const tags = [
        ['validKey', 'validValue'],
        [], // Empty tag
        ['onlyKey'], // Missing value
        [123, 'number-key'] as unknown as string[], // Non-string key
        ['key', 123] as unknown as string[], // Non-string value
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        validKey: 'validValue',
      });
    });

    it('should handle empty tag array', () => {
      const tags: string[][] = [];
      const result = parseColonSeparatedTags(tags);
      expect(result).toEqual({});
    });

    it('should handle duplicate keys by overwriting', () => {
      const tags = [
        ['name', 'First Name'],
        ['name', 'Second Name'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result).toEqual({
        name: 'Second Name',
      });
    });
  });

  describe('extractTagValues', () => {
    it('should extract all values for a given tag key', () => {
      const tags = [
        ['t', 'photosynthesis'],
        ['t', 'biology'],
        ['t', 'plant-science'],
        ['type', 'LearningResource'],
      ];

      const result = extractTagValues(tags, 't');

      expect(result).toEqual(['photosynthesis', 'biology', 'plant-science']);
    });

    it('should return empty array when tag key not found', () => {
      const tags = [
        ['type', 'LearningResource'],
        ['name', 'Test'],
      ];

      const result = extractTagValues(tags, 't');

      expect(result).toEqual([]);
    });

    it('should handle empty tag array', () => {
      const tags: string[][] = [];
      const result = extractTagValues(tags, 't');
      expect(result).toEqual([]);
    });

    it('should skip invalid tags', () => {
      const tags = [
        ['t', 'valid'],
        ['t'], // Missing value
        [], // Empty tag
        ['t', 'another-valid'],
      ];

      const result = extractTagValues(tags, 't');

      expect(result).toEqual(['valid', 'another-valid']);
    });
  });

  describe('findTagValue', () => {
    it('should find the first value for a given tag key', () => {
      const tags = [
        ['d', 'https://example.edu/image.png'],
        ['type', 'LearningResource'],
      ];

      const result = findTagValue(tags, 'd');

      expect(result).toBe('https://example.edu/image.png');
    });

    it('should return null when tag key not found', () => {
      const tags = [
        ['type', 'LearningResource'],
        ['name', 'Test'],
      ];

      const result = findTagValue(tags, 'd');

      expect(result).toBeNull();
    });

    it('should return first value when multiple tags with same key exist', () => {
      const tags = [
        ['type', 'First'],
        ['type', 'Second'],
      ];

      const result = findTagValue(tags, 'type');

      expect(result).toBe('First');
    });

    it('should handle empty tag array', () => {
      const tags: string[][] = [];
      const result = findTagValue(tags, 'd');
      expect(result).toBeNull();
    });
  });

  describe('parseBoolean', () => {
    it('should parse "true" to true', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('True')).toBe(true);
      expect(parseBoolean('  true  ')).toBe(true);
    });

    it('should parse "false" to false', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('FALSE')).toBe(false);
      expect(parseBoolean('False')).toBe(false);
      expect(parseBoolean('  false  ')).toBe(false);
    });

    it('should return null for invalid boolean strings', () => {
      expect(parseBoolean('yes')).toBeNull();
      expect(parseBoolean('no')).toBeNull();
      expect(parseBoolean('1')).toBeNull();
      expect(parseBoolean('0')).toBeNull();
      expect(parseBoolean('')).toBeNull();
      expect(parseBoolean('invalid')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseBoolean(null)).toBeNull();
    });
  });

  describe('parseBigInt', () => {
    it('should parse valid integer strings', () => {
      expect(parseBigInt('245680')).toBe(245680);
      expect(parseBigInt('0')).toBe(0);
      expect(parseBigInt('999999999')).toBe(999999999);
    });

    it('should return null for invalid integer strings', () => {
      expect(parseBigInt('not-a-number')).toBeNull();
      expect(parseBigInt('12.34')).toBe(12); // parseInt behavior
      expect(parseBigInt('')).toBeNull();
      expect(parseBigInt('abc123')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseBigInt(null)).toBeNull();
    });

    it('should handle negative numbers', () => {
      expect(parseBigInt('-100')).toBe(-100);
    });
  });
});
