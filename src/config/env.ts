import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    app: z.object({
        port: z.coerce.number().default(3000),
        env: z.enum(["development", "production", "test"]).default("development"),
        host : z.string().default("localhost"),
    }),

    db: z.object({
        host: z.string().default("localhost"),
        port: z.coerce.number().default(5432),
        username: z.string().default("postgres"),
        password: z.string().default("postgres"),
        name: z.string().default("green_mindmap_db"),
    }),

    redis: z.object({
        host: z.string().default("localhost"),
        port: z.coerce.number().default(6379),
        password: z.string().optional(),
        db: z.coerce.number().default(0),
    }),
});

const parsed = envSchema.safeParse({
    app: {
        port: process.env.PORT || 5000,
        env: process.env.ENV || "development",
        host: process.env.HOST || "localhost",
    },
    db: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        name: process.env.DB_NAME || "gau_db",
    },
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || "0", 10),
    },
});

if (!parsed.success) {
    console.error("Environment variable validation error:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;
