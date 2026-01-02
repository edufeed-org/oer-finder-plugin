import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOerSourcesTable1767355896158 implements MigrationInterface {
  name = 'AddOerSourcesTable1767355896158';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP CONSTRAINT "FK_b69a39222fb7793c0dc1ae58ada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP CONSTRAINT "FK_6f4abb483f5b9e7ef9b15a29575"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82cfb2c3e01081b46485c669bb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b69a39222fb7793c0dc1ae58ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f4abb483f5b9e7ef9b15a2957"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_license_uri"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_free_to_use"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_oer_source"`);
    await queryRunner.query(
      `CREATE TABLE "oer_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "oer_id" uuid, "source_name" text NOT NULL, "source_identifier" text, "source_data" jsonb NOT NULL, "status" text NOT NULL DEFAULT 'processed', "source_uri" text, "source_timestamp" bigint, "source_record_type" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3612cee39d6cd8aefa6b976fa35" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16f6043163502f0aeda104772f" ON "oer_sources" ("oer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09fe53efc402e7d2bb8248689d" ON "oer_sources" ("source_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_882c2d8f5d24da3c0829124fec" ON "oer_sources" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d9f2eef0492502ef272119bd" ON "oer_sources" ("source_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8514dce00ba8f9a9c5c9c7a1f7" ON "oer_sources" ("source_timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fffcc98246c761891de52746b2" ON "oer_sources" ("source_record_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ed712037fa3a5ca3876be0ec61" ON "oer_sources" ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "event_amb_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "event_file_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "source_name" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP CONSTRAINT "UQ_82cfb2c3e01081b46485c669bb8"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82cfb2c3e01081b46485c669bb" ON "open_educational_resources" ("url") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7724ea526569ff0d2928552949" ON "open_educational_resources" ("source_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cae7b8c16b2b3b728e13748a4b" ON "open_educational_resources" ("license_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feb3b8c9620479cf6044bd9ec5" ON "open_educational_resources" ("free_to_use") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9e6a2067565cb0505a9d9b31ed" ON "open_educational_resources" ("url", "source_name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "oer_sources" ADD CONSTRAINT "FK_16f6043163502f0aeda104772f2" FOREIGN KEY ("oer_id") REFERENCES "open_educational_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oer_sources" DROP CONSTRAINT "FK_16f6043163502f0aeda104772f2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e6a2067565cb0505a9d9b31ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feb3b8c9620479cf6044bd9ec5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cae7b8c16b2b3b728e13748a4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7724ea526569ff0d2928552949"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82cfb2c3e01081b46485c669bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD CONSTRAINT "UQ_82cfb2c3e01081b46485c669bb8" UNIQUE ("url")`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "source_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "source" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "event_file_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "event_amb_id" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ed712037fa3a5ca3876be0ec61"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fffcc98246c761891de52746b2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8514dce00ba8f9a9c5c9c7a1f7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0d9f2eef0492502ef272119bd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_882c2d8f5d24da3c0829124fec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09fe53efc402e7d2bb8248689d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_16f6043163502f0aeda104772f"`,
    );
    await queryRunner.query(`DROP TABLE "oer_sources"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_source" ON "open_educational_resources" ("source") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_free_to_use" ON "open_educational_resources" ("free_to_use") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_license_uri" ON "open_educational_resources" ("license_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f4abb483f5b9e7ef9b15a2957" ON "open_educational_resources" ("event_file_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b69a39222fb7793c0dc1ae58ad" ON "open_educational_resources" ("event_amb_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_82cfb2c3e01081b46485c669bb" ON "open_educational_resources" ("url") `,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD CONSTRAINT "FK_6f4abb483f5b9e7ef9b15a29575" FOREIGN KEY ("event_file_id") REFERENCES "nostr_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD CONSTRAINT "FK_b69a39222fb7793c0dc1ae58ada" FOREIGN KEY ("event_amb_id") REFERENCES "nostr_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
