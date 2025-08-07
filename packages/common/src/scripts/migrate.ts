import { getEnvVariable } from "src/env.js";
import {
  createDatabase,
  closeDatabase,
  migrateToLatest,
} from "../db/database.js";
import { createLogger } from "../logger.js";

const logger = createLogger("migration");

const DB_PATH = getEnvVariable("DB_PATH");

// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info("Running migration script...");
  const db = createDatabase(DB_PATH);
  migrateToLatest(db)
    .then(async () => {
      await closeDatabase(db);
    })
    .catch(async (error) => {
      console.error("Migration script failed:", error);
      await closeDatabase(db);
      process.exit(1);
    });
}
