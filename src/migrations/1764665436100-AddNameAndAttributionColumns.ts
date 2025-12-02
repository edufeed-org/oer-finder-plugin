import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameAndAttributionColumns1764665436100
  implements MigrationInterface
{
  name = 'AddNameAndAttributionColumns1764665436100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "name" text`,
    );

    // Add attribution column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD COLUMN "attribution" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop attribution column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "attribution"`,
    );

    // Drop name column
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN IF EXISTS "name"`,
    );
  }
}
