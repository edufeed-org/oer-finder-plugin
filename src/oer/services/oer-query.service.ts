import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';
import { OerQueryDto } from '../dto/oer-query.dto';
import { OerItem } from '../dto/oer-response.dto';

export interface QueryResult {
  data: OerItem[];
  total: number;
}

@Injectable()
export class OerQueryService {
  constructor(
    @InjectRepository(OpenEducationalResource)
    private oerRepository: Repository<OpenEducationalResource>,
  ) {}

  async findAll(query: OerQueryDto): Promise<QueryResult> {
    const qb = this.oerRepository.createQueryBuilder('oer');

    // Apply type filter with OR logic (search both MIME type and AMB type)
    if (query.type) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(oer.file_mime_type) LIKE LOWER(:type)', {
            type: `%${query.type}%`,
          }).orWhere("LOWER(oer.amb_metadata->>'type') LIKE LOWER(:type)", {
            type: `%${query.type}%`,
          });
        }),
      );
    }

    // Apply description filter
    if (query.description) {
      qb.andWhere('LOWER(oer.amb_description) LIKE LOWER(:description)', {
        description: `%${query.description}%`,
      });
    }

    // Apply name filter (search in AMB metadata)
    if (query.name) {
      qb.andWhere("LOWER(oer.amb_metadata->>'name') LIKE LOWER(:name)", {
        name: `%${query.name}%`,
      });
    }

    // Apply keywords filter (search in keywords array)
    if (query.keywords) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(oer.amb_keywords) AS keyword
          WHERE LOWER(keyword) LIKE LOWER(:keywords)
        )`,
        {
          keywords: `%${query.keywords}%`,
        },
      );
    }

    // Apply license filter (exact match)
    if (query.license) {
      qb.andWhere('oer.amb_license_uri = :license', {
        license: query.license,
      });
    }

    // Apply free_for_use filter
    if (query.free_for_use !== undefined) {
      qb.andWhere('oer.amb_free_to_use = :free_for_use', {
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

    // Apply date range filters
    if (query.date_created_from) {
      qb.andWhere('oer.amb_date_created >= :date_created_from', {
        date_created_from: query.date_created_from,
      });
    }
    if (query.date_created_to) {
      qb.andWhere('oer.amb_date_created <= :date_created_to', {
        date_created_to: this.getEndOfDay(query.date_created_to),
      });
    }

    if (query.date_published_from) {
      qb.andWhere('oer.amb_date_published >= :date_published_from', {
        date_published_from: query.date_published_from,
      });
    }
    if (query.date_published_to) {
      qb.andWhere('oer.amb_date_published <= :date_published_to', {
        date_published_to: this.getEndOfDay(query.date_published_to),
      });
    }

    if (query.date_modified_from) {
      qb.andWhere('oer.amb_date_modified >= :date_modified_from', {
        date_modified_from: query.date_modified_from,
      });
    }
    if (query.date_modified_to) {
      qb.andWhere('oer.amb_date_modified <= :date_modified_to', {
        date_modified_to: this.getEndOfDay(query.date_modified_to),
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

  private getEndOfDay(dateString: string): string {
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  private mapToOerItem(oer: OpenEducationalResource): OerItem {
    // Destructure to omit TypeORM relations from API response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventAmb, eventFile, ...item } = oer;
    return item;
  }
}
