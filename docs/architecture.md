# Architecture

## Overview

The system has two operation modes that share the same adapter codebase:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Web Application                               │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │              oer-finder-plugin (Web Components)              │   │
│   │                                                              │   │
│   │   Server-Proxy mode              Direct Client mode          │   │
│   │   (api-url set)                  (no api-url)                │   │
│   │        │                              │                      │   │
│   │        ▼                              ▼                      │   │
│   │   HTTP requests              Adapters run in-browser         │   │
│   └────────┼──────────────────────────────┼──────────────────────┘   │
│            │                              │                          │
└────────────┼──────────────────────────────┼──────────────────────────┘
             │                              │
             ▼                              │
   ┌─────────────────┐                     │
   │   NestJS Proxy   │                     │
   │   (stateless)    │                     │
   │        │         │                     │
   │   Adapters run   │                     │
   │   server-side    │                     │
   │        │         │                     │
   │   Asset proxying │                     │
   │   (imgproxy /    │                     │
   │    HMAC signing) │                     │
   └────────┼─────────┘                     │
            │                               │
            ▼                               ▼
   ┌────────────────────────────────────────────────┐
   │              External OER Sources               │
   │  AMB Relay · Openverse · ARASAAC · Wikimedia …  │
   └────────────────────────────────────────────────┘
```

**Server-Proxy mode** — The plugin sends HTTP requests to the NestJS proxy. Adapters run server-side. The proxy can apply asset proxying (imgproxy or HMAC-signed redirects) to protect user privacy. No adapter code is bundled into the client application.

**Direct Client mode** — Adapters run directly in the browser via the plugin. No server needed. The browser contacts external sources directly — asset proxying is not available.

Both modes use the same `SourceAdapter` interface and adapter packages. For plugin setup and mode selection, see the [Client Packages guide](./client-packages.md#routing-modes). For server configuration, see the [Server Setup guide](./server-setup.md).

## Source Adapter System

Adapters are self-contained packages that translate external APIs into a unified [AMB metadata](https://dini-ag-kim.github.io/amb/latest/) format. Each adapter handles one OER source. Only one source is queried per request, determined by the `source` parameter.

### Server-Side Request Flow

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
│              │  ┌──────────────┐                             │   │
│              │  │ Wikimedia    │                             │   │
│              │  │ Adapter      │                             │   │
│              │  └──────────────┘                             │   │
│              └──────────────────────┬───────────────────────┘   │
│                                     │                            │
│                                     ▼                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      ▼
                                API Response
```

