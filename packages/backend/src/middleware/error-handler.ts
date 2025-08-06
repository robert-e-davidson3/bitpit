import { Context, Next } from "koa";
import { uuidv7 } from "uuidv7";

import { createLogger } from "@bitpit/common/be.js";

const NODE_ENV = process.env.NODE_ENV || "development";

const logger = createLogger("error-handler");

export function errorHandler() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err: unknown) {
      const errorId = uuidv7();

      logError(err, errorId);

      ctx.status = err instanceof APIError ? err.status : 500;
      ctx.body = buildResponse(err, errorId);
    }
  };
}

function logError(err: unknown, errorId: string) {
  const message =
    err instanceof APIError
      ? (err.logMessage ?? err.message)
      : "An unexpected error occurred";
  const log: APIErrorResponse = {
    error: true,
    id: errorId,
    message,
    details: err,
  };

  if (err instanceof APIError) logger.debug(log);
  else logger.error(log);
}

function buildResponse(err: unknown, errorId: string): APIErrorResponse {
  const message =
    err instanceof APIError
      ? err.message
      : "An unexpected error occurred";
  const response: APIErrorResponse = {
    error: true,
    id: errorId,
    message,
  };
  // Expose a lot of details in non-production mode
  if (NODE_ENV !== "production") response.details = err;
  return response;
}

export interface APIErrorResponse {
  error: true;
  id: string;
  message: string;
  details?: any; // Exposed to client only in non-production
}

export class APIError extends Error {
  constructor(
    // Error message to return to the client
    message: string = "An error occurred",
    // HTTP status code for the error
    readonly status = 500,
    // If present, log this instead of `message`
    readonly logMessage?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
