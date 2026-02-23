import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import {
  ALL_RESOURCE_TYPES,
  isEmptySearch,
  EMPTY_RESULT,
} from '@edufeed-org/oer-adapter-core';
import { parseRpiGraphQLResponse } from './rpi-virtuell.types.js';
import { mapRpiMaterialToAmb } from './mappers/rpi-virtuell-to-amb.mapper.js';

/** Default API endpoint */
const DEFAULT_API_URL = 'https://material.rpi-virtuell.de/graphql';

/** Upper bound for page size to prevent excessive queries */
const MAX_PAGE_SIZE = 100;

/**
 * Multiplier for estimating total results when the API does not return a count.
 * If a full page is returned, we assume there are more results.
 */
const TOTAL_COUNT_ESTIMATE_MULTIPLIER = 10;

/**
 * Configuration options for the RPI-Virtuell adapter.
 */
export interface RpiVirtuellAdapterConfig {
  /** GraphQL API endpoint URL (defaults to https://material.rpi-virtuell.de/graphql) */
  apiUrl?: string;
}

/**
 * Maps UI type filter values to RPI-Virtuell MEDIENTYP taxonomy slugs.
 * UI types come from RESOURCE_TYPES in the finder plugin constants.
 */
export const TYPE_TO_MEDIENTYP_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  image: ['picture'],
  video: ['video'],
  audio: ['audio', 'podcast'],
  text: ['essay', 'for-teachers'],
  'application/pdf': ['pdf-dokument'],
};

/**
 * Maps CC license URI patterns to RPI-Virtuell LIZENZEN taxonomy slugs.
 * RPI groups licenses into 4 categories by reuse permissions.
 * Keys are substring patterns matched against license URIs (not exact match).
 */
export const LICENSE_TO_LIZENZEN_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  'publicdomain/zero': ['remixable'],
  'licenses/by/': ['remixable'],
  'licenses/by-sa/': ['remixable'],
  'licenses/by-nd/': ['copyable'],
  'licenses/by-nc-nd/': ['non-commercial-copyable'],
  'licenses/by-nc-sa/': ['non-commercial-remixable'],
  'licenses/by-nc/': ['non-commercial-remixable'],
};

/**
 * Maps AMB educational level URIs to RPI-Virtuell BILDUNGSSTUFE taxonomy slugs.
 * AMB vocabulary: https://w3id.org/kim/educationalLevel/
 * RPI slugs discovered via GraphQL introspection of bildungsstufen taxonomy.
 */
export const EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  'https://w3id.org/kim/educationalLevel/level_0': ['elementary'],
  'https://w3id.org/kim/educationalLevel/level_1': ['primary'],
  'https://w3id.org/kim/educationalLevel/level_2': ['secondary'],
  'https://w3id.org/kim/educationalLevel/level_3': ['advanced'],
  'https://w3id.org/kim/educationalLevel/level_4': ['professional'],
  'https://w3id.org/kim/educationalLevel/level_5': ['relpaed'],
  'https://w3id.org/kim/educationalLevel/level_A': ['relpaed'],
  'https://w3id.org/kim/educationalLevel/level_6': ['relpaed'],
  'https://w3id.org/kim/educationalLevel/level_7': ['relpaed'],
  'https://w3id.org/kim/educationalLevel/level_8': ['relpaed'],
  'https://w3id.org/kim/educationalLevel/level_C': ['adult-education'],
};

/**
 * Shared field selection for the materialien query.
 */
const MATERIAL_FIELDS = `
        post: basis {
          title: materialTitel
          excerpt: materialKurzbeschreibung
          content: materialBeschreibung
        }
        learningresourcetypes: medientypen {
          learningresourcetype: nodes {
            name
          }
        }
        educationallevels: bildungsstufen {
          educationallevel: nodes {
            name
          }
        }
        grades: altersstufen {
          grade: nodes {
            name
          }
        }
        tags: schlagworte {
          tag: nodes {
            name
          }
        }
        licenses: lizenzen {
          license: nodes {
            name
          }
        }
        authors: autorMeta {
          authorList: materialAutoren {
            author: nodes {
              ... on Autor {
                link
                slug
                name: autorMeta {
                  first: autorVorname
                  last: autorNachname
                }
              }
            }
          }
        }
        organisations: organisationMeta {
          organisationList: materialOrganisation {
            organisation: nodes {
              ... on Organisation {
                link
                slug
                name: organisationMeta {
                  short: organisationTitel
                  long: organisationTitelLang
                }
              }
            }
          }
        }
        origin: herkunft {
          authorInterim: materialAutorInterim
          organisationInterim: materialOrganisationInterim
        }
        url: link
        import_id: materialId
        date
        image: titelbild {
          url: materialCoverUrl
          source: materialCoverQuelle
          altimages: materialCover {
            altimage: node {
              url: sourceUrl
              localurl: mediaItemUrl
              caption
            }
          }
        }`;

/**
 * Taxonomy filter parameters for building the GraphQL taxQuery clause.
 */
interface TaxQueryFilters {
  medientypSlugs?: readonly string[];
  bildungsstufeSlugs?: readonly string[];
  lizenzenSlugs?: readonly string[];
}

