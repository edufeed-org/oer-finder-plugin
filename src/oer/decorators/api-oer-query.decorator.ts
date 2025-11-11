import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { OerListResponseSchema } from '../dto/oer-response-schema.dto';

/**
 * Combined API documentation decorator for the OER query endpoint.
 * Consolidates all Swagger decorators in one place to keep the controller clean.
 */
export function ApiOerQuery() {
  return applyDecorators(
    ApiOperation({
      summary: 'Query Open Educational Resources',
      description:
        'Search and filter OER aggregated from Nostr relays. Supports pagination and various filters including type, description, keywords, license, educational level, language, and date ranges. Rate limited to 10 requests per 60 seconds per IP.',
    }),

    // Pagination parameters
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (min: 1, default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Items per page (min: 1, max: 20, default: 20)',
      example: 20,
    }),

    // Filter parameters
    ApiQuery({
      name: 'type',
      required: false,
      type: String,
      description: 'Filter by MIME type or AMB metadata type (partial match)',
      example: 'image',
    }),
    ApiQuery({
      name: 'description',
      required: false,
      type: String,
      description: 'Filter by description (partial match)',
      example: 'plants',
    }),
    ApiQuery({
      name: 'name',
      required: false,
      type: String,
      description: 'Filter by AMB metadata name (partial match)',
      example: 'biology',
    }),
    ApiQuery({
      name: 'keywords',
      required: false,
      type: String,
      description: 'Filter by keywords (searches in keywords array)',
      example: 'plants',
    }),
    ApiQuery({
      name: 'license',
      required: false,
      type: String,
      description: 'Filter by license URI (exact match)',
      example: 'https://creativecommons.org/licenses/by/4.0/',
    }),
    ApiQuery({
      name: 'free_for_use',
      required: false,
      type: Boolean,
      description: 'Filter by free for use status (true or false)',
      example: true,
    }),
    ApiQuery({
      name: 'educational_level',
      required: false,
      type: String,
      description: 'Filter by educational level URI (exact match)',
      example: 'https://w3id.org/kim/educationalLevel/level_06',
    }),
    ApiQuery({
      name: 'language',
      required: false,
      type: String,
      description:
        'Filter by language code (2-3 lowercase letters, e.g., "en", "fr")',
      example: 'en',
    }),

    // Date range parameters
    ApiQuery({
      name: 'date_created_from',
      required: false,
      type: String,
      description: 'Filter by creation date from (ISO 8601 format)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'date_created_to',
      required: false,
      type: String,
      description: 'Filter by creation date to (ISO 8601 format)',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'date_published_from',
      required: false,
      type: String,
      description: 'Filter by published date from (ISO 8601 format)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'date_published_to',
      required: false,
      type: String,
      description: 'Filter by published date to (ISO 8601 format)',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'date_modified_from',
      required: false,
      type: String,
      description: 'Filter by modified date from (ISO 8601 format)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'date_modified_to',
      required: false,
      type: String,
      description: 'Filter by modified date to (ISO 8601 format)',
      example: '2024-12-31',
    }),

    // Response documentation
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved OER list',
      type: OerListResponseSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid query parameters',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            oneOf: [
              { type: 'string', example: 'Invalid query parameters' },
              {
                type: 'array',
                items: { type: 'string' },
                example: [
                  'page must be at least 1',
                  'pageSize must be at most 20',
                ],
              },
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded (10 requests per 60 seconds per IP)',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 429 },
          message: {
            type: 'string',
            example: 'ThrottlerException: Too Many Requests',
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
