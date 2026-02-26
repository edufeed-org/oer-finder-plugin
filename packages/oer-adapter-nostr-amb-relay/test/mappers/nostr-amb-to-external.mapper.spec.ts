import { mapNostrAmbEventToExternalOerItem } from '../../src/mappers/nostr-amb-to-external.mapper.js';
import type { NostrAmbEvent } from '../../src/nostr-amb-relay.types.js';

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

  describe('full real-world event mapping', () => {
    const realWorldEvent: NostrAmbEvent = {
      kind: 30142,
      id: 'abc123def456',
      pubkey: 'pubkey789',
      created_at: 1767092557,
      tags: [
        ['d', 'https://example.edu/resource/page'],
        ['type', 'LearningResource'],
        ['name', 'Test Resource Title'],
        ['description', 'A description of the resource.'],
        ['t', 'topic1'],
        ['t', 'topic2'],
        ['inLanguage', 'de'],
        ['creator:name', 'Dr. Alice'],
        ['creator:type', 'Person'],
        ['creator:id', 'https://example.edu/users/alice'],
        ['creator:honorificPrefix', 'Dr.'],
        ['creator:name', 'Dr. Bob'],
        ['creator:type', 'Person'],
        ['creator:id', 'https://example.edu/users/bob'],
        ['creator:honorificPrefix', 'Dr.'],
        ['creator:name', 'Charlie'],
        ['creator:type', 'Person'],
        ['creator:id', 'https://example.edu/users/charlie'],
        ['publisher:name', 'Example Publisher'],
        ['publisher:type', 'Organization'],
        ['publisher:id', 'https://example.edu'],
        ['license:id', 'https://creativecommons.org/licenses/by-sa/4.0/'],
        ['isAccessibleForFree', 'true'],
        ['conditionsOfAccess:id', 'http://w3id.org/kim/conditionsOfAccess/no_login'],
        ['conditionsOfAccess:type', 'Concept'],
        ['about:id', 'https://w3id.org/kim/hochschulfaechersystematik/n0'],
        ['about:prefLabel:de', 'General Studies'],
        ['educationalLevel:id', 'https://w3id.org/kim/educationalLevel/level_A'],
        ['educationalLevel:prefLabel:de', 'Higher Education'],
        ['educationalLevel:prefLabel:en', 'Higher Education'],
        ['audience:id', 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher'],
        ['audience:prefLabel:de', 'Teacher'],
        ['audience:type', 'Concept'],
        ['audience:id', 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student'],
        ['audience:prefLabel:de', 'Student'],
        ['audience:type', 'Concept'],
        ['learningResourceType:id', 'https://w3id.org/kim/hcrt/text'],
        ['datePublished', '2024-05-14T10:00:00'],
        ['dateCreated', '2024-02-23T11:09:01+01:00'],
        ['r', 'wss://relay.example.com'],
      ],
      content: '',
      sig: 'sig123',
    };

    let result: ReturnType<typeof mapNostrAmbEventToExternalOerItem>;

    beforeEach(() => {
      result = mapNostrAmbEventToExternalOerItem(realWorldEvent);
    });

    it('should set the correct id and basic metadata', () => {
      expect(result).toEqual(
        expect.objectContaining({
          id: 'nostr-amb-abc123def456',
          extensions: expect.objectContaining({
            foreignLandingUrl: 'https://example.edu/resource/page',
          }),
        }),
      );
    });

    it('should map name, description, and type as strings', () => {
      expect(result.amb).toEqual(
        expect.objectContaining({
          name: 'Test Resource Title',
          description: 'A description of the resource.',
          type: 'LearningResource',
        }),
      );
    });

    it('should map keywords from t tags as an array', () => {
      expect(result.amb.keywords).toEqual(['topic1', 'topic2']);
    });

    it('should map inLanguage as an array', () => {
      expect(result.amb.inLanguage).toEqual(['de']);
    });

    it('should map all 3 creators as an array of Person objects', () => {
      expect(Array.isArray(result.amb.creator)).toBe(true);
      expect(result.amb.creator).toEqual([
        {
          name: 'Dr. Alice',
          type: 'Person',
          id: 'https://example.edu/users/alice',
          honorificPrefix: 'Dr.',
        },
        {
          name: 'Dr. Bob',
          type: 'Person',
          id: 'https://example.edu/users/bob',
          honorificPrefix: 'Dr.',
        },
        {
          name: 'Charlie',
          type: 'Person',
          id: 'https://example.edu/users/charlie',
        },
      ]);
    });

    it('should map both audiences as an array of Concept objects', () => {
      expect(Array.isArray(result.amb.audience)).toBe(true);
      expect(result.amb.audience).toEqual([
        {
          id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher',
          prefLabel: { de: 'Teacher' },
          type: 'Concept',
        },
        {
          id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
          prefLabel: { de: 'Student' },
          type: 'Concept',
        },
      ]);
    });

    it('should map publisher as a single object (not array)', () => {
      expect(result.amb.publisher).toEqual({
        name: 'Example Publisher',
        type: 'Organization',
        id: 'https://example.edu',
      });
    });

    it('should map license as object with id', () => {
      expect(result.amb.license).toEqual({
        id: 'https://creativecommons.org/licenses/by-sa/4.0/',
      });
    });

    it('should map isAccessibleForFree as boolean true', () => {
      expect(result.amb.isAccessibleForFree).toBe(true);
    });

    it('should map conditionsOfAccess as nested object', () => {
      expect(result.amb.conditionsOfAccess).toEqual({
        id: 'http://w3id.org/kim/conditionsOfAccess/no_login',
        type: 'Concept',
      });
    });

    it('should map about with nested prefLabel', () => {
      expect(result.amb.about).toEqual({
        id: 'https://w3id.org/kim/hochschulfaechersystematik/n0',
        prefLabel: { de: 'General Studies' },
      });
    });

    it('should map educationalLevel with nested prefLabel containing de and en', () => {
      expect(result.amb.educationalLevel).toEqual({
        id: 'https://w3id.org/kim/educationalLevel/level_A',
        prefLabel: { de: 'Higher Education', en: 'Higher Education' },
      });
    });

    it('should map learningResourceType as nested object', () => {
      expect(result.amb.learningResourceType).toEqual({
        id: 'https://w3id.org/kim/hcrt/text',
      });
    });

    it('should map datePublished and dateCreated as strings', () => {
      expect(result.amb.datePublished).toBe('2024-05-14T10:00:00');
      expect(result.amb.dateCreated).toBe('2024-02-23T11:09:01+01:00');
    });

    it('should NOT include the r tag in AMB output', () => {
      const ambKeys = Object.keys(result.amb);
      expect(ambKeys).not.toContain('r');
    });
  });

  describe('cross-entity field contamination', () => {
    it('should not leak honorificPrefix from Dr. creators to Charlie', () => {
      const event = createEvent([
        ['d', 'https://example.com/resource'],
        ['creator:name', 'Dr. Alice'],
        ['creator:type', 'Person'],
        ['creator:honorificPrefix', 'Dr.'],
        ['creator:name', 'Charlie'],
        ['creator:type', 'Person'],
        ['creator:id', 'https://example.edu/users/charlie'],
      ]);

      const result = mapNostrAmbEventToExternalOerItem(event);

      expect(Array.isArray(result.amb.creator)).toBe(true);
      const creators = result.amb.creator as Array<Record<string, unknown>>;
      expect(creators).toHaveLength(2);

      const charlie = creators.find((c) => c.name === 'Charlie');
      expect(charlie).toBeDefined();
      expect(charlie).not.toHaveProperty('honorificPrefix');
    });
  });

  describe('multiple type tags', () => {
    it('should produce an array when multiple type tags exist', () => {
      const event = createEvent([
        ['d', 'https://example.com/resource'],
        ['type', 'LearningResource'],
        ['type', 'Image'],
      ]);

      const result = mapNostrAmbEventToExternalOerItem(event);

      expect(result.amb.type).toEqual(['LearningResource', 'Image']);
    });
  });
});
