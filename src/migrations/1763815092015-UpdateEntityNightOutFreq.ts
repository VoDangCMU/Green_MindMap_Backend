import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntityNightOutFreq1763815092015 implements MigrationInterface {
    name = 'UpdateEntityNightOutFreq1763815092015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP CONSTRAINT "PK_0ef2f711c3517cc7dcd6d2614cd"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD CONSTRAINT "PK_0ef2f711c3517cc7dcd6d2614cd" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP CONSTRAINT "PK_0ef2f711c3517cc7dcd6d2614cd"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ADD CONSTRAINT "PK_0ef2f711c3517cc7dcd6d2614cd" PRIMARY KEY ("id")`);
    }

}
