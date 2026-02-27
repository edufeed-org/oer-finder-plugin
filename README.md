# Nostr OER Finder - Proxy and Plugin

<p align="center">
  <img src="./docs/images/oer-finder-plugin-logo.png" width=250 />
</p>
An Open Educational Resources (OER) discovery system built on Nostr, providing:

1. **Proxy Service**: Forwards search queries to configurable source adapters and returns unified OER results via a public API. Supports searching an AMB Nostr relay, Openverse, ARASAAC, RPI-Virtuell, and more through an **extendable adapter system** - add your own adapters to integrate any external API.
2. **Source Adapters**: Pluggable adapters for OER sources (e.g., AMB relay, ARASAAC, Openverse) that integrate seamlessly with search results. The adapter plugin system makes it easy to add new sources.
3. **JavaScript Packages**: Type-safe API client and web components for integrating OER resources into applications
4. **Aggregation of Nostr Events though Nostr AMB Relay**: The Aggregation of events is done in a separate [AMB Relay based on TypeSense](https://github.com/edufeed-org/amb-relay) that is integrated via a before mentioned adapter.

**Motivation**: Instead of configuring for each new educational app new OER sources, this project aims to offer a meta search with reusable web components. The idea is to make it as easy as possible to install a OER search component in any Javascript application with multiple sources preconfigured. The main idea started to listen for OER Nostr events. But as this network must be estabilished first, additional sources were introduced.

## Demo of the configurable Web Components
<img src="./docs/images/oer-finder-plugin-example.png" width=750/>
The screenshot shows an example of using Openverse as a OER source for the keyword "car".

## Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         Your Application                          │
│  ┌────────────────────────┐    ┌────────────────────────────────┐ │
│  │   oer-finder-plugin    │    │     oer-finder-api-client      │ │
│  │    (Web Components)    │    │      (TypeScript Client)       │ │
│  └───────────┬────────────┘    └────────────────┬───────────────┘ │
└──────────────┼──────────────────────────────────┼─────────────────┘
               │                                  │
               └────────────────┬─────────────────┘
                                │ HTTP API
                                ▼
                ┌───────────────────────────────────────────────────┐
                │         Proxy Server (formerly aggregator)        │
                │          (NestJS)                                 │
                └───────────────┬───────────────────────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│   AMB Relay     │   │  Source Adapters │   │      imgproxy       │
│  (Nostr OER)    │   │  (External APIs) │   │    (Image Proxy)    │
└─────────────────┘   └──────────────────┘   └─────────────────────┘
                               │
               ┌───────────────┼───────────────┬───────────────┐
               │               │               │               │
               ▼               ▼               ▼               ▼
          ┌────────┐     ┌──────────┐    ┌──────────────┐ ┌──────────┐
          │ARASAAC │     │ Openverse│    │ RPI-Virtuell │ │Wikimedia │
          └────────┘     └──────────┘    └──────────────┘ └──────────┘
```

## Quick Start

### Development Server Setup

```bash
# 1. Build and start services
docker compose build
docker compose up -d --force-recreate

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Install dependencies
pnpm install

# 4. Run the application
pnpm start:dev
```

> **Note:** This is a pnpm workspace monorepo — the adapter packages must be built before the NestJS server can start. The `start:dev` script handles this automatically via `build:packages`. If you need to build packages manually (e.g. before running `pnpm start:prod`), run `pnpm run build:packages` or `pnpm run build` (which builds both packages and the server).

The API will be available at `http://localhost:3000/api/v1/oer` with interactive documentation at `http://localhost:3000/api-docs`.

**[Full Server Setup Guide](./docs/server-setup.md)** - Detailed installation, configuration, and development instructions

### Production Server Setup

Simply use the already built docker image instead of building it yourself: `docker pull ghcr.io/edufeed-org/oer-finder-plugin`

Docker compose

```yml
services:
  app:
    image: ghcr.io/edufeed-org/oer-finder-plugin
    ...
```

### Using the Client Packages

Please note: This requires a `.npmrc` file in your root folder with the following content:

```bash
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
Then, configure an env variable `GITHUB_TOKEN`.

#### API Client (TypeScript)

```bash
pnpm add @edufeed-org/oer-finder-api-client
```

```typescript
import { createOerClient } from '@edufeed-org/oer-finder-api-client';

const client = createOerClient('http://localhost:3000');
const { data, error } = await client.GET('/api/v1/oer', {
  params: { query: { source: 'nostr-amb-relay', searchTerm: 'plants' } }
});
```

#### Web Components Plugin

```bash
pnpm add @edufeed-org/oer-finder-plugin
```

```html
<oer-search api-url="http://localhost:3000">
  <oer-list></oer-list>
  <oer-load-more></oer-load-more>
</oer-search>
```

**Customize colors with CSS:**

```html
<style>
  oer-search, oer-list, oer-card, oer-load-more {
    --primary-color: #8b5cf6;
    --primary-hover-color: #7c3aed;
    --secondary-color: #ec4899;
  }
</style>

<oer-search api-url="http://localhost:3000">
  <oer-list></oer-list>
  <oer-load-more></oer-load-more>
</oer-search>
```

**[Full Client Package Guide](./docs/client-packages.md)** - Installation, usage examples, and API reference

## Documentation

### Getting Started
- **[Server Setup](./docs/server-setup.md)** - Installation, configuration, development, and testing
- **[Client Packages](./docs/client-packages.md)** - API client and web components usage
- **[Client Packages Examples for Angular](./docs/client-packages-angular.md)** - Web components usage in Angular
- **[Client Packages Examples for Svelte](./docs/client-packages-svelte.md)** - Web components usage in Svelte
- **[Client Packages Examples for React](./docs/client-packages-react.md)** - React component wrappers usage

### Architecture & Design
- **[Architecture](./docs/architecture.md)** - System architecture and adapter system
- **[Design Principles](./docs/design.md)** - Design philosophy and requirements
- **[Nostr Events](./docs/nostr-events.md)** - AMB event types and format
- **[Creating a New Adapter](./docs/creating-a-new-adapter.md)** - Step-by-step guide for building a new source adapter

## Features

- 🔍 **Meta Search** - Query multiple OER sources through a single API
- 🔗 **Source Adapters** - Extend search results with external OER sources (AMB relay, ARASAAC, Openverse, RPI-Virtuell, and more)
- 📦 **Type-Safe Client** - Auto-generated TypeScript client from OpenAPI spec
- 🎨 **Web Components** - Ready-to-use UI components built with Lit
- 🛡️ **Privacy-Aware Asset Proxying** (server-proxy mode) - Implicitly loaded assets (thumbnails in search results) are proxied via imgproxy or HMAC-signed URL redirects, preventing third-party tracking and CORS issues. Explicit actions like viewing original resources remain in the user's or integrator's domain. In direct-client mode, the browser contacts external sources directly and proxying does not apply.
- 🔒 **Rate Limiting** - Per-IP rate limiting for API protection
- 🔌 **Extensible** - Add custom adapters to integrate any external OER API

## API Example

```bash
# Search OER from AMB relay
curl "http://localhost:3000/api/v1/oer?source=nostr-amb-relay&searchTerm=pythagoras"

# Search from Openverse
curl "http://localhost:3000/api/v1/oer?source=openverse&searchTerm=plants&type=image"

# Search from ARASAAC
curl "http://localhost:3000/api/v1/oer?source=arasaac&searchTerm=car"
```

## Development

### Publishing Demo Events

To populate the local AMB relay with sample OER events for development and testing, use the `nak` (Nostr Army Knife) service:

```bash
docker compose run --rm --entrypoint sh nak /data/publish-demo-events.sh
```

This publishes sample Nostr events (kind 30142 learning resources) to the local AMB relay. The events will then be available for the proxy to search via the nostr-amb-relay adapter.

You can also use `nak` directly to publish a custom kind 30142 learning resource event (the AMB relay only accepts kind 30142 events):

```bash
docker compose run --rm nak event -k 30142 \
  -c "A custom learning resource description" \
  -t "d=my-unique-resource-id" \
  -t "type=LearningResource" \
  -t "name=My Custom Resource" \
  -t "license:id=https://creativecommons.org/licenses/by-sa/4.0/" \
  -t "inLanguage=en" \
  ws://amb-relay:3334
```

To query events from the relay directly:

```bash
docker compose run --rm nak req --search "pythagoras" ws://amb-relay:3334
```

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

## Release Process

Before creating a new version on GitHub, don't forget to bump the versions of the client packages. If not changed, the client packages will not get new release candidates. Then, simply create a new release on GitHub.

## License

- MIT
- BSD-3: The oer-finder-plugin makes use of lit, which is licensed under BSD-3

## Example Integrations
- edufeed / kanban-editor: https://github.com/edufeed-org/kanban-editor/pull/38

## Acknowledgements

- **[ARASAAC](https://arasaac.org/)** - Aragonese Portal of Augmentative and Alternative Communication, providing pictograms and resources under Creative Commons license

## Funding
This project is being funded by the BMBSFJ.

Förderkennzeichen: 01PZ25003

<img src="https://github.com/edufeed-org/comcal/raw/main/static/BMBFSFJ.png" width=250 alt="BMBSFJ"/>
