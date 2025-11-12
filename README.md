# Nostr OER Finder - Aggregator and Plugin

An Open Educational Resources (OER) discovery system built on Nostr, providing:

1. **Aggregator Service**: Listens to configurable Nostr relays for OER image resources, collects them, and exposes them via a public API
2. **JavaScript Plugin**: Connects to the API and simplifies integration of OER images into applications

## Requirements

- **Throughput & Performance**: While social networks typically have high event throughput, OER distribution is expected to be sporadic even across many relays. Events are filtered to store only relevant resources.
- **Simple Setup**: Easy deployment leveraging Docker best practices
- **API Design**: Intuitive, RESTful APIs following best practices
- **Search Capabilities**: Support multiple search categories including level, categories, name, license, dimensions, etc.
- **Configurable Relays**: Relay configuration via environment variables; optional admin interface for future enhancement
- **Image Sizes**: Support for multiple image sizes (original, thumbnail, medium) for optimal delivery
- **Event Management**: Support for event updates and deletions per Nostr specifications

## Design Principles

**Simplicity over Complexity**: Focus on the use case with pragmatic implementations
- Avoid job schedulers when possible - they add complexity despite being robust
- Use a single database (PostgreSQL) instead of multiple persistence layers (Redis, in-memory stores, etc.)
- Prioritize maintainable, readable code over premature optimization

## Data Model and Architecture

### Nostr Event Types

The system uses two complementary Nostr event types to represent OER resources:

