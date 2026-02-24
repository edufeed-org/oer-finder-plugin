import { parseCorsOrigins } from '../configuration';

describe('parseCorsOrigins', () => {
  describe('when input is empty or whitespace', () => {
    it('should return true for an empty string', () => {
      expect(parseCorsOrigins('')).toBe(true);
    });

    it('should return true for a whitespace-only string', () => {
      expect(parseCorsOrigins('   ')).toBe(true);
    });
  });

  describe('exact origins', () => {
    it('should return a single origin as a one-element array', () => {
      expect(parseCorsOrigins('https://myapp.com')).toEqual([
        'https://myapp.com',
      ]);
    });

    it('should return multiple origins as an array of strings', () => {
      expect(
        parseCorsOrigins('https://myapp.com,https://admin.myapp.com'),
      ).toEqual(['https://myapp.com', 'https://admin.myapp.com']);
    });

    it('should trim whitespace around origins', () => {
      expect(parseCorsOrigins('  https://a.com , https://b.com  ')).toEqual([
        'https://a.com',
        'https://b.com',
      ]);
    });

    it('should skip empty entries from double commas', () => {
      expect(parseCorsOrigins('https://a.com,,https://b.com')).toEqual([
        'https://a.com',
        'https://b.com',
      ]);
    });
  });

  describe('wildcard origins', () => {
    let regex: RegExp;

    beforeEach(() => {
      const result = parseCorsOrigins('*.example.com');
      regex = (result as Array<string | RegExp>)[0] as RegExp;
    });

    it('should convert a wildcard entry to a RegExp', () => {
      expect(regex).toBeInstanceOf(RegExp);
    });

    it('should match a single-level https subdomain', () => {
      expect(regex.test('https://app.example.com')).toBe(true);
    });

    it('should match a single-level http subdomain', () => {
      expect(regex.test('http://dev.example.com')).toBe(true);
    });

    it('should not match the apex domain', () => {
      expect(regex.test('https://example.com')).toBe(false);
    });

    it('should not match deep subdomains', () => {
      expect(regex.test('https://a.b.example.com')).toBe(false);
    });

    it('should not match unrelated domains', () => {
      expect(regex.test('https://evil-example.com')).toBe(false);
    });
  });

  describe('mixed exact and wildcard origins', () => {
    let result: Array<string | RegExp>;

    beforeEach(() => {
      result = parseCorsOrigins(
        'https://myapp.com,*.staging.myapp.com',
      ) as Array<string | RegExp>;
    });

    it('should keep the exact origin as a string', () => {
      expect(result[0]).toBe('https://myapp.com');
    });

    it('should convert the wildcard origin to a matching RegExp', () => {
      expect(result[1]).toBeInstanceOf(RegExp);
      expect((result[1] as RegExp).test('https://dev.staging.myapp.com')).toBe(
        true,
      );
    });
  });
});
