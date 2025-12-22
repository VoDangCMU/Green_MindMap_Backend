import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSegmentAttribute1766431921950 implements MigrationInterface {
    name = 'FixSegmentAttribute1766431921950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segments" RENAME COLUMN "ageRange" TO "age"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "segmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "segments" DROP COLUMN "age"`);
        await queryRunner.query(`ALTER TABLE "segments" ADD "age" integer`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_5c54d46e6cc5a6aef078e60b300" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_5c54d46e6cc5a6aef078e60b300"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "segments" DROP COLUMN "age"`);
        await queryRunner.query(`ALTER TABLE "segments" ADD "age" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "segmentId"`);
        await queryRunner.query(`ALTER TABLE "segments" RENAME COLUMN "age" TO "ageRange"`);
    }

}
