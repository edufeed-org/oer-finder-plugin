import * as v from 'valibot';
import { parseOerQuery } from '../dto/oer-query.dto';

describe('OerQueryDto', () => {
  describe('parseOerQuery', () => {
    it('should parse valid query with default values', () => {
      const result = parseOerQuery({});

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
      });
    });

    it('should parse valid query with custom pagination', () => {
      const result = parseOerQuery({
        page: '5',
        pageSize: '15',
      });

      expect(result).toEqual({
        page: 5,
        pageSize: 15,
      });
    });

    it('should accept page as string and convert to number', () => {
      const result = parseOerQuery({ page: '3' });

      expect(result.page).toBe(3);
      expect(typeof result.page).toBe('number');
    });

    it('should accept pageSize as string and convert to number', () => {
      const result = parseOerQuery({ pageSize: '15' });

      expect(result.pageSize).toBe(15);
      expect(typeof result.pageSize).toBe('number');
    });

    it('should reject page less than 1', () => {
      expect(() => parseOerQuery({ page: '0' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ page: '-1' })).toThrow(v.ValiError);
    });

    it('should reject pageSize less than 1', () => {
      expect(() => parseOerQuery({ pageSize: '0' })).toThrow(v.ValiError);
    });

    it('should reject pageSize greater than 20', () => {
      expect(() => parseOerQuery({ pageSize: '21' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ pageSize: '100' })).toThrow(v.ValiError);
    });

    it('should reject invalid page number string', () => {
      expect(() => parseOerQuery({ page: 'abc' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ page: 'not-a-number' })).toThrow(
        v.ValiError,
      );
    });

    it('should reject invalid pageSize number string', () => {
      expect(() => parseOerQuery({ pageSize: 'xyz' })).toThrow(v.ValiError);
    });

    it('should accept valid boolean strings', () => {
      const resultTrue = parseOerQuery({ free_for_use: 'true' });
      expect(resultTrue.free_for_use).toBe(true);
      expect(typeof resultTrue.free_for_use).toBe('boolean');

      const resultFalse = parseOerQuery({ free_for_use: 'false' });
      expect(resultFalse.free_for_use).toBe(false);
      expect(typeof resultFalse.free_for_use).toBe('boolean');
    });

    it('should reject invalid boolean strings', () => {
      expect(() => parseOerQuery({ free_for_use: 'yes' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ free_for_use: 'no' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ free_for_use: '1' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ free_for_use: 'True' })).toThrow(
        v.ValiError,
      );
    });

    it('should accept valid language codes', () => {
      expect(parseOerQuery({ language: 'en' }).language).toBe('en');
      expect(parseOerQuery({ language: 'fr' }).language).toBe('fr');
      expect(parseOerQuery({ language: 'de' }).language).toBe('de');
      expect(parseOerQuery({ language: 'spa' }).language).toBe('spa'); // 3-letter code
    });

    it('should reject invalid language code formats', () => {
      expect(() => parseOerQuery({ language: 'english' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ language: 'e' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ language: 'EN' })).toThrow(v.ValiError); // Must be lowercase
      expect(() => parseOerQuery({ language: 'en-US' })).toThrow(v.ValiError);
      expect(() => parseOerQuery({ language: '123' })).toThrow(v.ValiError);
    });

    it('should accept source parameter', () => {
      const resultNostr = parseOerQuery({ source: 'nostr' });
      expect(resultNostr.source).toBe('nostr');

      const resultArasaac = parseOerQuery({ source: 'arasaac' });
      expect(resultArasaac.source).toBe('arasaac');

      const resultEmpty = parseOerQuery({});
      expect(resultEmpty.source).toBeUndefined();
    });

    it('should accept all string filter parameters', () => {
      const result = parseOerQuery({
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
        type: 'video',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        free_for_use: 'true',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
        language: 'en',
      };

      const result = parseOerQuery(input);

      expect(result).toEqual({
        page: 2,
        pageSize: 15,
        type: 'video',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        free_for_use: true,
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
        language: 'en',
      });
    });

    it('should provide meaningful error messages for validation failures', () => {
      try {
        parseOerQuery({ page: 'invalid' });
        fail('Should have thrown ValiError');
      } catch (error) {
        expect(error).toBeInstanceOf(v.ValiError);
        expect(error.issues[0].message).toContain('number');
      }

      try {
        parseOerQuery({ free_for_use: 'maybe' });
        fail('Should have thrown ValiError');
      } catch (error) {
        expect(error).toBeInstanceOf(v.ValiError);
        expect(error.issues[0].message).toContain('true');
      }

      try {
        parseOerQuery({ language: 'english' });
        fail('Should have thrown ValiError');
      } catch (error) {
        expect(error).toBeInstanceOf(v.ValiError);
        expect(error.issues[0].message).toContain('lowercase');
      }
    });

    it('should ignore unknown parameters', () => {
      const result = parseOerQuery({
        page: '1',
        unknown_param: 'should be ignored',
      } as Record<string, unknown>);

      expect(result).not.toHaveProperty('unknown_param');
      expect(result.page).toBe(1);
    });
  });
});
