/**
 * OER (Open Educational Resource) Factories and Fixtures
 *
 * This module provides factories for creating OER test data:
 * - OerFactory: Create OpenEducationalResource entities
 * - Pre-configured fixtures for common scenarios
 * - Data generators for bulk test data
 */

import { OpenEducationalResource } from '@edufeed-org/oer-entities';

/**
 * Source name constant for Nostr events.
 * Defined locally to avoid circular dependency when oer-nostr package tests import this factory.
 */
const SOURCE_NAME_NOSTR = 'nostr';

// OER Fixtures
import oerQueryFixturesJson from './oer/oer-query-fixtures.json';

/**
 * Helper to convert date strings to Date objects recursively
 * Note: Date fields are now stored in metadata, not as separate columns
 */
function convertDates<T extends Record<string, unknown>>(obj: T): T {
  // No date conversion needed - dates are stored in metadata as strings
  return { ...obj };
}

/**
 * Factory for creating OpenEducationalResource entities
 *
 * Note: Returns Partial<OpenEducationalResource> to allow flexible test data creation.
 * This is intentional for testing purposes where not all fields may be needed.
 */
export class OerFactory {
  /**
   * Create an OER with sensible defaults and custom overrides
   *
   * All fields default to null except:
   * - url: 'https://example.edu/default.pdf'
   * - created_at, updated_at: current timestamp
   *
   * Uses nullish coalescing (??) to preserve falsy values like false and 0
   */
  static create(
    base?: Partial<OpenEducationalResource>,
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> {
    const now = new Date();

    const result = {
      // Primary key - omit by default to let DB generate UUID
      ...(base?.id ? { id: base.id } : {}),

      // Default URL (nullable in entity but commonly needed in tests)
      url: base?.url ?? 'https://example.edu/default.pdf',

      // source_name identifies the authoritative source for this OER
      source_name: base?.source_name ?? SOURCE_NAME_NOSTR,

      // Nullable fields - use nullish coalescing to preserve false/0 values
      license_uri: base?.license_uri ?? null,
      free_to_use: base?.free_to_use ?? null,
      file_mime_type: base?.file_mime_type ?? null,
      metadata: base?.metadata ?? null,
      metadata_type: base?.metadata_type ?? null,
      keywords: base?.keywords ?? null,
      file_dim: base?.file_dim ?? null,
      file_size: base?.file_size ?? null,
      file_alt: base?.file_alt ?? null,
      name: base?.name ?? null,
      description: base?.description ?? null,
      attribution: base?.attribution ?? null,
      audience_uri: base?.audience_uri ?? null,
      educational_level_uri: base?.educational_level_uri ?? null,

      // Relations (nullable)
      sources: base?.sources ?? [],

      // Required timestamps (not nullable in entity)
      created_at: base?.created_at ?? now,
      updated_at: base?.updated_at ?? now,

      // Apply overrides last to ensure they take precedence
      ...overrides,
    };

    return result;
  }

  /**
   * Create from JSON fixture with automatic date string conversion
   */
  static fromJson(
    json: Record<string, unknown>,
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> {
    const converted = convertDates(json);
    return this.create(
      converted as Partial<OpenEducationalResource>,
      overrides,
    );
  }
}

/**
 * Pre-configured OER fixtures
 */
export const oerFixtures = {
  /**
   * Query fixtures for testing various filter scenarios
   */
  query: oerQueryFixturesJson.map((fixture) => ({
    name: fixture.name,
    data: OerFactory.fromJson(fixture.data),
  })),
};

/**
 * Test data generators for bulk test data
 */
export const testDataGenerators = {
  /**
   * Generate multiple OERs for pagination tests
   */
  generateOers: (
    count: number,
    baseUrl = 'https://example.edu/resource',
  ): Array<Partial<OpenEducationalResource>> => {
    return Array.from({ length: count }, (_, i) =>
      OerFactory.create({
        url: `${baseUrl}-${i + 1}.png`,
        file_mime_type: 'image/png',
        description: `Test resource ${i + 1}`,
      }),
    );
  },
};

/**
 * Base OER data templates for reuse across factory helpers
 */
const baseOerData = {
  /**
   * Complete OER data with all fields populated
   */
  complete: {
    id: 'oer-uuid-123',
    url: 'https://example.edu/diagram.png',
    license_uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
    free_to_use: true,
    file_mime_type: 'image/png',
    metadata: {
      d: 'https://example.edu/diagram.png',
      'license:id': 'https://creativecommons.org/licenses/by-sa/4.0/',
      isAccessibleForFree: 'true',
      learningResourceType: {
        id: 'http://w3id.org/kim/hcrt/image',
        'prefLabel:en': 'Image',
      },
      type: 'LearningResource',
      dateCreated: '2024-01-15T10:30:00Z',
      datePublished: '2024-01-20T14:00:00Z',
    },
    metadata_type: 'amb',
    keywords: ['photosynthesis', 'biology'],
    file_dim: '1920x1080',
    file_size: 245680,
    file_alt: 'Photosynthesis diagram',
    description: 'A diagram showing photosynthesis',
  } as Partial<OpenEducationalResource>,

  /**
   * Minimal OER data with only required fields
   */
  minimal: {
    id: 'oer-uuid-456',
    url: 'https://example.edu/resource.pdf',
    metadata: {
      d: 'https://example.edu/resource.pdf',
      type: 'LearningResource',
    },
    metadata_type: 'amb',
  } as Partial<OpenEducationalResource>,

  /**
   * Existing OER base data (common fields for upsert tests)
   */
  existingBase: {
    id: 'oer-existing',
    url: 'https://example.edu/resource.png',
    license_uri: 'https://existing-license.org',
    free_to_use: true,
    file_mime_type: 'image/png',
    metadata: { type: 'ExistingType' },
    metadata_type: 'amb',
    keywords: ['existing'],
    file_dim: '800x600',
    file_size: 100000,
    file_alt: 'Existing alt text',
    description: 'Existing description',
    created_at: new Date('2020-01-01'),
    updated_at: new Date('2020-01-01'),
  } as Partial<OpenEducationalResource>,

  /**
   * Standard date set for existing OER tests (dates in metadata)
   */
  standardDates: {
    metadata: {
      dateCreated: '2024-01-10T08:00:00Z',
      datePublished: '2024-01-12T10:00:00Z',
    },
    metadata_type: 'amb',
  } as Partial<OpenEducationalResource>,
};

/**
 * Factory helpers for creating specific types of OER test data
 */
export const oerFactoryHelpers = {
  /**
   * Create a complete OER with all fields populated for extraction testing
   */
  createCompleteOer: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(baseOerData.complete, overrides);
  },

  /**
   * Create a minimal OER with only required fields for extraction testing
   */
  createMinimalOer: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(baseOerData.minimal, overrides);
  },

