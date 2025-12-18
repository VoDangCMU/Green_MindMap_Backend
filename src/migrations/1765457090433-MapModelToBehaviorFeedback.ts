import { MigrationInterface, QueryRunner } from "typeorm";

export class MapModelToBehaviorFeedback1765457090433 implements MigrationInterface {
    name = 'MapModelToBehaviorFeedback1765457090433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD "model_id" uuid`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD CONSTRAINT "FK_f516f701cd27fbbacf2848963c7" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP CONSTRAINT "FK_f516f701cd27fbbacf2848963c7"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP COLUMN "model_id"`);
    }

}
