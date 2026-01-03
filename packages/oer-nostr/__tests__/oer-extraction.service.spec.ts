import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { OerExtractionService } from '../src/services/oer-extraction.service';
import { OER_SOURCE_REPOSITORY } from '../src/services/nostr-event-database.service';
import { OER_REPOSITORY } from '../src/services/event-deletion.service';
import type {
  OerSourceEntity,
  OpenEducationalResourceEntity,
} from '../src/types/entities.types';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../src/constants/event-kinds.constants';
import { SOURCE_NAME_NOSTR } from '../src/constants/source.constants';
import { nostrEventFixtures, eventFactoryHelpers } from '../src/testing';
import { oerFactoryHelpers } from '../../../test/fixtures/oerFactory';

/**
 * Creates a mock OerSource from a NostrEvent-like object.
 * Adds default `sig` field if missing (required by NostrEventDataSchema).
 */
function createOerSourceFromEvent(
  eventData: ReturnType<typeof nostrEventFixtures.ambComplete>,
  overrides: Partial<OerSourceEntity> = {},
): OerSourceEntity {
  // Ensure source_data has a sig field (required by schema validation)
  const sourceData = {
    ...eventData,
    sig: (eventData as unknown as { sig?: string }).sig ?? 'test-signature',
  };

  return {
    id: `source-${eventData.id}`,
    oer_id: null,
    oer: null,
    source_name: SOURCE_NAME_NOSTR,
    source_identifier: `event:${eventData.id}`,
    source_data: sourceData as unknown as Record<string, unknown>,
    status: 'pending',
    source_uri: 'wss://relay.example.com',
    source_timestamp: eventData.created_at,
    source_record_type: String(eventData.kind),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('OerExtractionService', () => {
  let service: OerExtractionService;
  let oerRepository: Repository<OpenEducationalResourceEntity>;
  let oerSourceRepository: Repository<OerSourceEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerExtractionService,
        {
          provide: OER_REPOSITORY,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: OER_SOURCE_REPOSITORY,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OerExtractionService>(OerExtractionService);
    oerRepository =
      module.get<Repository<OpenEducationalResourceEntity>>(OER_REPOSITORY);
    oerSourceRepository = module.get<Repository<OerSourceEntity>>(
      OER_SOURCE_REPOSITORY,
    );

    // Set up default mocks for OerSource repository
    jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(oerSourceRepository, 'create')
      .mockImplementation((entity) => entity as OerSourceEntity);
    jest
      .spyOn(oerSourceRepository, 'save')
      .mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'source-id' } as OerSourceEntity),
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shouldExtractOer', () => {
    it('should return true for kind 30142 (AMB) events', () => {
      expect(service.shouldExtractOer(EVENT_AMB_KIND)).toBe(true);
    });

    it('should return false for other event kinds', () => {
      expect(service.shouldExtractOer(1)).toBe(false);
      expect(service.shouldExtractOer(EVENT_FILE_KIND)).toBe(false);
      expect(service.shouldExtractOer(0)).toBe(false);
    });
  });

  describe('extractOerFromSource', () => {
    it('should extract complete OER data from a kind 30142 (AMB) event with all fields', async () => {
      const mockFileEventData = nostrEventFixtures.fileComplete({
        id: 'file123',
      });
      const mockFileSource = createOerSourceFromEvent(
        mockFileEventData as ReturnType<typeof nostrEventFixtures.ambComplete>,
        {
          source_record_type: String(EVENT_FILE_KIND),
        },
      );

      const mockAmbEventData = nostrEventFixtures.ambComplete({
        id: 'event123',
        tags: [
          ['d', 'https://example.edu/diagram.png'],
          ['license:id', 'https://creativecommons.org/licenses/by-sa/4.0/'],
          ['isAccessibleForFree', 'true'],
          ['t', 'photosynthesis'],
          ['t', 'biology'],
          ['learningResourceType:id', 'http://w3id.org/kim/hcrt/image'],
          ['learningResourceType:prefLabel:en', 'Image'],
          ['type', 'LearningResource'],
          ['dateCreated', '2024-01-15T10:30:00Z'],
          ['datePublished', '2024-01-20T14:00:00Z'],
          ['e', 'file123', 'wss://relay.example.com', 'file'],
        ],
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockOer =
        oerFactoryHelpers.createCompleteOer() as OpenEducationalResourceEntity;

      // Mock the URL existence check to return null (no existing OER)
      const oerFindOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(null);
      // Mock file source lookup
      const sourceRepoFindOneSpy = jest
        .spyOn(oerSourceRepository, 'findOne')
        .mockResolvedValue(mockFileSource);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(oerFindOneSpy).toHaveBeenCalledWith({
        where: { url: 'https://example.edu/diagram.png', source_name: 'nostr' },
        relations: ['sources'],
      });
      expect(sourceRepoFindOneSpy).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:file123',
        },
      });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/diagram.png',
          source_name: 'nostr',
          license_uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
          free_to_use: true,
          file_mime_type: 'image/png',
          keywords: ['photosynthesis', 'biology'],
          file_dim: '1920x1080',
          file_size: 245680,
          file_alt: 'Photosynthesis diagram',
          description: 'A diagram showing photosynthesis',
          audience_uri: null,
          educational_level_uri: null,
        }),
      );
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockOer);
    });

    it('should extract OER with minimal data when fields are missing', async () => {
      const mockAmbEventData = nostrEventFixtures.ambMinimal({
        id: 'event456',
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockOer =
        oerFactoryHelpers.createMinimalOer() as OpenEducationalResourceEntity;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/resource.pdf',
          source_name: 'nostr',
          license_uri: null,
          free_to_use: null,
          file_mime_type: null,
          keywords: null,
          file_dim: null,
          file_size: null,
          file_alt: null,
          description: null,
          audience_uri: null,
          educational_level_uri: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should handle missing file event gracefully', async () => {
      const mockAmbEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event789',
        tags: [
          ['d', 'https://example.edu/image.png'],
          ['e', 'missing-file-event', 'wss://relay.example.com', 'file'],
        ],
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-uuid-789',
        url: 'https://example.edu/image.png',
        metadata: {},
      }) as OpenEducationalResourceEntity;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      const sourceRepoFindOneSpy = jest
        .spyOn(oerSourceRepository, 'findOne')
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(sourceRepoFindOneSpy).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:missing-file-event',
        },
      });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          file_mime_type: null,
          file_dim: null,
          file_size: null,
          file_alt: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should handle malformed boolean and number values gracefully', async () => {
      const mockAmbEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-malformed',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['isAccessibleForFree', 'not-a-boolean'],
          ['e', 'file-malformed', 'wss://relay.example.com', 'file'],
        ],
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockFileEventData = eventFactoryHelpers.createFileEvent({
        id: 'file-malformed',
        content: '',
        tags: [['size', 'not-a-number']],
      });
      const mockFileSource = createOerSourceFromEvent(
        mockFileEventData as ReturnType<typeof nostrEventFixtures.ambComplete>,
        {
          source_record_type: String(EVENT_FILE_KIND),
        },
      );

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-malformed',
        url: 'https://example.edu/resource',
        metadata: {},
      }) as OpenEducationalResourceEntity;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(oerSourceRepository, 'findOne')
        .mockResolvedValue(mockFileSource);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          free_to_use: null,
          file_size: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should use description tag if present, otherwise fall back to content', async () => {
      const mockAmbEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-desc',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['e', 'file-desc', 'wss://relay.example.com', 'file'],
        ],
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockFileEventData = eventFactoryHelpers.createFileEvent({
        id: 'file-desc',
        content: 'Fallback content description',
        tags: [['description', 'Tag description takes priority']],
      });
      const mockFileSource = createOerSourceFromEvent(
        mockFileEventData as ReturnType<typeof nostrEventFixtures.ambComplete>,
        {
          source_record_type: String(EVENT_FILE_KIND),
        },
      );

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-desc',
        url: 'https://example.edu/resource',
        metadata: {},
        description: 'Tag description takes priority',
      }) as OpenEducationalResourceEntity;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(oerSourceRepository, 'findOne')
        .mockResolvedValue(mockFileSource);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Tag description takes priority',
          audience_uri: null,
          educational_level_uri: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });
  });

  describe('extractOerFromSource - URL uniqueness and upsert behavior', () => {
    it('should create a new OER when URL does not exist', async () => {
      const mockAmbEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        tags: [
          ['d', 'https://example.edu/new-resource.png'],
          ['type', 'Image'],
        ],
      });
      const mockAmbSource = createOerSourceFromEvent(mockAmbEventData);

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-new',
        url: 'https://example.edu/new-resource.png',
        metadata: {
          type: 'Image',
        },
      }) as OpenEducationalResourceEntity;

      // Mock oerRepository.findOne to return null (URL doesn't exist)
      const findOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockAmbSource);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          url: 'https://example.edu/new-resource.png',
          source_name: 'nostr',
        },
        relations: ['sources'],
      });
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockOer);
    });

    it('should update existing OER when new dates are newer', async () => {
      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        license_uri: 'https://old-license.org',
        metadata: { type: 'OldType' },
        keywords: ['old'],
        description: 'Old description',
      }) as OpenEducationalResourceEntity;

      const newerEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['license:id', 'https://new-license.org'],
          ['isAccessibleForFree', 'false'],
          ['t', 'new-keyword'],
          ['type', 'NewType'],
          ['dateCreated', '2024-02-15T10:00:00Z'],
          ['datePublished', '2024-02-20T12:00:00Z'],
        ],
      });
      const newerSource = createOerSourceFromEvent(newerEventData);

      const updatedOer: OpenEducationalResourceEntity = {
        ...existingOer,
        license_uri: 'https://new-license.org',
        free_to_use: false,
        metadata: {
          'license:id': 'https://new-license.org',
          isAccessibleForFree: 'false',
          type: 'NewType',
          dateCreated: '2024-02-15T10:00:00Z',
          datePublished: '2024-02-20T12:00:00Z',
        },
        keywords: ['new-keyword'],
        updated_at: new Date(),
      };

      const findOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      await service.extractOerFromSource(newerSource);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          url: 'https://example.edu/resource.png',
          source_name: 'nostr',
        },
        relations: ['sources'],
      });
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          license_uri: 'https://new-license.org',
          free_to_use: false,
          keywords: ['new-keyword'],
        }),
      );
    });

    it('should skip update when new dates are older or same', async () => {
      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        license_uri: 'https://existing-license.org',
        metadata: {
          dateCreated: '2024-02-20T10:00:00Z',
        },
      }) as OpenEducationalResourceEntity;

      const olderEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-older',
        created_at: 1000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', '2024-01-15T08:00:00Z'],
        ],
      });
      const olderSource = createOerSourceFromEvent(olderEventData);

      const findOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromSource(olderSource);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          url: 'https://example.edu/resource.png',
          source_name: 'nostr',
        },
        relations: ['sources'],
      });
      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
    });

    it('should skip update when dates are the same', async () => {
      const sameDate = '2024-01-15T10:00:00Z';

      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        metadata: {
          dateCreated: sameDate,
        },
      }) as OpenEducationalResourceEntity;

      const sameAgeEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-same-age',
        created_at: 1600000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', sameDate],
        ],
      });
      const sameAgeSource = createOerSourceFromEvent(sameAgeEventData);

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromSource(sameAgeSource);

      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
    });

    it('should update OER when existing OER has no date fields', async () => {
      const existingOer =
        oerFactoryHelpers.createOerWithoutDates() as OpenEducationalResourceEntity;

      const newEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        created_at: 1500000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateCreated', '2024-01-20T10:00:00Z'],
        ],
      });
      const newSource = createOerSourceFromEvent(newEventData);

      const updatedOer = {
        ...existingOer,
        metadata: {
          type: 'NewType',
          dateCreated: '2024-01-20T10:00:00Z',
        },
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      await service.extractOerFromSource(newSource);

      // Should update because existing has no dates to compare
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should skip update when new event has no date fields and existing OER exists', async () => {
      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        id: 'oer-with-dates',
        metadata: {
          dateCreated: '2024-01-15T10:00:00Z',
        },
      }) as OpenEducationalResourceEntity;

      const newEventWithoutDatesData = eventFactoryHelpers.createAmbEvent({
        id: 'event-no-dates',
        created_at: 1600000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['license:id', 'https://new-license.org'],
        ],
      });
      const newSourceWithoutDates = createOerSourceFromEvent(
        newEventWithoutDatesData,
      );

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromSource(newSourceWithoutDates);

      // Should NOT update because new event has no dateCreated, datePublished, or dateModified
      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
    });

    it('should extract and use dateModified from metadata when comparing', async () => {
      const existingOer =
        oerFactoryHelpers.createOerWithModifiedDate() as OpenEducationalResourceEntity;

      const newerEventData = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateModified', '2024-02-20T10:00:00Z'],
        ],
      });
      const newerSource = createOerSourceFromEvent(newerEventData);

      const updatedOer: OpenEducationalResourceEntity = {
        ...existingOer,
        metadata: {
          type: 'NewType',
          dateModified: '2024-02-20T10:00:00Z',
        },
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      await service.extractOerFromSource(newerSource);

      // Should update because new dateModified is newer than existing dateModified
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
