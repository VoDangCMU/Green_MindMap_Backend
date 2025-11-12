import { MigrationInterface, QueryRunner } from "typeorm";

export class HealthyFood1762928758833 implements MigrationInterface {
    name = 'HealthyFood1762928758833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "metrics" DROP CONSTRAINT "FK_metrics_user"`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" DROP CONSTRAINT "FK_healthy_food_ratio_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_metrics_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_metrics_metric"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_healthy_food_ratio_userId"`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "weight" SET DEFAULT '0.25'`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "sigmaR" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD CONSTRAINT "FK_592d7eb22e009bb856cc14db1a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ADD CONSTRAINT "FK_ace48dfa24c20b9282a35717c8e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" DROP CONSTRAINT "FK_ace48dfa24c20b9282a35717c8e"`);
        await queryRunner.query(`ALTER TABLE "metrics" DROP CONSTRAINT "FK_592d7eb22e009bb856cc14db1a5"`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "sigmaR" SET DEFAULT 1.0`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ALTER COLUMN "weight" SET DEFAULT 0.25`);
        await queryRunner.query(`CREATE INDEX "IDX_healthy_food_ratio_userId" ON "healthy_food_ratio" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_metrics_metric" ON "metrics" ("metric") `);
        await queryRunner.query(`CREATE INDEX "IDX_metrics_userId" ON "metrics" ("userId") `);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ADD CONSTRAINT "FK_healthy_food_ratio_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD CONSTRAINT "FK_metrics_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
