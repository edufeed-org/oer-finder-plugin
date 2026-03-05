import * as v from 'valibot';
import { parseOerQuery } from './oer-query.dto';
import { KNOWN_ADAPTER_IDS } from '../../adapter/adapter.constants';

describe('OerQueryDto', () => {
  describe('parseOerQuery', () => {
    it('should parse valid query with source and default pagination', () => {
      const result = parseOerQuery({ source: 'nostr-amb-relay' });

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        source: 'nostr-amb-relay',
      });
    });

    it('should reject query without source', () => {
      expect(() => parseOerQuery({})).toThrow(v.ValiError);
    });

    it('should parse valid query with custom pagination', () => {
      const result = parseOerQuery({
        page: '5',
        pageSize: '15',
        source: 'arasaac',
      });

      expect(result).toEqual({
        page: 5,
        pageSize: 15,
        source: 'arasaac',
      });
    });

    it('should accept page as string and convert to number', () => {
      const result = parseOerQuery({ page: '3', source: 'nostr-amb-relay' });

      expect(result.page).toBe(3);
      expect(typeof result.page).toBe('number');
    });

    it('should accept pageSize as string and convert to number', () => {
      const result = parseOerQuery({
        pageSize: '15',
        source: 'nostr-amb-relay',
      });

      expect(result.pageSize).toBe(15);
      expect(typeof result.pageSize).toBe('number');
    });

    it('should reject page less than 1', () => {
      expect(() =>
        parseOerQuery({ page: '0', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ page: '-1', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should reject pageSize less than 1', () => {
      expect(() =>
        parseOerQuery({ pageSize: '0', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should reject pageSize greater than 20', () => {
      expect(() =>
        parseOerQuery({ pageSize: '21', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ pageSize: '100', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should reject invalid page number string', () => {
      expect(() =>
        parseOerQuery({ page: 'abc', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ page: 'not-a-number', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should reject invalid pageSize number string', () => {
      expect(() =>
        parseOerQuery({ pageSize: 'xyz', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should accept valid language codes', () => {
      expect(
        parseOerQuery({ language: 'en', source: 'nostr-amb-relay' }).language,
      ).toBe('en');
      expect(
        parseOerQuery({ language: 'fr', source: 'nostr-amb-relay' }).language,
      ).toBe('fr');
      expect(
        parseOerQuery({ language: 'de', source: 'nostr-amb-relay' }).language,
      ).toBe('de');
      expect(
        parseOerQuery({ language: 'spa', source: 'nostr-amb-relay' }).language,
      ).toBe('spa');
    });

    it('should reject invalid language code formats', () => {
      expect(() =>
        parseOerQuery({ language: 'english', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ language: 'e', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ language: 'EN', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ language: 'en-US', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
      expect(() =>
        parseOerQuery({ language: '123', source: 'nostr-amb-relay' }),
      ).toThrow(v.ValiError);
    });

    it('should require source parameter', () => {
      const resultNostr = parseOerQuery({ source: 'nostr-amb-relay' });
      expect(resultNostr.source).toBe('nostr-amb-relay');

      const resultArasaac = parseOerQuery({ source: 'arasaac' });
      expect(resultArasaac.source).toBe('arasaac');

      expect(() => parseOerQuery({})).toThrow(v.ValiError);
    });

    it('should accept all known adapter IDs as source', () => {
      for (const id of KNOWN_ADAPTER_IDS) {
        const result = parseOerQuery({ source: id });
        expect(result.source).toBe(id);
      }
    });

    it('should reject unknown source values', () => {
      expect(() => parseOerQuery({ source: 'unknown-adapter' })).toThrow(
        v.ValiError,
      );
      expect(() => parseOerQuery({ source: 'arbitrary-string' })).toThrow(
        v.ValiError,
      );
      expect(() => parseOerQuery({ source: '../path/traversal' })).toThrow(
        v.ValiError,
      );
      expect(() =>
        parseOerQuery({
          source: 'a'.repeat(1000),
        }),
      ).toThrow(v.ValiError);
    });

    it('should accept all string filter parameters', () => {
      const result = parseOerQuery({
        source: 'nostr-amb-relay',
        type: 'image',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      });

      expect(result.type).toBe('image');
      expect(result.searchTerm).toBe('science');
      expect(result.license).toBe(
        'https://creativecommons.org/licenses/by/4.0/',
      );
      expect(result.educational_level).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      );
    });

    it('should accept complete query with all valid parameters', () => {
      const input = {
        page: '2',
        pageSize: '15',
        source: 'nostr-amb-relay',
        type: 'video',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
        language: 'en',
      };

      const result = parseOerQuery(input);

      expect(result).toEqual({
        page: 2,
        pageSize: 15,
        source: 'nostr-amb-relay',
        type: 'video',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
        language: 'en',
      });
    });

    it('should provide meaningful error messages for validation failures', () => {
      try {
        parseOerQuery({ page: 'invalid', source: 'nostr-amb-relay' });
        fail('Should have thrown ValiError');
      } catch (error) {
        expect(error).toBeInstanceOf(v.ValiError);
        expect(error.issues[0].message).toContain('number');
      }

      try {
        parseOerQuery({ language: 'english', source: 'nostr-amb-relay' });
        fail('Should have thrown ValiError');
      } catch (error) {
        expect(error).toBeInstanceOf(v.ValiError);
        expect(error.issues[0].message).toContain('lowercase');
      }
    });

    it('should reject license that is not a valid URL', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          license: 'not-a-url',
        }),
      ).toThrow(v.ValiError);
    });

    it('should reject license containing spaces (injection attempt)', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          license:
            'https://creativecommons.org/licenses/by/4.0/ educationalLevel.id:http://fake',
        }),
      ).toThrow(v.ValiError);
    });

    it('should reject educational_level that is not a valid URL', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          educational_level: 'not-a-url',
        }),
      ).toThrow(v.ValiError);
    });

    it('should reject educational_level containing spaces (injection attempt)', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          educational_level:
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool license.id:http://fake',
        }),
      ).toThrow(v.ValiError);
    });

    it('should reject searchTerm exceeding max length', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          searchTerm: 'a'.repeat(201),
        }),
      ).toThrow(v.ValiError);
    });

    it('should accept searchTerm at max length', () => {
      const result = parseOerQuery({
        source: 'nostr-amb-relay',
        searchTerm: 'a'.repeat(200),
      });
      expect(result.searchTerm).toHaveLength(200);
    });

    it('should reject type exceeding max length', () => {
      expect(() =>
        parseOerQuery({
          source: 'nostr-amb-relay',
          type: 'a'.repeat(101),
        }),
      ).toThrow(v.ValiError);
    });

    it('should accept type at max length', () => {
      const result = parseOerQuery({
        source: 'nostr-amb-relay',
        type: 'a'.repeat(100),
      });
      expect(result.type).toHaveLength(100);
    });

    it('should ignore unknown parameters', () => {
      const result = parseOerQuery({
        page: '1',
        source: 'nostr-amb-relay',
        unknown_param: 'should be ignored',
      } as Record<string, unknown>);

      expect(result).not.toHaveProperty('unknown_param');
      expect(result.page).toBe(1);
    });
  });
});
