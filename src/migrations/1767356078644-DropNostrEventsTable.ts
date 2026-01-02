import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNostrEventsTable1767356078644 implements MigrationInterface {
  name = 'DropNostrEventsTable1767356078644';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nostr_events"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nostr_events" ("id" character varying(64) NOT NULL, "kind" integer NOT NULL, "pubkey" character varying(64) NOT NULL, "created_at" bigint NOT NULL, "content" text NOT NULL, "tags" jsonb NOT NULL, "raw_event" jsonb NOT NULL, "relay_url" character varying(512), "ingested_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_49f0f107f9961908d04c2192f79" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_600afd5845956fd1b4e33bcb43" ON "nostr_events" ("kind")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db3ce841de05354b31d814ed31" ON "nostr_events" ("pubkey")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c799981b73ae1d2b419a19afa3" ON "nostr_events" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03b6fcac4d766f960c1b47201f" ON "nostr_events" ("relay_url")`,
    );
  }
}
