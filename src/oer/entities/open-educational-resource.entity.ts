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
import { NostrEvent } from '../../nostr/entities/nostr-event.entity';

@Entity('open_educational_resources')
export class OpenEducationalResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true, unique: true })
  @Index({ unique: true })
  url: string | null;

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
  @Index()
  source: string | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  event_amb_id: string | null;

  @ManyToOne(() => NostrEvent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_amb_id' })
  eventAmb: NostrEvent | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  event_file_id: string | null;

  @ManyToOne(() => NostrEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_file_id' })
  eventFile: NostrEvent | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
