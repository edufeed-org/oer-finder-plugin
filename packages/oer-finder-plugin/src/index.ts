/**
 * @oer-aggregator/frontend-plugin
 * Web Components plugin for the OER Aggregator
 *
 * This package provides framework-agnostic Web Components for displaying
 * and interacting with Open Educational Resources.
 *
 * Usage:
 * ```html
 * <script type="module" src="oer-plugin.js"></script>
 * <oer-hello api-url="https://api.example.com"></oer-hello>
 * ```
 *
 * Or via npm:
 * ```typescript
 * import '@oer-aggregator/frontend-plugin';
 * ```
 */

// Import and register Web Components
import './oer-hello.js';

// Export component classes for programmatic usage
export { OerHelloElement } from './oer-hello.js';

// Re-export types from api-client for convenience
export type {
  OerItem,
  OerMetadata,
  OerListResponse,
  OerQueryParams,
  OerClient,
} from '@oer-aggregator/api-client';

export { createOerClient } from '@oer-aggregator/api-client';

// Package version
export const VERSION = '0.0.1';
