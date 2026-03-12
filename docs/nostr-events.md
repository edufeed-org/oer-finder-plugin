# Nostr Event Types

## Nostr Event Types

The system uses Nostr events following the AMB (A Metadata Bundle) format to represent OER resources. The aggregator subscribes to AMB relays via WebSocket, ingests these events, and stores them in a local PostgreSQL database for fast querying.

### EduFeed Metadata Event (kind 30142)
Educational metadata based on the [EduFeed NIP](https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md) and [AMB Data Model](https://dini-ag-kim.github.io/amb/latest/). Contains:
- Educational metadata (learning resource type, audience, educational level)
- Licensing information (license URI, accessibility)
- Descriptive metadata (name, description, keywords, language)
- Temporal metadata (creation, publication, modification dates)
- Important: It is expected that the url to the image is the final image resource, not a front page protecting the image

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

## How the Aggregator Uses These Events

The aggregator subscribes to one or more AMB Nostr relays via WebSocket and ingests events directly into a PostgreSQL database. The ingestion pipeline:

1. Validates Schnorr signatures on incoming events
2. Stores raw events as `OerSource` records
3. Extracts structured `OpenEducationalResource` records from kind 30142 AMB events
4. Links file metadata from kind 1063 events
5. Processes deletions from kind 5 events
6. Supports incremental sync resume on reconnect via per-relay timestamp tracking

When a client queries with `source=nostr`, the aggregator searches the local database directly for fast results.

## Publishing Events

Events can be published to AMB relays using tools like [nak](https://github.com/fiatjaf/nak):

```bash
# Publish a learning resource event
docker compose run --rm nak event -k 30142 \
  -c "A custom learning resource description" \
  -t "d=my-unique-resource-id" \
  -t "type=LearningResource" \
  -t "name=My Custom Resource" \
  -t "license:id=https://creativecommons.org/licenses/by-sa/4.0/" \
  -t "inLanguage=en" \
  ws://amb-relay:3334
```

## Related Standards

- [NIP-94](https://nips.nostr.com/94) - File Metadata (kind 1063)
- [NIP-09](https://nips.nostr.com/9) - Event Deletion
- [AMB Data Model](https://dini-ag-kim.github.io/amb/latest/) - Educational metadata standard
- [LRMI](https://www.dublincore.org/specifications/lrmi/) - Learning Resource Metadata Initiative
