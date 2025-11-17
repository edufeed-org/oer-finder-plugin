# Nostr Event Types and Processing

## Nostr Event Types

The system uses two complementary Nostr event types to represent OER resources:

### 1. EduFeed Metadata Event (kind 30142) - **Required**
Educational metadata based on the [EduFeed NIP](https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md) and [AMB Data Model](https://dini-ag-kim.github.io/amb/latest/). Contains:
- Educational metadata (learning resource type, audience, educational level)
- Licensing information (license URI, accessibility)
- Descriptive metadata (name, description, keywords, language)
- Temporal metadata (creation, publication, modification dates)
- Reference to the associated file metadata event (if available)

### 2. File Metadata Event (kind 1063 - NIP-94) - **Optional**
Technical file metadata following [NIP-94](https://nips.nostr.com/94). Contains:
- File URL and MIME type
- File size and dimensions
- Alt text and summary

**Event Relationship**: The AMB metadata event (30142) references the file metadata event (1063) via an `e` tag. Both events reference the same resource URL via their respective identifier tags. Images are never transmitted directly; only URL references are stored.

**Listening Strategy**: The aggregator subscribes to both event kinds (30142 and 1063) to ensure complete metadata collection. The file metadata event is optional but recommended for complete resource information.

## Nostr Event Examples for an Image

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

## Event Processing

Events may arrive in any order and are processed independently:

- **AMB Event Received First**: Creates an OER resource entry; file metadata can be added later when the file event arrives
- **File Event Received First**: Stored for later association when the corresponding AMB event arrives
- **Missing File Events**: The file metadata event is optional; resources remain valid without it

**Update Mechanism**: Resources are updated when a new AMB event with the same identifier (`d` tag) is received. The system uses the event's `created_at` timestamp to ensure only newer versions replace existing data.

**Delete Mechanism**: Deletions follow [NIP-09](https://nips.nostr.com/9). Delete events remove the corresponding OER resource from the database.

**Out of Scope**: NIP-32 (labeling) is currently not implemented but may be added for spam/content moderation in the future.

## Event Storage

All Nostr events (kinds 30142, 1063, and deletion events) are stored in the `nostr_events` table with:
- Complete raw event data (JSONB format)
- Indexed fields for efficient querying (event ID, kind, pubkey, created_at)
- Source relay URL for traceability
- Ingestion timestamp for auditing

Events are retained until explicitly deleted via NIP-09 deletion events.
