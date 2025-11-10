import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTodosTable1762768027556 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(500) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                parent_id UUID,
                user_id UUID NOT NULL,
                "order" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_todos_parent FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE,
                CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX idx_todos_user_id ON todos(user_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_todos_parent_id ON todos(parent_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_todos_parent_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_todos_user_id;`);
        await queryRunner.query(`DROP TABLE IF EXISTS todos;`);
    }

}
