/**
 * OER (Open Educational Resource) Factories and Fixtures
 *
 * This module provides factories for creating OER test data:
 * - OerFactory: Create OpenEducationalResource entities
 * - Pre-configured fixtures for common scenarios
 * - Data generators for bulk test data
 */

import { OpenEducationalResource } from '../../src/oer/entities/open-educational-resource.entity';

// OER Fixtures
import oerQueryFixturesJson from './oer/oer-query-fixtures.json';

/**
 * Helper to convert date strings to Date objects recursively
 */
function convertDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    // Handle date fields specifically
    if (
      (key === 'amb_date_created' ||
        key === 'amb_date_published' ||
        key === 'amb_date_modified') &&
      typeof value === 'string'
    ) {
      (result as Record<string, unknown>)[key] = new Date(value);
    }
  }

  return result;
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
      // Default URL (nullable in entity but commonly needed in tests)
      url: base?.url ?? 'https://example.edu/default.pdf',

      // Nullable fields - use nullish coalescing to preserve false/0 values
      amb_license_uri: base?.amb_license_uri ?? null,
      amb_free_to_use: base?.amb_free_to_use ?? null,
      file_mime_type: base?.file_mime_type ?? null,
      amb_metadata: base?.amb_metadata ?? null,
      amb_keywords: base?.amb_keywords ?? null,
      file_dim: base?.file_dim ?? null,
      file_size: base?.file_size ?? null,
      file_alt: base?.file_alt ?? null,
      amb_description: base?.amb_description ?? null,
      audience_uri: base?.audience_uri ?? null,
      educational_level_uri: base?.educational_level_uri ?? null,
      amb_date_created: base?.amb_date_created ?? null,
      amb_date_published: base?.amb_date_published ?? null,
      amb_date_modified: base?.amb_date_modified ?? null,
      event_amb_id: base?.event_amb_id ?? null,
      event_file_id: base?.event_file_id ?? null,

      // Relations (nullable)
      eventAmb: base?.eventAmb ?? null,
      eventFile: base?.eventFile ?? null,

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
        amb_description: `Test resource ${i + 1}`,
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
    amb_license_uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
    amb_free_to_use: true,
    file_mime_type: 'image/png',
    amb_metadata: {
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
    amb_keywords: ['photosynthesis', 'biology'],
    file_dim: '1920x1080',
    file_size: 245680,
    file_alt: 'Photosynthesis diagram',
    amb_description: 'A diagram showing photosynthesis',
    amb_date_created: new Date('2024-01-15T10:30:00Z'),
    amb_date_published: new Date('2024-01-20T14:00:00Z'),
    event_amb_id: 'event123',
    event_file_id: 'file123',
  } as Partial<OpenEducationalResource>,

  /**
   * Minimal OER data with only required fields
   */
  minimal: {
    id: 'oer-uuid-456',
    url: 'https://example.edu/resource.pdf',
    amb_metadata: {
      d: 'https://example.edu/resource.pdf',
      type: 'LearningResource',
    },
    event_amb_id: 'event456',
  } as Partial<OpenEducationalResource>,

  /**
   * Existing OER base data (common fields for upsert tests)
   */
  existingBase: {
    id: 'oer-existing',
    url: 'https://example.edu/resource.png',
    amb_license_uri: 'https://existing-license.org',
    amb_free_to_use: true,
    file_mime_type: 'image/png',
    amb_metadata: { type: 'ExistingType' },
    amb_keywords: ['existing'],
    file_dim: '800x600',
    file_size: 100000,
    file_alt: 'Existing alt text',
    amb_description: 'Existing description',
    event_amb_id: 'event-old',
    created_at: new Date('2020-01-01'),
    updated_at: new Date('2020-01-01'),
  } as Partial<OpenEducationalResource>,

  /**
   * Standard date set for existing OER tests
   */
  standardDates: {
    amb_date_created: new Date('2024-01-10T08:00:00Z'),
    amb_date_published: new Date('2024-01-12T10:00:00Z'),
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
        amb_metadata: {},
        event_amb_id: null,
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
        ...baseOerData.standardDates,
        amb_date_modified: new Date('2024-01-15T10:00:00Z'),
      },
      overrides,
    );
  },
};
