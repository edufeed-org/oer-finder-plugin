# Architecture

## Overview

The Nostr OER Finder consists of three main components:

1. **Aggregator Service**: Listens to configurable Nostr relays for OER image resources, collects them, and exposes them via a public API
2. **Source Adapters**: Pluggable modules that integrate external OER sources (e.g., ARASAAC) into search results
3. **JavaScript Plugin**: Connects to the API and simplifies integration of OER images into applications

## OER Resource Database Schema

The `open_educational_resources` table stores processed OER data with denormalized fields for efficient querying. Complete AMB metadata is preserved in JSONB format, while frequently queried fields are extracted and indexed.

| Field | Type | Indexed | Source | Description |
|-------|------|---------|--------|-------------|
| `id` | UUID | PK | System | Auto-generated primary key |
| `url` | Text | Unique | Both | Resource URL (from `d` tag or file URL) |
| **Educational Metadata** |
| `metadata` | JSONB | - | Source Event | Complete metadata in structured format (format depends on source) |
| `metadata_type` | Text | - | Source Event | Type identifier for metadata format (e.g., "amb" for AMB/Nostr sources) |
| `keywords` | JSONB Array | - | AMB Event | Searchable keywords/tags |
| `description` | Text | - | AMB Event | Resource description |
| `audience_uri` | Text | Yes | AMB Event | Target audience URI (e.g., educators, students) |
| `educational_level_uri` | Text | Yes | AMB Event | Educational level URI (e.g., K-12, higher ed) |
| **Licensing** |
| `license_uri` | Text | Yes | AMB Event | License identifier (e.g., CC-BY-SA-4.0) |
| `free_to_use` | Boolean | Yes | AMB Event | Accessibility flag |
| **File Metadata** |
| `file_mime_type` | Text | Yes | File Event | MIME type (e.g., `image/jpeg`) |
| `file_dim` | Text | - | File Event | Image dimensions (e.g., `1920x1080`) |
| `file_size` | BigInt | - | File Event | File size in bytes |
| `file_alt` | Text | - | File Event | Alternative text for accessibility |
| **Temporal Data** |
| `amb_date_created` | Timestamp | Yes | AMB Event | Resource creation date |
| `amb_date_published` | Timestamp | Yes | AMB Event | Publication date |
| `amb_date_modified` | Timestamp | Yes | AMB Event | Last modification date (for update tracking) |
| **System Fields** |
| `created_at` | Timestamp | Yes | System | Record creation timestamp |
| `updated_at` | Timestamp | - | System | Last update timestamp |
| `source_name` | Text | Yes | System | Origin identifier (e.g., "nostr") |
| `name` | Text | - | AMB Event | Resource name/title |
| `attribution` | Text | - | AMB Event | Attribution/copyright notice |

### OER Sources Table

The `oer_sources` table stores raw Nostr events and links them to OER records:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `oer_id` | UUID | Foreign key to `open_educational_resources` (nullable, cascade delete) |
| `source_name` | Text | Origin identifier (e.g., "nostr") |
| `source_identifier` | Text | Unique identifier (e.g., `event:<event-id>`) |
| `source_data` | JSONB | Complete raw event data |
| `status` | Text | Processing status: `pending` or `processed` |
| `source_uri` | Text | Resource URI from the event |
| `source_timestamp` | BigInt | Event timestamp (created_at) |
| `source_record_type` | Text | Event kind (e.g., "30142", "1063") |
| `created_at` | Timestamp | Record creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |

**Design Rationale**:
- **Denormalization**: Frequently queried fields are extracted from events for indexing, enabling fast searches by license, level, audience, and dates
- **JSONB Storage**: Complete AMB metadata is preserved to avoid data loss and support future query needs without schema changes
- **Author Handling**: Author data remains in JSONB to avoid normalization complexity when author information changes across event versions
- **Source Tracking**: The `source` field identifies where each resource originated, enabling filtering and attribution

## Source Adapter System

The adapter system allows integrating external OER sources alongside Nostr-based resources. The `source` query parameter determines which source is queried - only one source is queried per request.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OerQueryService                              │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │ source param?   │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│              ┌──────────────┴──────────────┐                    │
│              │                             │                     │
│              ▼                             ▼                     │
│  ┌──────────────────┐       ┌──────────────────────────────┐   │
│  │ PostgreSQL Query │       │    AdapterSearchService      │   │
│  │  (source=nostr)  │       │     (source=arasaac, ...)    │   │
│  └────────┬─────────┘       │  ┌──────────┐  ┌──────────┐  │   │
│           │                 │  │ ARASAAC  │  │ Future   │  │   │
│           │                 │  │ Adapter  │  │ Adapter  │  │   │
│           │                 │  └──────────┘  └──────────┘  │   │
│           │                 └──────────────┬───────────────┘   │
│           │                                │                    │
│           └────────────────┬───────────────┘                    │
│                            │                                    │
│                            ▼                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
                       API Response
