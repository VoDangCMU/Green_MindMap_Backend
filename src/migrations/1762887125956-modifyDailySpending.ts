import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyDailySpending1762887125956 implements MigrationInterface {
    name = 'ModifyDailySpending1762887125956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "metric" character varying`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "vt" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "bt" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "r" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "n" double precision`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD "contrib" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "contrib"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "n"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "r"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "bt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "vt"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP COLUMN "metric"`);
    }

}
