import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OerExtractionService } from '../services/oer-extraction.service';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';
import { NostrEvent } from '../../nostr/entities/nostr-event.entity';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../../nostr/constants/event-kinds.constants';
import {
  nostrEventFixtures,
  eventFactoryHelpers,
  oerFactoryHelpers,
} from '../../../test/fixtures';

describe('OerExtractionService', () => {
  let service: OerExtractionService;
  let oerRepository: Repository<OpenEducationalResource>;
  let nostrEventRepository: Repository<NostrEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerExtractionService,
        {
          provide: getRepositoryToken(OpenEducationalResource),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NostrEvent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OerExtractionService>(OerExtractionService);
    oerRepository = module.get<Repository<OpenEducationalResource>>(
      getRepositoryToken(OpenEducationalResource),
    );
    nostrEventRepository = module.get<Repository<NostrEvent>>(
      getRepositoryToken(NostrEvent),
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

  describe('extractOerFromEvent', () => {
    it('should extract complete OER data from a kind 30142 (AMB) event with all fields', async () => {
      const mockFileEvent = nostrEventFixtures.fileComplete({
        id: 'file123',
      });

      const mockNostrEvent = nostrEventFixtures.ambComplete({
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

      const mockOer =
        oerFactoryHelpers.createCompleteOer() as OpenEducationalResource;

      // Mock the URL existence check to return null (no existing OER)
      const oerFindOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(null);
      const nostrFindOneSpy = jest
        .spyOn(nostrEventRepository, 'findOne')
        .mockResolvedValue(mockFileEvent);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(oerFindOneSpy).toHaveBeenCalledWith({
        where: { url: 'https://example.edu/diagram.png' },
        relations: ['eventAmb'],
      });
      expect(nostrFindOneSpy).toHaveBeenCalledWith({
        where: { id: 'file123' },
      });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/diagram.png',
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
          event_amb_id: 'event123',
          event_file_id: 'file123',
        }),
      );
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockOer);
    });

    it('should extract OER with minimal data when fields are missing', async () => {
      const mockNostrEvent = nostrEventFixtures.ambMinimal({
        id: 'event456',
      });

      const mockOer =
        oerFactoryHelpers.createMinimalOer() as OpenEducationalResource;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/resource.pdf',
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
          event_amb_id: 'event456',
          event_file_id: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should handle missing file event gracefully', async () => {
      const mockNostrEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event789',
        tags: [
          ['d', 'https://example.edu/image.png'],
          ['e', 'missing-file-event', 'wss://relay.example.com', 'file'],
        ],
      });

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-uuid-789',
        url: 'https://example.edu/image.png',
        amb_metadata: { d: 'https://example.edu/image.png' },
        event_amb_id: 'event789',
        event_file_id: null,
      }) as OpenEducationalResource;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      const nostrFindOneSpy = jest
        .spyOn(nostrEventRepository, 'findOne')
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(nostrFindOneSpy).toHaveBeenCalledWith({
        where: { id: 'missing-file-event' },
      });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          file_mime_type: null,
          file_dim: null,
          file_size: null,
          file_alt: null,
          event_file_id: null, // Should be null
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should handle malformed boolean and number values gracefully', async () => {
      const mockNostrEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-malformed',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['isAccessibleForFree', 'not-a-boolean'],
          ['e', 'file-malformed', 'wss://relay.example.com', 'file'],
        ],
      });

      const mockFileEvent = eventFactoryHelpers.createFileEvent({
        id: 'file-malformed',
        content: '',
        tags: [['size', 'not-a-number']],
      });

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-malformed',
        url: 'https://example.edu/resource',
        amb_metadata: { d: 'https://example.edu/resource' },
        event_amb_id: 'event-malformed',
        event_file_id: 'file-malformed',
      }) as OpenEducationalResource;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(nostrEventRepository, 'findOne')
        .mockResolvedValue(mockFileEvent);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          free_to_use: null,
          file_size: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should use description tag if present, otherwise fall back to content', async () => {
      const mockNostrEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-desc',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['e', 'file-desc', 'wss://relay.example.com', 'file'],
        ],
      });

      const mockFileEvent = eventFactoryHelpers.createFileEvent({
        id: 'file-desc',
        content: 'Fallback content description',
        tags: [['description', 'Tag description takes priority']],
      });

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-desc',
        url: 'https://example.edu/resource',
        amb_metadata: { d: 'https://example.edu/resource' },
        description: 'Tag description takes priority',
        event_amb_id: 'event-desc',
        event_file_id: 'file-desc',
      }) as OpenEducationalResource;

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(nostrEventRepository, 'findOne')
        .mockResolvedValue(mockFileEvent);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

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

  describe('extractOerFromEvent - URL uniqueness and upsert behavior', () => {
    it('should create a new OER when URL does not exist', async () => {
      const mockNostrEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        tags: [
          ['d', 'https://example.edu/new-resource.png'],
          ['type', 'Image'],
        ],
      });

      const mockOer = oerFactoryHelpers.createMinimalOer({
        id: 'oer-new',
        url: 'https://example.edu/new-resource.png',
        amb_metadata: {
          d: 'https://example.edu/new-resource.png',
          type: 'Image',
        },
        event_amb_id: 'event-new',
      }) as OpenEducationalResource;

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

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { url: 'https://example.edu/new-resource.png' },
        relations: ['eventAmb'],
      });
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockOer);
    });

    it('should update existing OER when new dates are newer', async () => {
      const olderEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-old',
        created_at: 1000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', '2024-01-10T08:00:00Z'],
          ['datePublished', '2024-01-12T10:00:00Z'],
        ],
      });

      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        license_uri: 'https://old-license.org',
        amb_metadata: { type: 'OldType' },
        keywords: ['old'],
        description: 'Old description',
        eventAmb: olderEvent,
      }) as OpenEducationalResource;

      const newerEvent = eventFactoryHelpers.createAmbEvent({
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

      const updatedOer: OpenEducationalResource = {
        ...existingOer,
        license_uri: 'https://new-license.org',
        free_to_use: false,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          'license:id': 'https://new-license.org',
          isAccessibleForFree: 'false',
          type: 'NewType',
          dateCreated: '2024-02-15T10:00:00Z',
          datePublished: '2024-02-20T12:00:00Z',
        },
        keywords: ['new-keyword'],
        event_amb_id: 'event-new',
        updated_at: new Date(),
      };

      const findOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      const result = await service.extractOerFromEvent(newerEvent);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { url: 'https://example.edu/resource.png' },
        relations: ['eventAmb'],
      });
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          license_uri: 'https://new-license.org',
          free_to_use: false,
          keywords: ['new-keyword'],
          event_amb_id: 'event-new',
        }),
      );
      expect(result.event_amb_id).toEqual('event-new');
    });

    it('should skip update when new dates are older or same', async () => {
      const newerEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-newer',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', '2024-02-20T10:00:00Z'],
        ],
      });

      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        license_uri: 'https://existing-license.org',
        amb_metadata: {
          dateCreated: '2024-02-20T10:00:00Z',
        },
        event_amb_id: 'event-newer',
        eventAmb: newerEvent,
      }) as OpenEducationalResource;

      const olderIncomingEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-older',
        created_at: 1000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', '2024-01-15T08:00:00Z'],
        ],
      });

      const findOneSpy = jest
        .spyOn(oerRepository, 'findOne')
        .mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromEvent(olderIncomingEvent);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { url: 'https://example.edu/resource.png' },
        relations: ['eventAmb'],
      });
      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
      expect(result.event_amb_id).toEqual('event-newer'); // Should still reference the newer event
    });

    it('should skip update when dates are the same', async () => {
      const sameDate = '2024-01-15T10:00:00Z';

      const existingEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-existing',
        created_at: 1500000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', sameDate],
        ],
      });

      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        amb_metadata: {
          dateCreated: sameDate,
        },
        event_amb_id: 'event-existing',
        eventAmb: existingEvent,
      }) as OpenEducationalResource;

      const sameAgeEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-same-age',
        created_at: 1600000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', sameDate],
        ],
      });

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromEvent(sameAgeEvent);

      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
    });

    it('should update OER when existing OER has no date fields', async () => {
      const existingOer =
        oerFactoryHelpers.createOerWithoutDates() as OpenEducationalResource;

      const newEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        created_at: 1500000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateCreated', '2024-01-20T10:00:00Z'],
        ],
      });

      const updatedOer = {
        ...existingOer,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          type: 'NewType',
          dateCreated: '2024-01-20T10:00:00Z',
        },
        event_amb_id: 'event-new',
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      const result = await service.extractOerFromEvent(newEvent);

      // Should update because existing has no dates to compare
      expect(saveSpy).toHaveBeenCalled();
      expect(result.event_amb_id).toEqual('event-new');
    });

    it('should skip update when new event has no date fields and existing OER exists', async () => {
      const existingOer = oerFactoryHelpers.createExistingOerWithDates({
        id: 'oer-with-dates',
        amb_metadata: {
          dateCreated: '2024-01-15T10:00:00Z',
        },
        event_amb_id: 'event-existing',
      }) as OpenEducationalResource;

      const newEventWithoutDates = eventFactoryHelpers.createAmbEvent({
        id: 'event-no-dates',
        created_at: 1600000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['license:id', 'https://new-license.org'],
        ],
      });

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromEvent(newEventWithoutDates);

      // Should NOT update because new event has no dateCreated, datePublished, or dateModified
      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
      expect(result.event_amb_id).toEqual('event-existing');
    });

    it('should extract and use dateModified from amb_metadata when comparing', async () => {
      const existingOer =
        oerFactoryHelpers.createOerWithModifiedDate() as OpenEducationalResource;

      const newerEvent = eventFactoryHelpers.createAmbEvent({
        id: 'event-new',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateModified', '2024-02-20T10:00:00Z'],
        ],
      });

      const updatedOer: OpenEducationalResource = {
        ...existingOer,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          type: 'NewType',
          dateModified: '2024-02-20T10:00:00Z',
        },
        event_amb_id: 'event-new',
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest
        .spyOn(oerRepository, 'save')
        .mockResolvedValue(updatedOer);

      const result = await service.extractOerFromEvent(newerEvent);

      // Should update because new dateModified is newer than existing dateModified
      expect(saveSpy).toHaveBeenCalled();
      expect(result.event_amb_id).toEqual('event-new');
    });
  });
});
