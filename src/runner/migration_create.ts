import { exec } from "child_process";
import path from "path";
// import logger from "@root/logger";

const migrationsPath = path.resolve(__dirname, "..", "migrations");
const migrationName = process.argv[2];

function run() {
    if (!migrationName) {
        console.error("Migration name is missing");
        process.exit(1);
    }

    console.info(`Creating migration ${migrationName}`);

    const migrationFilePath = path.resolve(migrationsPath, migrationName);

    exec(
        `ts-node ./node_modules/typeorm/cli.js migration:create ${migrationFilePath}`,
        (error, stdout, stderr) => {
            if (error) {
                console.error(stderr || error.message);
                return;
            }
            console.info(stdout);
        }
    );
}

run();
