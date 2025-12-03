# OER Aggregator System Specification

## Purpose
This application aggregates Open Educational Resources (OER) from the Nostr network. It connects to multiple Nostr relays, continuously ingests educational content events, extracts and stores OER metadata in a PostgreSQL database, and provides a public REST API for searching and filtering educational resources. The system is designed for production deployment with comprehensive security hardening.

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
- **AND** configuration includes application port, database connection, Nostr relay URLs, and security settings

#### Scenario: Code quality checks
- **GIVEN** the codebase exists
- **WHEN** linting and formatting commands run
- **THEN** all code passes linting rules
- **AND** all code is properly formatted

### Requirement: Connect to Multiple Nostr Relays
The application MUST connect to one or more Nostr relays configured via environment variables and maintain persistent connections with automatic reconnection on failure.

#### Scenario: Configure relay URLs
- **GIVEN** relay URLs are provided as comma-separated list
- **WHEN** the application starts
- **THEN** it connects to all configured relays
- **AND** each relay connection is independent
- **AND** connection failures for one relay do not affect others

#### Scenario: Fallback configuration
- **GIVEN** no relay URLs are configured
- **WHEN** the application starts
- **THEN** it connects to a default local relay at ws://localhost:10547
- **AND** logs indicate the default relay is being used

#### Scenario: Handle relay connection failures
- **GIVEN** a relay is unreachable
- **WHEN** connection attempt fails
- **THEN** the failure is logged with relay details
- **AND** automatic reconnection is scheduled
- **AND** other relays continue operating normally
- **AND** the application remains available

#### Scenario: Automatic reconnection
- **GIVEN** a relay connection has dropped
- **WHEN** the reconnection timer expires
- **THEN** the system attempts to reconnect to that relay
- **AND** successful reconnection resumes event streaming
- **AND** failed reconnection schedules another attempt

### Requirement: Ingest Nostr Events from Relays
The application MUST subscribe to configured relays, receive Nostr events in real-time, validate their cryptographic signatures, and store them in PostgreSQL with deduplication.

#### Scenario: Subscribe to relay on connection
- **GIVEN** a relay connection is established
- **WHEN** the subscription is created
- **THEN** events begin streaming from the relay
- **AND** each relay has an independent subscription
- **AND** subscriptions persist until disconnection

#### Scenario: Resume from last known position
- **GIVEN** the application previously ingested events from a relay
- **WHEN** the application restarts or reconnects
- **THEN** it queries the database for the most recent event timestamp for that relay
- **AND** requests only events newer than that timestamp
- **AND** avoids re-downloading previously seen events

#### Scenario: Validate event signatures
- **GIVEN** an event is received from a relay
- **WHEN** the event is processed
- **THEN** its cryptographic signature is verified
- **AND** valid events are stored in the database
- **AND** invalid events are logged and discarded

#### Scenario: Handle duplicate events
- **GIVEN** the same event is received from multiple relays
- **WHEN** the duplicate is stored
- **THEN** the database prevents duplication by event ID
- **AND** the duplicate is logged but does not cause an error
- **AND** event processing continues normally

#### Scenario: Store events with source relay
- **GIVEN** an event is received and validated
- **WHEN** it is saved to the database
- **THEN** all event data is stored including id, kind, pubkey, created_at, content, tags, and raw JSON
- **AND** the source relay URL is recorded
- **AND** the relay URL enables per-relay tracking and queries

### Requirement: Extract OER Metadata from Educational Events
The application MUST automatically extract OER metadata from kind 30142 (AMB - A Metadata Bundle) Nostr events and store structured information in a dedicated OER table.

#### Scenario: Detect educational content events
- **GIVEN** a Nostr event of kind 30142 is received
- **WHEN** the event is stored in the database
- **THEN** OER extraction is triggered automatically
- **AND** a corresponding OER record is created
- **AND** extraction failures are logged but do not prevent event storage

#### Scenario: Parse nested metadata from tags
- **GIVEN** an AMB event contains colon-separated tags like "learningResourceType:prefLabel:en"
- **WHEN** metadata is extracted
- **THEN** the tag structure is transformed into fully nested JSON
- **AND** all levels of nesting are preserved
- **AND** the nested JSON is stored in the amb_metadata field

