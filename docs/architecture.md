# Architecture

## Overview

The OER Finder Aggregator consists of three main components:

1. **Aggregator Service**: Ingests Nostr AMB events into a PostgreSQL database and serves unified OER results via a public API. Also forwards search queries to configured external source adapters.
2. **Source Adapters**: Pluggable modules that integrate external OER sources (e.g., ARASAAC, Openverse, RPI-Virtuell) into search results
3. **JavaScript Plugin**: Connects to the API and simplifies integration of OER images into applications

The aggregator subscribes to Nostr AMB relays via WebSocket, ingests events into PostgreSQL, and queries them locally for the `nostr` source. For external sources, queries are forwarded to the appropriate adapter.

## Source Adapter System

The adapter system allows integrating multiple external OER sources through a unified API. The `source` query parameter determines which source handles each request — either the internal database (`source=nostr`) or an external adapter.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OerQueryService                              │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │ source param    │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │                 │                          │
│              source=nostr    source=<adapter>                   │
│                    │                 │                          │
│              ┌─────▼─────┐  ┌───────▼──────────────────────┐   │
│              │ PostgreSQL │  │   AdapterSearchService        │   │
│              │ (internal) │  │  ┌──────────┐  ┌──────────┐  │   │
│              └────────────┘  │  │ ARASAAC  │  │Openverse │  │   │
│                              │  └──────────┘  └──────────┘  │   │
│                              │  ┌──────────────┐  ┌────────┐│   │
│                              │  │ RPI-Virtuell │  │Wikimeda││   │
│                              │  └──────────────┘  └────────┘│   │
│                              └──────────────┬───────────────┘   │
│                                             │                    │
│                                             ▼                    │
└─────────────────────────────────────────────┼────────────────────┘
                                              ▼
                                        API Response
