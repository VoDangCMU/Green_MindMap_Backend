import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTokenTable1643123456790 implements MigrationInterface {
    name = 'CreateTokenTable1643123456790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "tokens",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "token",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "deviceID",
                        type: "varchar",
                        length: "50",
                        isUnique: true,
                        isNullable: true,
                    },
                    {
                        name: "expiredAt",
                        type: "timestamp",
                        isNullable: false,
                    },
                    {
                        name: "userId",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        isNullable: false,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ["userId"],
                        referencedTableName: "users",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                    }
                ],
                indices: [
                    {
                        name: "IDX_tokens_userId",
                        columnNames: ["userId"]
                    },
                    {
                        name: "IDX_tokens_expiredTime",
                        columnNames: ["expiredTime"]
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tokens");
    }
}
