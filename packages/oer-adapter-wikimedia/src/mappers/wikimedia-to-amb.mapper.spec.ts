import { describe, it, expect } from 'vitest';
import type { WikimediaPage } from '../wikimedia.types.js';
import {
  cleanTitle,
  stripHtmlTags,
  parseCategories,
  normalizeLicenseUrl,
  buildImageUrls,
  mapWikimediaPageToAmb,
} from './wikimedia-to-amb.mapper.js';

function makeMinimalPage(
  overrides?: Partial<WikimediaPage>,
): WikimediaPage {
  return {
    pageid: 12345,
    ns: 6,
    title: 'File:Sunset over mountains.jpg',
    index: 1,
    imageinfo: [
      {
        url: 'https://upload.wikimedia.org/original.jpg',
        descriptionurl:
          'https://commons.wikimedia.org/wiki/File:Sunset_over_mountains.jpg',
        width: 4000,
        height: 3000,
        size: 2048000,
        mime: 'image/jpeg',
        thumburl: 'https://upload.wikimedia.org/thumb/400px-original.jpg',
        thumbwidth: 400,
        thumbheight: 300,
        extmetadata: {
          LicenseUrl: {
            value: 'https://creativecommons.org/licenses/by-sa/4.0',
          },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          Artist: {
            value:
              '<a href="//commons.wikimedia.org/wiki/User:JohnDoe">John Doe</a>',
          },
          ImageDescription: { value: 'A beautiful sunset over mountains' },
          DateTimeOriginal: { value: '2023-01-15 10:30:00' },
          Categories: { value: 'Sunsets|Mountains|Nature' },
        },
      },
    ],
    ...overrides,
  };
}

function makePageWithExtmetadata(
  extmetadata: WikimediaPage['imageinfo'] extends
    | Array<infer I>
    | undefined
    ? I extends { extmetadata?: infer E }
      ? E
      : never
    : never,
): WikimediaPage {
  return makeMinimalPage({
    imageinfo: [
      {
        url: 'https://upload.wikimedia.org/original.jpg',
        mime: 'image/jpeg',
        extmetadata,
      },
    ],
  });
}

describe('cleanTitle', () => {
  it('strips File: prefix and file extension', () => {
    expect(cleanTitle('File:Sunset.jpg')).toBe('Sunset');
  });

  it('handles titles with multiple dots', () => {
    expect(cleanTitle('File:My.Photo.Name.png')).toBe('My.Photo.Name');
  });

  it('handles titles with no extension', () => {
    expect(cleanTitle('File:NoExtension')).toBe('NoExtension');
  });

  it('passes through titles without File: prefix', () => {
    expect(cleanTitle('Regular Title.jpg')).toBe('Regular Title');
  });
});

describe('stripHtmlTags', () => {
  it('strips anchor tags and returns plain text', () => {
    expect(
      stripHtmlTags(
        '<a href="//commons.wikimedia.org/wiki/User:Joonasl">Joonas Lyytinen</a>',
      ),
    ).toBe('Joonas Lyytinen');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtmlTags('John Doe')).toBe('John Doe');
  });

  it('handles nested tags', () => {
    expect(
      stripHtmlTags('<b><a href="url">Bold Link</a></b> and <i>italic</i>'),
    ).toBe('Bold Link and italic');
  });

  it('decodes &amp; entity', () => {
    expect(stripHtmlTags('Smith &amp; Jones')).toBe('Smith & Jones');
  });

  it('decodes &lt; and &gt; entities', () => {
    expect(stripHtmlTags('1 &lt; 2 &gt; 0')).toBe('1 < 2 > 0');
  });

  it('decodes &quot; entity', () => {
    expect(stripHtmlTags('&quot;quoted&quot;')).toBe('"quoted"');
  });

  it('handles unclosed tags', () => {
    expect(stripHtmlTags('<img src=x onerror=alert(1)')).toBe('');
  });
});

describe('parseCategories', () => {
  it('splits pipe-separated categories', () => {
    expect(parseCategories('Sunsets|Nature|Photographs')).toEqual([
      'Sunsets',
      'Nature',
      'Photographs',
    ]);
  });

  it('filters empty entries', () => {
    expect(parseCategories('Sunsets||Nature|')).toEqual([
      'Sunsets',
      'Nature',
    ]);
  });

  it('trims whitespace from entries', () => {
    expect(parseCategories(' Sunsets | Nature ')).toEqual([
      'Sunsets',
      'Nature',
    ]);
  });
});

