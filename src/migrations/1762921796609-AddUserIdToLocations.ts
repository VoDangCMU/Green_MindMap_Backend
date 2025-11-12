import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToLocations1762921796609 implements MigrationInterface {
    name = 'AddUserIdToLocations1762921796609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints nếu tồn tại (từ schema cũ)
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_8686a3315332905d65f0f46c5c0"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locationsId"`);

        // Thêm cột user_id (nullable trước để an toàn với dữ liệu hiện có)
        await queryRunner.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "user_id" uuid`);

        // Thêm cột length_to_previous_location nếu chưa có
        await queryRunner.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "length_to_previous_location" double precision`);

        // Set address thành nullable
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" DROP NOT NULL`);

        // Thêm foreign key constraint nếu chưa có
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_6315d9b5cb977506b9f747e0974'
                ) THEN
                    ALTER TABLE "locations" ADD CONSTRAINT "FK_6315d9b5cb977506b9f747e0974" 
                    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "FK_6315d9b5cb977506b9f747e0974"`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN IF EXISTS "length_to_previous_location"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locationsId" uuid`);
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_8686a3315332905d65f0f46c5c0'
                ) THEN
                    ALTER TABLE "users" ADD CONSTRAINT "FK_8686a3315332905d65f0f46c5c0" 
                    FOREIGN KEY ("locationsId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

}