```

### Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `SourceAdapter` | `packages/oer-adapter-core` | Interface that all external adapters implement |
| `NostrModule` | `src/nostr/` | Wires oer-nostr services for Nostr relay ingestion into PostgreSQL |
| `AdapterRegistryService` | `src/adapter/` | Manages enabled adapters based on configuration |
| `AdapterSearchService` | `src/adapter/` | Routes search requests to specific adapters |
| `AdapterLoaderService` | `src/adapter/` | Dynamically loads adapter packages |

### Adapter Interface

All external source adapters implement the `SourceAdapter` interface:

```typescript
interface SourceAdapter {
  readonly sourceId: string;           // e.g., "arasaac"
  readonly sourceName: string;         // e.g., "ARASAAC"
  readonly capabilities: AdapterCapabilities;  // Declares supported filters
  search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,    // Includes AbortSignal for cancellation
  ): Promise<AdapterSearchResult>;
}
```

`AdapterCapabilities` declares which filters an adapter supports (language, type, license, educational level). When a filter is active that the adapter cannot handle, the system returns empty results instead of unfiltered data.

### Available Sources

| Source | Package | Description |
|--------|---------|-------------|
| Nostr (internal DB) | `@edufeed-org/oer-nostr` | Local PostgreSQL database populated from Nostr AMB relays |
| ARASAAC | `@edufeed-org/oer-adapter-arasaac` | AAC pictograms (CC BY-NC-SA 4.0) |
| Openverse | `@edufeed-org/oer-adapter-openverse` | Openly licensed media |
| RPI-Virtuell | `@edufeed-org/oer-adapter-rpi-virtuell` | Religious education materials |
| Wikimedia | `@edufeed-org/oer-adapter-wikimedia` | Wikimedia Commons media |

### Creating Custom Adapters

To create a new adapter:

1. Create a new package in `/packages/oer-adapter-{name}/`
2. Implement the `SourceAdapter` interface from `@edufeed-org/oer-adapter-core`
3. Export a factory function (e.g., `createMyAdapter()`)
4. Register the adapter ID in the loader service
5. Enable via `ENABLED_ADAPTERS` environment variable

### Search Flow

1. Client sends search request to `/api/v1/oer` with required `source` parameter
2. `OerQueryService` routes to either the internal database (for `source=nostr`) or `AdapterSearchService` (for external adapters)
3. For external adapters, the adapter queries its external source and returns results in a unified format
4. Each item includes a `source` field identifying its origin
5. Response contains results from the selected source only

### Error Handling

- Adapter errors are logged and propagated to the client
- Per-adapter timeout prevents slow sources from blocking responses

## Nostr Ingestion

The aggregator includes a Nostr ingestion pipeline that:

1. Subscribes to one or more AMB Nostr relays via WebSocket
2. Validates Schnorr signatures on incoming events
3. Stores raw events as `OerSource` records in PostgreSQL
4. Extracts structured `OpenEducationalResource` records from AMB events (kind 30142)
5. Links file metadata from kind 1063 events
6. Processes deletions from kind 5 events
7. Supports incremental sync resume on reconnect via per-relay timestamp tracking

This pipeline is managed by the `NostrModule` and can be enabled/disabled via the `NOSTR_INGEST_ENABLED` environment variable.

## Asset Proxying (Server Mode Only)

Asset proxying is a **server mode feature**. In direct-client mode, the plugin runs adapters in the browser and contacts external sources directly — no proxying is available.

### Privacy Model

When the plugin operates through the aggregator server, the server applies a deliberate boundary between **implicit** and **explicit** resource loading:

- **Implicit assets are proxied.** Thumbnails that load automatically in search results go through either imgproxy or HMAC-signed URL redirects. The user's browser never contacts external image servers directly, preventing IP leakage, cookie tracking, and referrer exposure from passive browsing.
- **Explicit actions are the user's choice.** When a user deliberately navigates to the original resource (e.g., opening the source landing page or downloading the original file), that request goes directly to the external source. This is an informed decision by the user (or can be mediated by the integrator with appropriate warnings).

This means all three `extensions.images` sizes — including the `high` (full-resolution) variant — are proxied when configured. For images, users can view even the largest version without leaving the proxy boundary. Only `amb.id` and `amb.encoding[].contentUrl` (the original resource URLs for non-image media like audio, video, or PDFs) are passed through unmodified for the plugin or integrator to handle as they see fit.

### imgproxy Integration

The server supports optional [imgproxy](https://imgproxy.net/) integration for thumbnail proxying.

**CORS Restrictions**: Most OER image providers do not set CORS headers that allow browser-based applications to fetch images directly. When a web component tries to load an image from a third-party server, browsers block the request due to Cross-Origin Resource Sharing policies. Imgproxy solves this by acting as a server-side proxy that fetches images and serves them with appropriate CORS headers.

**On-the-fly Thumbnail Generation**: Rather than pre-generating and storing multiple thumbnail sizes for each image, imgproxy generates resized versions on demand. This approach:
- Eliminates storage overhead for thumbnails
- Allows flexible sizing based on actual usage needs
- Reduces initial processing time when ingesting new OER resources

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

### HMAC-Signed URL Redirects

As a lightweight alternative to imgproxy, the server can sign asset URLs with HMAC-SHA256. The API returns redirect URLs (`/api/v1/assets/:signature?url=...&exp=...`) instead of direct source URLs. The redirect endpoint verifies the signature and expiration, sets security headers (`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`), and issues a `302` redirect to the original URL.

This provides URL obfuscation, referrer stripping, and time-limited access without requiring an imgproxy deployment.

### Security

Both imgproxy and asset signing support HMAC-signed URLs to prevent abuse. When signing keys are configured, all generated URLs include cryptographic signatures. This ensures only the server can generate valid asset URLs, preventing the server from being used as an open relay.

## Related Projects

- [amb-relay](https://github.com/JannikStreek/amb-relay) - AMB Nostr relay with Typesense-based search
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
