import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAmbDateColumns1764665435927 implements MigrationInterface {
  name = 'RemoveAmbDateColumns1764665435927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oer_amb_date_created"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_oer_amb_date_published"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oer_amb_date_modified"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "amb_date_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "amb_date_published"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "amb_date_modified"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add columns
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "amb_date_created" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "amb_date_published" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "amb_date_modified" TIMESTAMP WITH TIME ZONE`,
    );

    // Re-add indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_amb_date_created" ON "open_educational_resources" ("amb_date_created")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_amb_date_published" ON "open_educational_resources" ("amb_date_published")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oer_amb_date_modified" ON "open_educational_resources" ("amb_date_modified")`,
    );
  }
}
