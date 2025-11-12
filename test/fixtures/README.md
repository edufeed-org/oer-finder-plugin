# Test Fixtures

This directory contains reusable test data fixtures for OER data and Nostr events, implemented using proper **Factory** and **Builder** patterns.

## Exports

This module exports the following:

### Factory Classes
- `NostrEventFactory` - Create NostrEvent entities
- `EventFactory` - Create Event entities (nostr-tools)
- `OerFactory` - Create OpenEducationalResource entities

### Builder Classes
- `NostrEventBuilder` - Fluent API for building NostrEvent
- `OerBuilder` - Fluent API for building OER

### Pre-configured Fixtures
- `nostrEventFixtures` - Common Nostr event fixtures
- `oerFixtures` - Common OER fixtures
- `testDataGenerators` - Bulk data generation utilities

## Quick Start

```typescript
// Import everything you need
import {
  // Factory classes
  NostrEventFactory,
  EventFactory,
  OerFactory,
  // Builder classes
  NostrEventBuilder,
  OerBuilder,
  // Pre-configured fixtures
  nostrEventFixtures,
  oerFixtures,
  testDataGenerators,
} from '../fixtures';

// Use pre-configured fixtures (easiest)
const event = nostrEventFixtures.ambComplete();

// Or use factories for custom data
const customEvent = NostrEventFactory.create({ id: 'custom-123' });

// Or use builders for complex construction
const builtEvent = new NostrEventBuilder()
  .id('event-123')
  .kind(30142)
  .build();
```

## Architecture

The fixtures system follows these design patterns:

### Factory Pattern
- **Simple creation** with sensible defaults
- **Type-safe** - proper TypeScript types throughout
- **Override support** - easily customize specific fields
- **DRY principle** - single source of truth for defaults
- **Immutable defaults** - defaults marked as `readonly` to prevent mutation

### Builder Pattern
- **Fluent interface** - chain method calls
- **Step-by-step construction** - build complex objects incrementally
- **Readable tests** - self-documenting test data creation

## Directory Structure

```
test/fixtures/
├── nostr-events/         # Nostr event fixtures (AMB, File, Delete)
│   ├── amb-complete.json
│   ├── amb-minimal.json
│   ├── amb-with-dates.json
│   ├── amb-with-uris.json
│   ├── file-complete.json
│   ├── file-with-description.json
│   ├── delete-single.json
│   └── delete-multiple.json
├── oer/                  # OER entity fixtures
│   ├── oer-complete.json
│   ├── oer-minimal.json
│   └── oer-query-fixtures.json
├── index.ts              # Factories and Builders
└── README.md             # This file
```

## API Reference

### Factories

#### NostrEventFactory

```typescript
// Create with defaults
const event = NostrEventFactory.create();

// Create with custom fields
const event = NostrEventFactory.create({
  id: 'custom-id',
  pubkey: 'custom-pubkey',
});

// Create from JSON fixture
const event = NostrEventFactory.fromJson(jsonData, overrides);
```

#### EventFactory

```typescript
// For nostr-tools Event type
const event = EventFactory.create({
  kind: 5,
  tags: [['e', 'target-event']],
});
```

#### OerFactory

**Note:** Returns `Partial<OpenEducationalResource>` for flexibility in testing. This allows creating test data without requiring all fields to be populated.

```typescript
// Create OER with defaults
// Returns: { url: 'https://example.edu/default.pdf', created_at: Date, updated_at: Date, ... }
const oer = OerFactory.create();

// Create with custom fields - preserves falsy values correctly
const oer = OerFactory.create({
  amb_free_to_use: false, // ✅ Preserved as false, not converted to null
  file_size: 0,            // ✅ Preserved as 0, not converted to null
});

// Create from JSON with automatic date conversion
// Date strings in JSON are automatically converted to Date objects
const oer = OerFactory.fromJson(jsonData);
```

**Default Values:**
- `url`: `'https://example.edu/default.pdf'`
- `created_at`, `updated_at`: Current timestamp
- All other fields: `null`

### Builders

#### NostrEventBuilder

```typescript
// Fluent API for building complex events
const event = new NostrEventBuilder()
  .id('event-123')
  .kind(30142)
  .pubkey('test-pubkey')
  .content('Event content')
  .tags([['d', 'resource-url']])
  .addTag(['t', 'keyword'])
  .relayUrl('wss://relay.example.com')
  .build();

// Start from a base fixture
const event = new NostrEventBuilder(baseFixture)
  .id('custom-id')
  .addTag(['custom', 'tag'])
  .build();
```

