import type { SourceOption } from '../oer-search/OerSearch.js';
import type { SourceConfig } from '../types/source-config.js';
import type { SearchClient } from './search-client.interface.js';
import { ApiClient } from './api-client.js';
import { DirectClient } from './direct-client.js';

const DEFAULT_SOURCES: readonly SourceConfig[] = [
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
];

/**
 * Configuration for creating a search client.
 */
export interface ClientConfig {
  /** API URL for server-proxy mode. If not provided, direct-adapter mode is used. */
  apiUrl?: string;
  /**
   * Unified source configuration. Works for both modes:
   * - Server mode: mapped to SourceOption[] for the API client
   * - Direct mode: passed to AdapterManager.fromSourceConfigs()
   *
   * Defaults to openverse + arasaac when not provided.
   */
  sources?: readonly SourceConfig[];
}

/**
 * Factory for creating the appropriate SearchClient based on configuration.
 *
 * Mode selection:
 * - If apiUrl is provided → ApiClient (server-proxy mode)
 * - If apiUrl is not provided → DirectClient (direct-adapter mode)
 */
export class ClientFactory {
  /**
   * Create a SearchClient based on the provided configuration.
   */
  static create(config: ClientConfig): SearchClient {
    const sources = config.sources ?? DEFAULT_SOURCES;

    if (config.apiUrl) {
      const sourceOptions = sources.map((s) => ({ id: s.id, label: s.label }));
      return ClientFactory.createApiClient(config.apiUrl, sourceOptions);
    }

    return new DirectClient(sources);
  }

  /**
   * Create an ApiClient for server-proxy mode.
   */
  static createApiClient(apiUrl: string, availableSources: SourceOption[] = []): ApiClient {
    return new ApiClient(apiUrl, availableSources);
  }
}
