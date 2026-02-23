# Design Principles and Requirements

## Requirements

- **Simple Setup**: Easy deployment leveraging Docker best practices
- **API Design**: Intuitive, RESTful APIs following best practices
- **Search Capabilities**: Support multiple search categories including type, searchTerm, license, educational level, language, etc.
- **Configurable Sources**: Source adapter configuration via environment variables
- **Image Sizes**: Support for multiple image sizes (original, thumbnail, medium) via imgproxy
- **Extensibility**: Easy to add new OER source adapters

## Design Principles

**Simplicity over Complexity**: Focus on the use case with pragmatic implementations
- Stateless proxy architecture - no local database required
- All search queries are forwarded to source adapters
- Prioritize maintainable, readable code over premature optimization

**Adapter-Based Architecture**: Each OER source is implemented as a separate adapter package
- Adapters implement a common interface (`SourceAdapter`)
- New sources can be added without modifying the core proxy
- Each adapter handles its own source-specific logic (API calls, data mapping)

## Future Enhancements

- **Additional Sources**: Add more OER source adapters as they become available
- **Content Moderation**: Leverage AMB relay moderation features for quality control
