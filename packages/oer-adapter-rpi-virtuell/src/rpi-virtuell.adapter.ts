import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
} from '@edufeed-org/oer-adapter-core';
import { parseRpiGraphQLResponse } from './rpi-virtuell.types.js';
import { mapRpiMaterialToAmb } from './mappers/rpi-virtuell-to-amb.mapper.js';

/** Default API endpoint */
const DEFAULT_API_URL = 'https://material.rpi-virtuell.de/graphql';

/**
 * Configuration options for the RPI-Virtuell adapter.
 */
export interface RpiVirtuellAdapterConfig {
  /** GraphQL API endpoint URL (defaults to https://material.rpi-virtuell.de/graphql) */
  apiUrl?: string;
}

/**
 * Build the GraphQL query for searching materials.
 *
 * Uses WordPress fulltext search (search parameter) which searches through
 * title, content, and excerpt. This provides much better results than
 * exact tag matching alone.
 */
function buildGraphQLQuery(
  keywords: string,
  first: number,
  _offset: number,
): string {
  // Escape double quotes in search string for GraphQL
  const searchString = keywords.replace(/"/g, '\\"');

  return `
    query rpi_material {
      materialien(
        first: ${first}
        where: {
          search: "${searchString}"
        }
      ) {
        posts: nodes {
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
          }
        }
      }
    }
  `;
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

  private readonly apiUrl: string;

  constructor(config?: RpiVirtuellAdapterConfig) {
    this.apiUrl = config?.apiUrl ?? DEFAULT_API_URL;
  }

  /**
   * Search for materials matching the query.
   *
   * Uses the GraphQL API to search by tags/keywords.
   * Note: The RPI-Virtuell API doesn't support pagination offset directly,
   * so we use 'first' parameter for page size.
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    const keywords = query.keywords?.trim();
    if (!keywords) {
      return { items: [], total: 0 };
    }

    const first = query.pageSize;
    const offset = (query.page - 1) * query.pageSize;

    const graphqlQuery = buildGraphQLQuery(keywords, first, offset);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
      signal: options?.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { items: [], total: 0 };
      }
      throw new Error(
        `RPI-Virtuell API error: ${response.status} ${response.statusText}`,
      );
    }

    const rawData: unknown = await response.json();
    const graphqlResponse = parseRpiGraphQLResponse(rawData);

    if (graphqlResponse.errors && graphqlResponse.errors.length > 0) {
      const errorMessages = graphqlResponse.errors
        .map((e) => e.message)
        .join(', ');
      throw new Error(`RPI-Virtuell GraphQL error: ${errorMessages}`);
    }

    const posts = graphqlResponse.data?.materialien?.posts ?? [];

    const items = posts.map((material) => mapRpiMaterialToAmb(material));

    // The API doesn't return total count, so we estimate based on results
    // If we got a full page, there might be more
    const total = items.length >= first ? items.length * 10 : items.length;

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
