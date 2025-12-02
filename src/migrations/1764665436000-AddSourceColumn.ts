import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceColumn1764665436000 implements MigrationInterface {
  name = 'AddSourceColumn1764665436000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add source column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "source" text`,
    );

    // Add index for source column
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_source" ON "open_educational_resources" ("source")`,
    );

    // Set default value for existing records (they came from nostr)
    await queryRunner.query(
      `UPDATE "open_educational_resources" SET "source" = 'nostr' WHERE "source" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oer_source"`);

    // Drop column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "source"`,
    );
  }
}
