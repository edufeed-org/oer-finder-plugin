## Context
The OER aggregator currently only supports Nostr relays as data sources. To expand coverage of educational resources, we need to support external APIs (e.g., Unsplash, Wikimedia Commons, OpenStax, OER Commons). These sources have different APIs and data formats that must be normalized to the existing OER model.

**Stakeholders:**
- API consumers expecting consistent response format
- Adapter developers needing clear interface contracts
- Operators who configure enabled sources via environment

**Constraints:**
- No local database storage for external results (passthrough only)
- External API rate limits must be respected
- Search latency should remain acceptable (parallel queries)
- Adapter packages live in `/packages/` folder for now

## Goals / Non-Goals

**Goals:**
- Define a clear `SourceAdapter` interface that adapter packages implement
- Enable runtime adapter registration based on environment variables
- Merge external results with Nostr results in a unified API response
- Add `source` field to identify result origin
- Support parallel querying of all enabled adapters
- Graceful degradation if an adapter fails (other sources still return)

**Non-Goals:**
- Storing external results in local database
- Full-text search across external sources (adapters implement their own search)
- Authentication/OAuth flows for external APIs (adapters handle credentials)
- Real-time streaming from external sources
- Administrative UI for adapter management
- Health check endpoints for external sources

## Decisions

### Decision 1: Adapter Interface Design
**What:** Define a TypeScript interface that all adapters must implement.

```typescript
interface SourceAdapter {
  /** Unique identifier for this source (e.g., "unsplash", "wikimedia") */
  readonly sourceId: string;

  /** Human-readable source name */
  readonly sourceName: string;

  /**
   * Search for OER matching the query.
   * Returns results mapped to the OER API model.
   */
  search(query: AdapterSearchQuery): Promise<AdapterSearchResult>;
}

interface AdapterSearchQuery {
  // Subset of OerQueryDto fields relevant to external searches
  keywords?: string;
  type?: string;
  license?: string;
  language?: string;
  page: number;
  pageSize: number;
}

interface AdapterSearchResult {
  items: ExternalOerItem[];
  total: number;
}

/** Image URLs at different resolutions - matches existing ImgProxyUrls structure */
interface ImageUrls {
  high: string;
  medium: string;
  small: string;
}

/** Creator information - person or organization */
interface Creator {
  type: string;       // e.g., "person", "organization"
  name: string;       // e.g., "Max Mustermann"
  link: string | null; // URL to external provider profile/resource
}

interface ExternalOerItem {
  // Mapped to OER response model (excludes AMB-specific fields)
  id: string;
  url: string;
  description: string | null;
  keywords: string[];
  license_uri: string | null;
  free_to_use: boolean | null;
  file_mime_type: string | null;
  file_size: number | null;
  file_dim: string | null;
  file_alt: string | null;
  /** Images at low/medium/high resolution - adapters map their source URLs to this structure */
  images: ImageUrls | null;
  /** List of creators (persons or organizations) */
  creators: Creator[];
  // Source will be added by the merge layer
}
```

**Alternatives considered:**
1. *Abstract base class* - More coupling, harder to test. Rejected.
2. *Plugin system with dynamic loading* - Over-engineered for current needs. Rejected.

### Decision 2: Adapter Package Structure
**What:** Each adapter is a separate npm package in `/packages/`.

```
packages/
├── oer-adapter-core/          # Shared types and utilities
│   ├── src/
│   │   ├── index.ts           # Exports interface & types
│   │   └── adapter.interface.ts
│   └── package.json
├── oer-adapter-unsplash/      # Example adapter
│   ├── src/
│   │   ├── index.ts
│   │   ├── unsplash.adapter.ts
│   │   └── unsplash.mapper.ts  # Maps Unsplash API → OER model
│   └── package.json
└── ...
```

**Rationale:** Keeps adapters modular, testable, and allows independent versioning.

### Decision 3: Runtime Registration via Environment
**What:** Adapters are activated via `ENABLED_ADAPTERS` environment variable.

```bash
# Enable specific adapters (comma-separated)
ENABLED_ADAPTERS=unsplash,wikimedia

# Each adapter may have its own config
UNSPLASH_ACCESS_KEY=xxx
WIKIMEDIA_API_URL=https://...
```

