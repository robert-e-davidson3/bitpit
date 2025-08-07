import { Context, Next } from "koa";
import { Database } from "../db/index.js";

// Augment the Koa context to include the database
declare module "koa" {
  interface ExtendibleContext {
    db: Database;
  }
}

export function dbContext(db: Database) {
  return async (ctx: Context, next: Next) => {
    ctx.db = db;
    await next();
  };
}
