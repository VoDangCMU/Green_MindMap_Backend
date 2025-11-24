import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBrand1763979101533 implements MigrationInterface {
    name = 'UpdateBrand1763979101533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "brands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "brands" text array NOT NULL, "startDay" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "FK_2bd14c9ce10e19d290d3f6818d9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT "FK_2bd14c9ce10e19d290d3f6818d9"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP TABLE "brands"`);
    }

}
