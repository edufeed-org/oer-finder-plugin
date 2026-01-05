import { Test, TestingModule } from '@nestjs/testing';
import { OerExtractionService } from '../src/services/oer-extraction.service';
import { OER_STORAGE_SERVICE } from '../src/services/oer-storage.service';
import type {
  OerSource,
  OpenEducationalResource,
} from '@edufeed-org/oer-entities';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../src/constants/event-kinds.constants';
import { SOURCE_NAME_NOSTR } from '../src/constants/source.constants';

describe('OerExtractionService', () => {
  let service: OerExtractionService;
  let mockStorageService: {
    extractOerFromSource: jest.Mock;
    findOersWithMissingFileMetadata: jest.Mock;
    updateFileMetadata: jest.Mock;
  };

  beforeEach(async () => {
    mockStorageService = {
      extractOerFromSource: jest.fn(),
      findOersWithMissingFileMetadata: jest.fn(),
      updateFileMetadata: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerExtractionService,
        {
          provide: OER_STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<OerExtractionService>(OerExtractionService);
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
    it('should delegate to storage service', async () => {
      const mockSource: OerSource = {
        id: 'source-123',
        oer_id: null,
        oer: null,
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: 'event:test123',
        source_data: {},
        status: 'pending',
        source_uri: 'wss://relay.example.com',
        source_timestamp: 1234567890,
        source_record_type: '30142',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockOer: OpenEducationalResource = {
        id: 'oer-123',
        url: 'https://example.com/resource.pdf',
        source_name: SOURCE_NAME_NOSTR,
      } as OpenEducationalResource;

      mockStorageService.extractOerFromSource.mockResolvedValue(mockOer);

      const result = await service.extractOerFromSource(mockSource);

      expect(mockStorageService.extractOerFromSource).toHaveBeenCalledWith(
        mockSource,
      );
      expect(result).toEqual(mockOer);
    });
  });

  describe('findOersWithMissingFileMetadata', () => {
    it('should delegate to storage service', async () => {
      const mockOers: OpenEducationalResource[] = [
        {
          id: 'oer-1',
          url: 'https://example.com/1.pdf',
        } as OpenEducationalResource,
        {
          id: 'oer-2',
          url: 'https://example.com/2.pdf',
        } as OpenEducationalResource,
      ];

      mockStorageService.findOersWithMissingFileMetadata.mockResolvedValue(
        mockOers,
      );

      const result = await service.findOersWithMissingFileMetadata();

      expect(
        mockStorageService.findOersWithMissingFileMetadata,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockOers);
    });
  });

  describe('updateFileMetadata', () => {
    it('should delegate to storage service', async () => {
      const mockOer: OpenEducationalResource = {
        id: 'oer-123',
        url: 'https://example.com/resource.pdf',
        source_name: SOURCE_NAME_NOSTR,
      } as OpenEducationalResource;

      const updatedOer: OpenEducationalResource = {
        ...mockOer,
        file_mime_type: 'application/pdf',
      } as OpenEducationalResource;

      mockStorageService.updateFileMetadata.mockResolvedValue(updatedOer);

      const result = await service.updateFileMetadata(mockOer);

      expect(mockStorageService.updateFileMetadata).toHaveBeenCalledWith(
        mockOer,
      );
      expect(result).toEqual(updatedOer);
    });
  });
});
