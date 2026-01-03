/**
 * Test Fixtures Helper
 *
 * This module provides factories and fixtures for test data following best practices:
 * - Factory Pattern: Simple creation with default values and overrides
 * - Type-safe: Proper TypeScript types throughout
 * - DRY: Reusable helpers to avoid code duplication
 *
 * All factories are organized by type in separate files:
 * - Nostr event-related factories and fixtures: exported from @edufeed-org/oer-nostr
 * - oerFactory.ts: OER (Open Educational Resource) factories and fixtures
 * - mocks/: Reusable mock factories for services and TypeORM
 */

// Re-export everything from Nostr event factories (from the package)
export {
  NostrEventFactory,
  EventFactory,
  nostrEventFixtures,
  eventFactoryHelpers,
  type NostrEventTestData,
  // Re-export as NostrEventData for backwards compatibility
  type NostrEventTestData as NostrEventData,
} from '@edufeed-org/oer-nostr';

// Re-export everything from OER factories
export {
  OerFactory,
  oerFixtures,
  testDataGenerators,
  oerFactoryHelpers,
} from './oerFactory';

// Re-export mock factories
export {
  createQueryBuilderMock,
  createRepositoryMock,
  createImgproxyServiceMock,
  createEnabledImgproxyServiceMock,
  createDisabledImgproxyServiceMock,
  mockImgproxyUrls,
} from './mocks';
