import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSegment1766066245005 implements MigrationInterface {
    name = 'FixSegment1766066245005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segments" DROP CONSTRAINT "FK_87a97b18e14b9491b8ef3d2cf22"`);
        await queryRunner.query(`ALTER TABLE "segments" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "segments" ADD CONSTRAINT "FK_c9cd44569b9f2098b198f9e2d85" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segments" DROP CONSTRAINT "FK_c9cd44569b9f2098b198f9e2d85"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "segments" ADD "model_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "segments" ADD CONSTRAINT "FK_87a97b18e14b9491b8ef3d2cf22" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
