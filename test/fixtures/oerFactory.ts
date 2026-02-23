/**
 * OER (Open Educational Resource) Factories and Fixtures
 *
 * This module provides factories for creating OER test data.
 */

import type { OerItem } from '../../src/oer/dto/oer-response.dto';

// OER Fixtures
import oerQueryFixturesJson from './oer/oer-query-fixtures.json';

interface OerFactoryOverrides {
  name?: string;
  url?: string;
  source_name?: string;
  attribution?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Factory for creating OerItem objects for API response testing
 */
export class OerFactory {
  static create(overrides?: OerFactoryOverrides): OerItem {
    return {
      amb: {
        type: 'LearningResource',
        name: overrides?.name ?? 'Default Resource',
        id: overrides?.url ?? 'https://example.edu/default.pdf',
        ...overrides?.metadata,
      },
      extensions: {
        fileMetadata: null,
        images: null,
        system: {
          source: overrides?.source_name ?? 'nostr-amb-relay',
          foreignLandingUrl: null,
          attribution: overrides?.attribution ?? null,
        },
      },
    };
  }
}

/**
 * Pre-configured OER fixtures
 */
export const oerFixtures = {
  query: oerQueryFixturesJson.map((fixture) => ({
    name: fixture.name,
    data: fixture.data,
  })),
};

/**
 * Test data generators for bulk test data
 */
export const testDataGenerators = {
  generateOerItems: (count: number): OerItem[] => {
    return Array.from({ length: count }, (_, i) =>
      OerFactory.create({
        url: `https://example.edu/resource-${i + 1}.png`,
        name: `Test resource ${i + 1}`,
      }),
    );
  },
};