  /**
   * Create an existing OER with dates for upsert testing
   */
  createExistingOerWithDates: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        ...baseOerData.existingBase,
        ...baseOerData.standardDates,
      },
      overrides,
    );
  },

  /**
   * Create an OER without date fields for upsert testing
   */
  createOerWithoutDates: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        id: 'oer-no-dates',
        url: 'https://example.edu/resource.png',
        metadata: {},
        metadata_type: 'amb',
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      },
      overrides,
    );
  },

  /**
   * Create an OER with modified date for upsert testing
   */
  createOerWithModifiedDate: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        ...baseOerData.existingBase,
        metadata: {
          ...baseOerData.standardDates.metadata,
          dateModified: '2024-01-15T10:00:00Z',
        },
        metadata_type: 'amb',
      },
      overrides,
    );
  },

  /**
   * Create an image OER for query service testing (triggers images generation)
   */
  createImageOer: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        id: 'oer-image-123',
        url: 'https://example.com/image.jpg',
        file_mime_type: 'image/png',
        metadata: {},
        metadata_type: 'amb',
      },
      overrides,
    );
  },

  /**
   * Create an image OER identified by metadata.type instead of MIME type
   */
  createImageOerByMetadataType: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        id: 'oer-image-metadata-123',
        url: 'https://example.com/image.jpg',
        file_mime_type: null,
        metadata: { type: 'Image' },
        metadata_type: 'amb',
      },
      overrides,
    );
  },

  /**
   * Create a video OER for query service testing (no images)
   */
  createVideoOer: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        id: 'oer-video-123',
        url: 'https://example.com/video.mp4',
        file_mime_type: 'video/mp4',
        metadata: { type: 'Video' },
        metadata_type: 'amb',
      },
      overrides,
    );
  },

  /**
   * Create a PDF OER for query service testing (no images)
   */
  createPdfOer: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> => {
    return OerFactory.create(
      {
        id: 'oer-pdf-123',
        url: 'https://example.com/document.pdf',
        file_mime_type: 'application/pdf',
        metadata: { type: 'Document' },
        metadata_type: 'amb',
      },
      overrides,
    );
  },

  /**
   * Create an OER with all API response fields for testing complete responses
   * Note: `id` is set explicitly because OerFactory.create doesn't include it by default
   */
  createOerForApiResponse: (
    overrides?: Partial<OpenEducationalResource>,
  ): OpenEducationalResource => {
    const oer = OerFactory.create(
      {
        url: 'https://example.com/resource',
        file_mime_type: 'image/png',
        license_uri: 'https://creativecommons.org/licenses/by/4.0/',
        free_to_use: true,
        description: 'Test resource',
        keywords: ['test', 'education'],
        metadata: {
          dateCreated: '2024-01-01T00:00:00Z',
          datePublished: '2024-01-01T00:00:00Z',
          dateModified: '2024-01-01T00:00:00Z',
        },
        metadata_type: 'amb',
        file_dim: null,
        file_size: null,
        file_alt: null,
        audience_uri: null,
        educational_level_uri: null,
      },
      overrides,
    );
    return {
      ...oer,
      id: '123',
    } as OpenEducationalResource;
  },
};
