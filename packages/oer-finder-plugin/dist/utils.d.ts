/**
 * Text truncation utilities for OER content display
 */
/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Truncates title text to 50 characters maximum
 * @param title - The title to truncate
 * @returns Truncated title
 */
export declare function truncateTitle(title: string): string;
/**
 * Truncates description/content text to 100 characters maximum
 * @param content - The content to truncate
 * @returns Truncated content
 */
export declare function truncateContent(content: string): string;
/**
 * Truncates label text to 20 characters maximum
 * @param label - The label to truncate
 * @returns Truncated label
 */
export declare function truncateLabel(label: string): string;
/**
 * Processes an array of labels, truncating each to 20 chars and limiting to 4 labels
 * @param labels - Array of labels to process
 * @returns Processed array with max 4 labels, each truncated to 20 chars
 */
export declare function shortenLabels(labels: (string | Record<string, unknown>)[]): string[];
