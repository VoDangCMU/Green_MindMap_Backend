import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelField1764015904508 implements MigrationInterface {
    name = 'AddModelField1764015904508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "templates" ADD "trait" character varying`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "model_id" character varying`);
        await queryRunner.query(`ALTER TABLE "templates" ADD "modelId" uuid`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "trait" character varying`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "model_id" character varying`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "modelId" uuid`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_286b0e15d3765b69162485aa067" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e925c70d07382319627f9b5e274" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e925c70d07382319627f9b5e274"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_286b0e15d3765b69162485aa067"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "modelId"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "trait"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "modelId"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "trait"`);
    }

}
