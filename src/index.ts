import express from "express";
import { config } from "@root/config/env";
import routes from "@root/routes";
import { AppDataSource } from "@root/infrastructure/database";
import { redis } from "@root/infrastructure/cache";

async function startServer() {
    try {
        await AppDataSource.initialize();
        console.log("PostgreSQL connected");

        await redis.connect();
        console.log("Redis connected");

        const app = express();
        app.use(express.json());
        app.use(routes);

        app.listen(config.app.port, () => {
            console.log(`🚀 Server running at http://localhost:${config.app.port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();
