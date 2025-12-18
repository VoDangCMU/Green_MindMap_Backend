import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorSurveyEntity1765216261259 implements MigrationInterface {
    name = 'RefactorSurveyEntity1765216261259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "questionSetId" uuid`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD CONSTRAINT "FK_5a5ff58d6ac74d0a432a1afc606" FOREIGN KEY ("questionSetId") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP CONSTRAINT "FK_5a5ff58d6ac74d0a432a1afc606"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "questionSetId"`);
    }

}