#### OerBuilder

```typescript
// Build OER step by step
const oer = new OerBuilder()
  .url('https://example.edu/resource.pdf')
  .license('https://creativecommons.org/licenses/by/4.0/')
  .freeToUse(true)
  .mimeType('application/pdf')
  .keywords(['science', 'education'])
  .description('Educational resource')
  .dateCreated('2024-01-15T10:00:00Z') // Accepts string or Date
  .datePublished(new Date())
  .eventAmbId('amb-123')
  .build();
```

## Usage Examples

### Using Pre-configured Fixtures

```typescript
import { nostrEventFixtures, oerFixtures } from '../fixtures';

// Get a complete AMB event
const ambEvent = nostrEventFixtures.ambComplete();

// Override specific fields
const customAmbEvent = nostrEventFixtures.ambComplete({
  id: 'custom-id',
  pubkey: 'custom-pubkey',
});

// Get OER fixtures
const completeOer = oerFixtures.complete();
const minimalOer = oerFixtures.minimal();

// Get specific query fixture by name
const imageResource = oerFixtures.queryByName('image-resource');
```

### Using Factories

```typescript
import { NostrEventFactory, OerFactory } from '../fixtures';

// Create multiple similar events
const events = Array.from({ length: 5 }, (_, i) =>
  NostrEventFactory.create({
    id: `event-${i}`,
    kind: 30142,
  })
);

// Create OER with specific values
const oer = OerFactory.create({
  url: 'https://example.edu/image.png',
  file_mime_type: 'image/png',
  amb_free_to_use: false, // Correctly preserved as false
});
```

### Using Builders

```typescript
import { NostrEventBuilder, OerBuilder } from '../fixtures';

// Build a complex event incrementally
const event = new NostrEventBuilder()
  .id('event-123')
  .kind(30142)
  .tags([['d', 'https://example.edu/resource.png']])
  .addTag(['t', 'biology'])
  .addTag(['t', 'education'])
  .build();

// Build OER with fluent API
const oer = new OerBuilder()
  .url('https://example.edu/textbook.pdf')
  .freeToUse(true)
  .keywords(['math', 'calculus'])
  .dateCreated('2024-01-15')
  .build();
```

### Test Data Generators

```typescript
import { testDataGenerators } from '../fixtures';

// Generate multiple OERs for pagination tests
const oers = testDataGenerators.generateOers(25);

// Generate with custom base URL
const oers = testDataGenerators.generateOers(10, 'https://custom.edu/resource');

// Generate AMB events
const events = testDataGenerators.generateAmbEvents(10, 'test-pubkey');
```

### Factory Helpers

```typescript
import { eventFactoryHelpers } from '../fixtures';

// Create an AMB event with defaults
const ambEvent = eventFactoryHelpers.createAmbEvent({
  id: 'custom-id',
  pubkey: 'custom-pubkey',
});

// Create a File event with defaults
const fileEvent = eventFactoryHelpers.createFileEvent({
  id: 'file-123',
  content: 'Custom description',
});

// Create a Delete event for single target
const deleteEvent = eventFactoryHelpers.createDeleteEvent('target-event-id', 'pubkey');

// Create a Delete event for multiple targets
const deleteMultiple = eventFactoryHelpers.createDeleteEvent(
  ['event-1', 'event-2', 'event-3'],
  'pubkey'
);
```

## Best Practices

### 1. Type Safety

✅ **Good** - Properly typed with nullish coalescing
```typescript
const oer = OerFactory.create({
  amb_free_to_use: false, // Preserved as false
  file_size: 0,            // Preserved as 0
});
```

❌ **Bad** - Using || operator (converts falsy values to defaults)
```typescript
// Don't do this - false becomes null
const value = oer.amb_free_to_use || null;
```

### 2. Use Builders for Complex Construction

✅ **Good** - Clear, self-documenting
```typescript
const event = new NostrEventBuilder()
  .kind(30142)
  .tags([['d', 'url']])
  .addTag(['t', 'keyword1'])
  .addTag(['t', 'keyword2'])
  .build();
```

❌ **Bad** - Hard to read
```typescript
const event = NostrEventFactory.create({
  kind: 30142,
  tags: [['d', 'url'], ['t', 'keyword1'], ['t', 'keyword2']],
});
```

### 3. Use Pre-configured Fixtures for Common Scenarios

✅ **Good** - Reuse tested fixtures
```typescript
const event = nostrEventFixtures.ambComplete({
  id: 'test-specific-id',
});
```

