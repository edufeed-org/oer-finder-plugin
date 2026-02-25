import { describe, it, expect } from 'vitest';
import { filterAmbMetadata, ALLOWED_AMB_FIELDS } from './amb-metadata.util';

describe('ALLOWED_AMB_FIELDS', () => {
  it('includes @context for JSON-LD compliance', () => {
    expect(ALLOWED_AMB_FIELDS).toContain('@context');
  });
});

describe('filterAmbMetadata', () => {
  it('keeps all allowed AMB fields', () => {
    const raw = {
      '@context': 'https://w3id.org/kim/amb/context.jsonld',
      id: 'https://example.com/resource/1',
      type: ['LearningResource'],
      name: 'Test Resource',
      license: { id: 'https://creativecommons.org/licenses/by/4.0/' },
    };

    const result = filterAmbMetadata(raw);

    expect(result).toEqual(raw);
  });

  it('strips non-AMB fields', () => {
    const raw = {
      '@context': 'https://w3id.org/kim/amb/context.jsonld',
      name: 'Test',
      d: 'nostr-d-tag',
      e: 'nostr-e-tag',
      p: 'nostr-p-tag',
      customField: 'should be removed',
    };

    const result = filterAmbMetadata(raw);

    expect(result).toEqual({
      '@context': 'https://w3id.org/kim/amb/context.jsonld',
      name: 'Test',
    });
  });

  it('returns empty object for input with no AMB fields', () => {
    const raw = { foo: 'bar', baz: 123 };

    const result = filterAmbMetadata(raw);

    expect(result).toEqual({});
  });
});
