import { MigrationInterface, QueryRunner } from "typeorm";

export class TTokenExpired1758531358046 implements MigrationInterface {
    name = 'TTokenExpired1758531358046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behaviors" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "behaviors" DROP COLUMN "description"`);
    }

}
