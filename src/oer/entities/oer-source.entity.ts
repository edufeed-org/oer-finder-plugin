import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OpenEducationalResource } from './open-educational-resource.entity';

/**
 * Status of an OER source record.
 * - pending: Event ingested but not yet linked to an OER (e.g., file events awaiting AMB event)
 * - processed: Successfully linked to an OER
 * - failed: Processing failed
 */
export type OerSourceStatus = 'pending' | 'processed' | 'failed';

/**
 * Represents a source that provided data for an Open Educational Resource.
 * Multiple sources can reference the same OER, allowing provenance tracking.
 *
 * This table also stores pending events (e.g., file events) that haven't been
 * linked to an OER yet, enabling full replacement of the nostr_events table.
 *
 * Examples:
 * - Nostr: source_name='nostr', source_identifier='event:abc123'
 * - Arasaac: source_name='arasaac', source_identifier='resource:12345'
 * - Openverse: source_name='openverse', source_identifier='search:query-id'
 */
@Entity('oer_sources')
export class OerSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the OER this source belongs to.
   * Nullable to allow storing pending events (e.g., file events) before their OER exists.
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  oer_id: string | null;

  @ManyToOne(() => OpenEducationalResource, (oer) => oer.sources, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'oer_id' })
  oer: OpenEducationalResource | null;

  /**
   * Name/category of the source system (e.g., 'nostr', 'arasaac', 'openverse')
   */
  @Column({ type: 'text' })
  @Index()
  source_name: string;

  /**
   * Optional detailed identifier within the source type.
   * Format conventions:
   * - Nostr: 'event:{event_id}' or 'relay:{relay_url}' or 'event:{id}@relay:{url}'
   * - External APIs: Resource ID, API endpoint, search query ID, etc.
   */
  @Column({ type: 'text', nullable: true })
  source_identifier: string | null;

  /**
   * Raw data from the source, stored as JSONB.
   * - For Nostr: Complete Nostr event object
   * - For external APIs: Complete API response
   * - Useful for auditing, debugging, and potential re-processing
   */
  @Column({ type: 'jsonb' })
  source_data: Record<string, unknown>;

  /**
   * Processing status of the source record.
   * - pending: Ingested but not yet linked to an OER
   * - processed: Successfully linked to an OER
   * - failed: Processing failed
   */
  @Column({ type: 'text', default: 'processed' })
  @Index()
  status: OerSourceStatus;

  /**
   * Full URI for the source, including server/relay info.
   * Examples:
   * - Nostr: 'wss://relay.edufeed.org'
   * - API: 'https://api.arasaac.org/v1/pictograms'
   */
  @Column({ type: 'text', nullable: true })
  @Index()
  source_uri: string | null;

  /**
   * Original timestamp from the source system.
   * Used for sync resume functionality - to know where to resume from.
   */
  @Column({ type: 'bigint', nullable: true })
  @Index()
  source_timestamp: number | null;

  /**
   * Record type/classification within the source system.
   * Examples:
   * - Nostr: '30142' (AMB event), '1063' (File event)
   * - Arasaac: 'pictogram', 'material'
   * - Openverse: 'image', 'audio'
   */
  @Column({ type: 'text', nullable: true })
  @Index()
  source_record_type: string | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