❌ **Bad** - Reinventing the wheel
```typescript
const event = {
  id: 'test-specific-id',
  kind: 30142,
  // ... 20 more lines of boilerplate
};
```

### 4. Date Handling

✅ **Good** - Automatic conversion
```typescript
const oer = OerFactory.fromJson({
  amb_date_created: '2024-01-15T10:00:00Z', // Automatically converted to Date
});
```

✅ **Good** - Builder accepts both formats
```typescript
const oer = new OerBuilder()
  .dateCreated('2024-01-15') // String
  .datePublished(new Date()) // Date object
  .build();
```

## Refactoring Examples

### Before (Inline Test Data)

```typescript
it('should extract OER from AMB event', async () => {
  const event: NostrEvent = {
    id: 'event123',
    kind: 30142,
    pubkey: 'pubkey123',
    created_at: 1234567890,
    content: '',
    tags: [
      ['d', 'https://example.edu/image.png'],
      ['license:id', 'https://creativecommons.org/licenses/by-sa/4.0/'],
      ['isAccessibleForFree', 'true'],
      ['t', 'photosynthesis'],
      ['t', 'biology'],
      // ... many more lines
    ],
    raw_event: {},
    relay_url: 'wss://relay.example.com',
    ingested_at: new Date(),
  };

  const result = await service.extractOerFromEvent(event);
  expect(result.url).toBe('https://example.edu/image.png');
});
```

### After (Using Fixtures)

```typescript
import { nostrEventFixtures } from '../fixtures';

it('should extract OER from AMB event', async () => {
  const event = nostrEventFixtures.ambComplete();

  const result = await service.extractOerFromEvent(event);
  expect(result.url).toBe('https://example.edu/diagram.png');
});
```

### After (Using Builder for Custom Case)

```typescript
import { NostrEventBuilder } from '../fixtures';

it('should extract OER with custom tags', async () => {
  const event = new NostrEventBuilder(nostrEventFixtures.ambComplete())
    .id('custom-test-id')
    .addTag(['custom', 'tag'])
    .build();

  const result = await service.extractOerFromEvent(event);
  expect(result).toBeDefined();
});
```

## Benefits

1. **Reduced Duplication** - Reuse same test data across all tests
2. **Easier Maintenance** - Update fixture once, all tests benefit
3. **Improved Readability** - Tests focus on behavior, not setup
4. **Type Safety** - TypeScript ensures correctness throughout
5. **Flexibility** - Factory for simple cases, Builder for complex
6. **Correctness** - Nullish coalescing (`??`) preserves falsy values
7. **Automatic Conversion** - Date strings automatically converted to Date objects
8. **Immutability** - Default values are readonly, preventing accidental mutation
9. **Partial Types** - OER factory returns `Partial<>` for flexible test data creation

## Type Safety Notes

### Why `Partial<OpenEducationalResource>`?

The `OerFactory` returns `Partial<OpenEducationalResource>` rather than the full type. This is intentional:

- **Flexibility**: Tests often don't need all fields populated
- **Simplicity**: No need to provide every required field for simple tests
- **Safety**: Still type-checked - you can't add invalid fields
- **Real entities**: When saving to database, TypeORM handles the full entity

```typescript
// Partial allows this:
const oer = OerFactory.create({ url: 'https://example.com/test.pdf' });
// No need to provide all ~20 fields!

// But still type-safe:
const badOer = OerFactory.create({ invalidField: 'oops' }); // ❌ TypeScript error
```

### Nullish Coalescing (`??`)

All factories use nullish coalescing to preserve falsy values:

```typescript
// ✅ Good - using ??
const value = base?.amb_free_to_use ?? null;
// If base.amb_free_to_use is false, it stays false

// ❌ Bad - using ||
const value = base?.amb_free_to_use || null;
// If base.amb_free_to_use is false, it becomes null
```

## Design Patterns Implemented

### Factory Pattern
- Static methods for object creation
- Sensible defaults
- Easy overrides
- Type-safe

### Builder Pattern
- Fluent interface
- Method chaining
- Step-by-step construction
- Final `build()` method

### DRY Principle
- Single source of truth for test data
- Reusable helpers (convertDates)
- No code duplication

## Adding New Fixtures

1. Create a new JSON file in the appropriate directory
2. Add import statement in `index.ts`
3. Add helper method in the appropriate fixtures object
4. Document in this README

Example:

```typescript
// In index.ts
import newFixtureJson from './nostr-events/new-fixture.json';

export const nostrEventFixtures = {
  // ... existing fixtures
  newFixture: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(newFixtureJson, overrides),
};
```
