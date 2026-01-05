# Nostr Package Improvement Opportunities

This document outlines potential improvements identified during a code review. These are suggestions for future refactoring work, organized by priority.

## High Priority

### 1. Split OerExtractionService (822 lines)

The `OerExtractionService` violates single responsibility by handling:
- AMB metadata extraction
- File metadata extraction
- Date parsing and comparison
- Update decision logic
- Database operations with race condition protection

**Recommendation**: Extract into focused classes:

```
src/services/
├── oer-extraction.service.ts      # Orchestration only (~300 lines)
├── extractors/
│   ├── amb-metadata.extractor.ts  # AMB parsing logic
│   └── file-metadata.extractor.ts # File event parsing
└── policies/
    └── oer-update.policy.ts       # Update decision logic
```

### 2. Fix Config Duplication

In `config/nostr.config.ts`, two environment variables handle the same purpose:

```typescript
// Current (lines 7-8)
process.env.NOSTR_RELAY_RECONNECT_TIME || process.env.NOSTR_RECONNECT_DELAY || '5000'
```

**Recommendation**: Pick one environment variable name and remove the fallback. Update documentation accordingly.

---

## Medium Priority

### 3. Convert Static Classes to Functions

Several classes contain only static methods with no state. These could be simpler as exported functions:

**RelayConfigParser** (`utils/relay-config.parser.ts`)
```typescript
// Before
export class RelayConfigParser {
  static parseRelayUrls(relayUrls: string, relayUrl: string): readonly string[] { ... }
}

// After
export function parseRelayUrls(relayUrls: string, relayUrl: string): readonly string[]
```

**EventValidator** (`utils/event-validator.ts`)
```typescript
// Before
export class EventValidator {
  static validateEventSignature(event: Event): EventValidationResult { ... }
  static formatValidationError(result, relayUrl): string { ... }
}

// After
export function validateEventSignature(event: Event): EventValidationResult
export function formatValidationError(result, relayUrl): string
```

**DatabaseErrorClassifier** (`utils/database-error.classifier.ts`)
```typescript
// All static methods, no state - convert to exported functions
```

### 4. Reduce Package Exports

The package exports 40+ items, some only needed internally.

**Recommendation**: Create separate export entry points:
```
src/
├── index.ts        # Public API only
├── testing.ts      # Test utilities (NostrEventFactory, etc.)
└── internals.ts    # Advanced/internal usage (clearly marked)
```

Items to consider making internal:
- `DEFAULT_SUBSCRIPTION_CONFIG` - only used within RelayConnectionManager

### 5. Standardize Error Handling

Some services use `DatabaseErrorClassifier.extractErrorMessage(error)` while others use inline:
```typescript
error instanceof Error ? error.message : String(error)
```

**Recommendation**: Use `DatabaseErrorClassifier` methods consistently throughout all services.

### 6. Extract Named Constants

Replace magic numbers with named constants:

```typescript
// In nostr.config.ts
const DEFAULT_RECONNECT_DELAY_MS = 5000;

// Usage
process.env.NOSTR_RECONNECT_DELAY || String(DEFAULT_RECONNECT_DELAY_MS)
```

---

## Low Priority

### 7. Improve Parameter Lists

Methods with >3 parameters should use configuration objects:

```typescript
// Before (relay-connection.manager.ts)
connect(
  relayUrl: string,
  handlers: RelayEventHandlers,
  config: RelaySubscriptionConfig,
  sinceTimestamp: number | null
)

// After
interface ConnectOptions {
  relayUrl: string;
  handlers: RelayEventHandlers;
  config: RelaySubscriptionConfig;
  sinceTimestamp: number | null;
}

connect(options: ConnectOptions)
```

### 8. Add Fixture Validation Tests

Test fixtures in JSON files should be validated against current schemas to catch drift:

```typescript
describe('Fixture Validation', () => {
  it('should validate all AMB fixtures against NostrEventDataSchema', () => {
    // Validate each fixture file against the schema
  });
});
```

### 9. Improve Variable Naming

In `tag-parser.util.ts`, the `setNestedValue` function uses `currentLevel` which could be clearer:

```typescript
// Before
let currentLevel = obj;

// After
let currentNode = obj;
// or
let currentObject = obj;
```

### 10. Document Type Assertions

Add comments explaining safety of type assertions:

```typescript
// In nostr-client.service.ts:347
// Safe because NostrEventData is validated by parseNostrEventData
// and is structurally compatible with nostr-tools Event
const event = parseResult.data as Event;
```

### 11. Consolidate Similar Types

In `extraction.types.ts`, `FileMetadataFields` and `FileMetadata` are nearly identical:

```typescript
// Consider if both are necessary or if one can extend the other
interface FileMetadataFields { ... }
interface FileMetadata extends FileMetadataFields {
  // Additional fields if any
}
```

---

## Type Safety Improvements

### Minor Issues

1. **Nullable chaining inconsistency** - Standardize on optional chaining:
   ```typescript
   // Prefer
   oer.sources?.map(...)

   // Over explicit checks
   if (oer.sources) { oer.sources.map(...) }
   ```

---

## Summary

| Priority | Items | Estimated Impact |
|----------|-------|------------------|
| High | 2 | Significant maintainability improvement |
| Medium | 4 | Better code organization |
| Low | 5 | Polish and consistency |

Start with high-priority items as they provide the most value for code maintainability.
