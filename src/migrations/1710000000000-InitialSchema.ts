import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create open_educational_resources table
    await queryRunner.query(
      `CREATE TABLE "open_educational_resources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "url" text,
        "source_name" text NOT NULL,
        "license_uri" text,
        "free_to_use" boolean,
        "file_mime_type" text,
        "metadata" jsonb,
        "metadata_type" text,
        "keywords" jsonb,
        "file_dim" text,
        "file_size" bigint,
        "file_alt" text,
        "name" text,
        "description" text,
        "attribution" text,
        "audience_uri" text,
        "educational_level_uri" text,
        "url_external_landing_page" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_91c6b46b770db44d7ca525a5ad0" PRIMARY KEY ("id")
      )`,
    );

    // Indexes for open_educational_resources
    await queryRunner.query(
      `CREATE INDEX "IDX_82cfb2c3e01081b46485c669bb" ON "open_educational_resources" ("url")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7724ea526569ff0d2928552949" ON "open_educational_resources" ("source_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cae7b8c16b2b3b728e13748a4b" ON "open_educational_resources" ("license_uri")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feb3b8c9620479cf6044bd9ec5" ON "open_educational_resources" ("free_to_use")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_file_mime_type" ON "open_educational_resources" ("file_mime_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_audience_uri" ON "open_educational_resources" ("audience_uri")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_educational_level_uri" ON "open_educational_resources" ("educational_level_uri")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_created_at" ON "open_educational_resources" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9e6a2067565cb0505a9d9b31ed" ON "open_educational_resources" ("url", "source_name")`,
    );

    // Create oer_sources table
    await queryRunner.query(
      `CREATE TABLE "oer_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "oer_id" uuid,
        "source_name" text NOT NULL,
        "source_identifier" text,
        "source_data" jsonb NOT NULL,
        "status" text NOT NULL DEFAULT 'processed',
        "source_uri" text,
        "source_timestamp" bigint,
        "source_record_type" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3612cee39d6cd8aefa6b976fa35" PRIMARY KEY ("id")
      )`,
    );

    // Indexes for oer_sources
    await queryRunner.query(
      `CREATE INDEX "IDX_16f6043163502f0aeda104772f" ON "oer_sources" ("oer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09fe53efc402e7d2bb8248689d" ON "oer_sources" ("source_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_882c2d8f5d24da3c0829124fec" ON "oer_sources" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d9f2eef0492502ef272119bd" ON "oer_sources" ("source_uri")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8514dce00ba8f9a9c5c9c7a1f7" ON "oer_sources" ("source_timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fffcc98246c761891de52746b2" ON "oer_sources" ("source_record_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ed712037fa3a5ca3876be0ec61" ON "oer_sources" ("created_at")`,
    );

    // Foreign key: oer_sources.oer_id -> open_educational_resources.id
    await queryRunner.query(
      `ALTER TABLE "oer_sources" ADD CONSTRAINT "FK_16f6043163502f0aeda104772f2" FOREIGN KEY ("oer_id") REFERENCES "open_educational_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oer_sources" DROP CONSTRAINT "FK_16f6043163502f0aeda104772f2"`,
    );
    await queryRunner.query(`DROP TABLE "oer_sources"`);
    await queryRunner.query(`DROP TABLE "open_educational_resources"`);
  }
}
