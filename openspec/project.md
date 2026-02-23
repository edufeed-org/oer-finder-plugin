# Project Context

## Purpose
This project implements an OER (Open Educational Resources) proxy that forwards search queries to configurable source adapters and returns unified results via a public REST API. Supported sources include AMB Nostr relays, Openverse, ARASAAC, and RPI-Virtuell. The adapter system is extensible, making it easy to add new OER sources.

The project is running inside a Docker container.

## Specification
The complete system specification is maintained in a single file: `openspec/spec.md`

This specification describes what the application does and how it behaves, focusing on:
- Source adapter system for querying external OER sources
- Public REST API for searching resources
- Security hardening and rate limiting
- Image proxy integration

## Tech Stack
- Node.js
- NestJS (TypeScript framework)
- Nostr (nostr-tools npm package, via AMB relay adapter)
- TypeScript (strict mode)
- Valibot (validation)

## Project Conventions

### Code Style
The project is written in TypeScript with strict mode enabled, without use of the `any` type. Linting and formatting follow best practices using ESLint and Prettier.

### Architecture Patterns
The architecture is modularized into use-case driven modules following NestJS conventions. All OER queries are routed through source adapters.

### Testing Strategy
The code is properly unit tested using frameworks popular with NestJS (Jest).

### Git Workflow
AI assistants do not commit to git.

## Domain Context

This application focuses on Open Educational Resources with support for:
- Kind 30142 events (AMB - A Metadata Bundle) for educational content metadata via AMB relay
- LRMI (Learning Resource Metadata Initiative) vocabularies for educational classification
- External OER sources (Openverse, ARASAAC, RPI-Virtuell) via adapter system

## Important Constraints

- The application is read-only from an API perspective (no write endpoints)
- The proxy is stateless - it does not store OER data locally
- All queries are forwarded to the appropriate source adapter
- Rate limiting is enforced per IP address to prevent abuse

## External Dependencies

- AMB Nostr relay (for nostr-amb-relay adapter)
- Typesense (backing store for AMB relay)
- External OER APIs (Openverse, ARASAAC, RPI-Virtuell)
- Network connectivity for adapter communication
