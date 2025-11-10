import { MigrationInterface, QueryRunner } from "typeorm";

export class PreSurvey1762744529239 implements MigrationInterface {
    name = 'PreSurvey1762744529239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pre_app_survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "daily_spending" numeric, "daily_spending_sigmoid" numeric, "daily_spending_weight" numeric, "daily_spending_direction" character varying, "daily_spending_alpha" numeric, "spending_variation" integer, "spending_variation_sigmoid" numeric, "spending_variation_weight" numeric, "spending_variation_direction" character varying, "spending_variation_alpha" numeric, "brand_trial" integer, "brand_trial_sigmoid" numeric, "brand_trial_weight" numeric, "brand_trial_direction" character varying, "brand_trial_alpha" numeric, "shopping_list" integer, "shopping_list_sigmoid" numeric, "shopping_list_weight" numeric, "shopping_list_direction" character varying, "shopping_list_alpha" numeric, "daily_distance" numeric, "daily_distance_sigmoid" numeric, "daily_distance_weight" numeric, "daily_distance_direction" character varying, "daily_distance_alpha" numeric, "new_places" integer, "new_places_sigmoid" numeric, "new_places_weight" numeric, "new_places_direction" character varying, "new_places_alpha" numeric, "public_transport" integer, "public_transport_sigmoid" numeric, "public_transport_weight" numeric, "public_transport_direction" character varying, "public_transport_alpha" numeric, "stable_schedule" integer, "stable_schedule_sigmoid" numeric, "stable_schedule_weight" numeric, "stable_schedule_direction" character varying, "stable_schedule_alpha" numeric, "night_outings" integer, "night_outings_sigmoid" numeric, "night_outings_weight" numeric, "night_outings_direction" character varying, "night_outings_alpha" numeric, "healthy_eating" integer, "healthy_eating_sigmoid" numeric, "healthy_eating_weight" numeric, "healthy_eating_direction" character varying, "healthy_eating_alpha" numeric, "social_media" integer, "goal_setting" integer, "mood_swings" integer, "is_completed" boolean NOT NULL DEFAULT false, "completed_at" TIMESTAMP, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_07aae69c8eabc9cbedee3c84d70" UNIQUE ("user_id"), CONSTRAINT "REL_07aae69c8eabc9cbedee3c84d7" UNIQUE ("user_id"), CONSTRAINT "PK_5aef47b268af478bd8c63076b4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pre_app_survey" ADD CONSTRAINT "FK_07aae69c8eabc9cbedee3c84d70" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pre_app_survey" DROP CONSTRAINT "FK_07aae69c8eabc9cbedee3c84d70"`);
        await queryRunner.query(`DROP TABLE "pre_app_survey"`);
    }

}
