import { Injectable } from '@nestjs/common';
import type { ExternalOerItemWithSource } from '@edufeed-org/oer-adapter-core';
import { OerQueryDto } from '../dto/oer-query.dto';
import { OerItem } from '../dto/oer-response.dto';
import { ImgproxyService } from './imgproxy.service';
import { AdapterSearchService } from '../../adapter';

export interface QueryResult {
  data: OerItem[];
  total: number;
}

@Injectable()
export class OerQueryService {
  constructor(
    private imgproxyService: ImgproxyService,
    private adapterSearchService: AdapterSearchService,
  ) {}

  async findAll(query: OerQueryDto): Promise<QueryResult> {
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

  /**
   * Maps an adapter item to the OerItem format.
   * External adapters return AMB format, so we just need to wrap it in extensions.
   */
  private mapAdapterItemToOerItem(item: ExternalOerItemWithSource): OerItem {
    const imgProxyUrls = item.extensions.images
      ? item.extensions.images
      : item.amb.id
        ? this.imgproxyService.generateUrls(item.amb.id)
        : null;

    return {
      amb: item.amb,
      extensions: {
        fileMetadata: null,
        images: imgProxyUrls,
        system: {
          source: item.source,
          foreignLandingUrl: item.extensions.foreignLandingUrl ?? null,
          attribution: item.extensions.attribution ?? null,
        },
      },
    };
  }
}
