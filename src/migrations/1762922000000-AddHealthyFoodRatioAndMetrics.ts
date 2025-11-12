import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHealthyFoodRatioAndMetrics1762922000000 implements MigrationInterface {
    name = 'AddHealthyFoodRatioAndMetrics1762922000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create healthy_food_ratio table
        await queryRunner.query(`
            CREATE TABLE "healthy_food_ratio" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "plantMeals" integer NOT NULL,
                "totalMeals" integer NOT NULL,
                "baseLikert" integer NOT NULL DEFAULT 4,
                "weight" double precision NOT NULL DEFAULT 0.25,
                "direction" character varying(10) NOT NULL DEFAULT 'up',
                "sigmaR" double precision NOT NULL DEFAULT 1.0,
                "alpha" double precision NOT NULL DEFAULT 0.5,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_healthy_food_ratio" PRIMARY KEY ("id"),
                CONSTRAINT "FK_healthy_food_ratio_user" FOREIGN KEY ("userId") 
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create metrics table
        await queryRunner.query(`
            CREATE TABLE "metrics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "metric" character varying(100) NOT NULL,
                "vt" double precision NOT NULL,
                "bt" double precision NOT NULL,
                "r" double precision NOT NULL,
                "n" double precision NOT NULL,
                "contrib" double precision,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_metrics" PRIMARY KEY ("id"),
                CONSTRAINT "FK_metrics_user" FOREIGN KEY ("userId") 
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_healthy_food_ratio_userId" ON "healthy_food_ratio" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_metrics_userId" ON "metrics" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_metrics_metric" ON "metrics" ("metric")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_metrics_metric"`);
        await queryRunner.query(`DROP INDEX "IDX_metrics_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_healthy_food_ratio_userId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "metrics"`);
        await queryRunner.query(`DROP TABLE "healthy_food_ratio"`);
    }
}

