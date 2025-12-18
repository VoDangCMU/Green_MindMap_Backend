import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorCreateQuestion1765362653009 implements MigrationInterface {
    name = 'RefactorCreateQuestion1765362653009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_900ccfcf91e174e7e275de127f1"`);
        await queryRunner.query(`ALTER TABLE "behaviors" DROP CONSTRAINT "FK_5afc686724620f4c13d4cf1a29c"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "threadHallId"`);
        await queryRunner.query(`ALTER TABLE "behaviors" DROP COLUMN "threadHallId"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "behaviors" ADD "threadHallId" uuid`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "threadHallId" uuid`);
        await queryRunner.query(`ALTER TABLE "behaviors" ADD CONSTRAINT "FK_5afc686724620f4c13d4cf1a29c" FOREIGN KEY ("threadHallId") REFERENCES "thread_halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_900ccfcf91e174e7e275de127f1" FOREIGN KEY ("threadHallId") REFERENCES "thread_halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
