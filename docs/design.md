# Design Principles and Requirements

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

## Future Enhancements

- **Content Moderation**: Implement NIP-32 labeling for spam detection, licensing issues, and inappropriate content
- **Current Approach**: Use trustworthy relays with built-in moderation; respond to deletion requests as needed