#### Scenario: Extract license information
- **GIVEN** an AMB event contains license tags
- **WHEN** OER extraction occurs
- **THEN** the license URI is extracted and stored
- **AND** the free-to-use status is extracted as a boolean
- **AND** missing license information results in null values

#### Scenario: Extract keywords
- **GIVEN** an AMB event contains keyword tags
- **WHEN** OER extraction occurs
- **THEN** all keywords are collected into a JSON array
- **AND** the array is stored in the keywords field

#### Scenario: Normalize language metadata
- **GIVEN** an AMB event contains inLanguage metadata
- **WHEN** OER extraction occurs
- **THEN** inLanguage is always stored as an array in the metadata
- **AND** single language values like "en" are converted to ["en"]
- **AND** existing arrays are preserved as-is
- **AND** missing or empty language values are omitted from metadata

#### Scenario: Extract date fields
- **GIVEN** an AMB event contains dateCreated, datePublished, or dateModified tags
- **WHEN** OER extraction occurs
- **THEN** all date values are parsed into timestamps
- **AND** timestamps support ISO 8601 formats
- **AND** invalid or missing dates result in null values

#### Scenario: Extract educational metadata
- **GIVEN** an AMB event contains educational level or audience metadata
- **WHEN** OER extraction occurs
- **THEN** educational level URI is extracted and stored
- **AND** audience URI is extracted and stored
- **AND** URIs enable efficient filtering by education level or target audience

#### Scenario: Ensure one OER per URL
- **GIVEN** an OER with a specific URL already exists
- **WHEN** a new AMB event for the same URL is received
- **THEN** the system compares dates (dateCreated, datePublished, dateModified)
- **AND** keeps the OER with the most recent date
- **AND** updates the existing record if the new event is newer
- **AND** skips update if the new event is older or has no dates
- **AND** only one OER record exists per URL

#### Scenario: Handle missing or partial metadata
- **GIVEN** an AMB event has minimal or malformed metadata
- **WHEN** OER extraction occurs
- **THEN** the OER record is created with available fields
- **AND** missing fields are set to null
- **AND** extraction warnings are logged
- **AND** the process does not fail

### Requirement: Process Historical Educational Events
The application MUST identify and process AMB events that were ingested before OER extraction was available or that failed to process.

#### Scenario: Detect end of stored events
- **GIVEN** a relay subscription is active
- **WHEN** the relay signals EOSE (End of Stored Events)
- **THEN** the application searches for unprocessed AMB events
- **AND** processes any events that lack corresponding OER records

#### Scenario: Batch process historical events
- **GIVEN** unprocessed AMB events are found
- **WHEN** batch processing begins
- **THEN** each event is processed through OER extraction
- **AND** the number of processed events is logged
- **AND** failures are logged but do not stop the batch

#### Scenario: Prevent duplicate processing
- **GIVEN** EOSE has been received once
- **WHEN** EOSE is received again from the same or different relay
- **THEN** historical processing does not run again
- **AND** the system only processes historical events once per lifecycle

### Requirement: Public REST API for OER Search
The application MUST provide a public HTTP API at `/api/v1/oer` that returns paginated OER results with comprehensive filtering capabilities.

#### Scenario: Retrieve paginated OER list
- **GIVEN** the API is available
- **WHEN** a GET request is made to `/api/v1/oer`
- **THEN** a paginated list of OER is returned with status 200
- **AND** each OER includes: id, url, type, license, description, keywords, dates, file metadata, educational metadata, and event references
- **AND** response includes pagination info: current page, page size, and total count

#### Scenario: Configure pagination
- **GIVEN** the API endpoint is called
- **WHEN** page and pageSize parameters are provided
- **THEN** results are paginated according to the parameters
- **AND** page must be >= 1
- **AND** pageSize must be between 1 and 20
- **AND** default pageSize is 20 when not specified

#### Scenario: Filter by resource type
- **GIVEN** OER exist with various MIME types and resource types
- **WHEN** a type filter is applied
- **THEN** both MIME type field and metadata type field are searched
- **AND** matching is case-insensitive and partial (contains)
- **AND** results include all OER matching either field

