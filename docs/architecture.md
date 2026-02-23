# Architecture

## Overview

The Nostr OER Finder consists of three main components:

1. **Proxy Service**: Forwards search queries to configured source adapters and returns unified OER results via a public API
2. **Source Adapters**: Pluggable modules that integrate external OER sources (e.g., AMB relay, ARASAAC, Openverse, RPI-Virtuell) into search results
3. **JavaScript Plugin**: Connects to the API and simplifies integration of OER images into applications

The proxy is stateless - it does not store OER data locally. All queries are forwarded to the appropriate source adapter, which communicates with the external source directly.

## Source Adapter System

The adapter system allows integrating multiple OER sources through a unified API. The `source` query parameter determines which adapter handles each request - only one source is queried per request.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OerQueryService                              │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │ source param    │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│              ┌──────────────────────────────────────────────┐   │
│              │         AdapterSearchService                  │   │
│              │  ┌──────────────┐  ┌──────────┐              │   │
│              │  │ AMB Relay    │  │ ARASAAC  │              │   │
│              │  │ Adapter      │  │ Adapter  │              │   │
│              │  └──────────────┘  └──────────┘              │   │
│              │  ┌──────────────┐  ┌──────────────┐          │   │
│              │  │ Openverse    │  │ RPI-Virtuell │          │   │
│              │  │ Adapter      │  │ Adapter      │          │   │
│              │  └──────────────┘  └──────────────┘          │   │
│              └──────────────────────┬───────────────────────┘   │
│                                     │                            │
│                                     ▼                            │
└─────────────────────────────────────┼────────────────────────────┘
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
  readonly sourceId: string;    // e.g., "nostr-amb-relay"
  readonly sourceName: string;  // e.g., "AMB Relay"
  search(query: AdapterSearchQuery): Promise<AdapterSearchResult>;
}
```

### Available Adapters

| Adapter | Package | Description |
|---------|---------|-------------|
| AMB Relay | `@edufeed-org/oer-adapter-nostr-amb-relay` | Nostr AMB relay for educational metadata |
| ARASAAC | `@edufeed-org/oer-adapter-arasaac` | AAC pictograms (CC BY-NC-SA 4.0) |
| Openverse | `@edufeed-org/oer-adapter-openverse` | Openly licensed media |
| RPI-Virtuell | `@edufeed-org/oer-adapter-rpi-virtuell` | Religious education materials |

### Creating Custom Adapters

To create a new adapter:

1. Create a new package in `/packages/oer-adapter-{name}/`
2. Implement the `SourceAdapter` interface from `@edufeed-org/oer-adapter-core`
3. Export a factory function (e.g., `createMyAdapter()`)
4. Register the adapter ID in the loader service
5. Enable via `ENABLED_ADAPTERS` environment variable

### Search Flow

1. Client sends search request to `/api/v1/oer` with required `source` parameter
2. `OerQueryService` delegates to `AdapterSearchService` which routes to the appropriate adapter
3. The adapter queries its external source and returns results in a unified format
4. Each item includes a `source` field identifying its origin
5. Response contains results from the selected source only

### Error Handling

- Adapter errors are logged and propagated to the client
- Per-adapter timeout prevents slow sources from blocking responses

## Image Proxy (imgproxy)

The proxy supports optional [imgproxy](https://imgproxy.net/) integration for image handling.

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
      "source": "nostr-amb-relay",
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

Imgproxy supports signed URLs to prevent abuse. When `IMGPROXY_KEY` and `IMGPROXY_SALT` are configured, all generated URLs include an HMAC-SHA256 signature. This ensures only the proxy can generate valid imgproxy URLs.

## Related Projects

- [amb-relay](https://github.com/JannikStreek/amb-relay) - AMB Nostr relay with Typesense-based search
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
