import { pino } from "pino";
import dotenv from "dotenv";

dotenv.config();
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

export function createLogger(name: string) {
  return pino({
    name,
    level: LOG_LEVEL,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  });
}
