import {
  parseColonSeparatedTags,
  findTagValue,
  extractTagValues,
  parseBoolean,
} from '../../src/utils/tag-parser.util';

describe('parseColonSeparatedTags', () => {
  it('should parse simple tags into flat object', () => {
    const tags = [
      ['type', 'LearningResource'],
      ['name', 'Test Resource'],
    ];

    const result = parseColonSeparatedTags(tags);

    expect(result).toEqual({ type: 'LearningResource', name: 'Test Resource' });
  });

  it('should parse colon-separated tags into nested objects', () => {
    const tags = [
      ['license:id', 'https://creativecommons.org/licenses/by/4.0/'],
      ['learningResourceType:prefLabel:en', 'Image'],
    ];

    const result = parseColonSeparatedTags(tags);

    expect(result.license).toEqual({
      id: 'https://creativecommons.org/licenses/by/4.0/',
    });
  });

  it('should skip invalid tags', () => {
    const tags = [['valid', 'value'], [], ['onlyKey']];

    const result = parseColonSeparatedTags(tags);

    expect(result).toEqual({ valid: 'value' });
  });

  describe('multiple entities of the same type', () => {
    it('should produce an array of 3 creator objects when 3 creators are defined', () => {
      const tags = [
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
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result.creator).toEqual([
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

    it('should produce an array of 2 audience objects when 2 audiences are defined', () => {
      const tags = [
        ['audience:id', 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher'],
        ['audience:prefLabel:de', 'Teacher'],
        ['audience:type', 'Concept'],
        ['audience:id', 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student'],
        ['audience:prefLabel:de', 'Student'],
        ['audience:type', 'Concept'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result.audience).toEqual([
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

    it('should keep a single object (not array) when only one entity exists', () => {
      const tags = [
        ['publisher:name', 'Example Publisher'],
        ['publisher:type', 'Organization'],
        ['publisher:id', 'https://example.edu'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result.publisher).toEqual({
        name: 'Example Publisher',
        type: 'Organization',
        id: 'https://example.edu',
      });
    });
  });

  describe('cross-entity field contamination', () => {
    it('should not leak honorificPrefix from earlier creators to Charlie', () => {
      const tags = [
        ['creator:name', 'Dr. Alice'],
        ['creator:type', 'Person'],
        ['creator:honorificPrefix', 'Dr.'],
        ['creator:name', 'Charlie'],
        ['creator:type', 'Person'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(Array.isArray(result.creator)).toBe(true);
      const creators = result.creator as Array<Record<string, unknown>>;
      expect(creators).toHaveLength(2);

      const charlie = creators.find((c) => c.name === 'Charlie');
      expect(charlie).toBeDefined();
      expect(charlie).not.toHaveProperty('honorificPrefix');
    });
  });

  describe('multiple type tags', () => {
    it('should produce an array when multiple type tags exist', () => {
      const tags = [
        ['type', 'LearningResource'],
        ['type', 'Image'],
      ];

      const result = parseColonSeparatedTags(tags);

      expect(result.type).toEqual(['LearningResource', 'Image']);
    });
  });
});

describe('findTagValue', () => {
  it('should return first matching tag value', () => {
    const tags = [
      ['d', 'https://example.com/resource'],
      ['type', 'Article'],
    ];

    expect(findTagValue(tags, 'd')).toBe('https://example.com/resource');
  });

  it('should return null when tag not found', () => {
    const tags = [['type', 'Article']];

    expect(findTagValue(tags, 'missing')).toBeNull();
  });
});

describe('extractTagValues', () => {
  it('should extract all values for repeated tags', () => {
    const tags = [
      ['t', 'biology'],
      ['t', 'science'],
      ['type', 'Article'],
    ];

    expect(extractTagValues(tags, 't')).toEqual(['biology', 'science']);
  });

  it('should return empty array when no matches', () => {
    const tags = [['type', 'Article']];

    expect(extractTagValues(tags, 't')).toEqual([]);
  });
});

describe('parseBoolean', () => {
  it('should parse true/false strings', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
  });

  it('should return null for invalid input', () => {
    expect(parseBoolean('yes')).toBeNull();
    expect(parseBoolean(null)).toBeNull();
  });
});
