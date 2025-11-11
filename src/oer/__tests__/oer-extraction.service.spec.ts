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
      const mockNostrEvent: NostrEvent = {
        id: 'event123',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey123',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/image.png'],
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
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockFileEvent: NostrEvent = {
        id: 'file123',
        kind: EVENT_FILE_KIND,
        pubkey: 'pubkey123',
        created_at: 1234567890,
        content: 'A diagram showing photosynthesis',
        tags: [
          ['m', 'image/png'],
          ['dim', '1920x1080'],
          ['size', '245680'],
          ['alt', 'Photosynthesis diagram'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-uuid-123',
        url: 'https://example.edu/image.png',
        amb_license_uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: {
          d: 'https://example.edu/image.png',
          'license:id': 'https://creativecommons.org/licenses/by-sa/4.0/',
          isAccessibleForFree: 'true',
          learningResourceType: {
            id: 'http://w3id.org/kim/hcrt/image',
            'prefLabel:en': 'Image',
          },
          type: 'LearningResource',
          dateCreated: '2024-01-15T10:30:00Z',
          datePublished: '2024-01-20T14:00:00Z',
        },
        amb_keywords: ['photosynthesis', 'biology'],
        file_dim: '1920x1080',
        file_size: 245680,
        file_alt: 'Photosynthesis diagram',
        amb_description: 'A diagram showing photosynthesis',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date('2024-01-15T10:30:00Z'),
        amb_date_published: new Date('2024-01-20T14:00:00Z'),
        amb_date_modified: null,
        event_amb_id: 'event123',
        event_file_id: 'file123',
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

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
        where: { url: 'https://example.edu/image.png' },
        relations: ['eventAmb'],
      });
      expect(nostrFindOneSpy).toHaveBeenCalledWith({
        where: { id: 'file123' },
      });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/image.png',
          amb_license_uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
          amb_free_to_use: true,
          file_mime_type: 'image/png',
          amb_keywords: ['photosynthesis', 'biology'],
          file_dim: '1920x1080',
          file_size: 245680,
          file_alt: 'Photosynthesis diagram',
          amb_description: 'A diagram showing photosynthesis',
          audience_uri: null,
          educational_level_uri: null,
          amb_date_created: expect.any(Date),
          amb_date_published: expect.any(Date),
          amb_date_modified: null,
          event_amb_id: 'event123',
          event_file_id: 'file123',
        }),
      );
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockOer);
    });

    it('should extract OER with minimal data when fields are missing', async () => {
      const mockNostrEvent: NostrEvent = {
        id: 'event456',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey456',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.pdf'],
          ['type', 'LearningResource'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-uuid-456',
        url: 'https://example.edu/resource.pdf',
        amb_license_uri: null,
        amb_free_to_use: null,
        file_mime_type: null,
        amb_metadata: {
          d: 'https://example.edu/resource.pdf',
          type: 'LearningResource',
        },
        amb_keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        amb_description: null,
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event456',
        event_file_id: null,
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(oerRepository, 'create')
        .mockReturnValue(mockOer);
      jest.spyOn(oerRepository, 'save').mockResolvedValue(mockOer);

      const result = await service.extractOerFromEvent(mockNostrEvent);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.edu/resource.pdf',
          amb_license_uri: null,
          amb_free_to_use: null,
          file_mime_type: null,
          amb_keywords: null,
          file_dim: null,
          file_size: null,
          file_alt: null,
          amb_description: null,
          audience_uri: null,
          educational_level_uri: null,
          amb_date_created: null,
          amb_date_published: null,
          amb_date_modified: null,
          event_amb_id: 'event456',
          event_file_id: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should handle missing file event gracefully', async () => {
      const mockNostrEvent: NostrEvent = {
        id: 'event789',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey789',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/image.png'],
          ['e', 'missing-file-event', 'wss://relay.example.com', 'file'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-uuid-789',
        url: 'https://example.edu/image.png',
        amb_license_uri: null,
        amb_free_to_use: null,
        file_mime_type: null,
        amb_metadata: { d: 'https://example.edu/image.png' },
        amb_keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        amb_description: null,
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event789',
        event_file_id: null, // Should be null when file event doesn't exist
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

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
      const mockNostrEvent: NostrEvent = {
        id: 'event-malformed',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['isAccessibleForFree', 'not-a-boolean'],
          ['e', 'file-malformed', 'wss://relay.example.com', 'file'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockFileEvent: NostrEvent = {
        id: 'file-malformed',
        kind: EVENT_FILE_KIND,
        pubkey: 'pubkey',
        created_at: 1234567890,
        content: '',
        tags: [['size', 'not-a-number']],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-malformed',
        url: 'https://example.edu/resource',
        amb_license_uri: null,
        amb_free_to_use: null, // Malformed boolean becomes null
        file_mime_type: null,
        amb_metadata: { d: 'https://example.edu/resource' },
        amb_keywords: null,
        file_dim: null,
        file_size: null, // Malformed number becomes null
        file_alt: null,
        amb_description: null,
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-malformed',
        event_file_id: 'file-malformed',
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

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
          amb_free_to_use: null,
          file_size: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });

    it('should use description tag if present, otherwise fall back to content', async () => {
      const mockNostrEvent: NostrEvent = {
        id: 'event-desc',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['e', 'file-desc', 'wss://relay.example.com', 'file'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockFileEvent: NostrEvent = {
        id: 'file-desc',
        kind: EVENT_FILE_KIND,
        pubkey: 'pubkey',
        created_at: 1234567890,
        content: 'Fallback content description',
        tags: [['description', 'Tag description takes priority']],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-desc',
        url: 'https://example.edu/resource',
        amb_license_uri: null,
        amb_free_to_use: null,
        file_mime_type: null,
        amb_metadata: { d: 'https://example.edu/resource' },
        amb_keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        amb_description: 'Tag description takes priority',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-desc',
        event_file_id: 'file-desc',
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

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
          amb_description: 'Tag description takes priority',
          audience_uri: null,
          educational_level_uri: null,
        }),
      );
      expect(result).toEqual(mockOer);
    });
  });

  describe('extractOerFromEvent - URL uniqueness and upsert behavior', () => {
    it('should create a new OER when URL does not exist', async () => {
      const mockNostrEvent: NostrEvent = {
        id: 'event-new',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1234567890,
        content: '',
        tags: [
          ['d', 'https://example.edu/new-resource.png'],
          ['type', 'Image'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-new',
        url: 'https://example.edu/new-resource.png',
        amb_license_uri: null,
        amb_free_to_use: null,
        file_mime_type: null,
        amb_metadata: {
          d: 'https://example.edu/new-resource.png',
          type: 'Image',
        },
        amb_keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        amb_description: null,
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-new',
        event_file_id: null,
        eventAmb: null,
        eventFile: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

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
      const olderEvent: NostrEvent = {
        id: 'event-old',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1000000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', '2024-01-10T08:00:00Z'],
          ['datePublished', '2024-01-12T10:00:00Z'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const existingOer: OpenEducationalResource = {
        id: 'oer-existing',
        url: 'https://example.edu/resource.png',
        amb_license_uri: 'https://old-license.org',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: { type: 'OldType' },
        amb_keywords: ['old'],
        file_dim: '800x600',
        file_size: 100000,
        file_alt: 'Old alt text',
        amb_description: 'Old description',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date('2024-01-10T08:00:00Z'),
        amb_date_published: new Date('2024-01-12T10:00:00Z'),
        amb_date_modified: null,
        event_amb_id: 'event-old',
        event_file_id: null,
        eventAmb: olderEvent,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const newerEvent: NostrEvent = {
        id: 'event-new',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 2000000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['license:id', 'https://new-license.org'],
          ['isAccessibleForFree', 'false'],
          ['t', 'new-keyword'],
          ['type', 'NewType'],
          ['dateCreated', '2024-02-15T10:00:00Z'],
          ['datePublished', '2024-02-20T12:00:00Z'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const updatedOer: OpenEducationalResource = {
        ...existingOer,
        amb_license_uri: 'https://new-license.org',
        amb_free_to_use: false,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          'license:id': 'https://new-license.org',
          isAccessibleForFree: 'false',
          type: 'NewType',
          dateCreated: '2024-02-15T10:00:00Z',
          datePublished: '2024-02-20T12:00:00Z',
        },
        amb_keywords: ['new-keyword'],
        amb_date_created: new Date('2024-02-15T10:00:00Z'),
        amb_date_published: new Date('2024-02-20T12:00:00Z'),
        amb_date_modified: null,
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
          id: 'oer-existing',
          amb_license_uri: 'https://new-license.org',
          amb_free_to_use: false,
          amb_keywords: ['new-keyword'],
          amb_date_created: expect.any(Date),
          amb_date_published: expect.any(Date),
          amb_date_modified: null,
          event_amb_id: 'event-new',
        }),
      );
      expect(result.event_amb_id).toEqual('event-new');
    });

    it('should skip update when new dates are older or same', async () => {
      const newerEvent: NostrEvent = {
        id: 'event-newer',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 2000000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', '2024-02-20T10:00:00Z'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const existingOer: OpenEducationalResource = {
        id: 'oer-existing',
        url: 'https://example.edu/resource.png',
        amb_license_uri: 'https://existing-license.org',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: { type: 'ExistingType' },
        amb_keywords: ['existing'],
        file_dim: '800x600',
        file_size: 100000,
        file_alt: 'Existing alt text',
        amb_description: 'Existing description',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date('2024-02-20T10:00:00Z'),
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-newer',
        event_file_id: null,
        eventAmb: newerEvent,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const olderIncomingEvent: NostrEvent = {
        id: 'event-older',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1000000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', '2024-01-15T08:00:00Z'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

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

      const existingEvent: NostrEvent = {
        id: 'event-existing',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1500000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['dateCreated', sameDate],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const existingOer: OpenEducationalResource = {
        id: 'oer-existing',
        url: 'https://example.edu/resource.png',
        amb_license_uri: 'https://existing-license.org',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: { type: 'ExistingType' },
        amb_keywords: ['existing'],
        file_dim: '800x600',
        file_size: 100000,
        file_alt: 'Existing alt text',
        amb_description: 'Existing description',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date(sameDate),
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-existing',
        event_file_id: null,
        eventAmb: existingEvent,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const sameAgeEvent: NostrEvent = {
        id: 'event-same-age',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1600000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['dateCreated', sameDate],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromEvent(sameAgeEvent);

      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
    });

    it('should update OER when existing OER has no date fields', async () => {
      const existingOer: OpenEducationalResource = {
        id: 'oer-no-dates',
        url: 'https://example.edu/resource.png',
        amb_license_uri: null,
        amb_free_to_use: null,
        file_mime_type: null,
        amb_metadata: {},
        amb_keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        amb_description: null,
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: null,
        event_file_id: null,
        eventAmb: null,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const newEvent: NostrEvent = {
        id: 'event-new',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1500000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateCreated', '2024-01-20T10:00:00Z'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const updatedOer = {
        ...existingOer,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          type: 'NewType',
          dateCreated: '2024-01-20T10:00:00Z',
        },
        amb_date_created: new Date('2024-01-20T10:00:00Z'),
        amb_date_published: null,
        amb_date_modified: null,
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
      const existingOer: OpenEducationalResource = {
        id: 'oer-with-dates',
        url: 'https://example.edu/resource.png',
        amb_license_uri: 'https://existing-license.org',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: { type: 'ExistingType' },
        amb_keywords: ['existing'],
        file_dim: '800x600',
        file_size: 100000,
        file_alt: 'Existing alt text',
        amb_description: 'Existing description',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date('2024-01-15T10:00:00Z'),
        amb_date_published: null,
        amb_date_modified: null,
        event_amb_id: 'event-existing',
        event_file_id: null,
        eventAmb: null,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const newEventWithoutDates: NostrEvent = {
        id: 'event-no-dates',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 1600000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'ShouldNotUpdate'],
          ['license:id', 'https://new-license.org'],
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      jest.spyOn(oerRepository, 'findOne').mockResolvedValue(existingOer);
      const saveSpy = jest.spyOn(oerRepository, 'save');

      const result = await service.extractOerFromEvent(newEventWithoutDates);

      // Should NOT update because new event has no dateCreated, datePublished, or dateModified
      expect(saveSpy).not.toHaveBeenCalled();
      expect(result).toEqual(existingOer);
      expect(result.event_amb_id).toEqual('event-existing');
    });

    it('should extract and use date_modified when comparing', async () => {
      const existingOer: OpenEducationalResource = {
        id: 'oer-existing',
        url: 'https://example.edu/resource.png',
        amb_license_uri: 'https://existing-license.org',
        amb_free_to_use: true,
        file_mime_type: 'image/png',
        amb_metadata: { type: 'ExistingType' },
        amb_keywords: ['existing'],
        file_dim: '800x600',
        file_size: 100000,
        file_alt: 'Existing alt text',
        amb_description: 'Existing description',
        audience_uri: null,
        educational_level_uri: null,
        amb_date_created: new Date('2024-01-10T08:00:00Z'),
        amb_date_published: new Date('2024-01-12T10:00:00Z'),
        amb_date_modified: new Date('2024-01-15T10:00:00Z'), // Modified is latest
        event_amb_id: 'event-old',
        event_file_id: null,
        eventAmb: null,
        eventFile: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
      };

      const newerEvent: NostrEvent = {
        id: 'event-new',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey',
        created_at: 2000000000,
        content: '',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'NewType'],
          ['dateModified', '2024-02-20T10:00:00Z'], // Newer than existing modified date
        ],
        raw_event: {},
        relay_url: 'wss://relay.example.com',
        ingested_at: new Date(),
      };

      const updatedOer: OpenEducationalResource = {
        ...existingOer,
        amb_metadata: {
          d: 'https://example.edu/resource.png',
          type: 'NewType',
          dateModified: '2024-02-20T10:00:00Z',
        },
        amb_date_created: null,
        amb_date_published: null,
        amb_date_modified: new Date('2024-02-20T10:00:00Z'),
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
