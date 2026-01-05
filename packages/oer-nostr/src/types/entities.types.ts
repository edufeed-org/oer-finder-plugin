/**
 * Entity type re-exports from the main application.
 * Using `import type` ensures no runtime dependency on TypeORM decorators.
 */
import type { OerSource } from '@app/entities/oer-source.entity';
import type { OpenEducationalResource } from '@app/entities/open-educational-resource.entity';

/**
 * OER Source entity type as used by Nostr services.
 * Alias for the root OerSource entity.
 */
export type OerSourceEntity = OerSource;

/**
 * Open Educational Resource entity type as used by Nostr services.
 * Alias for the root OpenEducationalResource entity.
 */
export type OpenEducationalResourceEntity = OpenEducationalResource;
