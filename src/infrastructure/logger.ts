import pino from "pino";
import { config } from "../config/env";

export const logger = pino({
    level: config.app.env === "production" ? "info" : "debug",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "HH:MM:ss",
        },
    },
});
