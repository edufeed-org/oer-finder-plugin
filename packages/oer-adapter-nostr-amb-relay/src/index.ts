export {
  NostrAmbRelayAdapter,
  createNostrAmbRelayAdapter,
} from './nostr-amb-relay.adapter.js';
export type {
  NostrAmbEvent,
  NostrAmbRelayConfig,
} from './nostr-amb-relay.types.js';
export {
  NostrAmbEventSchema,
  NostrEventTagSchema,
  EVENT_AMB_KIND,
  parseNostrAmbEvent,
} from './nostr-amb-relay.types.js';
export { mapNostrAmbEventToExternalOerItem } from './mappers/nostr-amb-to-external.mapper.js';

// Re-export AMB utilities from adapter-core for convenience
export {
  ALLOWED_AMB_FIELDS,
  filterAmbMetadata,
  type AllowedAmbField,
} from '@edufeed-org/oer-adapter-core';
