import { config } from "../config/env";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.name,
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
    synchronize: false,
    migrationsRun: false,
});
