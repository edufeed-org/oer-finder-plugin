import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import type { ExternalOerItemWithSource } from '@edufeed-org/oer-adapter-core';
import { OpenEducationalResource } from '@edufeed-org/oer-entities';
import { OerQueryDto } from '../dto/oer-query.dto';
import { OerItem } from '../dto/oer-response.dto';
import { ImgproxyService } from './imgproxy.service';
import { AdapterSearchService } from '../../adapter';
import { SOURCE_NAME_NOSTR } from '@edufeed-org/oer-nostr';

/**
 * Default source for OER queries (Nostr network)
 */
const DEFAULT_SOURCE = SOURCE_NAME_NOSTR;

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

    // Apply type filter with OR logic (search both MIME type and metadata type)
    if (query.type) {
      const escapedType = escapeLikeWildcards(query.type);
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(oer.file_mime_type) LIKE LOWER(:type) ESCAPE '\\'", {
            type: `%${escapedType}%`,
          }).orWhere(
            "LOWER(oer.metadata->>'type') LIKE LOWER(:type) ESCAPE '\\'",
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
              "LOWER(COALESCE(oer.metadata->>'name', '')) LIKE LOWER(:keywords) ESCAPE '\\'",
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
        "oer.metadata->'educationalLevel'->>'id' = :educational_level",
        {
          educational_level: query.educational_level,
        },
      );
    }

    // Apply language filter (search in inLanguage array)
    if (query.language) {
      qb.andWhere(`oer.metadata->'inLanguage' @> :language::jsonb`, {
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

  // Maps data for API usage and also adds image proxy urls
  private mapToOerItem(oer: OpenEducationalResource): OerItem {
    // Check if this is an image resource
    const isImage = this.isImageResource(oer);

    // Only generate images URLs for actual images
    const imgProxyUrls = isImage
      ? this.imgproxyService.generateUrls(oer.url)
      : null;

    // Build AMB metadata from database metadata field
    const amb = (oer.metadata ?? {}) as Record<string, unknown>;

    // Set resource URL as amb.id per Schema.org standard
    amb.id = oer.url;

    // Build file metadata extensions for fields not in AMB
    // Note: MIME type and file size should go in AMB encoding field
    const fileMetadata =
      oer.file_dim || oer.file_alt
        ? {
            fileDim: oer.file_dim,
            fileAlt: oer.file_alt,
          }
        : null;

    return {
      amb,
      extensions: {
        fileMetadata,
        images: imgProxyUrls,
        system: {
          source: oer.source_name,
          foreignLandingUrl: oer.url_external_landing_page,
          attribution: oer.attribution,
        },
      },
    };
  }

  /**
   * Maps an adapter item to the OerItem format.
   * External adapters now return AMB format, so we just need to wrap it in extensions.
   */
  private mapAdapterItemToOerItem(item: ExternalOerItemWithSource): OerItem {
    // Generate imgproxy URLs for images if needed (or use provided images)
    // Note: Resource URL should be in amb.id per Schema.org standard
    const imgProxyUrls = item.extensions.images
      ? item.extensions.images
      : item.amb.id
        ? this.imgproxyService.generateUrls(item.amb.id as string)
        : null;

    return {
      amb: item.amb,
      extensions: {
        // External adapters don't have file metadata
        fileMetadata: null,
        // Use imgproxy URLs (either from adapter or generated)
        images: imgProxyUrls,
        system: {
          source: item.source,
          foreignLandingUrl: item.extensions.foreign_landing_url ?? null,
          attribution: item.extensions.attribution ?? null,
        },
      },
    };
  }

  private isImageResource(oer: OpenEducationalResource): boolean {
    // Check if file_mime_type includes "image"
    if (oer.file_mime_type?.toLowerCase().includes('image')) {
      return true;
    }

    // Check if metadata.type is "Image" (case-insensitive)
    const metadataType = oer.metadata?.type;
    if (
      typeof metadataType === 'string' &&
      metadataType.toLowerCase() === 'image'
    ) {
      return true;
    }

    return false;
  }
}
