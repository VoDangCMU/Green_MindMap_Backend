import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSegemt1766093050340 implements MigrationInterface {
    name = 'AddSegemt1766093050340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "models" DROP CONSTRAINT "FK_models_behavior"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_286b0e15d3765b69162485aa067"`);
        await queryRunner.query(`ALTER TABLE "question_sets" DROP CONSTRAINT "FK_question_sets_model"`);
        await queryRunner.query(`ALTER TABLE "segments" DROP CONSTRAINT "FK_segments_model"`);
        await queryRunner.query(`ALTER TABLE "model_users" DROP CONSTRAINT "FK_model_users_model"`);
        await queryRunner.query(`ALTER TABLE "model_users" DROP CONSTRAINT "FK_model_users_user"`);
        await queryRunner.query(`ALTER TABLE "templates" RENAME COLUMN "modelId" TO "model_id"`);
        await queryRunner.query(`ALTER TABLE "segments" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD "segment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD "model_id" uuid`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "openness" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "conscientiousness" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "extraversion" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "agreeableness" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "neuroticism" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_1c077b0873c1e9dbe341154f922"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ALTER COLUMN "model_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "models" ADD CONSTRAINT "FK_50e8e3d2895dba4445032295fb7" FOREIGN KEY ("behavior_id") REFERENCES "behaviors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_766936dd49e365b284510bb9415" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_sets" ADD CONSTRAINT "FK_f63e24190d507fdd5d39a1b85e5" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segments" ADD CONSTRAINT "FK_c9cd44569b9f2098b198f9e2d85" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_users" ADD CONSTRAINT "FK_f6eefeb0b474302b034083c73f8" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_users" ADD CONSTRAINT "FK_547c0973996d1b8bf27aed2f900" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_1c077b0873c1e9dbe341154f922" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_f5f0e1123079d2c3654b4cb43b1" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD CONSTRAINT "FK_f516f701cd27fbbacf2848963c7" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP CONSTRAINT "FK_f516f701cd27fbbacf2848963c7"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_f5f0e1123079d2c3654b4cb43b1"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_1c077b0873c1e9dbe341154f922"`);
        await queryRunner.query(`ALTER TABLE "model_users" DROP CONSTRAINT "FK_547c0973996d1b8bf27aed2f900"`);
        await queryRunner.query(`ALTER TABLE "model_users" DROP CONSTRAINT "FK_f6eefeb0b474302b034083c73f8"`);
        await queryRunner.query(`ALTER TABLE "segments" DROP CONSTRAINT "FK_c9cd44569b9f2098b198f9e2d85"`);
        await queryRunner.query(`ALTER TABLE "question_sets" DROP CONSTRAINT "FK_f63e24190d507fdd5d39a1b85e5"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_766936dd49e365b284510bb9415"`);
        await queryRunner.query(`ALTER TABLE "models" DROP CONSTRAINT "FK_50e8e3d2895dba4445032295fb7"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ALTER COLUMN "model_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_1c077b0873c1e9dbe341154f922" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "neuroticism" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "agreeableness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "extraversion" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "conscientiousness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "openness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP COLUMN "model_id"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP COLUMN "segment_id"`);
        await queryRunner.query(`ALTER TABLE "segments" ADD "model_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "templates" RENAME COLUMN "model_id" TO "modelId"`);
        await queryRunner.query(`ALTER TABLE "model_users" ADD CONSTRAINT "FK_model_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_users" ADD CONSTRAINT "FK_model_users_model" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segments" ADD CONSTRAINT "FK_segments_model" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_sets" ADD CONSTRAINT "FK_question_sets_model" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_286b0e15d3765b69162485aa067" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "models" ADD CONSTRAINT "FK_models_behavior" FOREIGN KEY ("behavior_id") REFERENCES "behaviors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
