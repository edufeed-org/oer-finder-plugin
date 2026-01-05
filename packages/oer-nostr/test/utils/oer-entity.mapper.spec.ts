import {
  buildOerEntity,
  updateOerEntity,
  applyFileMetadataToEntity,
} from '../../src/utils/oer-entity.mapper';
import { SOURCE_NAME_NOSTR } from '../../src/constants/source.constants';
import type {
  AmbMetadata,
  FileMetadata,
  FileMetadataFields,
} from '../../src/types/extraction.types';
import type { OpenEducationalResource } from '@edufeed-org/oer-entities';

describe('oer-entity.mapper', () => {
  const createMockAmbMetadata = (
    overrides: Partial<AmbMetadata> = {},
  ): AmbMetadata => ({
    url: 'https://example.com/resource.pdf',
    parsedMetadata: {
      name: 'Test Resource',
      author: 'Test Author',
      description: 'A test description',
    },
    educationalLevelUri:
      'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
    audienceUri: 'http://purl.org/dcx/lrmi-vocabs/interactivityType/active',
    dates: {
      created: new Date('2024-01-01'),
      modified: new Date('2024-06-15'),
      published: new Date('2024-03-01'),
      latest: new Date('2024-06-15'),
    },
    license: {
      uri: 'https://creativecommons.org/licenses/by/4.0/',
      freeToUse: true,
    },
    keywords: ['education', 'test', 'resource'],
    fileEventId: 'file-event-123',
    ...overrides,
  });

  const createMockFileMetadata = (
    overrides: Partial<FileMetadata> = {},
  ): FileMetadata => ({
    eventId: 'file-event-123',
    mimeType: 'application/pdf',
    dim: '800x600',
    size: 1024000,
    alt: 'Test file alt text',
    description: 'Test file description',
    ...overrides,
  });

  const createMockOerEntity = (
    overrides: Partial<OpenEducationalResource> = {},
  ): OpenEducationalResource =>
    ({
      id: 'oer-123',
      url: 'https://old-url.com/resource.pdf',
      source_name: SOURCE_NAME_NOSTR,
      license_uri: 'https://old-license.com',
      free_to_use: false,
      file_mime_type: null,
      metadata: {},
      metadata_type: 'amb',
      keywords: [],
      file_dim: null,
      file_size: null,
      file_alt: null,
      description: null,
      audience_uri: null,
      educational_level_uri: null,
      name: null,
      attribution: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }) as OpenEducationalResource;

  describe('buildOerEntity', () => {
    it('should build OER entity with all AMB metadata fields', () => {
      const ambMetadata = createMockAmbMetadata();
      const result = buildOerEntity(ambMetadata, null);

      expect(result.url).toBe('https://example.com/resource.pdf');
      expect(result.source_name).toBe(SOURCE_NAME_NOSTR);
      expect(result.license_uri).toBe(
        'https://creativecommons.org/licenses/by/4.0/',
      );
      expect(result.free_to_use).toBe(true);
      expect(result.metadata_type).toBe('amb');
      expect(result.keywords).toEqual(['education', 'test', 'resource']);
      expect(result.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/interactivityType/active',
      );
      expect(result.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );
      expect(result.name).toBe('Test Resource');
      expect(result.attribution).toBe('Test Author');
    });

    it('should set file metadata to null when not provided', () => {
      const ambMetadata = createMockAmbMetadata();
      const result = buildOerEntity(ambMetadata, null);

      expect(result.file_mime_type).toBeNull();
      expect(result.file_dim).toBeNull();
      expect(result.file_size).toBeNull();
      expect(result.file_alt).toBeNull();
      expect(result.description).toBeNull();
    });

    it('should include file metadata when provided', () => {
      const ambMetadata = createMockAmbMetadata();
      const fileMetadata = createMockFileMetadata();
      const result = buildOerEntity(ambMetadata, fileMetadata);

      expect(result.file_mime_type).toBe('application/pdf');
      expect(result.file_dim).toBe('800x600');
      expect(result.file_size).toBe(1024000);
      expect(result.file_alt).toBe('Test file alt text');
      expect(result.description).toBe('Test file description');
    });

    it('should use empty string for url when null', () => {
      const ambMetadata = createMockAmbMetadata({ url: null });
      const result = buildOerEntity(ambMetadata, null);

      expect(result.url).toBe('');
    });

    it('should handle null name and author in parsed metadata', () => {
      const ambMetadata = createMockAmbMetadata({
        parsedMetadata: {
          description: 'Just a description',
        },
      });
      const result = buildOerEntity(ambMetadata, null);

      expect(result.name).toBeUndefined();
      expect(result.attribution).toBeUndefined();
    });
  });

  describe('updateOerEntity', () => {
    it('should mutate OER entity with all AMB metadata fields', () => {
      const oer = createMockOerEntity();
      const ambMetadata = createMockAmbMetadata();

      updateOerEntity(oer, ambMetadata, null);

      expect(oer.url).toBe('https://example.com/resource.pdf');
      expect(oer.source_name).toBe(SOURCE_NAME_NOSTR);
      expect(oer.license_uri).toBe(
        'https://creativecommons.org/licenses/by/4.0/',
      );
      expect(oer.free_to_use).toBe(true);
      expect(oer.metadata_type).toBe('amb');
      expect(oer.keywords).toEqual(['education', 'test', 'resource']);
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/interactivityType/active',
      );
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );
      expect(oer.name).toBe('Test Resource');
      expect(oer.attribution).toBe('Test Author');
    });

    it('should set file metadata to null when not provided', () => {
      const oer = createMockOerEntity({
        file_mime_type: 'image/png',
        file_dim: '100x100',
        file_size: 500,
        file_alt: 'old alt',
        description: 'old description',
      });
      const ambMetadata = createMockAmbMetadata();

      updateOerEntity(oer, ambMetadata, null);

      expect(oer.file_mime_type).toBeNull();
      expect(oer.file_dim).toBeNull();
      expect(oer.file_size).toBeNull();
      expect(oer.file_alt).toBeNull();
      expect(oer.description).toBeNull();
    });

    it('should update file metadata when provided', () => {
      const oer = createMockOerEntity();
      const ambMetadata = createMockAmbMetadata();
      const fileMetadata = createMockFileMetadata();

      updateOerEntity(oer, ambMetadata, fileMetadata);

      expect(oer.file_mime_type).toBe('application/pdf');
      expect(oer.file_dim).toBe('800x600');
      expect(oer.file_size).toBe(1024000);
      expect(oer.file_alt).toBe('Test file alt text');
      expect(oer.description).toBe('Test file description');
    });

    it('should preserve entity id when updating', () => {
      const oer = createMockOerEntity({ id: 'preserved-id-123' });
      const ambMetadata = createMockAmbMetadata();

      updateOerEntity(oer, ambMetadata, null);

      expect(oer.id).toBe('preserved-id-123');
    });
  });

  describe('applyFileMetadataToEntity', () => {
    it('should apply all file metadata fields to entity', () => {
      const oer = createMockOerEntity();
      const fileMetadata: FileMetadataFields = {
        mimeType: 'video/mp4',
        dim: '1920x1080',
        size: 50000000,
        alt: 'Video alt text',
        description: 'Video description',
      };

      applyFileMetadataToEntity(oer, fileMetadata);

      expect(oer.file_mime_type).toBe('video/mp4');
      expect(oer.file_dim).toBe('1920x1080');
      expect(oer.file_size).toBe(50000000);
      expect(oer.file_alt).toBe('Video alt text');
      expect(oer.description).toBe('Video description');
    });

    it('should handle null values in file metadata', () => {
      const oer = createMockOerEntity({
        file_mime_type: 'image/png',
        file_dim: '100x100',
        file_size: 500,
        file_alt: 'existing alt',
        description: 'existing description',
      });
      const fileMetadata: FileMetadataFields = {
        mimeType: 'application/pdf',
        dim: null,
        size: null,
        alt: null,
        description: null,
      };

      applyFileMetadataToEntity(oer, fileMetadata);

      expect(oer.file_mime_type).toBe('application/pdf');
      expect(oer.file_dim).toBeNull();
      expect(oer.file_size).toBeNull();
      expect(oer.file_alt).toBeNull();
      expect(oer.description).toBeNull();
    });

    it('should not modify other entity fields', () => {
      const oer = createMockOerEntity({
        url: 'https://preserved-url.com/file.pdf',
        name: 'Preserved Name',
        keywords: ['preserved', 'keywords'],
      });
      const fileMetadata: FileMetadataFields = {
        mimeType: 'application/pdf',
        dim: '800x600',
        size: 1024,
        alt: 'New alt',
        description: 'New description',
      };

      applyFileMetadataToEntity(oer, fileMetadata);

      expect(oer.url).toBe('https://preserved-url.com/file.pdf');
      expect(oer.name).toBe('Preserved Name');
      expect(oer.keywords).toEqual(['preserved', 'keywords']);
    });
  });
});
