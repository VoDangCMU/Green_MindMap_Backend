import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteUnUsedColumn1764016918225 implements MigrationInterface {
    name = 'DeleteUnUsedColumn1764016918225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "model_id" character varying`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "model_id" character varying`);
    }

}
