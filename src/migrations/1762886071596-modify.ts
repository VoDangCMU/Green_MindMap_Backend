import { MigrationInterface, QueryRunner } from "typeorm";

export class Modify1762886071596 implements MigrationInterface {
    name = 'Modify1762886071596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_6315d9b5cb977506b9f747e0974"`);
        await queryRunner.query(`ALTER TABLE "big_five" DROP CONSTRAINT "FK_b0ef77ef93bb2d14cedfcc978c5"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "big_five" DROP COLUMN "night_out_freq_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationsId" uuid`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8686a3315332905d65f0f46c5c0" FOREIGN KEY ("locationsId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8686a3315332905d65f0f46c5c0"`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationsId"`);
        await queryRunner.query(`ALTER TABLE "big_five" ADD "night_out_freq_id" character varying`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "big_five" ADD CONSTRAINT "FK_b0ef77ef93bb2d14cedfcc978c5" FOREIGN KEY ("night_out_freq_id") REFERENCES "night_out_freq"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_6315d9b5cb977506b9f747e0974" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