#### Scenario: Filter by description
- **GIVEN** OER exist with various descriptions
- **WHEN** a description filter is applied
- **THEN** OER with matching descriptions are returned
- **AND** matching is case-insensitive and partial

#### Scenario: Filter by name
- **GIVEN** OER exist with names in their metadata
- **WHEN** a name filter is applied
- **THEN** OER with matching names in metadata are returned
- **AND** matching is case-insensitive and partial

#### Scenario: Filter by searchTerm
- **GIVEN** OER exist with various keywords, names, and descriptions
- **WHEN** a searchTerm filter is applied
- **THEN** OER where the searchTerm matches name, description, or any keyword are returned
- **AND** matching is case-insensitive and partial

#### Scenario: Filter by educational level
- **GIVEN** OER exist with educational level URIs
- **WHEN** an educational_level filter is applied
- **THEN** OER with exact matching educational level URI are returned
- **AND** matching is exact and case-sensitive (URI matching)

#### Scenario: Filter by language
- **GIVEN** OER exist with language codes in metadata
- **WHEN** a language filter is applied
- **THEN** OER containing that language code in their inLanguage array are returned
- **AND** inLanguage is always stored as an array in the database
- **AND** matching is exact (language codes are case-sensitive)
- **AND** invalid language code format is rejected (must be 2-3 lowercase letters)

#### Scenario: Filter by license
- **GIVEN** OER exist with various license URIs
- **WHEN** a license filter is applied
- **THEN** OER with exact matching license URI are returned
- **AND** matching is exact and case-sensitive

#### Scenario: Filter by free-to-use status
- **GIVEN** OER exist with free_to_use true or false
- **WHEN** a free_for_use filter is applied with a boolean value
- **THEN** only OER with that exact boolean value are returned
- **AND** invalid boolean values are rejected

#### Scenario: Filter by date ranges
- **GIVEN** OER exist with various creation, publication, and modification dates
- **WHEN** date range filters are applied (date_created_from/to, date_published_from/to, date_modified_from/to)
- **THEN** OER within the specified date ranges are returned
- **AND** "from" filters use greater-than-or-equal comparison
- **AND** "to" filters use less-than-or-equal comparison (end of day)
- **AND** date formats must be valid ISO 8601

#### Scenario: Combine multiple filters
- **GIVEN** the API supports multiple filter parameters
- **WHEN** multiple filters are provided in one request
- **THEN** all filters are applied with AND logic
- **AND** only OER matching all criteria are returned
- **AND** pagination applies to the filtered results

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

#### Scenario: Limit query execution time
- **GIVEN** the application is running
- **WHEN** a database query is executed
- **THEN** the query has a maximum execution time (5 seconds)
- **AND** queries exceeding the limit are automatically terminated
- **AND** clients receive an error response for timed-out queries

#### Scenario: Manage database connections
- **GIVEN** the application is under load
- **WHEN** database connections are needed
- **THEN** a connection pool manages resources efficiently
- **AND** maximum connections are capped to prevent exhaustion
- **AND** minimum connections are maintained for baseline performance
- **AND** idle connections are released after timeout

#### Scenario: Optimize database queries
- **GIVEN** the database contains OER records
- **WHEN** filtered queries are executed
- **THEN** database indexes accelerate lookups
- **AND** indexes exist on all filterable fields
- **AND** JSONB fields have appropriate GIN indexes
- **AND** query performance is acceptable for typical datasets

#### Scenario: Protect sensitive information in production
- **GIVEN** the application is running in production
- **WHEN** errors occur
- **THEN** detailed error messages are not exposed to clients
- **AND** generic error messages are returned
- **AND** detailed errors are logged server-side
- **AND** SQL queries are not logged to prevent data exposure

#### Scenario: Provide detailed errors in development
- **GIVEN** the application is running in development
- **WHEN** errors occur
- **THEN** detailed error messages are returned to clients
- **AND** SQL queries can be logged for debugging
- **AND** developers can inspect full error details

### Requirement: Process Nostr Event Deletion Requests
The application MUST handle kind 5 (NIP-09) deletion events from Nostr relays, validate deletion requests according to NIP-09 protocol rules, and cascade deletions to dependent entities.

