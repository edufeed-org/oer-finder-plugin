import type { Event } from 'nostr-tools';
import { EventValidator } from '../../src/utils/event-validator';
import { verifyEvent } from 'nostr-tools';

jest.mock('nostr-tools', () => ({
  verifyEvent: jest.fn(),
}));

describe('EventValidator', () => {
  const mockEvent: Event = {
    id: 'test-event-id',
    kind: 1,
    pubkey: 'test-pubkey',
    created_at: 1234567890,
    content: 'test content',
    tags: [['test', 'tag']],
    sig: 'test-signature',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSignature', () => {
    it('should return valid result for valid signature', () => {
      jest.mocked(verifyEvent).mockReturnValue(true);

      const result = EventValidator.validateSignature(mockEvent);

      expect(result.valid).toBe(true);
      expect(verifyEvent).toHaveBeenCalledWith(mockEvent);
      if (result.valid) {
        expect(result.event).toEqual(mockEvent);
      }
    });

    it('should return invalid result for invalid signature', () => {
      jest.mocked(verifyEvent).mockReturnValue(false);

      const result = EventValidator.validateSignature(mockEvent);

      expect(result.valid).toBe(false);
      expect(verifyEvent).toHaveBeenCalledWith(mockEvent);
      if (!result.valid) {
        expect(result.reason).toBe('Invalid cryptographic signature');
        expect(result.event).toEqual(mockEvent);
      }
    });

    it('should include event in both valid and invalid results', () => {
      jest.mocked(verifyEvent).mockReturnValue(true);
      const validResult = EventValidator.validateSignature(mockEvent);
      expect(validResult.event).toBe(mockEvent);

      jest.mocked(verifyEvent).mockReturnValue(false);
      const invalidResult = EventValidator.validateSignature(mockEvent);
      expect(invalidResult.event).toBe(mockEvent);
    });
  });

  describe('formatValidationError', () => {
    it('should format validation error with event context', () => {
      const invalidResult = {
        valid: false as const,
        reason: 'Invalid cryptographic signature',
        event: mockEvent,
      };

      const formatted = EventValidator.formatValidationError(
        invalidResult,
        'wss://test-relay.com',
      );

      expect(formatted).toContain('Invalid cryptographic signature');
      expect(formatted).toContain('wss://test-relay.com');
      expect(formatted).toContain('test-event-id');
      expect(formatted).toContain('kind: 1');
      expect(formatted).toContain('test-pubkey');
    });

    it('should include relay URL in error message', () => {
      const invalidResult = {
        valid: false as const,
        reason: 'Test error',
        event: mockEvent,
      };

      const formatted = EventValidator.formatValidationError(
        invalidResult,
        'wss://relay.example.com',
      );

      expect(formatted).toContain('wss://relay.example.com');
    });

    it('should include event kind in error message', () => {
      const eventWithDifferentKind = { ...mockEvent, kind: 30142 };
      const invalidResult = {
        valid: false as const,
        reason: 'Test error',
        event: eventWithDifferentKind,
      };

      const formatted = EventValidator.formatValidationError(
        invalidResult,
        'wss://test.com',
      );

      expect(formatted).toContain('kind: 30142');
    });
  });
});
