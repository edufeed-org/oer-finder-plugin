# Project Context

## Purpose
This project implements an OER (Open Educational Resources) aggregator that connects to Nostr relays to ingest educational content events. It extracts OER metadata from Nostr events and stores them in PostgreSQL, providing a public REST API for searching and filtering educational resources. The system is designed for production deployment with comprehensive security hardening.

The project is running inside a Docker container.

## Specification
The complete system specification is maintained in a single file: `openspec/spec.md`

This specification describes what the application does and how it behaves, focusing on:
- Relay connection and event ingestion
- OER metadata extraction and storage
- Public REST API for searching resources
- Security hardening and rate limiting
- Database performance optimization

## Tech Stack
- Node.js
- NestJS (TypeScript framework)
- PostgreSQL (data storage)
- Nostr (nostr-tools npm package)
- TypeScript (strict mode)
- Valibot (validation)

## Project Conventions

### Code Style
The project is written in TypeScript with strict mode enabled, without use of the `any` type. Linting and formatting follow best practices using ESLint and Prettier.

### Architecture Patterns
The architecture is modularized into use-case driven modules following NestJS conventions.

### Testing Strategy
The code is properly unit tested using frameworks popular with NestJS (Jest).

### Git Workflow
AI assistants do not commit to git.

## Domain Context

This application focuses on Open Educational Resources distributed via the Nostr protocol using:
- Kind 30142 events (AMB - A Metadata Bundle) for educational content metadata
- Kind 1063 events (File Metadata) for file information
- LRMI (Learning Resource Metadata Initiative) vocabularies for educational classification

## Important Constraints

- The application is read-only from an API perspective (no write endpoints)
- All Nostr events are validated cryptographically before storage
- The system maintains one OER record per URL, keeping the most recent version
- Rate limiting is enforced per IP address to prevent abuse

## External Dependencies

- PostgreSQL database for persistent storage
- One or more Nostr relays for event ingestion
- Network connectivity for relay connections
