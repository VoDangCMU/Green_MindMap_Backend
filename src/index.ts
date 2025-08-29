import express from "express";
import { config } from "@root/config/env";
import routes from "@root/routes";
import { initInfrastructure } from "@root/infrastructure";
import controller from "@root/controller";

async function startServer() {
    try {
        const infrastructure = initInfrastructure();
        const logger = infrastructure.logger;


        logger.info("Starting Green MindMap Backend", {
            environment: config.app.env,
            port: config.app.port,
            host: config.app.host
        });

        const app = express();
        app.use(express.json());
        app.locals.controller = controller;
        app.use(routes);



        app.listen(config.app.port, () => {
            logger.info(`Server is running on port ${config.app.port}`);
            console.log(`Server is running on port ${config.app.port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();