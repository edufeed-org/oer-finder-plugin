/**
 * Test Fixtures Helper
 *
 * This module provides factories and fixtures for test data following best practices:
 * - Factory Pattern: Simple creation with default values and overrides
 * - Type-safe: Proper TypeScript types throughout
 * - DRY: Reusable helpers to avoid code duplication
 *
 * All factories are organized by type in separate files:
 * - eventFactory.ts: Nostr event-related factories and fixtures
 * - oerFactory.ts: OER (Open Educational Resource) factories and fixtures
 */

// Re-export everything from event factories
export {
  NostrEventFactory,
  EventFactory,
  nostrEventFixtures,
  eventFactoryHelpers,
} from './eventFactory';

// Re-export everything from OER factories
export {
  OerFactory,
  oerFixtures,
  testDataGenerators,
  oerFactoryHelpers,
} from './oerFactory';
