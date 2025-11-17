# Architecture

## Overview

The Nostr OER Finder consists of two main components:

1. **Aggregator Service**: Listens to configurable Nostr relays for OER image resources, collects them, and exposes them via a public API
2. **JavaScript Plugin**: Connects to the API and simplifies integration of OER images into applications

## OER Resource Database Schema

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

## Multi-Relay Support

Connect to multiple Nostr relays simultaneously for improved resilience and data coverage.

**Features**:
- **Sequential Connection**: Relays connect one after another during startup
- **Independent Lifecycle**: Each relay maintains its own connection and subscription
- **Automatic Reconnection**: Failed relays automatically reconnect without affecting others
- **Event Deduplication**: Database constraints prevent duplicate events from multiple relays

## Related Projects

- [nostream](https://github.com/cameri/nostream) - Self-hostable Nostr relay written in TypeScript
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) - Tools for developing Nostr clients
- [nak](https://github.com/fiatjaf/nak) - CLI tool for Nostr events
- [Lumina](https://github.com/lumina-rocks/lumina) - Image-first social media client for Nostr
- [imgproxy](https://github.com/imgproxy/imgproxy) - Fast image resizing service without local thumbnail storage
