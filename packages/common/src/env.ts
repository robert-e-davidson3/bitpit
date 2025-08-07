import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(__dirname, "../../../.env");

dotenv.config({ path: ENV_FILE });

export function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new EnvRequiredError(name);
  return value;
}

export class EnvRequiredError extends Error {
  constructor(variableName: string) {
    super(`Environment variable ${variableName} is required but not set`);
    this.name = "EnvRequiredError";
  }
}
