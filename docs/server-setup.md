# Server Setup and Development

This guide covers installing, configuring, and developing the OER Aggregator server.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (recommended for PostgreSQL and local Nostr relay)
- **OR** PostgreSQL database and access to a Nostr relay

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

# Edit .env with your database, relay, and application settings
```

See the [Configuration](#configuration) section for details on available variables.

### 3. Initialize Databases

```bash
# Create the development database
docker compose exec postgres createdb -U postgres oer-aggregator-dev

# Create the test database (required for running tests)
docker compose exec postgres createdb -U postgres oer-aggregator-dev-test
```

**Note**: The application automatically creates tables:
- **Development**: Uses TypeORM migrations for schema management
- **Test**: Uses synchronize mode (auto-syncs entities to schema)

### 4. Run the Application

```bash
# Development mode (one-time build)
pnpm start

# Watch mode (auto-reload on changes)
pnpm start:dev

# Production mode
pnpm start:prod
```

The API will be available at `http://localhost:3000` (or the port specified in your `.env` file).

## Configuration

The application uses environment variables for configuration. See `.env.example` for a complete list.

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |

### Nostr Relay Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NOSTR_RELAY_URLS` | - | Comma-separated relay WebSocket URLs (recommended) |
| `NOSTR_RELAY_URL` | `ws://localhost:10547` | Single relay URL (backward compatibility) |

**Multi-Relay Support**: Connect to multiple Nostr relays simultaneously for improved resilience and data coverage.

```bash
# Single relay
NOSTR_RELAY_URLS=wss://relay.example.com

# Multiple relays (comma-separated)
NOSTR_RELAY_URLS=wss://relay1.com,wss://relay2.com,wss://relay3.com
```

**Note**: `NOSTR_RELAY_URLS` takes priority when both variables are set.

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL server host |
| `POSTGRES_PORT` | `5432` | PostgreSQL server port |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DATABASE` | `oer-aggregator-dev` | Database name (auto-suffixed with `-test` in test mode) |
| `POSTGRES_LOGGING` | `false` | Enable TypeORM query logging (for debugging) |

### Source Adapter Configuration

Source adapters extend search results with external OER sources. Adapters are enabled via environment variables and queried in parallel during searches.

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLED_ADAPTERS` | - | Comma-separated list of adapter IDs to enable |
| `ADAPTER_TIMEOUT_MS` | `3000` | Timeout for adapter requests in milliseconds |

**Available Adapters**:

| Adapter ID | Description | Additional Config |
|------------|-------------|-------------------|
| `arasaac` | ARASAAC AAC pictograms (CC BY-NC-SA 4.0) | None required |

**Example configuration**:
```bash
# Enable ARASAAC adapter
ENABLED_ADAPTERS=arasaac

# Increase timeout for slow connections
ADAPTER_TIMEOUT_MS=5000
```

When adapters are enabled:
- The `source` query parameter can be used to select which source to query
- Default (no `source` or `source=nostr`): queries the Nostr database
- With `source=arasaac`: queries only the ARASAAC adapter
- Each response item has a `source` field identifying its origin

### Image Proxy Configuration (imgproxy)

The aggregator supports optional [imgproxy](https://imgproxy.net/) integration for image handling. When configured, the API includes proxy URLs for each OER resource in three sizes (high, medium, small).

#### Why imgproxy?

1. **CORS Workaround**: Most image providers do not allow cross-origin requests from browsers. Imgproxy acts as a proxy, fetching images server-side and serving them with proper CORS headers.
2. **Thumbnail Generation**: Instead of storing multiple thumbnail sizes, imgproxy generates resized images on-the-fly, reducing storage requirements while improving load times.
3. **Bandwidth Optimization**: Serve appropriately sized images based on context (list view vs. detail view).

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

## API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` for interactive OpenAPI documentation.

```

## Development

### Running Tests

**Prerequisites**: The `oer-aggregator-dev-test` database must exist (see [Initialize Databases](#3-initialize-databases)).

Tests run in an isolated environment with a dedicated test database to prevent interference with development data.

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e

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
# Publish a simple test event
docker compose exec nak-relay nak event -k 1 -c "Hello, this is a test message" ws://localhost:10547

# Publish demo OER events
docker compose exec nak-relay sh /data/publish-demo-events.sh
```
