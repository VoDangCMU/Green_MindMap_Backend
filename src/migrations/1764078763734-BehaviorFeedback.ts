import { MigrationInterface, QueryRunner } from "typeorm";

export class BehaviorFeedback1764078763734 implements MigrationInterface {
    name = 'BehaviorFeedback1764078763734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "behavior_feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "metric" character varying(50) NOT NULL, "vt" numeric(10,2) NOT NULL, "bt" numeric(10,2) NOT NULL, "r" numeric(10,4) NOT NULL, "n" numeric(10,4) NOT NULL, "contrib" numeric(10,4) NOT NULL, "mechanismFeedback" jsonb NOT NULL, "reason" text, "oceanScore" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_784d74123e76d8b2b6573445294" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" ADD CONSTRAINT "FK_9685e2b2486f7c03dd30c2e91de" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behavior_feedbacks" DROP CONSTRAINT "FK_9685e2b2486f7c03dd30c2e91de"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP TABLE "behavior_feedbacks"`);
    }

}
