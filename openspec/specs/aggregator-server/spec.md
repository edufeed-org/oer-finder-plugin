# OER Proxy System Specification

## Purpose
This application provides a proxy for Open Educational Resources (OER) from multiple sources. It forwards search queries to configured source adapters (AMB Nostr relay, Openverse, ARASAAC, RPI-Virtuell) and returns unified results via a public REST API. The system is designed for production deployment with comprehensive security hardening.

## Requirements

### Requirement: Application Foundation
The application MUST provide a production-ready HTTP server with proper configuration management, code quality tools, and environment validation.

#### Scenario: Start the application
- **GIVEN** the application is configured
- **WHEN** the server starts
- **THEN** the HTTP server boots successfully
- **AND** all configuration is loaded and validated
- **AND** invalid configuration prevents startup with clear error messages

#### Scenario: Environment configuration
- **GIVEN** environment variables are provided
- **WHEN** the application initializes
- **THEN** all settings are validated against expected types
- **AND** default values are used for optional settings
- **AND** configuration includes application port, adapter settings, and security settings

#### Scenario: Code quality checks
- **GIVEN** the codebase exists
- **WHEN** linting and formatting commands run
- **THEN** all code passes linting rules
- **AND** all code is properly formatted

### Requirement: Source Adapter System
The application MUST support a pluggable adapter system that routes search queries to configured OER sources.

#### Scenario: Configure enabled adapters
- **GIVEN** adapter IDs are provided via the ENABLED_ADAPTERS environment variable
- **WHEN** the application starts
- **THEN** only the specified adapters are loaded and registered
- **AND** unknown adapter IDs are logged as warnings
- **AND** at least one adapter must be enabled for the API to function

#### Scenario: Route queries to adapters
- **GIVEN** a search request includes a `source` parameter
- **WHEN** the request is processed
- **THEN** the query is routed to the matching adapter
- **AND** the adapter queries its external source
- **AND** results are returned in a unified format

#### Scenario: Handle adapter timeouts
- **GIVEN** an adapter is querying an external source
- **WHEN** the request exceeds the configured timeout (ADAPTER_TIMEOUT_MS)
- **THEN** the request is aborted
- **AND** an error is returned to the client
- **AND** the timeout is logged

#### Scenario: Handle adapter errors
- **GIVEN** an adapter encounters an error from its external source
- **WHEN** the error occurs
- **THEN** the error is logged with adapter context
- **AND** an appropriate error response is returned to the client
- **AND** other adapters are not affected

### Requirement: Public REST API for OER Search
The application MUST provide a public HTTP API at `/api/v1/oer` that returns paginated OER results from configured source adapters.

#### Scenario: Retrieve paginated OER list
- **GIVEN** the API is available
- **WHEN** a GET request is made to `/api/v1/oer` with a `source` parameter
- **THEN** a paginated list of OER is returned with status 200
- **AND** each OER includes AMB metadata and extension fields
- **AND** response includes pagination info: current page, page size, total count, and total pages

#### Scenario: Configure pagination
- **GIVEN** the API endpoint is called
- **WHEN** page and pageSize parameters are provided
- **THEN** results are paginated according to the parameters
- **AND** page must be >= 1
- **AND** pageSize must be between 1 and 20
- **AND** default pageSize is 20 when not specified

#### Scenario: Filter by resource type
- **GIVEN** a type filter is applied
- **WHEN** the query is forwarded to the adapter
- **THEN** only resources matching the type are returned
- **AND** matching behavior depends on the adapter implementation

#### Scenario: Filter by searchTerm
- **GIVEN** a searchTerm filter is applied
- **WHEN** the query is forwarded to the adapter
- **THEN** resources matching the search term are returned
- **AND** matching behavior depends on the adapter implementation

#### Scenario: Filter by educational level
- **GIVEN** an educational_level filter is applied
- **WHEN** the query is forwarded to the adapter
- **THEN** resources matching the educational level are returned

#### Scenario: Filter by language
- **GIVEN** a language filter is applied
- **WHEN** the query is forwarded to the adapter
- **THEN** resources containing that language code are returned
- **AND** invalid language code format is rejected (must be 2-3 lowercase letters)

#### Scenario: Filter by license
- **GIVEN** a license filter is applied
- **WHEN** the query is forwarded to the adapter
- **THEN** resources matching the license are returned

#### Scenario: Validate query parameters
- **GIVEN** the API receives a request
- **WHEN** query parameters are invalid
- **THEN** a 400 Bad Request response is returned
- **AND** the error message describes the validation failure
- **AND** detailed errors are shown in development mode
- **AND** generic errors are shown in production mode

### Requirement: Rate Limiting for API Protection
The application MUST limit the number of API requests per IP address to prevent abuse and ensure fair resource usage.

#### Scenario: Track requests per IP address
- **GIVEN** multiple clients are making requests
- **WHEN** requests are received
- **THEN** each IP address has an independent rate limit counter
- **AND** one IP reaching the limit does not affect other IPs

#### Scenario: Allow requests within limit
- **GIVEN** a client IP is under the rate limit
- **WHEN** a request is made
- **THEN** the request is processed normally with 200 response
- **AND** rate limit headers show remaining quota

#### Scenario: Block excessive requests
- **GIVEN** a client IP has exceeded the rate limit (default: 10 requests per minute)
- **WHEN** another request is made
- **THEN** the request is rejected with 429 Too Many Requests
- **AND** a Retry-After header indicates when to retry
- **AND** the client is blocked for the configured duration (default: 60 seconds)

#### Scenario: Reset rate limit after time window
- **GIVEN** a client was rate limited
- **WHEN** the time window expires
- **THEN** the client's quota is reset
- **AND** new requests are accepted normally

#### Scenario: Configure rate limits
- **GIVEN** the application is deployed
- **WHEN** rate limit environment variables are set
- **THEN** the limits are applied as configured
- **AND** defaults are: 10 requests per 60 seconds, 60 second block duration

### Requirement: Security Hardening
The application MUST implement security best practices including security headers, CORS configuration, and protection against common vulnerabilities.

#### Scenario: Apply security headers
- **GIVEN** the application is running
- **WHEN** any API request is made
- **THEN** security headers are included in the response
- **AND** headers prevent clickjacking, MIME sniffing, and XSS attacks
- **AND** headers enforce HTTPS in production and limit referrer information

#### Scenario: Configure CORS for public API
- **GIVEN** the API is public and read-only
- **WHEN** a cross-origin request is made
- **THEN** CORS allows all origins
- **AND** only GET, HEAD, and OPTIONS methods are allowed
- **AND** credentials (cookies, auth headers) are disabled
- **AND** standard content headers are allowed

#### Scenario: Protect sensitive information in production
- **GIVEN** the application is running in production
- **WHEN** errors occur
- **THEN** detailed error messages are not exposed to clients
- **AND** generic error messages are returned
- **AND** detailed errors are logged server-side

#### Scenario: Provide detailed errors in development
- **GIVEN** the application is running in development
- **WHEN** errors occur
- **THEN** detailed error messages are returned to clients
- **AND** developers can inspect full error details
