import { ApiProperty } from '@nestjs/swagger';

export class AmbMetadataSchema {
  @ApiProperty({
    description: 'JSON-LD context URI(s)',
    example: ['https://w3id.org/kim/amb/context.jsonld'],
    required: false,
  })
  '@context'?: string | string[];

  @ApiProperty({
    description: 'Unique identifier (URI) of the resource',
    example: 'https://example.org/resource/123',
    required: false,
  })
  id?: string;

  @ApiProperty({
    description:
      'Type of the educational resource (e.g., LearningResource, CreativeWork)',
    example: 'LearningResource',
    required: false,
  })
  type?: string | string[];

  @ApiProperty({
    description: 'Name/title of the educational resource',
    example: 'Introduction to Biology',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Textual description of the resource content',
    example: 'A comprehensive guide to basic biology concepts for students',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description:
      'Subject matter or topics covered (references to controlled vocabularies)',
    example: [{ id: 'http://w3id.org/kim/hochschulfaechersystematik/n079' }],
    required: false,
  })
  about?: unknown;

  @ApiProperty({
    description: 'Keywords/tags describing the resource',
    example: ['biology', 'science', 'education'],
    required: false,
    type: [String],
  })
  keywords?: string[];

  @ApiProperty({
    description: 'Language code(s) following BCP47 standard',
    example: ['en', 'de'],
    required: false,
    type: [String],
  })
  inLanguage?: string[];

  @ApiProperty({
    description: 'URL of a thumbnail or preview image',
    example: 'https://example.org/images/resource-thumbnail.jpg',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Video or audio preview with contentUrl or embedUrl',
    example: {
      type: 'VideoObject',
      contentUrl: 'https://example.org/videos/preview.mp4',
    },
    required: false,
  })
  trailer?: unknown;

  @ApiProperty({
    description:
      'Creator(s) of the resource (Person or Organization with name, type, and optional identifiers)',
    example: [{ type: 'Person', name: 'Jane Doe' }],
    required: false,
  })
  creator?: unknown;

  @ApiProperty({
    description: 'Additional contributor(s) to the resource',
    example: [{ type: 'Person', name: 'John Smith' }],
    required: false,
  })
  contributor?: unknown;

  @ApiProperty({
    description: 'Organizational affiliation of the creator',
    example: { type: 'Organization', name: 'University of Example' },
    required: false,
  })
  affiliation?: unknown;

  @ApiProperty({
    description: 'Date the resource was created (ISO 8601 format)',
    example: '2024-01-15',
    required: false,
  })
  dateCreated?: string;

  @ApiProperty({
    description: 'Date the resource was published (ISO 8601 format)',
    example: '2024-02-01',
    required: false,
  })
  datePublished?: string;

  @ApiProperty({
    description: 'Date the resource was last modified (ISO 8601 format)',
    example: '2024-03-10',
    required: false,
  })
  dateModified?: string;

  @ApiProperty({
    description: 'Publisher(s) of the resource',
    example: [{ type: 'Organization', name: 'Educational Press' }],
    required: false,
  })
  publisher?: unknown;

  @ApiProperty({
    description: 'Funding source(s) or program(s)',
    example: [{ type: 'Organization', name: 'Research Foundation' }],
    required: false,
  })
  funder?: unknown;

  @ApiProperty({
    description: 'Whether the resource is free to access',
    example: true,
    required: false,
  })
  isAccessibleForFree?: boolean;

  @ApiProperty({
    description: 'License information (Creative Commons or other open license)',
    example: { id: 'https://creativecommons.org/licenses/by/4.0/' },
    required: false,
  })
  license?: unknown;

  @ApiProperty({
    description: 'Access requirements or restrictions',
    example: { type: 'ConditionsOfAccess', name: 'Registration required' },
    required: false,
  })
  conditionsOfAccess?: unknown;

  @ApiProperty({
    description:
      'Type of learning resource (references to HCRT/OEHRT vocabularies)',
    example: [{ id: 'https://w3id.org/kim/hcrt/worksheet' }],
    required: false,
  })
  learningResourceType?: unknown;

  @ApiProperty({
    description: 'Target audience role(s) per LRMI',
    example: [
      {
        id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      },
    ],
    required: false,
  })
  audience?: unknown;

  @ApiProperty({
    description: 'Competencies that learners can achieve',
    example: [{ type: 'DefinedTerm', name: 'Understanding cell division' }],
    required: false,
  })
  teaches?: unknown;

  @ApiProperty({
    description: 'Competencies that can be assessed/evaluated',
    example: [{ type: 'DefinedTerm', name: 'Knowledge of photosynthesis' }],
    required: false,
  })
  assesses?: unknown;

  @ApiProperty({
    description: 'Prerequisites for understanding the resource',
    example: [{ type: 'DefinedTerm', name: 'Basic chemistry knowledge' }],
    required: false,
  })
  competencyRequired?: unknown;

