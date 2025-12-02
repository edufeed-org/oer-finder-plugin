## 1. Core Adapter Infrastructure

- [ ] 1.1 Create `packages/oer-adapter-core/` package with TypeScript configuration
- [ ] 1.2 Define `SourceAdapter` interface in `adapter.interface.ts`
- [ ] 1.3 Define `AdapterSearchQuery` and `AdapterSearchResult` types
- [ ] 1.4 Define `ExternalOerItem` type matching OER response model
- [ ] 1.5 Define `Creator` type with type, name, and link fields
- [ ] 1.6 Export all types from package entry point
- [ ] 1.7 Add unit tests for type validation utilities

## 2. Adapter Registry Service

- [ ] 2.1 Add `ENABLED_ADAPTERS` environment variable to config
- [ ] 2.2 Create `AdapterRegistryService` to manage adapter instances
- [ ] 2.3 Implement adapter loading based on environment configuration
- [ ] 2.4 Add logging for adapter registration status
- [ ] 2.5 Add unit tests for registry service

## 3. Adapter Search Orchestration

- [ ] 3.1 Create `AdapterSearchService` for parallel query execution
- [ ] 3.2 Implement query translation from `OerQueryDto` to `AdapterSearchQuery`
- [ ] 3.3 Implement parallel search across all enabled adapters
- [ ] 3.4 Add per-adapter timeout handling (e.g., 3 seconds)
- [ ] 3.5 Implement graceful error handling (continue on adapter failure)
- [ ] 3.6 Add unit tests for search orchestration

## 4. Result Merging

- [ ] 4.1 Create result merger that combines Nostr and adapter results
- [ ] 4.2 Add `source` field to each result item
- [ ] 4.3 Implement pagination across merged results
- [ ] 4.4 Calculate combined total count from all sources
- [ ] 4.5 Add unit tests for result merging logic

## 5. API Response Model Update

- [ ] 5.1 Add `source` field to `OerItem` response type
- [ ] 5.2 Add `creators` field to `OerItem` response type (list of Creator objects)
- [ ] 5.3 Update `OerQueryService` to include source for Nostr results
- [ ] 5.4 Extract creators from AMB metadata for Nostr results
- [ ] 5.5 Integrate `AdapterSearchService` into `OerQueryService`
- [ ] 5.6 Update API documentation / OpenAPI schema
- [ ] 5.7 Update `oer-finder-api-client` package types
- [ ] 5.8 Add integration tests for merged search results

## 6. Adapter Module Setup

- [ ] 6.1 Create `AdapterModule` in `/src/adapter/`
- [ ] 6.2 Wire up `AdapterRegistryService` and `AdapterSearchService`
- [ ] 6.3 Import `AdapterModule` in `OerModule`
- [ ] 6.4 Verify module initialization and dependency injection
- [ ] 6.5 Add E2E tests for adapter-enabled search

## 7. Example Adapter Implementation (Unsplash)

- [ ] 7.1 Create `packages/oer-adapter-unsplash/` package
- [ ] 7.2 Implement `UnsplashAdapter` class implementing `SourceAdapter`
- [ ] 7.3 Create `UnsplashMapper` to transform Unsplash API responses to OER model
- [ ] 7.4 Map Unsplash image URLs to high/medium/small resolution structure
- [ ] 7.5 Map Unsplash user/photographer data to creators list
- [ ] 7.6 Add `UNSPLASH_ACCESS_KEY` environment variable support
- [ ] 7.7 Add unit tests for Unsplash adapter
- [ ] 7.8 Document adapter configuration in README

## 8. Documentation

- [ ] 8.1 Update project README with adapter system overview
- [ ] 8.2 Create adapter development guide for contributors
- [ ] 8.3 Document environment variables for adapter configuration
- [ ] 8.4 Add API changelog noting `source` field addition