**Alternatives considered:**
1. *Config file (JSON/YAML)* - Adds complexity, env vars are simpler. Rejected.
2. *Database configuration* - Overkill, harder to version control. Rejected.

### Decision 4: Search Orchestration
**What:** The `OerQueryService` orchestrates parallel queries to Nostr DB and all enabled adapters.

```typescript
async search(query: OerQueryDto): Promise<MergedSearchResult> {
  const [nostrResults, ...adapterResults] = await Promise.allSettled([
    this.searchNostrDatabase(query),
    ...this.enabledAdapters.map(adapter => adapter.search(toAdapterQuery(query)))
  ]);

  return this.mergeResults(nostrResults, adapterResults, query);
}
```

**Rationale:**
- Parallel execution minimizes latency
- `Promise.allSettled` ensures one failing adapter doesn't break the response
- Merging happens at service layer, not in adapters

### Decision 5: Result Merging Strategy
**What:** Results are merged with source identification and consistent pagination.

**Merging rules:**
1. Nostr results come first (primary source)
2. External results follow in adapter registration order
3. Each item gets a `source` field added
4. Pagination is applied after merging:
   - `total` is sum of all source totals
   - `page` and `pageSize` work across merged results
   - For large result sets, may need cursor-based pagination in future

**Deduplication:** Not implemented initially. Same resource from multiple sources appears multiple times with different `source` values.

### Decision 6: API Response Model Change
**What:** Add `source` field to OER response items.

```typescript
interface OerItem {
  // ... existing fields ...
  source: string;  // "nostr" | "unsplash" | "wikimedia" | etc.
}
```

**Breaking change:** Yes. API consumers must update to handle new field. Given the API is already in use, this is acceptable as the field is additive.

### Decision 7: Error Handling
**What:** Adapters failing should not fail the entire search.

```typescript
// In merge logic
adapterResults.forEach((result, index) => {
  if (result.status === 'rejected') {
    this.logger.warn(`Adapter ${adapters[index].sourceId} failed: ${result.reason}`);
    // Continue without this adapter's results
  }
});
```

**Response includes:** Only successful results. No indication to client which adapters failed (logged server-side).

### Decision 8: NestJS Integration
**What:** Create an `AdapterModule` that manages adapter lifecycle.

```typescript
@Module({
  providers: [
    AdapterRegistryService,  // Manages enabled adapters
    AdapterSearchService,    // Orchestrates searches
    // Adapters injected dynamically based on config
  ],
  exports: [AdapterSearchService],
})
export class AdapterModule {}
```

**Integration points:**
- `OerModule` imports `AdapterModule`
- `OerQueryService` delegates to `AdapterSearchService` for external sources
- Configuration loaded in `ConfigModule`

### Decision 9: Image URL Mapping
**What:** Adapters map their source image URLs to the existing `ImgProxyUrls` structure (high/medium/small).

External sources typically provide multiple image resolutions. Adapters are responsible for mapping their available resolutions to the standard structure:
- `high`: Full resolution or largest available
- `medium`: ~400px width or medium quality
- `small`: ~200px width or thumbnail

If a source provides a single URL, the adapter may use the same URL for all three resolutions (client can choose based on context).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| External API rate limits exceeded | Implement per-adapter rate limiting; respect API quotas |
| Increased search latency | Parallel queries; timeout per adapter (e.g., 3s) |
| Inconsistent data quality | Mappers validate/sanitize external data |
| Adapter configuration errors | Clear error logging on startup; validation of env vars |
| Breaking API change (`source` field) | Document in release notes; field is additive |

## Migration Plan

1. **Phase 1:** Create `oer-adapter-core` package with interface definitions
2. **Phase 2:** Implement adapter registry and search orchestration in main app
3. **Phase 3:** Add `source` field to API response
4. **Phase 4:** Create first example adapter (e.g., Unsplash)
5. **Rollback:** Disable adapters by removing from `ENABLED_ADAPTERS` env var

## Open Questions

1. Should we add a `/api/v1/sources` endpoint to list enabled adapters?
2. Should adapter results include a link back to the original source page?
3. How should we handle adapters that don't support all filter types?
4. Should we cache external adapter results (with TTL) to reduce API calls?
