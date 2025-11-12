import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailySpendingEntity1762884592939 implements MigrationInterface {
    name = 'AddDailySpendingEntity1762884592939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "avg_daily_spend" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalDaily" double precision NOT NULL, "baseAvg" double precision NOT NULL, "weight" double precision NOT NULL, "sigma_r" double precision NOT NULL, "alpha" double precision NOT NULL, "direction" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "bigFiveBeforeId" uuid, "bigFiveAfterId" uuid, CONSTRAINT "PK_7c328b5b1377787a67ac83ac72e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_b36c30be7be533535b311bcf901" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae" FOREIGN KEY ("bigFiveBeforeId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_5b941064230f580cdf3ca97bde7" FOREIGN KEY ("bigFiveAfterId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_5b941064230f580cdf3ca97bde7"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_b36c30be7be533535b311bcf901"`);
        await queryRunner.query(`DROP TABLE "avg_daily_spend"`);
    }

}
