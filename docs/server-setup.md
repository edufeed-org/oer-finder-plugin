# Server Setup and Development

This guide covers installing, configuring, and developing the OER Proxy server.

## Prerequisites

- Node.js (v24 or higher)
- Docker and Docker Compose (recommended for AMB relay and supporting services)

## Installation

### 1. Build and Start Services

```bash
# Standard build
docker compose build
docker compose up -d --force-recreate

# OR use development compose file to customize build
docker compose -f docker-compose.yml docker-compose.dev.yml build
docker compose -f docker-compose.yml docker-compose.dev.yml up -d
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
```

See the [Configuration](#configuration) section for details on available variables.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

> **Important:** This is a pnpm workspace monorepo — the adapter packages must be built before the NestJS server can start. The `start:dev` and `start:debug` scripts handle this automatically. For production mode, run `pnpm run build` first to build both packages and the server.

```bash
# Watch mode (auto-reload on changes, builds packages automatically)
pnpm start:dev

# Production mode (requires prior build)
pnpm run build
pnpm start:prod
```

The API will be available at `http://localhost:3000` (or the port specified in your `.env` file).

## Configuration

The application uses environment variables for configuration. See `.env.example` for a complete list.

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |

### Source Adapter Configuration

Source adapters forward search requests to external OER sources. Adapters are enabled via environment variables. Only one source is queried per request, determined by the `source` query parameter.

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLED_ADAPTERS` | - | Comma-separated list of adapter IDs to enable |
| `ADAPTER_TIMEOUT_MS` | `3000` | Timeout for adapter requests in milliseconds |

**Available Adapters**:

| Adapter ID | Description | Additional Config |
|------------|-------------|-------------------|
| `nostr-amb-relay` | AMB Nostr relay for educational metadata | `NOSTR_AMB_RELAY_URL` required |
| `arasaac` | ARASAAC AAC pictograms (CC BY-NC-SA 4.0) | None required |
| `openverse` | Openverse openly licensed media | None required |
| `rpi-virtuell` | RPI-Virtuell religious education materials | Optional `RPI_VIRTUELL_API_URL` |

**Example configuration**:
```bash
# Enable multiple adapters
ENABLED_ADAPTERS=nostr-amb-relay,arasaac,openverse,rpi-virtuell

# AMB relay URL (required when nostr-amb-relay is enabled)
NOSTR_AMB_RELAY_URL=ws://amb-relay:3334

# Increase timeout for slow connections
ADAPTER_TIMEOUT_MS=5000
```

When adapters are enabled:
- The `source` query parameter selects which adapter to query (required)
- With `source=nostr-amb-relay`: queries the AMB Nostr relay
- With `source=arasaac`: queries the ARASAAC adapter
- With `source=openverse`: queries the Openverse adapter
- Each response item has a `source` field identifying its origin

### Asset Proxying Configuration

When using the server-proxy mode, implicitly loaded assets (thumbnails in search results) can be proxied to protect user privacy and solve CORS issues. When proxying is configured, the user's browser never contacts external image servers directly during passive browsing — preventing IP leakage, cookie tracking, and referrer exposure. All three image sizes (including the full-resolution `high` variant) are proxied, so users can view images at any resolution without leaving the proxy boundary. Explicit actions like navigating to the original resource landing page or downloading non-image media remain in the user's or integrator's domain.

**Note:** This feature applies only to server-proxy mode. In direct-client mode, the plugin runs adapters in the browser and contacts external sources directly — proxying is not available.

Two proxying strategies are available: imgproxy (full image proxy with resizing) and HMAC-signed URL redirects (lightweight alternative).

#### imgproxy

The proxy supports optional [imgproxy](https://imgproxy.net/) integration. When configured, the API includes proxied thumbnail URLs for each OER resource in three sizes (high, medium, small).

1. **Privacy**: Thumbnails are fetched server-side — external image servers never see the user's IP address.
2. **CORS Workaround**: Most image providers do not allow cross-origin requests from browsers. Imgproxy serves images with proper CORS headers.
3. **Thumbnail Generation**: Instead of storing multiple thumbnail sizes, imgproxy generates resized images on-the-fly, reducing storage requirements while improving load times.

| Variable | Default | Description |
|----------|---------|-------------|
| `IMGPROXY_BASE_URL` | - | Base URL for imgproxy service (e.g., `http://localhost:8080`) |
| `IMGPROXY_KEY` | - | Hex-encoded key for signed URLs (optional) |
| `IMGPROXY_SALT` | - | Hex-encoded salt for signed URLs (optional) |

**Modes**:
- **Disabled**: Leave `IMGPROXY_BASE_URL` empty. API responses will not include proxy URLs.
- **Insecure**: Set only `IMGPROXY_BASE_URL`. URLs are generated without signatures.
- **Secure**: Set all three variables. URLs are signed with HMAC-SHA256.

```bash
# Generate secure keys (Linux/macOS)
echo $(xxd -g 2 -l 64 -p /dev/random | tr -d '\n')
```

**Example configuration**:
```bash
IMGPROXY_BASE_URL=http://localhost:8080
IMGPROXY_KEY=your_64_byte_hex_key
IMGPROXY_SALT=your_64_byte_hex_salt
```

#### Asset Signing (Lightweight Alternative)

As a lightweight alternative to imgproxy, the proxy can sign asset URLs with HMAC-SHA256. When configured, the API returns redirect URLs (`/api/v1/assets/:signature?url=...&exp=...`) instead of direct source URLs. The redirect endpoint verifies the signature and expiration, sets security headers (`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`), and issues a `302` redirect to the original URL.

This provides URL obfuscation, referrer stripping, and time-limited access without requiring an imgproxy deployment.

| Variable | Default | Description |
|----------|---------|-------------|
| `ASSET_SIGNING_KEY` | - | HMAC key string (min 32 characters) |
| `ASSET_SIGNING_TTL_SECONDS` | `3600` | Signed URL lifetime in seconds (0 = non-expiring) |
| `PUBLIC_BASE_URL` | - | Base URL for signed URLs (falls back to `http://localhost:<PORT>`) |

**Modes**:
- **Disabled** (default): Leave `ASSET_SIGNING_KEY` empty. If imgproxy is also disabled, source URLs are returned as-is in API responses.
- **Enabled**: Set `ASSET_SIGNING_KEY` to any string of at least 32 characters. Optionally set `PUBLIC_BASE_URL` for production deployments.

```bash
# Generate a signing key (Linux/macOS)
openssl rand -base64 32
```

**Example configuration**:
```bash
ASSET_SIGNING_KEY=your-secret-signing-key-at-least-32-chars
ASSET_SIGNING_TTL_SECONDS=3600
PUBLIC_BASE_URL=https://oer.example.com
```

**Priority**: When both imgproxy and asset signing are configured, imgproxy takes priority for generating image URLs from source URLs. Asset signing is still used to sign adapter-provided image URLs.

## API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` for interactive OpenAPI documentation.

## Development

### Running Tests

```bash
# Unit tests
pnpm test

# Test coverage report
pnpm test:cov
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format

# Check formatting (dry run)
pnpm format -- --check

# TypeScript type checking
pnpm build
```

### Publishing Test Events

```bash
# Publish demo OER events to the AMB relay
docker compose run --rm --entrypoint sh nak /data/publish-demo-events.sh

# Publish a custom learning resource event
docker compose run --rm nak event -k 30142 \
  -c "A custom learning resource description" \
  -t "d=my-unique-resource-id" \
  -t "type=LearningResource" \
  -t "name=My Custom Resource" \
  -t "license:id=https://creativecommons.org/licenses/by-sa/4.0/" \
  -t "inLanguage=en" \
  ws://amb-relay:3334
```
