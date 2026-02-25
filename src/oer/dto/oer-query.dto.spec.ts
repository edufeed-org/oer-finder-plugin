import * as v from 'valibot';
import { parseOerQuery } from './oer-query.dto';

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
