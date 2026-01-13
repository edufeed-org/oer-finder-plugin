import type { AdapterManagerConfig } from '../adapters/adapter-manager.js';
import type { SearchClient, SourceOption } from './search-client.interface.js';
import { ApiClient } from './api-client.js';
import { DirectClient } from './direct-client.js';

/**
 * Configuration for creating a search client.
 */
export interface ClientConfig {
  /** API URL for server-proxy mode. If not provided, direct-adapter mode is used. */
  apiUrl?: string;
  /** Configuration for adapters in direct mode. */
  adapters?: AdapterManagerConfig;
  /** Available sources for API mode. */
  availableSources?: SourceOption[];
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
    if (config.apiUrl) {
      return ClientFactory.createApiClient(config.apiUrl, config.availableSources);
    }
    return ClientFactory.createDirectClient(config.adapters);
  }

  /**
   * Create an ApiClient for server-proxy mode.
   */
  static createApiClient(apiUrl: string, availableSources: SourceOption[] = []): ApiClient {
    return new ApiClient(apiUrl, availableSources);
  }

  /**
   * Create a DirectClient for direct-adapter mode.
   */
  static createDirectClient(config: AdapterManagerConfig = {}): DirectClient {
    return new DirectClient(config);
  }
}
