export { ClientFactory, type ClientConfig } from './client-factory.js';
export { ApiClient } from './api-client.js';
export { DirectClient } from './direct-client.js';
export type {
  SearchClient,
  SearchResult,
  AllSourcesState,
  PerSourceCursor,
} from './search-client.interface.js';
export { searchAllSources } from './all-sources-search.js';
export type { SingleSourceSearchFn, AllSourcesSearchConfig } from './all-sources-search.js';
