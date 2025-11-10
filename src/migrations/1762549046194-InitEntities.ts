import { MigrationInterface, QueryRunner } from "typeorm";

export class ReInitEntiities1762549046194 implements MigrationInterface {
    name = 'ReInitEntiities1762549046194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_78eda52dc27b7ad20350c4a752d"`);
        await queryRunner.query(`CREATE TABLE "simulated_survey_scenarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalEligible" integer NOT NULL, "targetCount" integer NOT NULL, "assignedCount" integer NOT NULL DEFAULT '0', "unassignedCount" integer NOT NULL DEFAULT '0', "status" character varying(50) NOT NULL DEFAULT 'completed', "notes" text, "eligibleUsers" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "scenarioId" uuid, "triggeredById" uuid, CONSTRAINT "REL_234b12bdd71919aa950f08a4a4" UNIQUE ("scenarioId"), CONSTRAINT "PK_f97115b372136a12ba8e09c3eee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "gender" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationsId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_234b12bdd71919aa950f08a4a44" FOREIGN KEY ("scenarioId") REFERENCES "survey_scenarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8686a3315332905d65f0f46c5c0" FOREIGN KEY ("locationsId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8686a3315332905d65f0f46c5c0"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_234b12bdd71919aa950f08a4a44"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationsId"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "gender"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "userId" uuid`);
        await queryRunner.query(`DROP TABLE "simulated_survey_scenarios"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_78eda52dc27b7ad20350c4a752d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