```

### Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `SourceAdapter` | `packages/oer-adapter-core` | Interface that all adapters implement |
| `AdapterRegistryService` | `src/adapter/` | Manages enabled adapters based on configuration |
| `AdapterSearchService` | `src/adapter/` | Routes search requests to specific adapters |
| `AdapterLoaderService` | `src/adapter/` | Dynamically loads adapter packages |

### Adapter Interface

All source adapters implement the `SourceAdapter` interface:

```typescript
interface SourceAdapter {
  readonly sourceId: string;    // e.g., "arasaac"
  readonly sourceName: string;  // e.g., "ARASAAC"
  search(query: AdapterSearchQuery): Promise<AdapterSearchResult>;
}
```

### Available Adapters

| Adapter | Package | Description |
|---------|---------|-------------|
| ARASAAC | `@edufeed-org/oer-adapter-arasaac` | AAC pictograms (CC BY-NC-SA 4.0) |

### Creating Custom Adapters

To create a new adapter:

1. Create a new package in `/packages/oer-adapter-{name}/`
2. Implement the `SourceAdapter` interface from `@edufeed-org/oer-adapter-core`
3. Export a factory function (e.g., `createMyAdapter()`)
4. Register the adapter ID in the loader service
5. Enable via `ENABLED_ADAPTERS` environment variable

### Search Flow

1. Client sends search request to `/api/v1/oer` with optional `source` parameter
2. If `source` is not specified or is `nostr`, `OerQueryService` queries PostgreSQL for Nostr-sourced OERs
3. If `source` is set to an adapter ID (e.g., `arasaac`), `AdapterSearchService` queries only that specific adapter
4. Each item includes a `source` field identifying its origin
5. Response contains results from the selected source only

### Error Handling

- Adapter errors are logged and propagated to the client
- Per-adapter timeout prevents slow sources from blocking responses

## Multi-Relay Support

Connect to multiple Nostr relays simultaneously for improved resilience and data coverage.

**Features**:
- **Sequential Connection**: Relays connect one after another during startup
- **Independent Lifecycle**: Each relay maintains its own connection and subscription
- **Automatic Reconnection**: Failed relays automatically reconnect without affecting others
- **Event Deduplication**: Database constraints prevent duplicate events from multiple relays

## Image Proxy (imgproxy)

The aggregator supports optional [imgproxy](https://imgproxy.net/) integration for image handling.

### Why imgproxy is Important

**CORS Restrictions**: Most OER image providers do not set CORS headers that allow browser-based applications to fetch images directly. When a web component tries to load an image from a third-party server, browsers block the request due to Cross-Origin Resource Sharing policies. Imgproxy solves this by acting as a server-side proxy that fetches images and serves them with appropriate CORS headers.

**On-the-fly Thumbnail Generation**: Rather than pre-generating and storing multiple thumbnail sizes for each image, imgproxy generates resized versions on demand. This approach:
- Eliminates storage overhead for thumbnails
- Allows flexible sizing based on actual usage needs
- Reduces initial processing time when ingesting new OER resources

### How it Works

When imgproxy is configured, the API response includes an `images` object for each OER resource:

```json
{
  "amb": {
    "id": "https://example.com/original-image.jpg"
  },
  "extensions": {
    "images": {
      "high": "http://imgproxy.local/insecure/rs:fit:0:0/plain/https%3A%2F%2Fexample.com%2Foriginal-image.jpg",
      "medium": "http://imgproxy.local/insecure/rs:fit:400:0/plain/https%3A%2F%2Fexample.com%2Foriginal-image.jpg",
      "small": "http://imgproxy.local/insecure/rs:fit:200:0/plain/https%3A%2F%2Fexample.com%2Foriginal-image.jpg"
    },
    "system": {
      "source": "nostr",
      "foreignLandingUrl": null,
      "attribution": null
    }
  }
}
```

- **high**: Original resolution (no resizing)
- **medium**: 400px width (height auto-calculated)
- **small**: 200px width (height auto-calculated)

### Security

Imgproxy supports signed URLs to prevent abuse. When `IMGPROXY_KEY` and `IMGPROXY_SALT` are configured, all generated URLs include an HMAC-SHA256 signature. This ensures only the aggregator can generate valid proxy URLs.

## Related Projects

- [nostream](https://github.com/cameri/nostream) - Self-hostable Nostr relay written in TypeScript
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [Lumina](https://github.com/lumina-rocks/lumina) - Image-first social media client for Nostr
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
