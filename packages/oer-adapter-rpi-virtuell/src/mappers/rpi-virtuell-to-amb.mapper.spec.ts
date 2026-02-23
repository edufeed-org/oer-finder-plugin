import { describe, it, expect } from 'vitest';
import type { RpiMaterialPost } from '../rpi-virtuell.types.js';
import {
  extractLearningResourceTypes,
  mapRpiMaterialToAmb,
} from './rpi-virtuell-to-amb.mapper.js';

function makeMinimalMaterial(
  overrides?: Partial<RpiMaterialPost>,
): RpiMaterialPost {
  return {
    post: { title: 'Test Material', excerpt: null, content: null },
    learningresourcetypes: null,
    educationallevels: null,
    grades: null,
    tags: null,
    licenses: null,
    authors: null,
    organisations: null,
    origin: null,
    url: 'https://example.com/material/1',
    import_id: '123',
    date: null,
    image: null,
    ...overrides,
  };
}

describe('extractLearningResourceTypes', () => {
  it('maps known German names to HCRT entries', () => {
    const material = makeMinimalMaterial({
      learningresourcetypes: {
        learningresourcetype: [{ name: 'Bild' }, { name: 'Video' }],
      },
    });

    const result = extractLearningResourceTypes(material);

    expect(result).toEqual([
      {
        id: 'http://w3id.org/kim/hcrt/image',
        prefLabel: { en: 'Image', de: 'Bild' },
      },
      {
        id: 'http://w3id.org/kim/hcrt/video',
        prefLabel: { en: 'Video', de: 'Video' },
      },
    ]);
  });

  it('deduplicates entries with same HCRT id (Audio + Podcast)', () => {
    const material = makeMinimalMaterial({
      learningresourcetypes: {
        learningresourcetype: [{ name: 'Audio' }, { name: 'Podcast' }],
      },
    });

    const result = extractLearningResourceTypes(material);

    expect(result).toEqual([
      {
        id: 'http://w3id.org/kim/hcrt/audio',
        prefLabel: { en: 'Audio Recording', de: 'Audio' },
      },
    ]);
  });

  it('skips unknown names and returns only mapped entries', () => {
    const material = makeMinimalMaterial({
      learningresourcetypes: {
        learningresourcetype: [
          { name: 'UnknownType' },
          { name: 'Arbeitsblatt' },
        ],
      },
    });

    const result = extractLearningResourceTypes(material);

    expect(result).toEqual([
      {
        id: 'http://w3id.org/kim/hcrt/worksheet',
        prefLabel: { en: 'Worksheet', de: 'Arbeitsmaterial' },
      },
    ]);
  });

  it('returns empty array when no learning resource types exist', () => {
    const material = makeMinimalMaterial();

    const result = extractLearningResourceTypes(material);

    expect(result).toEqual([]);
  });
});

describe('mapRpiMaterialToAmb', () => {
  it('prefixes item id with rpi-virtuell-', () => {
    const material = makeMinimalMaterial({ import_id: '456' });

    const result = mapRpiMaterialToAmb(material);

    expect(result.id).toBe('rpi-virtuell-456');
  });

  it('uses url as fallback id with prefix when import_id is null', () => {
    const material = makeMinimalMaterial({
      import_id: null,
      url: 'https://example.com/resource',
    });

    const result = mapRpiMaterialToAmb(material);

    expect(result.id).toBe('rpi-virtuell-https://example.com/resource');
  });

  it('produces learningResourceType with id and prefLabel', () => {
    const material = makeMinimalMaterial({
      learningresourcetypes: {
        learningresourcetype: [{ name: 'Video' }],
      },
    });

    const result = mapRpiMaterialToAmb(material);
    const lrt = result.amb.learningResourceType as Array<{
      id: string;
      prefLabel: { en: string; de: string };
    }>;

    expect(lrt).toEqual([
      {
        id: 'http://w3id.org/kim/hcrt/video',
        prefLabel: { en: 'Video', de: 'Video' },
      },
    ]);
  });

  it('omits learningResourceType when no types are mapped', () => {
    const material = makeMinimalMaterial({
      learningresourcetypes: {
        learningresourcetype: [{ name: 'UnknownType' }],
      },
    });

    const result = mapRpiMaterialToAmb(material);

    expect(result.amb.learningResourceType).toBeUndefined();
  });
});
