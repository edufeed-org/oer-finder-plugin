import type { Event } from 'nostr-tools/core';
import { verifyEvent } from 'nostr-tools/pure';

/**
 * Validation result with type-safe error information.
 */
export type EventValidationResult =
  | { valid: true; event: Event }
  | { valid: false; reason: string; event: Event };

/**
 * Utility for validating Nostr events.
 */
export class EventValidator {
  /**
   * Validates a Nostr event's cryptographic signature.
   *
   * @param event - The event to validate
   * @returns Validation result with type-safe discriminated union
   */
  static validateSignature(event: Event): EventValidationResult {
    const isValid = verifyEvent(event);

    if (!isValid) {
      return {
        valid: false,
        reason: 'Invalid cryptographic signature',
        event,
      };
    }

    return { valid: true, event };
  }

  /**
   * Formats a validation error message with event context.
   */
  static formatValidationError(
    result: EventValidationResult & { valid: false },
    relayUrl: string,
  ): string {
    return `${result.reason} from ${relayUrl}: ${result.event.id} (kind: ${result.event.kind}, pubkey: ${result.event.pubkey})`;
  }
}
