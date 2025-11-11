import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('nostr_events')
export class NostrEvent {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column('int')
  @Index()
  kind: number;

  @Column({ length: 64 })
  @Index()
  pubkey: string;

  @Column('bigint')
  @Index()
  created_at: number;

  @Column('text')
  content: string;

  @Column('jsonb')
  tags: string[][];

  @Column('jsonb')
  raw_event: Record<string, unknown>;

  @Column({ type: 'varchar', length: 512, nullable: true })
  @Index()
  relay_url: string | null;

  @CreateDateColumn()
  ingested_at: Date;
}
