import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOerApiFields1764592163365 implements MigrationInterface {
  name = 'RenameOerApiFields1764592163365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes on old column names (only for fields being renamed)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d28b7baf02905f4ac2e1187656"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_3c9d767d3910af71dcde3a0f22"`,
    );

    // Rename columns (excluding date fields - they keep amb_ prefix)
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "amb_license_uri" TO "license_uri"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "amb_free_to_use" TO "free_to_use"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "amb_keywords" TO "keywords"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "amb_description" TO "description"`,
    );

    // Re-create indexes with new column names
    await queryRunner.query(
      `CREATE INDEX "IDX_license_uri" ON "open_educational_resources" ("license_uri")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_free_to_use" ON "open_educational_resources" ("free_to_use")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes on new column names
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_free_to_use"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_license_uri"`);

    // Rename columns back to original names
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "description" TO "amb_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "keywords" TO "amb_keywords"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "free_to_use" TO "amb_free_to_use"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "license_uri" TO "amb_license_uri"`,
    );

    // Re-create indexes with old column names
    await queryRunner.query(
      `CREATE INDEX "IDX_3c9d767d3910af71dcde3a0f22" ON "open_educational_resources" ("amb_free_to_use")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d28b7baf02905f4ac2e1187656" ON "open_educational_resources" ("amb_license_uri")`,
    );
  }
}
