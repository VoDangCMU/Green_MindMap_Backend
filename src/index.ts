import express from "express";
import { config } from "@root/config/env";
import routes from "@root/routes";
import infrastructure from "@root/infrastructure";
import controller from "@root/controller";

async function startServer() {
    try {
        // Initialize database connection
        await infrastructure.database.initialize();
        console.log("PostgreSQL connected");
        console.log("Redis connected");


        const app = express();
        app.use(express.json());
        
        // Make controller available to routes via app.locals
        app.locals.controller = controller;
        app.use(routes);

        app.listen(config.app.port, () => {
            console.log(`Server running at http://${config.app.host}:${config.app.port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();
