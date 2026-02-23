import { describe, it, expect } from 'vitest';
import type { OpenverseImage } from '../openverse.types.js';
import {
  buildImageUrls,
  extractKeywords,
  mapOpenverseImageToAmb,
} from './openverse-to-amb.mapper.js';

function makeMinimalImage(
  overrides?: Partial<OpenverseImage>,
): OpenverseImage {
  return {
    id: 'abc-123',
    title: 'Test Image',
    foreign_landing_url: 'https://flickr.com/photo/123',
    url: 'https://example.com/image.jpg',
    license: 'by',
    license_version: '4.0',
    ...overrides,
  };
}

describe('buildImageUrls', () => {
  it('uses thumbnail for medium and small when available', () => {
    const image = makeMinimalImage({
      url: 'https://example.com/full.jpg',
      thumbnail: 'https://example.com/thumb.jpg',
    });

    expect(buildImageUrls(image)).toEqual({
      high: 'https://example.com/full.jpg',
      medium: 'https://example.com/thumb.jpg',
      small: 'https://example.com/thumb.jpg',
    });
  });

  it('falls back to url when thumbnail is not available', () => {
    const image = makeMinimalImage({ thumbnail: undefined });

    const urls = buildImageUrls(image);

    expect(urls.medium).toBe(image.url);
    expect(urls.small).toBe(image.url);
  });
});

describe('extractKeywords', () => {
  it('lowercases tag names', () => {
    const image = makeMinimalImage({
      tags: [{ name: 'Nature' }, { name: 'SUNSET' }],
    });

    expect(extractKeywords(image)).toEqual(['nature', 'sunset']);
  });

  it('returns empty array when no tags', () => {
    const image = makeMinimalImage({ tags: undefined });

    expect(extractKeywords(image)).toEqual([]);
  });
});

describe('mapOpenverseImageToAmb', () => {
  it('maps a full image to ExternalOerItem with AMB metadata', () => {
    const image = makeMinimalImage({
      id: 'img-456',
      title: 'Sunset photo',
      license: 'by-sa',
      license_version: '4.0',
      creator: 'John Doe',
      creator_url: 'https://example.com/john',
      source: 'Flickr',
      provider: 'flickr',
      filetype: 'jpg',
      width: 1920,
      height: 1080,
      filesize: 204800,
      tags: [{ name: 'sunset' }, { name: 'nature' }],
      attribution: 'Photo by John Doe / CC BY-SA',
    });

    const result = mapOpenverseImageToAmb(image);

    expect(result).toEqual({
      id: 'openverse-img-456',
      amb: {
        '@context': 'https://w3id.org/kim/amb/context.jsonld',
        id: image.url,
        type: ['LearningResource', 'ImageObject'],
        name: 'Sunset photo',
        keywords: ['sunset', 'nature'],
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
            contentUrl: image.url,
            encodingFormat: 'image/jpeg',
            width: '1920',
            height: '1080',
            contentSize: '204800',
          },
        ],
        creator: [
          {
            type: 'Person',
            name: 'John Doe',
            url: 'https://example.com/john',
          },
        ],
        publisher: [
          {
            type: 'Organization',
            name: 'Flickr',
          },
        ],
      },
      extensions: {
        images: {
          high: image.url,
          medium: image.url,
          small: image.url,
        },
        foreignLandingUrl: 'https://flickr.com/photo/123',
        attribution: 'Photo by John Doe / CC BY-SA',
      },
    });
  });

  it('omits creator when not available', () => {
    const image = makeMinimalImage({ creator: null });

    const result = mapOpenverseImageToAmb(image);

    expect(result.amb.creator).toBeUndefined();
  });

  it('omits publisher when neither source nor provider available', () => {
    const image = makeMinimalImage({ source: null, provider: null });

    const result = mapOpenverseImageToAmb(image);

    expect(result.amb.publisher).toBeUndefined();
  });

  it('maps CC0 license correctly', () => {
    const image = makeMinimalImage({ license: 'cc0', license_version: '1.0' });

    const result = mapOpenverseImageToAmb(image);

    expect(result.amb.license).toEqual({
      id: 'https://creativecommons.org/publicdomain/zero/1.0/',
    });
  });

  it('defaults MIME type to image/jpeg when filetype is null', () => {
    const image = makeMinimalImage({ filetype: null });

    const result = mapOpenverseImageToAmb(image);
    const encoding = result.amb.encoding as Array<{ encodingFormat: string }>;

    expect(encoding[0].encodingFormat).toBe('image/jpeg');
  });
});
