import { redis } from "./cache";
import { AppDataSource } from "./database";
import { DataSource } from "typeorm";
import Redis from "ioredis";
import { logger, LoggerClient } from "./logger";

export class Infrastructure {
    database: DataSource;
    cache: Redis;
    logger: LoggerClient;

    constructor(dependencies: { database: DataSource; cache: Redis; logger: LoggerClient }) {
        this.database = dependencies.database;
        this.cache = dependencies.cache;
        this.logger = dependencies.logger;
    }
}

export function initInfrastructure() {
    return new Infrastructure({
        database: AppDataSource,
        cache: redis,
        logger: logger,
    });
}
