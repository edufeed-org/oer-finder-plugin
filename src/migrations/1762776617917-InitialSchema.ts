import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762776617917 implements MigrationInterface {
  name = 'InitialSchema1762776617917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nostr_events" ("id" character varying(64) NOT NULL, "kind" integer NOT NULL, "pubkey" character varying(64) NOT NULL, "created_at" bigint NOT NULL, "content" text NOT NULL, "tags" jsonb NOT NULL, "raw_event" jsonb NOT NULL, "relay_url" character varying(512), "ingested_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_49f0f107f9961908d04c2192f79" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_600afd5845956fd1b4e33bcb43" ON "nostr_events" ("kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db3ce841de05354b31d814ed31" ON "nostr_events" ("pubkey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c799981b73ae1d2b419a19afa3" ON "nostr_events" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03b6fcac4d766f960c1b47201f" ON "nostr_events" ("relay_url") `,
    );
    await queryRunner.query(
      `CREATE TABLE "open_educational_resources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text, "amb_license_uri" text, "amb_free_to_use" boolean, "file_mime_type" text, "amb_metadata" jsonb, "amb_keywords" jsonb, "file_dim" text, "file_size" bigint, "file_alt" text, "amb_description" text, "audience_uri" text, "educational_level_uri" text, "amb_date_created" TIMESTAMP WITH TIME ZONE, "amb_date_published" TIMESTAMP WITH TIME ZONE, "amb_date_modified" TIMESTAMP WITH TIME ZONE, "event_amb_id" character varying, "event_file_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_82cfb2c3e01081b46485c669bb8" UNIQUE ("url"), CONSTRAINT "PK_91c6b46b770db44d7ca525a5ad0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_82cfb2c3e01081b46485c669bb" ON "open_educational_resources" ("url") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d28b7baf02905f4ac2e1187656" ON "open_educational_resources" ("amb_license_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c9d767d3910af71dcde3a0f22" ON "open_educational_resources" ("amb_free_to_use") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_15171bb51ae1592bda54385c85" ON "open_educational_resources" ("file_mime_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3fdb6f4d52ac5c1a16501768a" ON "open_educational_resources" ("audience_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b67f6632b2a85c6b3d60b4109b" ON "open_educational_resources" ("educational_level_uri") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e68bf6afb8411ad7e9ec58c080" ON "open_educational_resources" ("amb_date_created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65fca873791458f94e20e545c8" ON "open_educational_resources" ("amb_date_published") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eca4b680f8368bec3f7b5e5b22" ON "open_educational_resources" ("amb_date_modified") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b69a39222fb7793c0dc1ae58ad" ON "open_educational_resources" ("event_amb_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f4abb483f5b9e7ef9b15a2957" ON "open_educational_resources" ("event_file_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6acc4a3b14e98e98a4c408d418" ON "open_educational_resources" ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD CONSTRAINT "FK_b69a39222fb7793c0dc1ae58ada" FOREIGN KEY ("event_amb_id") REFERENCES "nostr_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD CONSTRAINT "FK_6f4abb483f5b9e7ef9b15a29575" FOREIGN KEY ("event_file_id") REFERENCES "nostr_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP CONSTRAINT "FK_6f4abb483f5b9e7ef9b15a29575"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP CONSTRAINT "FK_b69a39222fb7793c0dc1ae58ada"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6acc4a3b14e98e98a4c408d418"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f4abb483f5b9e7ef9b15a2957"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b69a39222fb7793c0dc1ae58ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eca4b680f8368bec3f7b5e5b22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65fca873791458f94e20e545c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e68bf6afb8411ad7e9ec58c080"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b67f6632b2a85c6b3d60b4109b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3fdb6f4d52ac5c1a16501768a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_15171bb51ae1592bda54385c85"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c9d767d3910af71dcde3a0f22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d28b7baf02905f4ac2e1187656"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82cfb2c3e01081b46485c669bb"`,
    );
    await queryRunner.query(`DROP TABLE "open_educational_resources"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03b6fcac4d766f960c1b47201f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c799981b73ae1d2b419a19afa3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db3ce841de05354b31d814ed31"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_600afd5845956fd1b4e33bcb43"`,
    );
    await queryRunner.query(`DROP TABLE "nostr_events"`);
  }
}
