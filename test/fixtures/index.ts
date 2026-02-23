/**
 * Test Fixtures Helper
 *
 * This module provides factories and fixtures for test data following best practices:
 * - Factory Pattern: Simple creation with default values and overrides
 * - Type-safe: Proper TypeScript types throughout
 * - DRY: Reusable helpers to avoid code duplication
 *
 * All factories are organized by type in separate files:
 * - oerFactory.ts: OER (Open Educational Resource) factories and fixtures
 * - mocks/: Reusable mock factories for services
 */

// Re-export everything from OER factories
export { OerFactory, oerFixtures, testDataGenerators } from './oerFactory';

// Re-export mock factories
export {
  createImgproxyServiceMock,
  createEnabledImgproxyServiceMock,
  createDisabledImgproxyServiceMock,
  mockImgproxyUrls,
  createAssetSigningServiceMock,
  createAssetUrlServiceMock,
} from './mocks';