describe('normalizeLicenseUrl', () => {
  it('adds trailing slash when missing', () => {
    expect(
      normalizeLicenseUrl('https://creativecommons.org/licenses/by-sa/4.0'),
    ).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
  });

  it('does not double trailing slash', () => {
    expect(
      normalizeLicenseUrl('https://creativecommons.org/licenses/by/4.0/'),
    ).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
});

describe('buildImageUrls', () => {
  it('uses thumburl for medium/small when available', () => {
    expect(
      buildImageUrls(
        'https://upload.wikimedia.org/original.jpg',
        'https://upload.wikimedia.org/thumb/400px-original.jpg',
      ),
    ).toEqual({
      high: 'https://upload.wikimedia.org/original.jpg',
      medium: 'https://upload.wikimedia.org/thumb/400px-original.jpg',
      small: 'https://upload.wikimedia.org/thumb/400px-original.jpg',
    });
  });

  it('falls back to original URL when no thumburl', () => {
    expect(
      buildImageUrls('https://upload.wikimedia.org/original.jpg', undefined),
    ).toEqual({
      high: 'https://upload.wikimedia.org/original.jpg',
      medium: 'https://upload.wikimedia.org/original.jpg',
      small: 'https://upload.wikimedia.org/original.jpg',
    });
  });
});

describe('mapWikimediaPageToAmb', () => {
  it('maps a full page to ExternalOerItem with correct structure', () => {
    const result = mapWikimediaPageToAmb(makeMinimalPage());

    expect(result).toEqual({
      id: 'wikimedia-12345',
      amb: {
        '@context': 'https://w3id.org/kim/amb/context.jsonld',
        id: 'https://upload.wikimedia.org/original.jpg',
        type: ['LearningResource', 'ImageObject'],
        name: 'Sunset over mountains',
        description: 'A beautiful sunset over mountains',
        keywords: ['sunsets', 'mountains', 'nature'],
        license: {
          id: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        isAccessibleForFree: true,
        learningResourceType: [
          {
            id: 'http://w3id.org/kim/hcrt/image',
            prefLabel: { en: 'Image', de: 'Bild' },
          },
        ],
        encoding: [
          {
            type: 'MediaObject',
            contentUrl: 'https://upload.wikimedia.org/original.jpg',
            encodingFormat: 'image/jpeg',
            width: '4000',
            height: '3000',
            contentSize: '2048000',
          },
        ],
        publisher: [
          {
            type: 'Organization',
            name: 'Wikimedia Commons',
            url: 'https://commons.wikimedia.org',
          },
        ],
        creator: [{ type: 'Person', name: 'John Doe' }],
        dateCreated: '2023-01-15 10:30:00',
      },
      extensions: {
        images: {
          high: 'https://upload.wikimedia.org/original.jpg',
          medium: 'https://upload.wikimedia.org/thumb/400px-original.jpg',
          small: 'https://upload.wikimedia.org/thumb/400px-original.jpg',
        },
        foreignLandingUrl:
          'https://commons.wikimedia.org/wiki/File:Sunset_over_mountains.jpg',
        attribution:
          '"Sunset over mountains" by John Doe, CC BY-SA 4.0, via Wikimedia Commons',
      },
    });
  });

  it('omits creator when Artist is not available', () => {
    const page = makePageWithExtmetadata({
      LicenseUrl: {
        value: 'https://creativecommons.org/licenses/by/4.0',
      },
      LicenseShortName: { value: 'CC BY 4.0' },
    });

    expect(mapWikimediaPageToAmb(page).amb.creator).toBeUndefined();
  });

  it('omits description when ImageDescription is not available', () => {
    const page = makePageWithExtmetadata({
      Artist: { value: 'John Doe' },
    });

    expect(mapWikimediaPageToAmb(page).amb.description).toBeUndefined();
  });

  it('omits dateCreated when DateTimeOriginal is not available', () => {
    const page = makePageWithExtmetadata({
      Artist: { value: 'John Doe' },
    });

    expect(mapWikimediaPageToAmb(page).amb.dateCreated).toBeUndefined();
  });

  it('returns empty keywords when Categories is not available', () => {
    const page = makePageWithExtmetadata({});

    expect(mapWikimediaPageToAmb(page).amb.keywords).toEqual([]);
  });

  it('omits license when LicenseUrl is not available', () => {
    const page = makePageWithExtmetadata({});

    expect(mapWikimediaPageToAmb(page).amb.license).toBeUndefined();
  });

  it('normalizes license URL with trailing slash', () => {
    const result = mapWikimediaPageToAmb(makeMinimalPage());
    const license = result.amb.license as { id: string };

    expect(license.id).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
  });

  it('uses descriptionurl for foreignLandingUrl', () => {
    const result = mapWikimediaPageToAmb(makeMinimalPage());

    expect(result.extensions.foreignLandingUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:Sunset_over_mountains.jpg',
    );
  });

  it('prefixes id with wikimedia-', () => {
    const result = mapWikimediaPageToAmb(
      makeMinimalPage({ pageid: 99999 }),
    );

    expect(result.id).toBe('wikimedia-99999');
  });
});
