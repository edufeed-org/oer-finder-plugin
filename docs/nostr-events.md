# Nostr Event Types

## Nostr Event Types

The system uses Nostr events following the AMB (A Metadata Bundle) format to represent OER resources. These events are stored on AMB relays and queried by the proxy through the `nostr-amb-relay` adapter.

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

## How the Proxy Uses These Events

The proxy does not ingest or store Nostr events directly. Instead, the `nostr-amb-relay` adapter connects to an AMB relay via WebSocket and performs search queries using Nostr REQ messages. The AMB relay (backed by Typesense) handles full-text search and filtering of kind 30142 events, returning matching results to the proxy for delivery to the client.

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
