// Import telemetry configuration FIRST
import './config/telemetry';

import express from "express";
import { config } from "@root/config/env";
import routes from "@root/routes";
import infrastructure from "@root/infrastructure";
import controller from "@root/controller";
import { initLogger, getLogger } from "@root/infrastructure/logger";
import { loggingMiddleware } from "@root/middlewares/loggingMiddleware";

// Additional environment variable setup to ensure OpenTelemetry picks up the service name
process.env.OTEL_SERVICE_NAME = process.env.GRAFANA_SERVICE_NAME || "green-mind-backend";
process.env.OTEL_RESOURCE_ATTRIBUTES = `service.name=${process.env.OTEL_SERVICE_NAME},service.version=1.0.0,service.namespace=green-mindmap,deployment.environment=${process.env.DEPLOY_ENV || 'development'}`;

console.log(`Final OpenTelemetry service configuration: ${process.env.OTEL_SERVICE_NAME}`);

async function startServer() {
    try {
        // Initialize logger first
        const logger = initLogger();
        logger.info("Starting Green MindMap Backend", {
            environment: config.app.env,
            port: config.app.port,
            host: config.app.host
        });

        // Initialize database connection
        await infrastructure.database.initialize();
        logger.info("Database connections established", {
            database: "PostgreSQL",
            cache: "Redis"
        });

        const app = express();
        app.use(express.json());
        
        // Add logging middleware
        app.use(loggingMiddleware);

        // Make controller available to routes via app.locals
        app.locals.controller = controller;
        app.use(routes);

        app.listen(config.app.port, () => {
            logger.info("Server started successfully", {
                url: `http://${config.app.host}:${config.app.port}`,
                pid: process.pid
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info("Received SIGTERM, shutting down gracefully");
            await logger.shutdown();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            logger.info("Received SIGINT, shutting down gracefully");
            await logger.shutdown();
            process.exit(0);
        });

    } catch (error) {
        let logger;
        try {
            logger = getLogger();
        } catch (e) {
            console.error("Error starting server", error);
            process.exit(1);
        }
        logger.error("Error starting server", error as Error);
        process.exit(1);
    }
}

startServer();
