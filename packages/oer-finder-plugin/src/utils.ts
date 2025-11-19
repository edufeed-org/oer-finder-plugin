/**
 * Text truncation utilities for OER content display
 */

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Truncates title text to 50 characters maximum
 * @param title - The title to truncate
 * @returns Truncated title
 */
export function truncateTitle(title: string): string {
  return truncateText(title, 40);
}

/**
 * Truncates description/content text to 100 characters maximum
 * @param content - The content to truncate
 * @returns Truncated content
 */
export function truncateContent(content: string): string {
  return truncateText(content, 60);
}

/**
 * Truncates label text to 20 characters maximum
 * @param label - The label to truncate
 * @returns Truncated label
 */
export function truncateLabel(label: string): string {
  return truncateText(label, 20);
}

/**
 * Processes an array of labels, truncating each to 20 chars and limiting to 4 labels
 * @param labels - Array of labels to process
 * @returns Processed array with max 4 labels, each truncated to 20 chars
 */
export function shortenLabels(labels: (string | Record<string, unknown>)[]): string[] {
  return labels.slice(0, 4).map((label) => {
    const labelStr = typeof label === 'string' ? label : String(label);
    return truncateLabel(labelStr);
  });
}