  @ApiProperty({
    description:
      'Educational level or stage (references to educational level vocabularies)',
    example: [{ id: 'https://w3id.org/kim/educationalLevel/level_06' }],
    required: false,
  })
  educationalLevel?: unknown;

  @ApiProperty({
    description: 'Learning method (expositive/active/mixed)',
    example: { id: 'http://w3id.org/kim/interactivitytype/mixed' },
    required: false,
  })
  interactivityType?: unknown;

  @ApiProperty({
    description: 'Source resource for derivative works',
    example: [{ id: 'https://example.org/original-resource' }],
    required: false,
  })
  isBasedOn?: unknown;

  @ApiProperty({
    description: 'Parent resource(s) or collection(s)',
    example: [{ id: 'https://example.org/course/biology-101' }],
    required: false,
  })
  isPartOf?: unknown;

  @ApiProperty({
    description: 'Child or component resource(s)',
    example: [{ id: 'https://example.org/lesson/cell-structure' }],
    required: false,
  })
  hasPart?: unknown;

  @ApiProperty({
    description: 'Metadata provider and creation information',
    example: [
      {
        type: 'WebPage',
        dateCreated: '2024-01-15',
        provider: { type: 'Organization', name: 'Metadata Service' },
      },
    ],
    required: false,
  })
  mainEntityOfPage?: unknown;

  @ApiProperty({
    description: 'Playback duration (ISO 8601 format)',
    example: 'PT1H30M',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    description: 'Download options with MediaObject details',
    example: [
      {
        type: 'MediaObject',
        contentUrl: 'https://example.org/downloads/resource.pdf',
        encodingFormat: 'application/pdf',
      },
    ],
    required: false,
  })
  encoding?: unknown;

  @ApiProperty({
    description: 'Subtitle files for audiovisual content',
    example: [
      {
        type: 'MediaObject',
        contentUrl: 'https://example.org/captions/en.vtt',
        inLanguage: 'en',
      },
    ],
    required: false,
  })
  caption?: unknown;
}

export class CreatorSchema {
  @ApiProperty({
    description: 'Type of creator (e.g., "person", "organization")',
    example: 'person',
  })
  type: string;

  @ApiProperty({
    description: 'Name of the creator',
    example: 'Jane Doe',
  })
  name: string;

  @ApiProperty({
    description:
      'URL to the creator profile or resource, or null if unavailable',
    example: 'https://example.org/creator/jane-doe',
    nullable: true,
    type: String,
  })
  link: string | null;
}

export class ImageUrlsSchema {
  @ApiProperty({
    description: 'High resolution image URL (original size with optimization)',
    example:
      'http://localhost:8080/rs:fit:0:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
  })
  high: string;

  @ApiProperty({
    description: 'Medium thumbnail URL (approximately 400px width)',
    example:
      'http://localhost:8080/rs:fit:400:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
  })
  medium: string;

  @ApiProperty({
    description: 'Small thumbnail URL (approximately 200px width)',
    example:
      'http://localhost:8080/rs:fit:200:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
  })
  small: string;
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
  license_uri: string | null;

  @ApiProperty({
    description: 'Whether the resource is free to use',
    example: true,
    nullable: true,
  })
  free_to_use: boolean | null;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
    nullable: true,
  })
  file_mime_type: string | null;

  @ApiProperty({
    description:
      'AMB metadata object containing type, name, educational level, language, etc. Note: Additional fields beyond the schema definition may be present.',
    nullable: true,
    type: AmbMetadataSchema,
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
  keywords: string[] | null;

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
    description: 'Name/title of the resource',
    example: 'Introduction to TypeScript',
    nullable: true,
    type: String,
  })
  name: string | null;

  @ApiProperty({
    description: 'Description of the resource',
    example: 'A comprehensive guide to learning TypeScript for beginners',
    nullable: true,
    type: String,
  })
  description: string | null;

  @ApiProperty({
    description:
      'Attribution/copyright notice for the resource (e.g., for external sources)',
    example:
      'Pictographic symbols are the property of the Government of Aragón',
    nullable: true,
    type: String,
  })
  attribution: string | null;

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
    description:
      'Data source identifier (e.g., "nostr" for Nostr database, "arasaac" for ARASAAC adapter)',
    example: 'nostr',
    type: String,
  })
  source: string;

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

  @ApiProperty({
    description:
      'Image proxy URLs for optimized image loading. Contains high, medium, and small thumbnail variants. Null when imgproxy is not configured or no image URL is available.',
    nullable: true,
    type: ImageUrlsSchema,
    example: {
      high: 'http://localhost:8080/rs:fit:0:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
      medium:
        'http://localhost:8080/rs:fit:400:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
      small:
        'http://localhost:8080/rs:fit:200:0/plain/https%3A%2F%2Fexample.org%2Fimage.jpg',
    },
  })
  images: ImageUrlsSchema | null;

  @ApiProperty({
    description: 'List of creators (persons or organizations)',
    type: [CreatorSchema],
    example: [{ type: 'person', name: 'Jane Doe', link: null }],
  })
  creators: CreatorSchema[];
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
