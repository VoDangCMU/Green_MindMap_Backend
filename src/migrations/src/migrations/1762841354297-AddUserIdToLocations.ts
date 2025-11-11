import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToLocations1762841354297 implements MigrationInterface {
    name = 'AddUserIdToLocations1762841354297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8686a3315332905d65f0f46c5c0"`);
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "fk_todos_parent"`);
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "fk_todos_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_todos_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_todos_parent_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationsId"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "completed" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "order" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "createdAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "updatedAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_6315d9b5cb977506b9f747e0974" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "FK_5508b1763e832c788cc6b33f2d5" FOREIGN KEY ("parent_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "FK_53511787e1f412d746c4bf223ff" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "FK_53511787e1f412d746c4bf223ff"`);
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "FK_5508b1763e832c788cc6b33f2d5"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_6315d9b5cb977506b9f747e0974"`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "updatedAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "createdAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "order" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "completed" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationsId" uuid`);
        await queryRunner.query(`CREATE INDEX "idx_todos_parent_id" ON "todos" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "idx_todos_user_id" ON "todos" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "fk_todos_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "fk_todos_parent" FOREIGN KEY ("parent_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8686a3315332905d65f0f46c5c0" FOREIGN KEY ("locationsId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
