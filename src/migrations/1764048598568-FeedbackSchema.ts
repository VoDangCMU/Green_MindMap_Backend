import { MigrationInterface, QueryRunner } from "typeorm";

export class FeedbackSchema1764048598568 implements MigrationInterface {
    name = 'FeedbackSchema1764048598568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "model_id" uuid NOT NULL, "user_id" character varying(100) NOT NULL, "trait_checked" character varying(10) NOT NULL, "expected" numeric(5,2) NOT NULL, "actual" numeric(5,2) NOT NULL, "deviation" numeric(5,2) NOT NULL, "match" boolean NOT NULL, "level" character varying(50) NOT NULL, "feedback" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_1c077b0873c1e9dbe341154f922" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_1c077b0873c1e9dbe341154f922"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP TABLE "feedbacks"`);
    }

}
