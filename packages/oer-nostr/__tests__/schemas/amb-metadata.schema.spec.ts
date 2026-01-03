import {
  filterAmbMetadata,
  ALLOWED_AMB_FIELDS,
} from '../../src/schemas/amb-metadata.schema';

describe('AMB Metadata Schema', () => {
  describe('ALLOWED_AMB_FIELDS', () => {
    it('should contain expected AMB fields', () => {
      expect(ALLOWED_AMB_FIELDS).toContain('name');
      expect(ALLOWED_AMB_FIELDS).toContain('type');
      expect(ALLOWED_AMB_FIELDS).toContain('description');
      expect(ALLOWED_AMB_FIELDS).toContain('creator');
      expect(ALLOWED_AMB_FIELDS).toContain('license');
      expect(ALLOWED_AMB_FIELDS).toContain('learningResourceType');
      expect(ALLOWED_AMB_FIELDS).toContain('dateCreated');
      expect(ALLOWED_AMB_FIELDS).toContain('datePublished');
      expect(ALLOWED_AMB_FIELDS).toContain('inLanguage');
    });

    it('should not contain Nostr-specific tags', () => {
      expect(ALLOWED_AMB_FIELDS).not.toContain('d');
      expect(ALLOWED_AMB_FIELDS).not.toContain('e');
      expect(ALLOWED_AMB_FIELDS).not.toContain('t');
      expect(ALLOWED_AMB_FIELDS).not.toContain('p');
    });
  });

  describe('filterAmbMetadata', () => {
    it('should preserve valid AMB fields', () => {
      const input = {
        name: 'Test Resource',
        type: 'LearningResource',
        description: 'A test description',
        creator: { name: 'Test Author' },
        license: { id: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      };

      const result = filterAmbMetadata(input);

      expect(result).toEqual(input);
    });

    it('should strip Nostr-specific tags', () => {
      const input = {
        d: 'https://example.com/resource',
        e: '91777b91b9807b7dfb4016640cc729a2af5b0059caa4f326d368344507989d6c',
        t: 'mobile',
        name: 'Test Resource',
        type: 'Image',
      };

      const result = filterAmbMetadata(input);

      expect(result).toEqual({
        name: 'Test Resource',
        type: 'Image',
      });
      expect(result).not.toHaveProperty('d');
      expect(result).not.toHaveProperty('e');
      expect(result).not.toHaveProperty('t');
    });

    it('should strip all single-letter Nostr tags', () => {
      const input = {
        d: 'url',
        e: 'event-id',
        t: 'tag',
        p: 'pubkey',
        a: 'address',
        name: 'Keep this',
      };

      const result = filterAmbMetadata(input);

      expect(result).toEqual({ name: 'Keep this' });
    });

    it('should pass through nested objects unchanged', () => {
      const input = {
        name: 'Test',
        creator: {
          name: 'Author Name',
          type: 'Person',
          affiliation: {
            name: 'University',
            custom_field: 'should be preserved',
          },
        },
        learningResourceType: {
          id: 'http://w3id.org/kim/hcrt/image',
          'prefLabel@en': 'Image',
          'prefLabel@de': 'Bild',
        },
      };

      const result = filterAmbMetadata(input);

      expect(result).toEqual(input);
      expect((result.creator as Record<string, unknown>).affiliation).toEqual({
        name: 'University',
        custom_field: 'should be preserved',
      });
    });

    it('should handle empty input', () => {
      const result = filterAmbMetadata({});

      expect(result).toEqual({});
    });

    it('should handle input with only Nostr-specific fields', () => {
      const input = {
        d: 'url',
        e: 'event',
        t: 'tag',
      };

      const result = filterAmbMetadata(input);

      expect(result).toEqual({});
    });

    it('should handle realistic Nostr event metadata', () => {
      // This simulates what parseColonSeparatedTags would produce from a real event
      const input = {
        d: 'https://download.sodix.de/dlms/a6214a68de8d32d2/resource',
        e: '91777b91b9807b7dfb4016640cc729a2af5b0059caa4f326d368344507989d6c',
        t: 'mobile',
        name: 'Car',
        type: 'Image',
        description: 'Car',
        dateCreated: '2025-01-15',
        datePublished: '2025-01-20',
        learningResourceType: {
          id: 'http://w3id.org/kim/hcrt/image',
          'prefLabel@en': 'Image',
          'prefLabel@de': 'Bild',
        },
        license: {
          id: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        isAccessibleForFree: 'true',
        inLanguage: ['en'],
        creator: {
          name: 'Siemens Stiftung 2018',
        },
      };

      const result = filterAmbMetadata(input);

      // Should not have Nostr-specific fields
      expect(result).not.toHaveProperty('d');
      expect(result).not.toHaveProperty('e');
      expect(result).not.toHaveProperty('t');

      // Should have all AMB fields
      expect(result).toHaveProperty('name', 'Car');
      expect(result).toHaveProperty('type', 'Image');
      expect(result).toHaveProperty('description', 'Car');
      expect(result).toHaveProperty('dateCreated', '2025-01-15');
      expect(result).toHaveProperty('datePublished', '2025-01-20');
      expect(result).toHaveProperty('learningResourceType');
      expect(result).toHaveProperty('license');
      expect(result).toHaveProperty('isAccessibleForFree', 'true');
      expect(result).toHaveProperty('inLanguage');
      expect(result).toHaveProperty('creator');
    });
  });
});
