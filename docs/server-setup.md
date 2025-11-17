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
