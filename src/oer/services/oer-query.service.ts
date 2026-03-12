import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import type { ExternalOerItemWithSource } from '@edufeed-org/oer-adapter-core';
import { OpenEducationalResource } from '@edufeed-org/oer-entities';
import { OerQueryDto } from '../dto/oer-query.dto';
import { OerItem } from '../dto/oer-response.dto';
import { AssetUrlService } from './asset-url.service';
import { AdapterSearchService } from '../../adapter';
import { NOSTR_SOURCE_ID } from '../../adapter/adapter.constants';

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
    private readonly oerRepository: Repository<OpenEducationalResource>,
    private readonly assetUrlService: AssetUrlService,
    private readonly adapterSearchService: AdapterSearchService,
  ) {}

  async findAll(query: OerQueryDto): Promise<QueryResult> {
    if (query.source === NOSTR_SOURCE_ID) {
      return this.findNostrResources(query);
    }
    return this.findFromAdapter(query, query.source);
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
      .addOrderBy('sources.created_at', 'ASC');

    // Apply type filter with OR logic (search both MIME type and metadata type)
    if (query.type) {
      const escapedType = escapeLikeWildcards(query.type);
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(oer.file_mime_type) LIKE LOWER(:type) ESCAPE '\\'", {
            type: `%${escapedType}%`,
          }).orWhere(
            "LOWER(oer.metadata_type) LIKE LOWER(:metadataType) ESCAPE '\\'",
            {
              metadataType: `%${escapedType}%`,
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
              "LOWER(COALESCE(oer.name, '')) LIKE LOWER(:keywords) ESCAPE '\\'",
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

    // Apply educational_level filter (exact match on column)
    if (query.educational_level) {
      qb.andWhere('oer.educational_level_uri = :educational_level', {
        educational_level: query.educational_level,
      });
    }

    // Apply language filter (search in inLanguage array in metadata)
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
      data: data.map((oer) => this.mapEntityToOerItem(oer)),
      total,
    };
  }

  private mapEntityToOerItem(oer: OpenEducationalResource): OerItem {
    const isImage = this.isImageResource(oer);
    const sourceUrl: string | null = oer.url;
    const imageUrls = isImage
      ? this.assetUrlService.resolveAssetUrls(null, sourceUrl)
      : null;

    // Build AMB metadata from database metadata field (immutable — don't mutate entity)
    const amb = {
      ...(oer.metadata ?? {}),
      id: oer.url,
    } as Record<string, unknown>;

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
        images: imageUrls,
        system: {
          source: oer.source_name,
          foreignLandingUrl: oer.url_external_landing_page ?? null,
          attribution: oer.attribution ?? null,
        },
      },
    };
  }

  /**
   * Maps an adapter item to the OerItem format.
   * External adapters return AMB format, so we just need to wrap it in extensions.
   */
  private mapAdapterItemToOerItem(item: ExternalOerItemWithSource): OerItem {
    const sourceUrl: string | null = item.amb.id ?? null;
    const imageUrls = this.assetUrlService.resolveAssetUrls(
      item.extensions.images ?? null,
      sourceUrl,
    );

    return {
      amb: item.amb,
      extensions: {
        fileMetadata: null,
        images: imageUrls,
        system: {
          source: item.source,
          foreignLandingUrl: item.extensions.foreignLandingUrl ?? null,
          attribution: item.extensions.attribution ?? null,
        },
      },
    };
  }

  private isImageResource(oer: OpenEducationalResource): boolean {
    if (oer.file_mime_type?.toLowerCase().includes('image')) {
      return true;
    }

    if (
      typeof oer.metadata_type === 'string' &&
      oer.metadata_type.toLowerCase() === 'image'
    ) {
      return true;
    }

    return false;
  }
}
