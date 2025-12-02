## ADDED Requirements

### Requirement: Source Adapter System
The application MUST support external OER source adapters that can be enabled via environment configuration to expand searchable content beyond Nostr relays.

#### Scenario: Configure enabled adapters via environment
- **GIVEN** the `ENABLED_ADAPTERS` environment variable is set with comma-separated adapter identifiers
- **WHEN** the application starts
- **THEN** each specified adapter is loaded and registered
- **AND** adapter registration status is logged
- **AND** invalid adapter identifiers are logged as warnings
- **AND** the application continues with valid adapters only

#### Scenario: No adapters enabled by default
- **GIVEN** the `ENABLED_ADAPTERS` environment variable is not set or empty
- **WHEN** the application starts
- **THEN** only Nostr database results are returned from searches
- **AND** no adapter loading is attempted
- **AND** the application behaves as it did before adapters were introduced

### Requirement: Adapter Search Interface
Each source adapter MUST implement a standard interface that enables searching external OER sources and returning results in a normalized format.

#### Scenario: Adapter implements required interface
- **GIVEN** an adapter package exists
- **WHEN** the adapter is loaded
- **THEN** it provides a unique source identifier
- **AND** it provides a human-readable source name
- **AND** it provides a search method accepting query parameters

#### Scenario: Adapter returns normalized results
- **GIVEN** an adapter receives a search query
- **WHEN** the adapter queries its external source
- **THEN** results are mapped to the standard OER response format
- **AND** each result includes: id, url, description, keywords, license, file metadata, and creators
- **AND** each result includes images with high, medium, and small resolution URLs
- **AND** missing fields are returned as null
- **AND** the source identifier is not included (added by merge layer)

#### Scenario: Adapter handles external API errors
- **GIVEN** an adapter is querying an external API
- **WHEN** the external API returns an error or times out
- **THEN** the adapter throws an appropriate error
- **AND** the error includes details about the failure
- **AND** the calling service handles the error gracefully

#### Scenario: Adapter maps images to resolution structure
- **GIVEN** an adapter receives image URLs from an external source
- **WHEN** the adapter builds the response
- **THEN** images are mapped to high, medium, and small resolution URLs
- **AND** high corresponds to full resolution or largest available
- **AND** medium corresponds to approximately 400px width
- **AND** small corresponds to approximately 200px width or thumbnail
- **AND** if only one URL is available it may be used for all resolutions

#### Scenario: Adapter maps creator information
- **GIVEN** an adapter receives creator data from an external source
- **WHEN** the adapter builds the response
- **THEN** creators are mapped to a list of creator objects
- **AND** each creator has a type field (e.g., "person", "organization")
- **AND** each creator has a name field
- **AND** each creator has a link field for the external provider profile URL or null if unavailable
- **AND** an empty list is returned if no creator information is available

### Requirement: Parallel Search Orchestration
The application MUST query Nostr database and all enabled adapters in parallel, merging results into a unified response.

#### Scenario: Execute parallel searches
- **GIVEN** multiple adapters are enabled
- **WHEN** a search request is received
- **THEN** the Nostr database query executes in parallel with adapter queries
- **AND** all queries start at the same time
- **AND** the response waits for all queries to complete or timeout

#### Scenario: Apply adapter timeout
- **GIVEN** an adapter query is in progress
- **WHEN** the query exceeds the configured timeout (default 3 seconds)
- **THEN** the adapter query is cancelled
- **AND** results from other sources are still returned
- **AND** the timeout is logged with adapter identifier

#### Scenario: Continue on adapter failure
- **GIVEN** one or more adapters fail during search
- **WHEN** the search is being processed
- **THEN** successful results from other adapters are included
- **AND** Nostr database results are included
- **AND** adapter failures are logged as warnings
- **AND** the API response does not indicate which adapters failed

### Requirement: Result Merging and Source Identification
The application MUST merge results from all sources and include a source identifier on each result item.

#### Scenario: Add source field to all results
- **GIVEN** results are returned from Nostr database and adapters
- **WHEN** results are merged
- **THEN** each Nostr result has `source` set to "nostr"
- **AND** each adapter result has `source` set to the adapter's source identifier
- **AND** the source field is always present and non-null

#### Scenario: Order merged results
- **GIVEN** results from multiple sources are being merged
- **WHEN** the merge is performed
- **THEN** Nostr database results appear first
- **AND** adapter results follow in adapter registration order
- **AND** within each source, original ordering is preserved

#### Scenario: Calculate total count across sources
- **GIVEN** each source returns a total count
- **WHEN** results are merged
- **THEN** the response total is the sum of all source totals
- **AND** pagination metadata reflects the combined dataset
- **AND** totalPages is calculated based on combined total

#### Scenario: Apply pagination to merged results
- **GIVEN** merged results exceed requested page size
- **WHEN** pagination is applied
- **THEN** only pageSize items are returned for the requested page
- **AND** items are selected based on merged order
- **AND** page and pageSize in response reflect requested values

### Requirement: Query Translation for Adapters
The application MUST translate OER query parameters to adapter-compatible format, supporting common filter types.

#### Scenario: Translate supported query parameters
- **GIVEN** a search request with OER query parameters
- **WHEN** the query is sent to adapters
- **THEN** keywords filter is passed to adapters
- **AND** type filter is passed to adapters
- **AND** license filter is passed to adapters
- **AND** language filter is passed to adapters
- **AND** pagination parameters are passed to adapters

#### Scenario: Handle unsupported filter types
- **GIVEN** an adapter does not support a specific filter type
- **WHEN** that filter is included in the query
- **THEN** the adapter ignores the unsupported filter
- **AND** results may include items that don't match that filter
- **AND** no error is raised

## MODIFIED Requirements

### Requirement: Public REST API for OER Search
The application MUST provide a public HTTP API at `/api/v1/oer` that returns paginated OER results with comprehensive filtering capabilities.

#### Scenario: Retrieve paginated OER list
- **GIVEN** the API is available
- **WHEN** a GET request is made to `/api/v1/oer`
- **THEN** a paginated list of OER is returned with status 200
- **AND** each OER includes: id, url, type, license, description, keywords, dates, file metadata, educational metadata, event references, source, and creators
- **AND** creators is a list of objects with type, name, and link fields
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

#### Scenario: Filter by keywords
- **GIVEN** OER exist with various keywords
- **WHEN** a keywords filter is applied
- **THEN** OER where any keyword matches are returned
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

#### Scenario: Include source identifier in response
- **GIVEN** the API returns OER results
- **WHEN** results are from Nostr database
- **THEN** each result includes `source: "nostr"`
- **AND** the source field is always present

#### Scenario: Include external adapter results
- **GIVEN** external adapters are enabled
- **WHEN** a search request is processed
- **THEN** results from enabled adapters are merged with Nostr results
- **AND** each adapter result includes its respective source identifier
- **AND** adapter failures do not prevent Nostr results from being returned
