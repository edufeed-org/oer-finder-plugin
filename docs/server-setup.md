# Server Setup and Development

This guide covers installing, configuring, and developing the OER Aggregator server.

## Prerequisites

- Node.js (v24 or higher)
- Docker and Docker Compose (recommended for PostgreSQL, AMB relay, and supporting services)

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

> **Important:** This is a pnpm workspace monorepo — the entity, nostr, and adapter packages must be built before the NestJS server can start. The `start:dev` and `start:debug` scripts handle this automatically via `build:packages`. For production mode, run `pnpm run build` first to build both packages and the server.

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
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `CORS_ALLOWED_ORIGINS` | - | Comma-separated allowed origins (empty = allow all). Supports wildcards e.g. `*.example.com` |
| `TRUST_PROXY` | `0` | Number of trusted reverse proxy hops (0 = disabled, max 10). Set to `1` when behind a single reverse proxy (e.g. nginx) so rate limiting uses the real client IP |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `THROTTLE_TTL` | `60000` | Rate limit window in milliseconds |
| `THROTTLE_LIMIT` | `30` | Maximum requests per window |
| `THROTTLE_BLOCK_DURATION` | `60000` | Block duration in milliseconds after exceeding the limit |

### Database Configuration

The aggregator uses PostgreSQL to store Nostr events and OER resources.

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DATABASE` | `oer-aggregator-dev` | Database name |
| `POSTGRES_SSL` | `false` | Enable SSL connection (`true` or set `PGSSLMODE=require`) |
| `POSTGRES_LOGGING` | `false` | Enable TypeORM query logging |

### Nostr Ingestion Configuration

The aggregator subscribes to AMB Nostr relays via WebSocket, ingests events, and stores them in PostgreSQL.

| Variable | Default | Description |
|----------|---------|-------------|
| `NOSTR_INGEST_ENABLED` | `false` | Enable Nostr event ingestion |
| `NOSTR_RELAY_URL` | - | Primary Nostr relay WebSocket URL |
| `NOSTR_RELAY_URLS` | - | Comma-separated additional relay URLs |
| `NOSTR_RECONNECT_DELAY` | `5000` | Reconnect delay in milliseconds |

**Example configuration**:
```bash
NOSTR_INGEST_ENABLED=true
NOSTR_RELAY_URL=ws://amb-relay:3334
```

### Source Adapter Configuration

Source adapters forward search requests to external OER sources. Adapters are enabled via environment variables. Only one source is queried per request, determined by the `source` query parameter.

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLED_ADAPTERS` | - | Comma-separated list of adapter IDs to enable |
| `ADAPTER_TIMEOUT_MS` | `3000` | Timeout for adapter requests in milliseconds |

**Available Adapters**:

| Adapter ID | Description | Additional Config |
|------------|-------------|-------------------|
| `arasaac` | ARASAAC AAC pictograms (CC BY-NC-SA 4.0) | None required |
| `openverse` | Openverse openly licensed media | None required |
| `rpi-virtuell` | RPI-Virtuell religious education materials | Optional `RPI_VIRTUELL_API_URL` |
| `wikimedia` | Wikimedia Commons media | None required |

**Example configuration**:
```bash
# Enable multiple adapters
ENABLED_ADAPTERS=arasaac,openverse,rpi-virtuell,wikimedia

# Increase timeout for slow connections
ADAPTER_TIMEOUT_MS=5000
```

When adapters are enabled:
- The `source` query parameter selects which source to query (required)
- With `source=nostr`: queries the internal PostgreSQL database
- With `source=arasaac`: queries the ARASAAC adapter
- With `source=openverse`: queries the Openverse adapter
- Each response item has a `source` field identifying its origin

### Asset Proxying Configuration

When using the aggregator in server mode, implicitly loaded assets (thumbnails in search results) can be proxied to protect user privacy and solve CORS issues. When proxying is configured, the user's browser never contacts external image servers directly during passive browsing — preventing IP leakage, cookie tracking, and referrer exposure. All three image sizes (including the full-resolution `high` variant) are proxied, so users can view images at any resolution without leaving the proxy boundary. Explicit actions like navigating to the original resource landing page or downloading non-image media remain in the user's or integrator's domain.

**Note:** This feature applies only to server mode. In direct-client mode, the plugin runs adapters in the browser and contacts external sources directly — proxying is not available.

Two proxying strategies are available: imgproxy (full image proxy with resizing) and HMAC-signed URL redirects (lightweight alternative).

#### imgproxy

The aggregator supports optional [imgproxy](https://imgproxy.net/) integration. When configured, the API includes proxied thumbnail URLs for each OER resource in three sizes (high, medium, small).

1. **Privacy**: Thumbnails are fetched server-side — external image servers never see the user's IP address.
2. **CORS Workaround**: Most image providers do not allow cross-origin requests from browsers. Imgproxy serves images with proper CORS headers.
3. **Thumbnail Generation**: Instead of storing multiple thumbnail sizes, imgproxy generates resized images on-the-fly, reducing storage requirements while improving load times.

| Variable | Default | Description |
|----------|---------|-------------|
| `IMGPROXY_BASE_URL` | - | Base URL for imgproxy service (e.g., `http://localhost:8080`) |
| `IMGPROXY_KEY` | - | Hex-encoded key for signed URLs (optional) |
| `IMGPROXY_SALT` | - | Hex-encoded salt for signed URLs (optional) |

**Modes**:
- **Disabled**: Leave `IMGPROXY_BASE_URL` empty. API responses will not include proxied URLs.
- **Insecure**: Set only `IMGPROXY_BASE_URL`. URLs are generated without signatures.
- **Secure**: Set all three variables. URLs are signed with HMAC-SHA256.

**SSRF hardening**: imgproxy fetches arbitrary source URLs server-side. While imgproxy has built-in loopback protections, [past CVEs have shown bypasses](https://github.com/imgproxy/imgproxy/security/advisories/GHSA-j2hp-6m75-v4j4). To mitigate SSRF risks:
1. **Set `ASSET_PROXY_ALLOWED_DOMAINS`** — the aggregator applies this allowlist *before* any URL reaches imgproxy, blocking URLs to non-allowlisted domains at the application layer.
2. **Network isolation** — run imgproxy in a network segment that cannot reach internal services (e.g. cloud metadata endpoints, databases, admin interfaces). In Docker Compose, use a dedicated network with no access to internal services.
3. **Keep imgproxy updated** — patches close known bypasses.
4. **Use URL signing** — prevents attackers from crafting arbitrary imgproxy URLs.

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

As a lightweight alternative to imgproxy, the aggregator can sign asset URLs with HMAC-SHA256. When configured, the API returns redirect URLs (`/api/v1/assets/:signature?url=...&exp=...`) instead of direct source URLs. The redirect endpoint verifies the signature and expiration, sets security headers (`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`), and issues a `302` redirect to the original URL.

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

#### Asset Proxy Security

| Variable | Default | Description |
|----------|---------|-------------|
| `ASSET_PROXY_TIMEOUT_MS` | `15000` | Per-asset proxy fetch timeout in ms (range 1000–30000) |
| `ASSET_PROXY_ALLOWED_DOMAINS` | - | Comma-separated domain allowlist for asset proxy (empty = allow all). Subdomains are matched automatically |

When the aggregator fetches assets on behalf of clients, these settings control timeouts and restrict which external domains are allowed. Setting `ASSET_PROXY_ALLOWED_DOMAINS` is **strongly recommended** in production to prevent the server from being used to probe internal network resources (SSRF).

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
