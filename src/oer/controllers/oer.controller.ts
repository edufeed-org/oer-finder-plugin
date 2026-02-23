import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import * as v from 'valibot';
import { OerQueryService } from '../services/oer-query.service';
import { parseOerQuery, OerQueryDto } from '../dto/oer-query.dto';
import { OerListResponse } from '../dto/oer-response.dto';
import { ApiOerQuery } from '../decorators/api-oer-query.decorator';

@ApiTags('OER')
@Controller('api/v1/oer')
@UseGuards(ThrottlerGuard)
export class OerController {
  private readonly logger = new Logger(OerController.name);

  constructor(
    private readonly oerQueryService: OerQueryService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOerQuery()
  async getOer(
    @Query() rawQuery: Record<string, string>,
  ): Promise<OerListResponse> {
    // Validate with valibot (handles type coercion from strings)
    let validatedQuery: OerQueryDto;
    try {
      validatedQuery = parseOerQuery(rawQuery);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const isProduction =
          this.configService.get('app.nodeEnv') === 'production';

        // Log detailed errors server-side
        this.logger.error(`Validation error: ${JSON.stringify(error.issues)}`);

        // Return generic message in production, detailed in development
        const message = isProduction
          ? 'Invalid query parameters'
          : error.issues.map((issue) => issue.message);

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message,
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }

    // Query via adapter
    const result = await this.oerQueryService.findAll(validatedQuery);

    // Format response with metadata
    const totalPages = Math.ceil(result.total / validatedQuery.pageSize);

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: validatedQuery.page,
        pageSize: validatedQuery.pageSize,
        totalPages,
      },
    };
  }
}
