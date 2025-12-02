/**
 * @edufeed-org/api-client
 * Auto-generated API client for the OER Aggregator
 *
 * This package provides a type-safe client for interacting with the OER Aggregator API.
 * The client is automatically generated from the OpenAPI specification using openapi-typescript.
 *
 * Usage:
 * ```typescript
 * import { createOerClient } from '@edufeed-org/api-client';
 *
 * const client = createOerClient('https://api.example.com');
 * const { data, error } = await client.GET('/api/v1/oer', {
 *   params: { query: { page: 1, pageSize: 10 } }
 * });
 * ```
 */

import createClient from 'openapi-fetch';
import type { paths, components, operations } from '../generated/schema.js';

export type OerClient = ReturnType<typeof createClient<paths>>;

/**
 * Create a new OER API client
 *
 * @param baseUrl - Base URL of the API (e.g., 'https://api.example.com')
 * @param options - Additional client options (headers, etc.)
 * @returns Type-safe OER API client instance
 *
 * @example
 * ```typescript
 * const client = createOerClient('https://api.example.com');
 *
 * // List OER resources
 * const { data, error } = await client.GET('/api/v1/oer', {
 *   params: {
 *     query: {
 *       page: 1,
 *       pageSize: 10,
 *       type: 'image',
 *     }
 *   }
 * });
 *
 * if (error) {
 *   console.error('Error:', error);
 * } else {
 *   console.log('Results:', data);
 * }
 *
 * // Health check
 * const { data: health } = await client.GET('/health');
 * ```
 */
export function createOerClient(
  baseUrl: string,
  options?: {
    headers?: HeadersInit;
    fetch?: typeof fetch;
  },
): OerClient {
  return createClient<paths>({
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    headers: options?.headers,
    fetch: options?.fetch,
  });
}

// Re-export generated schema types
export type { paths, components, operations } from '../generated/schema.js';

// Export convenient type aliases from generated schema
export type OerItem = components['schemas']['OerItemSchema'];
export type OerMetadata = components['schemas']['OerMetadataSchema'];
export type OerListResponse = components['schemas']['OerListResponseSchema'];
export type ImageUrls = components['schemas']['ImageUrlsSchema'];

// Query parameters type from the operation
export type OerQueryParams = operations['OerController_getOer']['parameters']['query'];
