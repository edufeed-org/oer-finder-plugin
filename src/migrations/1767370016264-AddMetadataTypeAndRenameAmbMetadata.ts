import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataTypeAndRenameAmbMetadata1767370016264
  implements MigrationInterface
{
  name = 'AddMetadataTypeAndRenameAmbMetadata1767370016264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename amb_metadata column to metadata (preserves data)
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "amb_metadata" TO "metadata"`,
    );
    // Add metadata_type column (nullable, no default)
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" ADD "metadata_type" text`,
    );
    // Set metadata_type to 'amb' for existing nostr records
    await queryRunner.query(
      `UPDATE "open_educational_resources" SET "metadata_type" = 'amb' WHERE "source_name" = 'nostr'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" DROP COLUMN "metadata_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_educational_resources" RENAME COLUMN "metadata" TO "amb_metadata"`,
    );
  }
}
