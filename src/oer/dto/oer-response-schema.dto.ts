import { ApiProperty } from '@nestjs/swagger';

export class AmbMetadataSchema {
  @ApiProperty({
    description: 'Type of the educational resource',
    example: 'LearningResource',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Name of the educational resource',
    example: 'Introduction to TypeScript',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Educational level',
    example: 'Beginner',
    required: false,
  })
  educationalLevel?: string;

  @ApiProperty({
    description: 'Language code',
    example: ['en'],
    required: false,
  })
  inLanguage?: string;

  @ApiProperty({
    description: 'Type of learning resource',
    example: 'Tutorial',
    required: false,
  })
  learningResourceType?: string;
}

export class OerItemSchema {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'URL of the resource',
    example: 'https://w3id.org/kim/hcrt/worksheet',
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    description: 'License URI',
    example: 'https://creativecommons.org/licenses/by/4.0/',
    nullable: true,
  })
  amb_license_uri: string | null;

  @ApiProperty({
    description: 'Whether the resource is free to use',
    example: true,
    nullable: true,
  })
  amb_free_to_use: boolean | null;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
    nullable: true,
  })
  file_mime_type: string | null;

  @ApiProperty({
    description:
      'AMB metadata object containing type, name, educational level, language, etc.',
    nullable: true,
    example: {
      type: 'LearningResource',
      name: 'Introduction to TypeScript',
      educationalLevel: 'Beginner',
      inLanguage: ['en'],
      learningResourceType: 'Tutorial',
    },
  })
  amb_metadata: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Array of keywords associated with the resource',
    example: ['typescript', 'programming', 'tutorial'],
    nullable: true,
    type: [String],
  })
  amb_keywords: string[] | null;

  @ApiProperty({
    description: 'Dimensions of the file (e.g., for images or videos)',
    example: '1920x1080',
    nullable: true,
  })
  file_dim: string | null;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 1024000,
    nullable: true,
  })
  file_size: number | null;

  @ApiProperty({
    description: 'Alternative text for the file',
    example: 'A diagram showing TypeScript type system',
    nullable: true,
  })
  file_alt: string | null;

  @ApiProperty({
    description: 'Description of the resource',
    example: 'A comprehensive guide to learning TypeScript for beginners',
    nullable: true,
  })
  amb_description: string | null;

  @ApiProperty({
    description: 'Audience URI',
    example: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
    nullable: true,
  })
  audience_uri: string | null;

  @ApiProperty({
    description: 'Educational level URI',
    example: 'https://w3id.org/kim/educationalLevel/level_06',
    nullable: true,
  })
  educational_level_uri: string | null;

  @ApiProperty({
    description: 'Date the resource was created (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  amb_date_created: Date | null;

  @ApiProperty({
    description: 'Date the resource was published (ISO 8601)',
    example: '2024-02-01T12:00:00Z',
    nullable: true,
  })
  amb_date_published: Date | null;

  @ApiProperty({
    description: 'Date the resource was last modified (ISO 8601)',
    example: '2024-03-10T14:45:00Z',
    nullable: true,
  })
  amb_date_modified: Date | null;

  @ApiProperty({
    description: 'Nostr event ID for the AMB event',
    example: 'abc123def456',
    nullable: true,
  })
  event_amb_id: string | null;

  @ApiProperty({
    description: 'Nostr event ID for the file event',
    example: 'xyz789uvw012',
    nullable: true,
  })
  event_file_id: string | null;

  @ApiProperty({
    description: 'Timestamp when the record was created in the database',
    example: '2024-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the record was last updated in the database',
    example: '2024-01-15T10:30:00Z',
  })
  updated_at: Date;
}

export class OerMetadataSchema {
  @ApiProperty({
    description: 'Total number of resources matching the query',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}

export class OerListResponseSchema {
  @ApiProperty({
    description: 'Array of Open Educational Resources',
    type: [OerItemSchema],
  })
  data: OerItemSchema[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: OerMetadataSchema,
  })
  meta: OerMetadataSchema;
}
