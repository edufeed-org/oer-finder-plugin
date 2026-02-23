import { describe, it, expect } from 'vitest';
import type { ArasaacPictogram } from '../arasaac.types.js';
import {
  buildImageUrls,
  extractKeywords,
  getPrimaryKeyword,
  mapArasaacPictogramToAmb,
} from './arasaac-to-amb.mapper.js';

function makeMinimalPictogram(
  overrides?: Partial<ArasaacPictogram>,
): ArasaacPictogram {
  return {
    _id: 1234,
    schematic: false,
    sex: false,
    violence: false,
    aac: true,
    aacColor: true,
    skin: false,
    hair: false,
    categories: [],
    synsets: [],
    tags: ['test'],
    keywords: [{ keyword: 'hello', type: 1 }],
    ...overrides,
  };
}

describe('buildImageUrls', () => {
  it('returns three resolution URLs with the pictogram id', () => {
    const urls = buildImageUrls(42, 'https://static.arasaac.org/pictograms');

    expect(urls).toEqual({
      high: 'https://static.arasaac.org/pictograms/42/42_2500.png',
      medium: 'https://static.arasaac.org/pictograms/42/42_500.png',
      small: 'https://static.arasaac.org/pictograms/42/42_300.png',
    });
  });
});

describe('extractKeywords', () => {
  it('deduplicates keywords and tags, lowercased', () => {
    const pictogram = makeMinimalPictogram({
      keywords: [
        { keyword: 'Dog', type: 1 },
        { keyword: 'Cat', type: 1, plural: 'Cats' },
      ],
      tags: ['dog', 'animal'],
    });

    const result = extractKeywords(pictogram);

    expect(result).toEqual(['dog', 'cat', 'cats', 'animal']);
  });

  it('returns empty array when no keywords or tags', () => {
    const pictogram = makeMinimalPictogram({
      keywords: [],
      tags: [],
    });

    const result = extractKeywords(pictogram);

    expect(result).toEqual([]);
  });
});

describe('getPrimaryKeyword', () => {
  it('returns first keyword when available', () => {
    const pictogram = makeMinimalPictogram({
      keywords: [{ keyword: 'hello', type: 1 }, { keyword: 'world', type: 1 }],
    });

    expect(getPrimaryKeyword(pictogram)).toBe('hello');
  });

  it('falls back to first tag when no keywords', () => {
    const pictogram = makeMinimalPictogram({
      keywords: [],
      tags: ['fallback'],
    });

    expect(getPrimaryKeyword(pictogram)).toBe('fallback');
  });

  it('returns null when no keywords or tags', () => {
    const pictogram = makeMinimalPictogram({
      keywords: [],
      tags: [],
    });

    expect(getPrimaryKeyword(pictogram)).toBeNull();
  });
});

describe('mapArasaacPictogramToAmb', () => {
  it('maps a full pictogram to ExternalOerItem with AMB metadata', () => {
    const pictogram = makeMinimalPictogram({
      _id: 5678,
      keywords: [{ keyword: 'sun', type: 1, plural: 'suns' }],
      tags: ['weather'],
      created: '2023-01-15',
      lastUpdated: '2024-03-20',
    });

    const result = mapArasaacPictogramToAmb(
      pictogram,
      'https://static.arasaac.org/pictograms',
      'en',
    );

    expect(result.id).toBe('arasaac-5678');
    expect(result.amb['@context']).toBe(
      'https://w3id.org/kim/amb/context.jsonld',
    );
    expect(result.amb.name).toBe('sun');
    expect(result.amb.type).toEqual(['LearningResource', 'ImageObject']);
    expect(result.amb.license).toEqual({
      id: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    });
    expect(result.amb.isAccessibleForFree).toBe(true);
    expect(result.amb.inLanguage).toEqual(['en']);
    expect(result.amb.dateCreated).toBe('2023-01-15');
    expect(result.amb.dateModified).toBe('2024-03-20');
    expect(result.extensions.foreignLandingUrl).toBe(
      'https://arasaac.org/pictograms/en/5678',
    );
    expect(result.extensions.images).toEqual({
      high: 'https://static.arasaac.org/pictograms/5678/5678_2500.png',
      medium: 'https://static.arasaac.org/pictograms/5678/5678_500.png',
      small: 'https://static.arasaac.org/pictograms/5678/5678_300.png',
    });
  });

  it('uses German attribution when language is de', () => {
    const pictogram = makeMinimalPictogram();

    const result = mapArasaacPictogramToAmb(
      pictogram,
      'https://static.arasaac.org/pictograms',
      'de',
    );

    expect(result.extensions.attribution).toContain('Piktogramm-Urheber');
  });

  it('uses English attribution for non-de languages', () => {
    const pictogram = makeMinimalPictogram();

    const result = mapArasaacPictogramToAmb(
      pictogram,
      'https://static.arasaac.org/pictograms',
      'fr',
    );

    expect(result.extensions.attribution).toContain('Pictograms author');
  });

  it('omits date fields when not present', () => {
    const pictogram = makeMinimalPictogram({
      created: undefined,
      lastUpdated: undefined,
    });

    const result = mapArasaacPictogramToAmb(
      pictogram,
      'https://static.arasaac.org/pictograms',
      'en',
    );

    expect(result.amb.dateCreated).toBeUndefined();
    expect(result.amb.dateModified).toBeUndefined();
  });
});
