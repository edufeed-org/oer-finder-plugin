import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OerSource } from './oer-source.entity';

@Entity('open_educational_resources')
@Index(['url', 'source_name'], { unique: true })
export class OpenEducationalResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  @Index()
  url: string | null;

  /**
   * The source system that owns/controls this OER entry.
   * This determines which system is authoritative for this resource.
   * Examples: 'nostr', 'arasaac', 'openverse'
   *
   * Combined with url, forms the unique identity of an OER.
   * The same URL from different sources will be stored as separate entries.
   */
  @Column({ type: 'text' })
  @Index()
  source_name: string;

  @Column({ type: 'text', nullable: true })
  @Index()
  license_uri: string | null;

  @Column({ type: 'boolean', nullable: true })
  @Index()
  free_to_use: boolean | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  file_mime_type: string | null;

  @Column({ type: 'jsonb', nullable: true })
  amb_metadata: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[] | null;

  @Column({ type: 'text', nullable: true })
  file_dim: string | null;

  @Column({ type: 'bigint', nullable: true })
  file_size: number | null;

  @Column({ type: 'text', nullable: true })
  file_alt: string | null;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  attribution: string | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  audience_uri: string | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  educational_level_uri: string | null;

  @Column({ type: 'text', nullable: true })
  url_external_landing_page: string | null;

  /**
   * All sources that have provided data for this OER
   */
  @OneToMany(() => OerSource, (source) => source.oer, {
    cascade: true,
  })
  sources: OerSource[];

  @CreateDateColumn()
  @Index()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
