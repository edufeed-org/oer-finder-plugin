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
