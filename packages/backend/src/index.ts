import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

import {
  createLogger,
  createDatabase,
  type Database,
} from "@bitpit/common/be.js";

import { createRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { dbContext } from "./middleware/db-context.js";
import { authMiddleware } from "./middleware/auth.js";

const __filename = new URL(import.meta.url).pathname;

import dotenv from "dotenv";
dotenv.config();

const PORT = parseInt(process.env.PORT || "3000");
const DB_PATH = process.env.DB_PATH || "./bitpit.db";
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const WEB_CLIENT_URL = process.env.WEB_CLIENT_URL || "http://localhost:3001";
const NODE_ENV = process.env.NODE_ENV || "development";

const logger = createLogger("api-server");

export async function startServer({
  db,
  port = PORT,
}: {
  db: Database;
  port?: number;
}) {
  const app = new Koa();

  // Set up middleware
  app.use(errorHandler());
  app.use(
    cors({
      origin: NODE_ENV === "production" ? WEB_CLIENT_URL : "*",
      credentials: true,
    }),
  );
  app.use(bodyParser());
  app.use(dbContext(db));
  app.use(authMiddleware());

  // Set up routes
  const router = createRouter();
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Start the server
  const server = app.listen(port, () => {
    logger.info(`API server running on ${API_BASE_URL}`);
  });

  // Handle shutdown
  const shutdown = async () => {
    logger.info("Shutting down API server...");
    server.close();
    db.destroy();
    logger.info("Server shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}

// Start the server if this file is run directly
if (process.argv[1] === __filename) {
  const db = createDatabase(DB_PATH);

  startServer({ db }).catch((err) => {
    logger.error("Failed to start server");
    console.error(err);
    process.exit(1);
  });
}
