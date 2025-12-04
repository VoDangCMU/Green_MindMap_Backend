import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestionSet1764855863320 implements MigrationInterface {
    name = 'QuestionSet1764855863320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "question_set_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionSetId" uuid NOT NULL, "questionId" uuid NOT NULL, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a46e4d45cae42e3b7aac1f2aae9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "question_sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_12966187dea2ccd7eb45d79cd15" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_a5837fd196f804c6fda69beb34f" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_set_items" ADD CONSTRAINT "FK_88196e8ad7b1fe9401db3c193e0" FOREIGN KEY ("questionSetId") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_set_items" ADD CONSTRAINT "FK_00c1060c049905f9d5bf27edd1b" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_sets" ADD CONSTRAINT "FK_13ee52b064cc932757eaf7ea5e1" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_sets" DROP CONSTRAINT "FK_13ee52b064cc932757eaf7ea5e1"`);
        await queryRunner.query(`ALTER TABLE "question_set_items" DROP CONSTRAINT "FK_00c1060c049905f9d5bf27edd1b"`);
        await queryRunner.query(`ALTER TABLE "question_set_items" DROP CONSTRAINT "FK_88196e8ad7b1fe9401db3c193e0"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_a5837fd196f804c6fda69beb34f"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "ownerId"`);
        await queryRunner.query(`DROP TABLE "question_sets"`);
        await queryRunner.query(`DROP TABLE "question_set_items"`);
    }

}
