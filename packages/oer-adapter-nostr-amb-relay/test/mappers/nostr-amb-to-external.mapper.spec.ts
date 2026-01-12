import { mapNostrAmbEventToExternalOerItem } from '../../src/mappers/nostr-amb-to-external.mapper';
import type { NostrAmbEvent } from '../../src/nostr-amb-relay.types';

describe('mapNostrAmbEventToExternalOerItem', () => {
  const createEvent = (tags: string[][]): NostrAmbEvent => ({
    id: 'abc123',
    pubkey: 'pubkey123',
    created_at: 1234567890,
    kind: 30142,
    tags,
    content: '',
    sig: 'sig123',
  });

  it('should map basic AMB event to ExternalOerItem', () => {
    const event = createEvent([
      ['d', 'https://example.com/resource'],
      ['name', 'Test Resource'],
      ['type', 'LearningResource'],
    ]);

    const result = mapNostrAmbEventToExternalOerItem(event);

    expect(result.id).toBe('nostr-amb-abc123');
    expect(result.amb.name).toBe('Test Resource');
  });

  it('should extract keywords from t tags', () => {
    const event = createEvent([
      ['d', 'https://example.com/resource'],
      ['t', 'biology'],
      ['t', 'science'],
    ]);

    const result = mapNostrAmbEventToExternalOerItem(event);

    expect(result.amb.keywords).toEqual(['biology', 'science']);
  });

  it('should map license from colon-separated tag', () => {
    const event = createEvent([
      ['d', 'https://example.com/resource'],
      ['license:id', 'https://creativecommons.org/licenses/by/4.0/'],
    ]);

    const result = mapNostrAmbEventToExternalOerItem(event);

    expect(result.amb.license).toEqual({
      id: 'https://creativecommons.org/licenses/by/4.0/',
    });
  });
});
