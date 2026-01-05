import {
  extractAmbMetadata,
  extractFileMetadataFields,
  extractNestedId,
  extractLicenseInfo,
  extractKeywords,
  normalizeInLanguage,
} from '../../src/utils/metadata-extractor.util';
import type { NostrEventData } from '../../src/schemas/nostr-event.schema';
import { EVENT_FILE_KIND } from '../../src/constants/event-kinds.constants';

describe('metadata-extractor.util', () => {
  describe('extractNestedId', () => {
    it('should extract id from nested object', () => {
      const metadata = {
        educationalLevel: {
          id: 'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
          prefLabel: { en: 'Middle School' },
        },
      };

      const result = extractNestedId(metadata, 'educationalLevel');
      expect(result).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      );
    });

    it('should return null if field does not exist', () => {
      const metadata = {
        title: 'Test Resource',
      };

      const result = extractNestedId(metadata, 'educationalLevel');
      expect(result).toBeNull();
    });

    it('should return null if field is not an object', () => {
      const metadata = {
        educationalLevel:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      };

      const result = extractNestedId(metadata, 'educationalLevel');
      expect(result).toBeNull();
    });

    it('should return null if nested object has no id', () => {
      const metadata = {
        educationalLevel: {
          prefLabel: { en: 'Middle School' },
        },
      };

      const result = extractNestedId(metadata, 'educationalLevel');
      expect(result).toBeNull();
    });

    it('should return null if id is empty string', () => {
      const metadata = {
        educationalLevel: {
          id: '',
        },
      };

      const result = extractNestedId(metadata, 'educationalLevel');
      expect(result).toBeNull();
    });

    it('should return null for null metadata', () => {
      const result = extractNestedId(
        null as unknown as Record<string, unknown>,
        'educationalLevel',
      );
      expect(result).toBeNull();
    });

    it('should extract audience id', () => {
      const metadata = {
        audience: {
          id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
        },
      };

      const result = extractNestedId(metadata, 'audience');
      expect(result).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );
    });
  });

  describe('extractLicenseInfo', () => {
    it('should extract license URI from tags', () => {
      const tags = [
        ['license:id', 'https://creativecommons.org/licenses/by/4.0/'],
        ['isAccessibleForFree', 'true'],
      ];

      const result = extractLicenseInfo(tags);
      expect(result.uri).toBe('https://creativecommons.org/licenses/by/4.0/');
      expect(result.freeToUse).toBe(true);
    });

    it('should handle missing license tag', () => {
      const tags = [['title', 'Test Resource']];

      const result = extractLicenseInfo(tags);
      expect(result.uri).toBeNull();
      expect(result.freeToUse).toBeNull();
    });

    it('should handle isAccessibleForFree as false', () => {
      const tags = [
        ['license:id', 'https://example.com/license'],
        ['isAccessibleForFree', 'false'],
      ];

      const result = extractLicenseInfo(tags);
      expect(result.freeToUse).toBe(false);
    });

    it('should handle empty tags array', () => {
      const result = extractLicenseInfo([]);
      expect(result.uri).toBeNull();
      expect(result.freeToUse).toBeNull();
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from t tags', () => {
      const tags = [
        ['t', 'math'],
        ['t', 'algebra'],
        ['t', 'equations'],
        ['title', 'Test Resource'],
      ];

      const result = extractKeywords(tags);
      expect(result).toEqual(['math', 'algebra', 'equations']);
    });

    it('should return null if no t tags', () => {
      const tags = [
        ['title', 'Test Resource'],
        ['d', 'https://example.com/resource'],
      ];

      const result = extractKeywords(tags);
      expect(result).toBeNull();
    });

    it('should return null for empty tags array', () => {
      const result = extractKeywords([]);
      expect(result).toBeNull();
    });

    it('should handle single keyword', () => {
      const tags = [['t', 'science']];

      const result = extractKeywords(tags);
      expect(result).toEqual(['science']);
    });
  });

  describe('normalizeInLanguage', () => {
    it('should return array as-is', () => {
      const result = normalizeInLanguage(['en', 'de']);
      expect(result).toEqual(['en', 'de']);
    });

    it('should wrap string in array', () => {
      const result = normalizeInLanguage('en');
      expect(result).toEqual(['en']);
    });

    it('should return null for empty array', () => {
      const result = normalizeInLanguage([]);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = normalizeInLanguage('');
      expect(result).toBeNull();
    });

    it('should return null for null', () => {
      const result = normalizeInLanguage(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = normalizeInLanguage(undefined);
      expect(result).toBeNull();
    });

    it('should return null for number', () => {
      const result = normalizeInLanguage(123);
      expect(result).toBeNull();
    });

    it('should return null for object', () => {
      const result = normalizeInLanguage({ lang: 'en' });
      expect(result).toBeNull();
    });
  });

  describe('extractAmbMetadata', () => {
    const createMockNostrEvent = (tags: string[][]): NostrEventData => ({
      id: 'test-event-id',
      pubkey: 'test-pubkey',
      created_at: 1234567890,
      kind: 30142,
      tags,
      content: '',
      sig: 'test-sig',
    });

    it('should extract URL from d tag', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.url).toBe('https://example.com/resource');
    });

    it('should return null url when d tag is missing', () => {
      const event = createMockNostrEvent([['t', 'some-tag']]);

      const result = extractAmbMetadata(event);

      expect(result.url).toBeNull();
    });

    it('should extract file event ID from e tag', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['e', 'file-event-id-123'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.fileEventId).toBe('file-event-id-123');
    });

    it('should return null fileEventId when e tag is missing', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.fileEventId).toBeNull();
    });

    it('should extract keywords from t tags', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['t', 'keyword1'],
        ['t', 'keyword2'],
        ['t', 'keyword3'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.keywords).toEqual(['keyword1', 'keyword2', 'keyword3']);
    });

    it('should return null keywords when no t tags', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.keywords).toBeNull();
    });

    it('should extract license info from tags', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['license:id', 'https://creativecommons.org/licenses/by/4.0/'],
        ['isAccessibleForFree', 'true'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.license.uri).toBe(
        'https://creativecommons.org/licenses/by/4.0/',
      );
      expect(result.license.freeToUse).toBe(true);
    });

    it('should extract dates from metadata tags', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['dateCreated', '2024-01-10'],
        ['datePublished', '2024-01-15'],
        ['dateModified', '2024-01-20'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.dates.created).toBeInstanceOf(Date);
      expect(result.dates.published).toBeInstanceOf(Date);
      expect(result.dates.modified).toBeInstanceOf(Date);
      expect(result.dates.latest).toBeInstanceOf(Date);
      expect(result.dates.latest?.toISOString()).toContain('2024-01-20');
    });

    it('should extract educational level URI from nested metadata', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['educationalLevel:id', 'http://w3id.org/kim/educationalLevel/level_A'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.educationalLevelUri).toBe(
        'http://w3id.org/kim/educationalLevel/level_A',
      );
    });

    it('should extract audience URI from nested metadata', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        [
          'audience:id',
          'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
        ],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.audienceUri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );
    });

    it('should handle inLanguage with indexed format as object', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['inLanguage:0', 'en'],
        ['inLanguage:1', 'de'],
      ]);

      const result = extractAmbMetadata(event);

      // Indexed tags are parsed as objects, not arrays, so inLanguage gets removed
      expect(result.parsedMetadata).not.toHaveProperty('inLanguage');
    });

    it('should normalize inLanguage string to array in parsed metadata', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['inLanguage', 'en'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.parsedMetadata.inLanguage).toEqual(['en']);
    });

    it('should remove inLanguage from parsed metadata when empty', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['name', 'Test Resource'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.parsedMetadata).not.toHaveProperty('inLanguage');
    });

    it('should filter out Nostr-specific tags from parsed metadata', () => {
      const event = createMockNostrEvent([
        ['d', 'https://example.com/resource'],
        ['e', 'file-event-id'],
        ['t', 'keyword'],
        ['p', 'some-pubkey'],
        ['name', 'Test Resource'],
        ['type', 'Image'],
      ]);

      const result = extractAmbMetadata(event);

      // Nostr tags should not be in parsed metadata
      expect(result.parsedMetadata).not.toHaveProperty('d');
      expect(result.parsedMetadata).not.toHaveProperty('e');
      expect(result.parsedMetadata).not.toHaveProperty('t');
      expect(result.parsedMetadata).not.toHaveProperty('p');

      // AMB fields should be preserved
      expect(result.parsedMetadata.name).toBe('Test Resource');
      expect(result.parsedMetadata.type).toBe('Image');
    });

    it('should extract complete AMB metadata from realistic event', () => {
      const event = createMockNostrEvent([
        ['d', 'https://download.sodix.de/dlms/a6214a68de8d32d2/resource'],
        [
          'e',
          '91777b91b9807b7dfb4016640cc729a2af5b0059caa4f326d368344507989d6c',
        ],
        ['t', 'mobile'],
        ['t', 'education'],
        ['name', 'Car'],
        ['type', 'Image'],
        ['description', 'A car image'],
        ['dateCreated', '2025-01-15'],
        ['datePublished', '2025-01-20'],
        ['learningResourceType:id', 'http://w3id.org/kim/hcrt/image'],
        ['learningResourceType:prefLabel@en', 'Image'],
        ['learningResourceType:prefLabel@de', 'Bild'],
        ['license:id', 'https://creativecommons.org/licenses/by-sa/4.0/'],
        ['isAccessibleForFree', 'true'],
        ['inLanguage', 'en'],
        ['creator:name', 'Siemens Stiftung 2018'],
      ]);

      const result = extractAmbMetadata(event);

      expect(result.url).toBe(
        'https://download.sodix.de/dlms/a6214a68de8d32d2/resource',
      );
      expect(result.fileEventId).toBe(
        '91777b91b9807b7dfb4016640cc729a2af5b0059caa4f326d368344507989d6c',
      );
      expect(result.keywords).toEqual(['mobile', 'education']);
      expect(result.license.uri).toBe(
        'https://creativecommons.org/licenses/by-sa/4.0/',
      );
      expect(result.license.freeToUse).toBe(true);
      expect(result.dates.created).toBeInstanceOf(Date);
      expect(result.dates.published).toBeInstanceOf(Date);
      expect(result.parsedMetadata.name).toBe('Car');
      expect(result.parsedMetadata.type).toBe('Image');
      expect(result.parsedMetadata.description).toBe('A car image');
      expect(result.parsedMetadata.inLanguage).toEqual(['en']);
      expect(result.parsedMetadata.learningResourceType).toEqual({
        id: 'http://w3id.org/kim/hcrt/image',
        'prefLabel@en': 'Image',
        'prefLabel@de': 'Bild',
      });
      expect(result.parsedMetadata.creator).toEqual({
        name: 'Siemens Stiftung 2018',
      });
    });

    it('should handle empty tags array', () => {
      const event = createMockNostrEvent([]);

      const result = extractAmbMetadata(event);

      expect(result.url).toBeNull();
      expect(result.fileEventId).toBeNull();
      expect(result.keywords).toBeNull();
      expect(result.parsedMetadata).toEqual({});
      expect(result.dates.created).toBeNull();
      expect(result.dates.published).toBeNull();
      expect(result.dates.modified).toBeNull();
      expect(result.dates.latest).toBeNull();
    });
  });

  describe('extractFileMetadataFields', () => {
    const createMockFileEvent = (
      tags: string[][],
      content = '',
    ): NostrEventData => ({
      id: 'test-file-event-id',
      pubkey: 'test-pubkey',
      created_at: 1234567890,
      kind: EVENT_FILE_KIND,
      tags,
      content,
      sig: 'test-sig',
    });

    it('should extract mime type from m tag', () => {
      const event = createMockFileEvent([['m', 'image/png']]);

      const result = extractFileMetadataFields(event);

      expect(result.mimeType).toBe('image/png');
    });

    it('should extract dimensions from dim tag', () => {
      const event = createMockFileEvent([['dim', '1920x1080']]);

      const result = extractFileMetadataFields(event);

      expect(result.dim).toBe('1920x1080');
    });

    it('should extract size from size tag', () => {
      const event = createMockFileEvent([['size', '123456']]);

      const result = extractFileMetadataFields(event);

      expect(result.size).toBe(123456);
    });

    it('should extract alt text from alt tag', () => {
      const event = createMockFileEvent([['alt', 'An image of a car']]);

      const result = extractFileMetadataFields(event);

      expect(result.alt).toBe('An image of a car');
    });

    it('should extract description from description tag', () => {
      const event = createMockFileEvent([
        ['description', 'A detailed description'],
      ]);

      const result = extractFileMetadataFields(event);

      expect(result.description).toBe('A detailed description');
    });

    it('should use content as fallback for description', () => {
      const event = createMockFileEvent([], 'Content as description');

      const result = extractFileMetadataFields(event);

      expect(result.description).toBe('Content as description');
    });

    it('should prefer description tag over content', () => {
      const event = createMockFileEvent(
        [['description', 'Tag description']],
        'Content description',
      );

      const result = extractFileMetadataFields(event);

      expect(result.description).toBe('Tag description');
    });

    it('should return null for missing fields', () => {
      const event = createMockFileEvent([]);

      const result = extractFileMetadataFields(event);

      expect(result.mimeType).toBeNull();
      expect(result.dim).toBeNull();
      expect(result.size).toBeNull();
      expect(result.alt).toBeNull();
      expect(result.description).toBeNull();
    });

    it('should extract all fields from complete file event', () => {
      const event = createMockFileEvent([
        ['m', 'image/jpeg'],
        ['dim', '800x600'],
        ['size', '54321'],
        ['alt', 'Test image alt'],
        ['description', 'Test image description'],
      ]);

      const result = extractFileMetadataFields(event);

      expect(result.mimeType).toBe('image/jpeg');
      expect(result.dim).toBe('800x600');
      expect(result.size).toBe(54321);
      expect(result.alt).toBe('Test image alt');
      expect(result.description).toBe('Test image description');
    });

    it('should handle invalid size value', () => {
      const event = createMockFileEvent([['size', 'not-a-number']]);

      const result = extractFileMetadataFields(event);

      expect(result.size).toBeNull();
    });
  });
});
