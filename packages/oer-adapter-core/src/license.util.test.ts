import { describe, it, expect } from 'vitest';
import {
  CC_LICENSE_URIS,
  ccCodeToLicenseUri,
  ccLicenseUriToCode,
} from './license.util';

describe('CC_LICENSE_URIS', () => {
  it('contains all standard CC license codes', () => {
    expect(Object.keys(CC_LICENSE_URIS)).toEqual(
      expect.arrayContaining([
        'by',
        'by-sa',
        'by-nc',
        'by-nd',
        'by-nc-sa',
        'by-nc-nd',
        'cc0',
        'pdm',
      ]),
    );
  });
});

describe('ccCodeToLicenseUri', () => {
  it('maps CC BY code to license URI', () => {
    expect(ccCodeToLicenseUri('by')).toBe(
      'https://creativecommons.org/licenses/by/4.0/',
    );
  });

  it('maps CC BY-SA code to license URI', () => {
    expect(ccCodeToLicenseUri('by-sa')).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
  });

  it('maps CC BY-NC-ND code to license URI', () => {
    expect(ccCodeToLicenseUri('by-nc-nd')).toBe(
      'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    );
  });

  it('handles CC0 public domain dedication', () => {
    expect(ccCodeToLicenseUri('cc0')).toBe(
      'https://creativecommons.org/publicdomain/zero/1.0/',
    );
  });

  it('handles PDM public domain mark', () => {
    expect(ccCodeToLicenseUri('pdm')).toBe(
      'https://creativecommons.org/publicdomain/mark/1.0/',
    );
  });

  it('is case-insensitive', () => {
    expect(ccCodeToLicenseUri('BY-SA')).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
  });

  it('returns null for unknown codes', () => {
    expect(ccCodeToLicenseUri('unknown')).toBeNull();
  });
});

describe('ccLicenseUriToCode', () => {
  it('extracts BY code from CC BY license URI', () => {
    expect(
      ccLicenseUriToCode('https://creativecommons.org/licenses/by/4.0/'),
    ).toBe('by');
  });

  it('extracts BY-SA code from CC BY-SA license URI', () => {
    expect(
      ccLicenseUriToCode('https://creativecommons.org/licenses/by-sa/4.0/'),
    ).toBe('by-sa');
  });

  it('extracts BY-NC-ND code from CC BY-NC-ND license URI', () => {
    expect(
      ccLicenseUriToCode(
        'https://creativecommons.org/licenses/by-nc-nd/4.0/',
      ),
    ).toBe('by-nc-nd');
  });

  it('recognizes CC0 URIs', () => {
    expect(
      ccLicenseUriToCode(
        'https://creativecommons.org/publicdomain/zero/1.0/',
      ),
    ).toBe('cc0');
  });

  it('recognizes PDM URIs', () => {
    expect(
      ccLicenseUriToCode(
        'https://creativecommons.org/publicdomain/mark/1.0/',
      ),
    ).toBe('pdm');
  });

  it('returns null for unrecognized URIs', () => {
    expect(ccLicenseUriToCode('https://example.com/license')).toBeNull();
  });
});
