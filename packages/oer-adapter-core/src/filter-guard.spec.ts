import { describe, it, expect } from 'vitest';
import { isFilterIncompatible } from './filter-guard.js';
import type { AdapterCapabilities } from './adapter.interface.js';

describe('isFilterIncompatible', () => {
  const baseCapabilities: AdapterCapabilities = {
    supportedTypes: ['image', 'video', 'audio', 'text'],
    supportsLicenseFilter: true,
    supportsEducationalLevelFilter: true,
  };

  it('returns false when no filters are active', () => {
    const result = isFilterIncompatible(baseCapabilities, {});

    expect(result).toBe(false);
  });

  describe('language filter', () => {
    it('returns false when supportedLanguages is undefined (pass-through)', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedLanguages: undefined,
      };

      const result = isFilterIncompatible(caps, { language: 'en' });

      expect(result).toBe(false);
    });

    it('returns false when requested language is in supported list', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedLanguages: ['de', 'en'],
      };

      const result = isFilterIncompatible(caps, { language: 'de' });

      expect(result).toBe(false);
    });

    it('returns true when requested language is not in supported list', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedLanguages: ['de'],
      };

      const result = isFilterIncompatible(caps, { language: 'fr' });

      expect(result).toBe(true);
    });

    it('returns true when supportedLanguages is empty and language is requested', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedLanguages: [],
      };

      const result = isFilterIncompatible(caps, { language: 'en' });

      expect(result).toBe(true);
    });

    it('returns false when supportedLanguages is defined but no language filter active', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedLanguages: ['de'],
      };

      const result = isFilterIncompatible(caps, {});

      expect(result).toBe(false);
    });
  });

  describe('type filter', () => {
    it('returns false when requested type is in supportedTypes', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedTypes: ['image', 'video'],
      };

      const result = isFilterIncompatible(caps, { type: 'image' });

      expect(result).toBe(false);
    });

    it('returns true when requested type is not in supportedTypes', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedTypes: ['image'],
      };

      const result = isFilterIncompatible(caps, { type: 'video' });

      expect(result).toBe(true);
    });

    it('returns true when supportedTypes is undefined and type is set', () => {
      const caps: AdapterCapabilities = {
        supportsLicenseFilter: true,
        supportsEducationalLevelFilter: false,
      };

      const result = isFilterIncompatible(caps, { type: 'image' });

      expect(result).toBe(true);
    });

    it('returns true when supportedTypes is empty and type is set', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportedTypes: [],
      };

      const result = isFilterIncompatible(caps, { type: 'image' });

      expect(result).toBe(true);
    });

    it('returns false when supportedTypes is undefined but no type filter active', () => {
      const caps: AdapterCapabilities = {
        supportsLicenseFilter: true,
        supportsEducationalLevelFilter: false,
      };

      const result = isFilterIncompatible(caps, {});

      expect(result).toBe(false);
    });
  });

  describe('license filter', () => {
    it('returns false when supportsLicenseFilter is true and license is set', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsLicenseFilter: true,
      };

      const result = isFilterIncompatible(caps, {
        license: 'https://creativecommons.org/licenses/by/4.0/',
      });

      expect(result).toBe(false);
    });

    it('returns true when supportsLicenseFilter is false and license is set', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsLicenseFilter: false,
      };

      const result = isFilterIncompatible(caps, {
        license: 'https://creativecommons.org/licenses/by/4.0/',
      });

      expect(result).toBe(true);
    });

    it('returns false when supportsLicenseFilter is false but no license filter active', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsLicenseFilter: false,
      };

      const result = isFilterIncompatible(caps, {});

      expect(result).toBe(false);
    });
  });

  describe('educational level filter', () => {
    it('returns false when supportsEducationalLevelFilter is true and educationalLevel is set', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsEducationalLevelFilter: true,
      };

      const result = isFilterIncompatible(caps, {
        educationalLevel: 'https://w3id.org/kim/educationalLevel/level_06',
      });

      expect(result).toBe(false);
    });

    it('returns true when supportsEducationalLevelFilter is false and educationalLevel is set', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsEducationalLevelFilter: false,
      };

      const result = isFilterIncompatible(caps, {
        educationalLevel: 'https://w3id.org/kim/educationalLevel/level_06',
      });

      expect(result).toBe(true);
    });

    it('returns false when supportsEducationalLevelFilter is false but no educationalLevel filter active', () => {
      const caps: AdapterCapabilities = {
        ...baseCapabilities,
        supportsEducationalLevelFilter: false,
      };

      const result = isFilterIncompatible(caps, {});

      expect(result).toBe(false);
    });
  });

  describe('combined filters', () => {
    it('returns true on first incompatible filter (language)', () => {
      const caps: AdapterCapabilities = {
        supportedLanguages: ['de'],
        supportsLicenseFilter: false,
        supportsEducationalLevelFilter: false,
      };

      const result = isFilterIncompatible(caps, {
        language: 'en',
        type: 'video',
        license: 'https://creativecommons.org/licenses/by/4.0/',
      });

      expect(result).toBe(true);
    });

    it('returns false when all filters are compatible', () => {
      const caps: AdapterCapabilities = {
        supportedLanguages: ['de', 'en'],
        supportedTypes: ['image', 'video'],
        supportsLicenseFilter: true,
        supportsEducationalLevelFilter: true,
      };

      const result = isFilterIncompatible(caps, {
        language: 'de',
        type: 'image',
        license: 'https://creativecommons.org/licenses/by/4.0/',
      });

      expect(result).toBe(false);
    });
  });
});
