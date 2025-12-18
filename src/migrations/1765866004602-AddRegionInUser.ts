import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionInUser1765866004602 implements MigrationInterface {
    name = 'AddRegionInUser1765866004602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP CONSTRAINT "FK_f516f701cd27fbbacf2848963c7"`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "region" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "region"`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD "model_id" uuid`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD CONSTRAINT "FK_f516f701cd27fbbacf2848963c7" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
