import { describe, it, expect } from 'vitest';
import {
  truncateText,
  truncateTitle,
  truncateContent,
  truncateLabel,
  shortenLabels,
} from './utils.js';

describe('truncateText', () => {
  it('returns text unchanged when shorter than max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('returns text unchanged when equal to max length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('truncates text and adds ellipsis when longer than max length', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...');
  });

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('truncates to exact length including ellipsis', () => {
    const result = truncateText('This is a very long text', 10);
    expect(result).toBe('This is...');
    expect(result.length).toBe(10);
  });
});

describe('truncateTitle', () => {
  it('truncates title to 40 characters', () => {
    const longTitle = 'This is a very long title that exceeds fifty characters in length';
    const result = truncateTitle(longTitle);
    expect(result.length).toBe(40);
  });

  it('returns short title unchanged', () => {
    expect(truncateTitle('Short Title')).toBe('Short Title');
  });

  it('returns title at exactly 40 chars unchanged', () => {
    const exactTitle = 'a'.repeat(40);
    expect(exactTitle.length).toBe(40);
    expect(truncateTitle(exactTitle)).toBe(exactTitle);
  });
});

describe('truncateContent', () => {
  it('truncates content to 60 characters', () => {
    const longContent =
      'This is a very long description that definitely exceeds one hundred characters and should be truncated properly with ellipsis';
    const result = truncateContent(longContent);
    expect(result.length).toBe(60);
  });

  it('returns short content unchanged', () => {
    expect(truncateContent('Short description')).toBe('Short description');
  });

  it('returns content at exactly 100 chars unchanged', () => {
    const exactContent = 'a'.repeat(60);
    expect(exactContent.length).toBe(60);
    expect(truncateContent(exactContent)).toBe(exactContent);
  });
});

describe('truncateLabel', () => {
  it('truncates label to 20 characters', () => {
    const longLabel = 'This is a very long label';
    const result = truncateLabel(longLabel);
    expect(result.length).toBe(20);
    expect(result).toBe('This is a very lo...');
  });

  it('returns short label unchanged', () => {
    expect(truncateLabel('Short')).toBe('Short');
  });

  it('returns label at exactly 20 chars unchanged', () => {
    const exactLabel = 'Exactly twenty chars';
    expect(exactLabel.length).toBe(20);
    expect(truncateLabel(exactLabel)).toBe(exactLabel);
  });
});

describe('shortenLabels', () => {
  it('limits labels to 4 items', () => {
    const labels = ['label1', 'label2', 'label3', 'label4', 'label5', 'label6'];
    const result = shortenLabels(labels);
    expect(result.length).toBe(4);
    expect(result).toEqual(['label1', 'label2', 'label3', 'label4']);
  });

  it('truncates each label to 20 characters', () => {
    const labels = [
      'This is a very long label that exceeds twenty characters',
      'short',
      'Another extremely long label text',
    ];
    const result = shortenLabels(labels);
    expect(result).toEqual(['This is a very lo...', 'short', 'Another extremely...']);
    expect(result[0].length).toBe(20);
    expect(result[2].length).toBe(20);
  });

  it('handles array with fewer than 4 labels', () => {
    const labels = ['label1', 'label2'];
    const result = shortenLabels(labels);
    expect(result.length).toBe(2);
    expect(result).toEqual(['label1', 'label2']);
  });

  it('handles empty array', () => {
    const result = shortenLabels([]);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });

  it('converts non-string labels to strings', () => {
    const labels = [{ key: 'value' }, 123, true];
    const result = shortenLabels(labels as (string | Record<string, unknown>)[]);
    expect(result.length).toBe(3);
    expect(result[0]).toBe('[object Object]');
    expect(result[1]).toBe('123');
    expect(result[2]).toBe('true');
  });

  it('combines limiting to 4 and truncating to 20 chars', () => {
    const labels = [
      'Very long label number one that is too long',
      'Very long label number two that is too long',
      'Very long label number three that is too long',
      'Very long label number four that is too long',
      'Very long label number five that is too long',
      'Very long label number six that is too long',
    ];
    const result = shortenLabels(labels);
    expect(result.length).toBe(4);
    result.forEach((label) => {
      expect(label.length).toBeLessThanOrEqual(20);
    });
  });
});
