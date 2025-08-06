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