/**
 * Build the GraphQL query for fetching materials.
 *
 * Uses WordPress fulltext search (search parameter) which searches through
 * title, content, and excerpt. When taxonomy slugs are provided, adds
 * taxQuery clauses to filter by MEDIENTYP and/or BILDUNGSSTUFE taxonomies.
 *
 * Note: The WPGraphQL WordPress plugin used by RPI-Virtuell supports
 * the String type for the `where.search` field. The taxQuery enum values
 * (MEDIENTYP, BILDUNGSSTUFE, SLUG, IN, AND) are GraphQL enums and must be
 * interpolated directly. The terms array values come from our own constants,
 * not user input.
 */
export function buildMaterialsQuery(filters?: TaxQueryFilters): string {
  const taxArrayEntries: string[] = [];

  if (filters?.medientypSlugs) {
    taxArrayEntries.push(`{
            taxonomy: MEDIENTYP
            field: SLUG
            terms: [${filters.medientypSlugs.map((s) => `"${s}"`).join(', ')}]
            operator: IN
          }`);
  }

  if (filters?.bildungsstufeSlugs) {
    taxArrayEntries.push(`{
            taxonomy: BILDUNGSSTUFE
            field: SLUG
            terms: [${filters.bildungsstufeSlugs.map((s) => `"${s}"`).join(', ')}]
            operator: IN
          }`);
  }

  if (filters?.lizenzenSlugs) {
    taxArrayEntries.push(`{
            taxonomy: LIZENZEN
            field: SLUG
            terms: [${filters.lizenzenSlugs.map((s) => `"${s}"`).join(', ')}]
            operator: IN
          }`);
  }

  const taxQueryClause =
    taxArrayEntries.length > 0
      ? `
        taxQuery: {
          relation: AND
          taxArray: [${taxArrayEntries.join(', ')}]
        }`
      : '';

  return `
  query rpi_material($search: String!) {
    materialien(
      where: {
        search: $search${taxQueryClause}
      }
    ) {
      posts: nodes {
${MATERIAL_FIELDS}
      }
    }
  }
`;
}

/**
 * Resolve a license URI to RPI-Virtuell LIZENZEN taxonomy slugs.
 * Uses pattern matching against LICENSE_TO_LIZENZEN_SLUGS keys.
 * Returns undefined if no match is found.
 */
function resolveLicenseToSlugs(
  licenseUri: string,
): readonly string[] | undefined {
  for (const [pattern, slugs] of Object.entries(LICENSE_TO_LIZENZEN_SLUGS)) {
    if (licenseUri.includes(pattern)) {
      return slugs;
    }
  }
  return undefined;
}

/**
 * RPI-Virtuell Materialpool adapter for searching educational materials via GraphQL.
 *
 * RPI-Virtuell is a German platform for religious education materials.
 * This adapter queries their GraphQL API to search for materials by keywords/tags.
 *
 * API Endpoint: https://material.rpi-virtuell.de/graphql
 */
export class RpiVirtuellAdapter implements SourceAdapter {
  readonly sourceId = 'rpi-virtuell';
  readonly sourceName = 'RPI-Virtuell Materialpool';
  readonly capabilities: AdapterCapabilities = {
    supportedLanguages: ['de'],
    supportedTypes: ALL_RESOURCE_TYPES,
    supportsLicenseFilter: true,
    supportsEducationalLevelFilter: true,
  };

  private readonly apiUrl: string;

  constructor(config?: RpiVirtuellAdapterConfig) {
    this.apiUrl = config?.apiUrl ?? DEFAULT_API_URL;
  }

  /**
   * Search for materials matching the query.
   *
   * Uses the GraphQL API with variables to safely pass user input.
   * Note: The RPI-Virtuell API doesn't return a total count, so we
   * estimate based on whether a full page of results was returned.
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const keywords = query.keywords!.trim();
    const pageSize = Math.min(Math.max(1, query.pageSize), MAX_PAGE_SIZE);

    const medientypSlugs = query.type
      ? TYPE_TO_MEDIENTYP_SLUGS[query.type]
      : undefined;
    const bildungsstufeSlugs = query.educationalLevel
      ? EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS[query.educationalLevel]
      : undefined;
    const lizenzenSlugs = query.license
      ? resolveLicenseToSlugs(query.license)
      : undefined;
    const materialsQuery = buildMaterialsQuery({
      medientypSlugs,
      bildungsstufeSlugs,
      lizenzenSlugs,
    });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: materialsQuery,
        variables: { search: keywords },
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return EMPTY_RESULT;
      }
      throw new Error(
        `RPI-Virtuell API error: ${response.status} ${response.statusText}`,
      );
    }

    const rawData: unknown = await response.json();
    const graphqlResponse = parseRpiGraphQLResponse(rawData);

    if (graphqlResponse.errors && graphqlResponse.errors.length > 0) {
      throw new Error('RPI-Virtuell search failed');
    }

    const posts = graphqlResponse.data?.materialien?.posts ?? [];

    const items = posts
      .slice(0, pageSize)
      .map((material) => mapRpiMaterialToAmb(material));

    const total =
      items.length >= pageSize
        ? items.length * TOTAL_COUNT_ESTIMATE_MULTIPLIER
        : items.length;

    return {
      items,
      total,
    };
  }
}

/**
 * Factory function to create an RpiVirtuellAdapter.
 */
export function createRpiVirtuellAdapter(
  config?: RpiVirtuellAdapterConfig,
): RpiVirtuellAdapter {
  return new RpiVirtuellAdapter(config);
}