1. Client sends `GET /api/v1/oer?source=<id>&searchTerm=<text>`
2. `OerQueryService` delegates to `AdapterSearchService`, which routes to the matching adapter
3. The adapter queries its external source with an `AbortController` timeout
4. Results are normalized to AMB metadata and returned
5. If asset proxying is configured, image URLs are rewritten (see [Asset Proxying](#asset-proxying))

### Key Server Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SourceAdapter` | `packages/oer-adapter-core` | Interface all adapters implement |
| `AdapterRegistryService` | `src/adapter/` | Manages enabled adapters from config |
| `AdapterSearchService` | `src/adapter/` | Routes requests to the correct adapter |
| `AdapterLoaderService` | `src/adapter/` | Instantiates adapters at startup |
| `KNOWN_ADAPTER_IDS` | `src/adapter/adapter.constants.ts` | Single source of truth for valid adapter IDs |

### Adapter Interface

```typescript
interface SourceAdapter {
  readonly sourceId: string;           // e.g., "nostr-amb-relay"
  readonly sourceName: string;         // e.g., "AMB Relay"
  readonly capabilities: AdapterCapabilities;  // Declares supported filters
  search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,    // Includes AbortSignal for cancellation
  ): Promise<AdapterSearchResult>;
}
```

`AdapterCapabilities` declares which filters an adapter supports (language, type, license, educational level). When a filter is active that the adapter cannot handle, the system returns empty results instead of unfiltered data.

### Available Adapters

| Adapter | Package | Source |
|---------|---------|--------|
| AMB Relay | `@edufeed-org/oer-adapter-nostr-amb-relay` | Nostr AMB relay (WebSocket, kind 30142) |
| ARASAAC | `@edufeed-org/oer-adapter-arasaac` | ARASAAC pictograms API |
| Openverse | `@edufeed-org/oer-adapter-openverse` | Openverse (Flickr, Wikimedia, etc.) |
| RPI-Virtuell | `@edufeed-org/oer-adapter-rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) |
| Wikimedia | `@edufeed-org/oer-adapter-wikimedia` | Wikimedia Commons API |

For creating new adapters, see the [step-by-step guide](./creating-a-new-adapter.md).

### Client-Side Adapter Loading

In direct client mode, the same adapter packages run in the browser. The plugin provides a lightweight adapter registry:

- Adapters are registered via `register*Adapter()` functions before the first search
- Only registered adapters are available — unregistered source IDs are silently skipped
- Selective registration enables tree-shaking to reduce bundle size

See [Client Packages — Direct Client Mode](./client-packages.md#direct-client-mode) for setup.

## API Response Structure

Each OER item in the API response has two top-level sections: `amb` (standard AMB metadata) and `extensions` (system-generated fields):

```json
{
  "amb": {
    "id": "https://example.com/resource",
    "name": "Example Resource",
    "license": { "id": "https://creativecommons.org/licenses/by-sa/4.0/" }
  },
  "extensions": {
    "images": {
      "high": "http://imgproxy.local/…/rs:fit:0:0/plain/…",
      "medium": "http://imgproxy.local/…/rs:fit:400:0/plain/…",
      "small": "http://imgproxy.local/…/rs:fit:200:0/plain/…"
    },
    "system": {
      "source": "nostr-amb-relay",
      "foreignLandingUrl": "https://example.com/resource",
      "attribution": "Author Name, CC BY-SA 4.0"
    }
  }
}
```

- **`amb`** — Normalized [AMB metadata](https://dini-ag-kim.github.io/amb/latest/) from the source (id, name, description, creator, license, keywords, etc.). Passed through from the adapter.
- **`extensions.images`** — Thumbnail URLs in three sizes, **generated by the proxy** when asset proxying is configured. These are not from the original source — the proxy rewrites the source image URL into imgproxy URLs (with on-the-fly resizing) or HMAC-signed redirect URLs. In direct client mode or when proxying is disabled, these contain the original source URLs as-is.
  - `high` — original resolution (no resizing)
  - `medium` — 400px width
  - `small` — 200px width
- **`extensions.system`** — System metadata: which adapter produced the result (`source`), the original landing page (`foreignLandingUrl`), and attribution text.

For the full TypeScript type definition, see [Client Packages — Response Structure](./client-packages.md#response-structure).

## Asset Proxying

Asset proxying is a **server-proxy mode feature only**. In direct client mode, the browser contacts external sources directly.

When configured, the proxy rewrites image URLs in API responses so that the user's browser never contacts external image servers directly during passive browsing. This prevents IP leakage, cookie tracking, and referrer exposure.

### Privacy Model

The proxy applies a deliberate boundary between implicit and explicit resource loading:

- **Implicit assets are proxied.** Thumbnails in search results (`extensions.images.high/medium/small`) go through imgproxy or HMAC-signed redirects. All three sizes are proxied, including the full-resolution `high` variant.
- **Explicit actions are the user's choice.** Navigating to the original resource (`amb.id`) or downloading non-image media (`amb.encoding[].contentUrl`) goes directly to the external source.

### Two Proxying Strategies

**imgproxy** — Full image proxy with on-the-fly resizing. Solves CORS restrictions (most OER providers don't set cross-origin headers), generates thumbnails on demand, and fetches images server-side for privacy. Produces three sizes per image (high: original, medium: 400px, small: 200px).

**HMAC-signed URL redirects** — Lightweight alternative. The API returns signed redirect URLs (`/api/v1/assets/:signature?url=...&exp=...`) that verify the signature and expiration, set security headers, and `302` redirect to the original URL. Provides URL obfuscation, referrer stripping, and time-limited access without an imgproxy deployment.

When both are configured, imgproxy takes priority for source URLs; asset signing is still used for adapter-provided image URLs.

Both strategies support HMAC signing to prevent the proxy from being used as an open relay. For configuration details, see the [Server Setup guide](./server-setup.md#asset-proxying-configuration).

## Related Projects

- [amb-relay](https://github.com/JannikStreek/amb-relay) - AMB Nostr relay with Typesense-based search
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