#### 1. EduFeed Metadata Event (kind 30142) - **Required**
Educational metadata based on the [EduFeed NIP](https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md) and [AMB Data Model](https://dini-ag-kim.github.io/amb/latest/). Contains:
- Educational metadata (learning resource type, audience, educational level)
- Licensing information (license URI, accessibility)
- Descriptive metadata (name, description, keywords, language)
- Temporal metadata (creation, publication, modification dates)
- Reference to the associated file metadata event (if available)

#### 2. File Metadata Event (kind 1063 - NIP-94) - **Optional**
Technical file metadata following [NIP-94](https://nips.nostr.com/94). Contains:
- File URL and MIME type
- File size and dimensions
- Alt text and summary

**Event Relationship**: The AMB metadata event (30142) references the file metadata event (1063) via an `e` tag. Both events reference the same resource URL via their respective identifier tags. Images are never transmitted directly; only URL references are stored.

**Listening Strategy**: The aggregator subscribes to both event kinds (30142 and 1063) to ensure complete metadata collection. The file metadata event is optional but recommended for complete resource information.

### Nostr Event Examples for an Image

AMB Metadata Event:
```
{
  "kind": 30142,
  "id": "...",
  "pubkey": "...",
  "created_at": ...,
  "tags": [
    ["d", "https://link-to-image"],
    ["e", "<event-id-of-file-event>", "<relay-hint>"],
    ["type", "LearningResource"],
    ["type", "Image"],
    ["name", "Bug"],
    ["description", "A big bug"],
    ["dateCreated", "2025-11-03"],
    ["datePublished", "2025-11-11"],
    ["learningResourceType:id", "https://w3id.org/kim/hcrt/image"],
    ["learningResourceType:prefLabel:de", "Abbildung"],
    ["learningResourceType:prefLabel:en", "Image"],
    ["inLanguage", "en"],
    ["license:id", "https://creativecommons.org/licenses/by-sa/4.0/"],
    ["isAccessibleForFree", "true"],
    ...
  ],
  "content": "",
  "sig": "..."
}
```

Optional: File Meta Data Event
```
{
  "kind": 1063,
  "tags": [
    ["url","https://link-to-image"],
    ["m", "image/jpeg"],
    ["size", "23995858"],
    ["dim", "1092"],
    ["summary", "A bug"],
    ["alt", "A bug"],
    ...
  ],
  "content": "...",
  // other fields...
}
```

### Event Processing

Events may arrive in any order and are processed independently:

- **AMB Event Received First**: Creates an OER resource entry; file metadata can be added later when the file event arrives
- **File Event Received First**: Stored for later association when the corresponding AMB event arrives
- **Missing File Events**: The file metadata event is optional; resources remain valid without it

**Update Mechanism**: Resources are updated when a new AMB event with the same identifier (`d` tag) is received. The system uses the event's `created_at` timestamp to ensure only newer versions replace existing data.

**Delete Mechanism**: Deletions follow [NIP-09](https://nips.nostr.com/9). Delete events remove the corresponding OER resource from the database.

**Out of Scope**: NIP-32 (labeling) is currently not implemented but may be added for spam/content moderation in the future.

### Event Storage

All Nostr events (kinds 30142, 1063, and deletion events) are stored in the `nostr_events` table with:
- Complete raw event data (JSONB format)
- Indexed fields for efficient querying (event ID, kind, pubkey, created_at)
- Source relay URL for traceability
- Ingestion timestamp for auditing

Events are retained until explicitly deleted via NIP-09 deletion events.

### OER Resource Database Schema

The `open_educational_resources` table stores processed OER data with denormalized fields for efficient querying. Complete AMB metadata is preserved in JSONB format, while frequently queried fields are extracted and indexed.

| Field | Type | Indexed | Source | Description |
|-------|------|---------|--------|-------------|
| `id` | UUID | PK | System | Auto-generated primary key |
| `url` | Text | Unique | Both | Resource URL (from `d` tag or file URL) |
| **Educational Metadata** |
| `amb_metadata` | JSONB | - | AMB Event | Complete AMB metadata in structured format |
| `amb_keywords` | JSONB Array | - | AMB Event | Searchable keywords/tags |
| `amb_description` | Text | - | AMB Event | Resource description |
| `audience_uri` | Text | Yes | AMB Event | Target audience URI (e.g., educators, students) |
| `educational_level_uri` | Text | Yes | AMB Event | Educational level URI (e.g., K-12, higher ed) |
| **Licensing** |
| `amb_license_uri` | Text | Yes | AMB Event | License identifier (e.g., CC-BY-SA-4.0) |
| `amb_free_to_use` | Boolean | Yes | AMB Event | Accessibility flag |
| **File Metadata** |
| `file_mime_type` | Text | Yes | File Event | MIME type (e.g., `image/jpeg`) |
| `file_dim` | Text | - | File Event | Image dimensions (e.g., `1920x1080`) |
| `file_size` | BigInt | - | File Event | File size in bytes |
| `file_alt` | Text | - | File Event | Alternative text for accessibility |
| **Temporal Data** |
| `amb_date_created` | Timestamp | Yes | AMB Event | Resource creation date |
| `amb_date_published` | Timestamp | Yes | AMB Event | Publication date |
| `amb_date_modified` | Timestamp | Yes | AMB Event | Last modification date (for update tracking) |
| **Event References** |
| `event_amb_id` | Text | Yes, FK | System | Foreign key to AMB event in `nostr_events` |
| `event_file_id` | Text | Yes, FK | System | Foreign key to file event in `nostr_events` (nullable) |
| **System Fields** |
| `created_at` | Timestamp | Yes | System | Record creation timestamp |
| `updated_at` | Timestamp | - | System | Last update timestamp |

**Design Rationale**:
- **Denormalization**: Frequently queried fields are extracted from events for indexing, enabling fast searches by license, level, audience, and dates
- **JSONB Storage**: Complete AMB metadata is preserved to avoid data loss and support future query needs without schema changes
- **Author Handling**: Author data remains in JSONB to avoid normalization complexity when author information changes across event versions

## API docs

See http://localhost:3000/api-docs for openapi documentation

## Related Projects

- [nostream](https://github.com/cameri/nostream) - Self-hostable Nostr relay written in TypeScript
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [Lumina](https://github.com/lumina-rocks/lumina) - Image-first social media client for Nostr
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage

## Future Enhancements

- **Content Moderation**: Implement NIP-32 labeling for spam detection, licensing issues, and inappropriate content
- **Current Approach**: Use trustworthy relays with built-in moderation; respond to deletion requests as needed


## Development

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (recommended for PostgreSQL and local Nostr relay)
- **OR** PostgreSQL database and access to a Nostr relay

### Project Setup

#### 1. Build and Start Services

```bash
# Standard build
docker compose build
docker compose up -d --force-recreate

# OR use development compose file to customize build
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
```

#### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database, relay, and application settings
```

See the [Configuration](#configuration) section for details on available variables.

#### 3. Initialize Databases

```bash
# Create the development database
docker compose exec postgres createdb -U postgres oer-aggregator-dev

# Create the test database (required for running tests)
docker compose exec postgres createdb -U postgres oer-aggregator-dev-test
```

**Note**: The application automatically creates tables:
- **Development**: Uses TypeORM migrations for schema management
- **Test**: Uses synchronize mode (auto-syncs entities to schema)

### Running the Application

```bash
# Development mode (one-time build)
pnpm start

# Watch mode (auto-reload on changes)
pnpm start:dev

# Production mode
pnpm start:prod
```

### Testing

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

### Configuration

The application uses environment variables for configuration. See `.env.example` for a complete list.

#### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |

#### Nostr Relay Configuration

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

**Features**:
- **Sequential Connection**: Relays connect one after another during startup
- **Independent Lifecycle**: Each relay maintains its own connection and subscription
- **Automatic Reconnection**: Failed relays automatically reconnect without affecting others
- **Event Deduplication**: Database constraints prevent duplicate events from multiple relays

**Note**: `NOSTR_RELAY_URLS` takes priority when both variables are set.

#### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL server host |
| `POSTGRES_PORT` | `5432` | PostgreSQL server port |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DATABASE` | `oer-aggregator-dev` | Database name (auto-suffixed with `-test` in test mode) |
| `POSTGRES_LOGGING` | `false` | Enable TypeORM query logging (for debugging) |