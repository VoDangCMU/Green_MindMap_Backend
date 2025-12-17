import { MigrationInterface, QueryRunner } from "typeorm";

export class DropUnusedTables1765952400000 implements MigrationInterface {
    name = 'DropUnusedTables1765952400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first if they exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_5afc686724620f4c13d4cf1a29c' AND table_name = 'behaviors') THEN
                    ALTER TABLE "behaviors" DROP CONSTRAINT "FK_5afc686724620f4c13d4cf1a29c";
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_900ccfcf91e174e7e275de127f1' AND table_name = 'questions') THEN
                    ALTER TABLE "questions" DROP CONSTRAINT "FK_900ccfcf91e174e7e275de127f1";
                END IF;
            END $$;
        `);

        // Drop unused tables if they exist
        await queryRunner.query(`DROP TABLE IF EXISTS "thread_halls" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "healthy_food_ratio" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "spend_variability" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "survey_scenarios_questions_questions" CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate thread_halls table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "thread_halls" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_thread_halls" PRIMARY KEY ("id")
            )
        `);

        // Note: healthy_food_ratio, spend_variability, survey_scenarios_questions_questions
        // are legacy tables and their exact schema is unknown, so they are not recreated
    }
}

