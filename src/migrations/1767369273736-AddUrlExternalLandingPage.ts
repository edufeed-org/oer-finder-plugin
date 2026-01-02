import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUrlExternalLandingPage1767369273736
  implements MigrationInterface
{
  name = 'AddUrlExternalLandingPage1767369273736';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "url_external_landing_page" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "url_external_landing_page"`,
    );
  }
}
