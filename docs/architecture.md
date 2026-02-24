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

## Asset Proxying

### Privacy Model

The proxy applies a deliberate boundary between **implicit** and **explicit** resource loading:

- **Implicit assets are proxied.** Thumbnails that load automatically in search results go through either imgproxy or HMAC-signed URL redirects. The user's browser never contacts external image servers directly, preventing IP leakage, cookie tracking, and referrer exposure from passive browsing.
- **Explicit actions are the user's choice.** When a user deliberately navigates to the original resource (e.g., opening the source landing page or downloading the original file), that request goes directly to the external source. This is an informed decision by the user (or can be mediated by the integrator with appropriate warnings).

This means all three `extensions.images` sizes — including the `high` (full-resolution) variant — are proxied when configured. For images, users can view even the largest version without leaving the proxy boundary. Only `amb.id` and `amb.encoding[].contentUrl` (the original resource URLs for non-image media like audio, video, or PDFs) are passed through unmodified for the plugin or integrator to handle as they see fit.

### imgproxy Integration

The proxy supports optional [imgproxy](https://imgproxy.net/) integration for thumbnail proxying.

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

### HMAC-Signed URL Redirects

As a lightweight alternative to imgproxy, the proxy can sign asset URLs with HMAC-SHA256. The API returns redirect URLs (`/api/v1/assets/:signature?url=...&exp=...`) instead of direct source URLs. The redirect endpoint verifies the signature and expiration, sets security headers (`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`), and issues a `302` redirect to the original URL.

This provides URL obfuscation, referrer stripping, and time-limited access without requiring an imgproxy deployment.

### Security

Both imgproxy and asset signing support HMAC-signed URLs to prevent abuse. When signing keys are configured, all generated URLs include cryptographic signatures. This ensures only the proxy can generate valid asset URLs, preventing the proxy from being used as an open relay.

## Related Projects

- [amb-relay](https://github.com/JannikStreek/amb-relay) - AMB Nostr relay with Typesense-based search
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
