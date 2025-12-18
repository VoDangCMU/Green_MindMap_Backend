import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityQuestion1764965587963 implements MigrationInterface {
    name = 'FixEntityQuestion1764965587963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "question_set_questions" ("questionSetsId" uuid NOT NULL, "questionsId" uuid NOT NULL, CONSTRAINT "PK_084ebcddcc44aa0b8f6c6f07080" PRIMARY KEY ("questionSetsId", "questionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b3a6802ceaa5d7c04c41d6d74" ON "question_set_questions" ("questionSetsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9933e8c55c2a9ad3334daaf3c" ON "question_set_questions" ("questionsId") `);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "question_set_questions" ADD CONSTRAINT "FK_3b3a6802ceaa5d7c04c41d6d74e" FOREIGN KEY ("questionSetsId") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "question_set_questions" ADD CONSTRAINT "FK_e9933e8c55c2a9ad3334daaf3c0" FOREIGN KEY ("questionsId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_set_questions" DROP CONSTRAINT "FK_e9933e8c55c2a9ad3334daaf3c0"`);
        await queryRunner.query(`ALTER TABLE "question_set_questions" DROP CONSTRAINT "FK_3b3a6802ceaa5d7c04c41d6d74e"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9933e8c55c2a9ad3334daaf3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b3a6802ceaa5d7c04c41d6d74"`);
        await queryRunner.query(`DROP TABLE "question_set_questions"`);
    }

}
