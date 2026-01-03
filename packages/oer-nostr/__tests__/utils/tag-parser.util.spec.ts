import {
  parseColonSeparatedTags,
  extractTagValues,
  findTagValue,
  findEventIdByMarker,
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

  describe('findEventIdByMarker', () => {
    describe('standard format: ["e", "event_id", "relay_url", "marker"]', () => {
      it('should find event ID with matching marker', () => {
        const tags = [
          ['e', 'abc123eventid', 'wss://relay.example.com', 'file'],
          ['e', 'other-event-id', 'wss://relay.example.com', 'reply'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('abc123eventid');
      });

      it('should return null when marker not found', () => {
        const tags = [
          ['e', 'abc123eventid', 'wss://relay.example.com', 'reply'],
          ['type', 'LearningResource'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBeNull();
      });

      it('should return null when e tag has insufficient fields', () => {
        const tags = [
          ['e', 'abc123eventid', 'wss://relay.example.com'], // Missing marker
          ['e', 'xyz'], // Insufficient fields
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBeNull();
      });

      it('should handle relay URL with port', () => {
        const tags = [['e', 'xyz789eventid', 'ws://localhost:10547', 'file']];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('xyz789eventid');
      });
    });

    describe('compact format: ["e", "event_id:relay_url:marker"]', () => {
      it('should find event ID with simple relay URL', () => {
        const tags = [
          ['e', 'abc123eventid:wss://relay.example.com:file'],
          ['e', 'other-event-id:wss://relay.example.com:reply'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('abc123eventid');
      });

      it('should find event ID with relay URL containing port', () => {
        const tags = [
          [
            'e',
            'dbd8fcdeca8ba9d16a98c2d33ee770fdb3e51389f36953671e991e5cb63586fa:ws://127.0.0.1:10547:file',
          ],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe(
          'dbd8fcdeca8ba9d16a98c2d33ee770fdb3e51389f36953671e991e5cb63586fa',
        );
      });

      it('should find event ID with wss:// relay URL and port', () => {
        const tags = [['e', 'event123:wss://relay.example.com:8080:file']];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('event123');
      });

      it('should return null when marker does not match', () => {
        const tags = [
          ['e', 'abc123:ws://localhost:10547:reply'],
          ['e', 'xyz789:wss://relay.com:root'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBeNull();
      });

      it('should handle minimal compact format event_id:marker', () => {
        const tags = [['e', 'simpleeventid:file']];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('simpleeventid');
      });

      it('should check standard format before compact for each tag', () => {
        // If a tag has 4 elements with matching marker, use standard format
        // even if the second element contains colons
        const tags = [['e', 'event1:ws://relay:wrong', 'ws://relay', 'file']];

        const result = findEventIdByMarker(tags, 'file');

        // Standard format (4 elements) is checked first
        expect(result).toBe('event1:ws://relay:wrong');
      });

      it('should return first matching tag regardless of format', () => {
        const tags = [
          ['e', 'compact-event:ws://relay:8080:file'],
          ['e', 'standard-event', 'ws://relay', 'file'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        // First matching tag wins (compact in this case)
        expect(result).toBe('compact-event');
      });

      it('should return first matching compact format event', () => {
        const tags = [
          ['e', 'first-event:ws://relay1:10547:file'],
          ['e', 'second-event:ws://relay2:10547:file'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('first-event');
      });
    });

    describe('edge cases', () => {
      it('should handle empty tag array', () => {
        const tags: string[][] = [];
        const result = findEventIdByMarker(tags, 'file');
        expect(result).toBeNull();
      });

      it('should skip non-e tags', () => {
        const tags = [
          ['d', 'not-an-e-tag:file'],
          ['e', 'real-event:ws://relay:file'],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('real-event');
      });

      it('should handle e tag with only event ID (no colon)', () => {
        const tags = [['e', 'loneeventid']];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBeNull();
      });

      it('should handle mixed standard and compact formats', () => {
        const tags = [
          ['e', 'compact1:ws://relay:reply'],
          ['e', 'standard1', 'ws://relay', 'root'],
          ['e', 'compact2:ws://relay:file'],
          ['e', 'standard2', 'ws://relay', 'file'],
        ];

        // Should find first matching, which is compact2
        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe('compact2');
      });

      it('should handle event ID with special characters', () => {
        const tags = [
          [
            'e',
            'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:ws://relay:file',
          ],
        ];

        const result = findEventIdByMarker(tags, 'file');

        expect(result).toBe(
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        );
      });
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
