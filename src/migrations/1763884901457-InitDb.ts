import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1763884901457 implements MigrationInterface {
    name = 'InitDb1763884901457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_5b941064230f580cdf3ca97bde7"`);
        await queryRunner.query(`CREATE TABLE "night_out_freq" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "night_out_count" integer NOT NULL DEFAULT '0', "base_night_out" integer NOT NULL, "weight" numeric NOT NULL DEFAULT '0.2', "direction" character varying NOT NULL DEFAULT 'up', "sigma_r" numeric NOT NULL DEFAULT '1', "alpha" numeric NOT NULL DEFAULT '0.5', "home_location" character varying NOT NULL, "metric" character varying, "vt" numeric, "bt" numeric, "r" numeric, "n" numeric, "contrib" numeric, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "big_five_before_id" uuid, "big_five_after_id" uuid, "user_id" uuid, CONSTRAINT "PK_0ef2f711c3517cc7dcd6d2614cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "metrics" DROP COLUMN "metric"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "totalDaily"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "baseAvg"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "weight"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "sigma_r"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "alpha"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "bigFiveBeforeId"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "bigFiveAfterId"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "vt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "bt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "r"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "n"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "contrib"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "direction"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "metric"`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD "type" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "total_spend" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "day_spend" date`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "openness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "conscientiousness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "extraversion" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "agreeableness" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "neuroticism" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD CONSTRAINT "FK_faadc2dce89de2f6e5f8fc303d6" FOREIGN KEY ("big_five_before_id") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD CONSTRAINT "FK_98858f609994a00376122c9bd65" FOREIGN KEY ("big_five_after_id") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD CONSTRAINT "FK_f3374f49e534e7bb6943eeaffdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP CONSTRAINT "FK_f3374f49e534e7bb6943eeaffdf"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP CONSTRAINT "FK_98858f609994a00376122c9bd65"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP CONSTRAINT "FK_faadc2dce89de2f6e5f8fc303d6"`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "neuroticism" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "agreeableness" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "extraversion" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "conscientiousness" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "big_five" ALTER COLUMN "openness" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "day_spend"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "total_spend"`);
        await queryRunner.query(`ALTER TABLE "metrics" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "metrics" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "metric" character varying`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "direction" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "contrib" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "n" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "r" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "bt" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "vt" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "bigFiveAfterId" uuid`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "bigFiveBeforeId" uuid`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "alpha" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "sigma_r" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "weight" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "baseAvg" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "totalDaily" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD "metric" character varying(100) NOT NULL`);
        await queryRunner.query(`DROP TABLE "night_out_freq"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_5b941064230f580cdf3ca97bde7" FOREIGN KEY ("bigFiveAfterId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae" FOREIGN KEY ("bigFiveBeforeId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
