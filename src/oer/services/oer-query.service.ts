import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import type { ExternalOerItemWithSource } from '@edufeed-org/oer-adapter-core';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';
import { OerQueryDto } from '../dto/oer-query.dto';
import { OerItem, OerSourceInfo, Creator } from '../dto/oer-response.dto';
import { ImgproxyService } from './imgproxy.service';
import { AdapterSearchService } from '../../adapter';
import { DEFAULT_SOURCE } from '../constants';

export interface QueryResult {
  data: OerItem[];
  total: number;
}

/**
 * Escapes SQL LIKE wildcard characters (% and _) in a string.
 * This prevents users from injecting wildcards that could affect query behavior.
 */
function escapeLikeWildcards(value: string): string {
  return value.replace(/[%_]/g, '\\$&');
}

/**
 * Type guard to check if a value is a non-null object (Record-like).
 */
function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class OerQueryService {
  constructor(
    @InjectRepository(OpenEducationalResource)
    private oerRepository: Repository<OpenEducationalResource>,
    private imgproxyService: ImgproxyService,
    private adapterSearchService: AdapterSearchService,
  ) {}

  async findAll(query: OerQueryDto): Promise<QueryResult> {
    // Route to specific source based on query parameter
    // Default (undefined or DEFAULT_SOURCE): query only Nostr database
    // Other values: query specific external adapter
    if (query.source && query.source !== DEFAULT_SOURCE) {
      return this.findFromAdapter(query, query.source);
    }

    // Default: query only Nostr database
    return this.findNostrResources(query);
  }

  private async findFromAdapter(
    query: OerQueryDto,
    sourceId: string,
  ): Promise<QueryResult> {
    const adapterResult = await this.adapterSearchService.searchBySource(
      query,
      sourceId,
    );

    return {
      data: adapterResult.items.map((item) =>
        this.mapAdapterItemToOerItem(item),
      ),
      total: adapterResult.total,
    };
  }

  private async findNostrResources(query: OerQueryDto): Promise<QueryResult> {
    const qb = this.oerRepository
      .createQueryBuilder('oer')
      .leftJoinAndSelect('oer.sources', 'sources')
      // Ensure deterministic ordering of sources by creation date (oldest first)
      .addOrderBy('sources.created_at', 'ASC');

    // Apply type filter with OR logic (search both MIME type and AMB type)
    if (query.type) {
      const escapedType = escapeLikeWildcards(query.type);
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(oer.file_mime_type) LIKE LOWER(:type) ESCAPE '\\'", {
            type: `%${escapedType}%`,
          }).orWhere(
            "LOWER(oer.amb_metadata->>'type') LIKE LOWER(:type) ESCAPE '\\'",
            {
              type: `%${escapedType}%`,
            },
          );
        }),
      );
    }

    // Apply searchTerm filter (search in keywords array, name, and description)
    if (query.searchTerm) {
      const escapedKeywords = escapeLikeWildcards(query.searchTerm);
      qb.andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(COALESCE(oer.keywords, '[]'::jsonb)) AS keyword
              WHERE LOWER(keyword) LIKE LOWER(:keywords) ESCAPE '\\'
            )`,
            { keywords: `%${escapedKeywords}%` },
          )
            .orWhere(
              "LOWER(COALESCE(oer.amb_metadata->>'name', '')) LIKE LOWER(:keywords) ESCAPE '\\'",
              { keywords: `%${escapedKeywords}%` },
            )
            .orWhere(
              "LOWER(COALESCE(oer.description, '')) LIKE LOWER(:keywords) ESCAPE '\\'",
              { keywords: `%${escapedKeywords}%` },
            );
        }),
      );
    }

    // Apply license filter (exact match)
    if (query.license) {
      qb.andWhere('oer.license_uri = :license', {
        license: query.license,
      });
    }

    // Apply free_for_use filter
    if (query.free_for_use !== undefined) {
      qb.andWhere('oer.free_to_use = :free_for_use', {
        free_for_use: query.free_for_use,
      });
    }

    // Apply educational_level filter (exact match on nested JSON field)
    if (query.educational_level) {
      qb.andWhere(
        "oer.amb_metadata->'educationalLevel'->>'id' = :educational_level",
        {
          educational_level: query.educational_level,
        },
      );
    }

    // Apply language filter (search in inLanguage array)
    if (query.language) {
      qb.andWhere(`oer.amb_metadata->'inLanguage' @> :language::jsonb`, {
        language: JSON.stringify([query.language]),
      });
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination
    const skip = (query.page - 1) * query.pageSize;
    qb.skip(skip).take(query.pageSize);

    // Execute query
    const data = await qb.getMany();

    return {
      data: data.map((oer) => this.mapToOerItem(oer)),
      total,
    };
  }

  // Maps data for API usage and also adds image proxy urls, sources, and creators
  private mapToOerItem(oer: OpenEducationalResource): OerItem {
    // Destructure to omit TypeORM relations and url_external_landing_page from API response
    const { sources: oerSources, url_external_landing_page, ...item } = oer;

    // Check if this is an image resource
    const isImage = this.isImageResource(oer);

    // Only generate images URLs for actual images
    const imgProxyUrls = isImage
      ? this.imgproxyService.generateUrls(oer.url)
      : null;

    // Extract creators from AMB metadata
    const creators = this.extractCreatorsFromAmbMetadata(oer.amb_metadata);

    // Map sources to API format (already ordered by created_at ASC from query)
    const sources: OerSourceInfo[] =
      oerSources?.map((source) => ({
        source_name: source.source_name,
        source_identifier: source.source_identifier,
        created_at: source.created_at,
      })) ?? [];

    return {
      ...item,
      images: imgProxyUrls,
      sources,
      creators,
      foreign_landing_url: url_external_landing_page,
    };
  }

  /**
   * Maps an adapter item to the OerItem format.
   * External adapter items have a single source, which we convert to a sources array.
   */
  private mapAdapterItemToOerItem(item: ExternalOerItemWithSource): OerItem {
    return {
      id: item.id,
      url: item.url,
      foreign_landing_url: item.foreign_landing_url,
      name: item.name,
      description: item.description,
      attribution: item.attribution,
      keywords: item.keywords,
      license_uri: item.license_uri,
      free_to_use: item.free_to_use,
      file_mime_type: item.file_mime_type,
      file_size: item.file_size,
      file_dim: item.file_dim,
      file_alt: item.file_alt,
      images: item.images,
      // source_name indicates the authoritative source for this OER
      source_name: item.source,
      // Convert single source to sources array format
      sources: [
        {
          source_name: item.source,
          source_identifier: item.id,
          created_at: new Date(),
        },
      ],
      creators: item.creators,
      // Fields that are specific to Nostr/database records - set to null for adapters
      amb_metadata: null,
      audience_uri: null,
      educational_level_uri: null,
      created_at: null,
      updated_at: null,
    };
  }

  /**
   * Extract creators from AMB metadata.
   * AMB metadata may contain creator/author information in various formats.
   */
  private extractCreatorsFromAmbMetadata(
    metadata: Record<string, unknown> | null,
  ): Creator[] {
    if (!metadata) {
      return [];
    }

    const creators: Creator[] = [];

    // Try to extract from 'creator' field (can be object or array)
    const creatorField = metadata['creator'];
    if (creatorField) {
      const creatorArray = Array.isArray(creatorField)
        ? creatorField
        : [creatorField];
      for (const creator of creatorArray) {
        const parsed = this.parseCreator(creator);
        if (parsed) {
          creators.push(parsed);
        }
      }
    }

    // Try to extract from 'author' field as fallback
    const authorField = metadata['author'];
    if (authorField && creators.length === 0) {
      const authorArray = Array.isArray(authorField)
        ? authorField
        : [authorField];
      for (const author of authorArray) {
        const parsed = this.parseCreator(author);
        if (parsed) {
          creators.push(parsed);
        }
      }
    }

    return creators;
  }

  /**
   * Parse a single creator object from AMB metadata.
   */
  private parseCreator(creator: unknown): Creator | null {
    if (typeof creator === 'string') {
      return {
        type: 'person',
        name: creator,
        link: null,
      };
    }

    if (isRecordObject(creator)) {
      const name = creator['name'];
      if (typeof name === 'string' && name.length > 0) {
        return {
          type:
            typeof creator['type'] === 'string' ? creator['type'] : 'person',
          name,
          link:
            typeof creator['url'] === 'string'
              ? creator['url']
              : typeof creator['link'] === 'string'
                ? creator['link']
                : null,
        };
      }
    }

    return null;
  }

  private isImageResource(oer: OpenEducationalResource): boolean {
    // Check if file_mime_type includes "image"
    if (oer.file_mime_type?.toLowerCase().includes('image')) {
      return true;
    }

    // Check if amb_metadata.type is "Image" (case-insensitive)
    const metadataType = oer.amb_metadata?.type;
    if (
      typeof metadataType === 'string' &&
      metadataType.toLowerCase() === 'image'
    ) {
      return true;
    }

    return false;
  }
}
