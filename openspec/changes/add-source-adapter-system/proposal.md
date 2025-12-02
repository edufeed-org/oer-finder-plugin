## Why
The current system only ingests OER from Nostr relays. Users need access to broader OER catalogs from external sources like Unsplash, Wikimedia Commons, or other educational content APIs. An adapter system allows modular integration of these external sources without modifying core application logic.

## What Changes
- Add a new "source adapter" abstraction that allows external OER sources to be queried on-demand during search
- **BREAKING**: Add `source` field to API response model indicating the origin (e.g., "nostr", "unsplash")
- Create adapter packages in `/packages/` folder that implement a common interface
- Enable/disable adapters via environment variables
- Merge results from Nostr database and active adapters into unified search response
- No local database storage for external adapter results (direct API passthrough)

## Impact
- Affected specs: `aggregator-server`
- Affected code:
  - `/src/oer/` - OER module for adapter integration and result merging
  - `/src/config/` - New environment variables for adapter activation
  - `/packages/` - New adapter packages
- API consumers will need to handle the new `source` field
