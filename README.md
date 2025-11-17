# Nostr OER Finder - Aggregator and Plugin

An Open Educational Resources (OER) discovery system built on Nostr, providing:

1. **Aggregator Service**: Listens to configurable Nostr relays for OER image resources, collects them, and exposes them via a public API
2. **JavaScript Packages**: Type-safe API client and web components for integrating OER resources into applications

## Quick Start

### Server Setup

```bash
# 1. Build and start services
docker compose build
docker compose up -d --force-recreate

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Initialize database
docker compose exec postgres createdb -U postgres oer-aggregator-dev

# 4. Run the application
pnpm start:dev
```

The API will be available at `http://localhost:3000` with interactive documentation at `http://localhost:3000/api-docs`.

**📚 [Full Server Setup Guide](./docs/server-setup.md)** - Detailed installation, configuration, and development instructions

### Using the Client Packages

#### API Client (TypeScript)

```bash
npm install github:edufeed-org/oer-finder-plugin#packages/api-client
```

```typescript
import { createOerClient } from '@oer-aggregator/api-client';

const client = createOerClient('http://localhost:3000');
const { data, error } = await client.GET('/api/v1/oer', {
  params: { query: { page: 1, pageSize: 10 } }
});
```

#### Web Components Plugin

```bash
npm install github:edufeed-org/oer-finder-plugin#packages/oer-finder-plugin
```

```html
<oer-search api-url="http://localhost:3000"></oer-search>
<oer-list></oer-list>
```

**Customize colors with CSS:**

```html
<style>
  oer-search, oer-list, oer-card {
    --primary-color: #8b5cf6;
    --primary-hover-color: #7c3aed;
    --secondary-color: #ec4899;
  }
</style>

<oer-search api-url="http://localhost:3000"></oer-search>
<oer-list></oer-list>
```

**📚 [Full Client Package Guide](./docs/client-packages.md)** - Installation, usage examples, and API reference

## Documentation

### Getting Started
- **[Server Setup](./docs/server-setup.md)** - Installation, configuration, development, and testing
- **[Client Packages](./docs/client-packages.md)** - API client and web components usage

### Architecture & Design
- **[Architecture](./docs/architecture.md)** - System architecture and database schema
- **[Design Principles](./docs/design.md)** - Design philosophy and requirements
- **[Nostr Events](./docs/nostr-events.md)** - Event types, examples, and processing

## Features

- 🔌 **Multi-Relay Support** - Connect to multiple Nostr relays simultaneously
- 🔍 **Advanced Search** - Filter by license, educational level, audience, and more
- 📦 **Type-Safe Client** - Auto-generated TypeScript client from OpenAPI spec
- 🎨 **Web Components** - Ready-to-use UI components built with Lit
- 🗄️ **PostgreSQL Storage** - Efficient querying with indexed fields
- 🔄 **Event Management** - Automatic handling of updates and deletions per Nostr specs

## API Example

```bash
# Get all OER resources
curl http://localhost:3000/api/v1/oer

# Search by license
curl "http://localhost:3000/api/v1/oer?license=https://creativecommons.org/licenses/by-sa/4.0/"

# Filter by educational level
curl "http://localhost:3000/api/v1/oer?educationalLevel=https://w3id.org/kim/educationalLevel/level_A"
```

## Development

```bash
# Run tests
pnpm test

# Run lints and formatting
pnpm lint
pnpm format

# Type check and build
pnpm build
```

See [Server Setup Guide](./docs/server-setup.md#development) for detailed development instructions.

## License

Main project: MIT
The oer-finder-plugin makes use of lit which is licensed under BSD-3.
