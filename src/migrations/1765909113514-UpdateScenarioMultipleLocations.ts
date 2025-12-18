import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateScenarioMultipleLocations1765909113514 implements MigrationInterface {
    name = 'UpdateScenarioMultipleLocations1765909113514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" text DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD CONSTRAINT "FK_70e66242a533fece3a33684f0be" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP CONSTRAINT "FK_70e66242a533fece3a33684f0be"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "userId"`);
    }

}