#### Scenario: Receive and validate deletion event
- **GIVEN** a kind 5 deletion event is received from a relay
- **WHEN** the event contains 'e' tags referencing event IDs to delete
- **THEN** the deletion event is validated according to NIP-09
- **AND** the pubkey of the deletion event must match the pubkey of each referenced event
- **AND** invalid deletion requests are logged and rejected

#### Scenario: Extract event references from deletion tags
- **GIVEN** a kind 5 deletion event with multiple 'e' tags
- **WHEN** the deletion is processed
- **THEN** all event IDs from 'e' tags are extracted
- **AND** each referenced event is processed individually
- **AND** other tag types (like 'p' tags) are ignored

#### Scenario: Skip deletion when referenced event not found
- **GIVEN** a deletion event references an event ID
- **WHEN** the referenced event does not exist in the database
- **THEN** the deletion is skipped with a debug log message
- **AND** processing continues for other referenced events
- **AND** no error is raised

#### Scenario: Reject deletion when pubkeys do not match
- **GIVEN** a deletion event is received
- **WHEN** the deletion event pubkey does not match the referenced event pubkey
- **THEN** the deletion request is rejected
- **AND** a warning is logged with both pubkeys
- **AND** the referenced event is not deleted
- **AND** this follows NIP-09 security rules

#### Scenario: Cascade delete AMB events and associated OER records
- **GIVEN** a valid deletion request for a kind 30142 (AMB) event
- **WHEN** the AMB event is deleted from the database
- **THEN** the database CASCADE constraint automatically deletes associated OER records
- **AND** the deletion is logged with event ID and kind
- **AND** all related data is removed atomically

#### Scenario: Nullify file metadata for deleted file events
- **GIVEN** a valid deletion request for a kind 1063 (file) event
- **WHEN** the file event is deleted
- **THEN** file metadata fields (file_mime_type, file_size, file_dim, file_alt) are nullified in all OER records referencing this file
- **AND** the file event reference (event_file_id) is set to null by database constraint
- **AND** the OER records remain intact with nullified file metadata
- **AND** the deletion is logged with affected OER count

#### Scenario: Delete other event types directly
- **GIVEN** a valid deletion request for an event that is not AMB or file type
- **WHEN** the event is deleted
- **THEN** the event is removed from the database directly
- **AND** no cascade operations are triggered
- **AND** the deletion is logged

#### Scenario: Process deletion events immediately on receipt
- **GIVEN** the application is ingesting events from relays
- **WHEN** a kind 5 deletion event is received and stored
- **THEN** the deletion is processed immediately
- **AND** referenced events are deleted before processing continues
- **AND** deletion failures do not prevent event ingestion

#### Scenario: Process historical deletion events after EOSE
- **GIVEN** the application has completed initial sync (EOSE received)
- **WHEN** historical processing begins
- **THEN** all kind 5 deletion events in the database are retrieved
- **AND** each deletion event is processed to ensure deletions are applied
- **AND** this handles deletions received before deletion processing was implemented
- **AND** the number of processed deletion events is logged

#### Scenario: Handle deletion processing errors gracefully
- **GIVEN** an error occurs while processing a deletion
- **WHEN** the deletion fails
- **THEN** the error is logged with event ID and error details
- **AND** processing continues for other deletions
- **AND** the failure does not stop event ingestion
- **AND** individual deletion failures are isolated

#### Scenario: Skip deletion events with no event references
- **GIVEN** a kind 5 deletion event has no 'e' tags
- **WHEN** the event is processed
- **THEN** a warning is logged indicating no references found
- **AND** no database queries are executed
- **AND** the deletion is skipped

### Requirement: Graceful Shutdown
The application MUST cleanly shut down all connections and release resources when stopping.

#### Scenario: Close relay connections on shutdown
- **GIVEN** the application is running with active relay connections
- **WHEN** the application shuts down
- **THEN** all relay subscriptions are closed
- **AND** all relay connections are terminated
- **AND** pending reconnection timers are cleared
- **AND** resources are released without errors
- **AND** shutdown process is logged
