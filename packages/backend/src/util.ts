import { z } from "zod";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

import { getEnvVariable } from "@bitpit/common/be.js";

export namespace JWT {
  export const SECRET = getEnvVariable("JWT_SECRET");

  export function sign(payload: Payload): string {
    return jwt.sign(payload, SECRET, { expiresIn: "7d" });
  }

  export function verify(token: string): Payload | null {
    let raw: string | JwtPayload;
    try {
      raw = jwt.verify(token, SECRET);
    } catch (error) {
      return null;
    }
    if (typeof raw === "string") return null;
    const { success, data } = Payload.safeParse(raw);
    return success ? data : null;
  }

  export const Payload = z.object({
    userId: z.number(),
    username: z.string(),
  });
  export type Payload = z.infer<typeof Payload>;
}

export namespace Password {
  export function validate(password: string): boolean {
    return password.length >= 8;
  }

  export function hash(password: string): Promise<string> {
    const ROUNDS = 10; // Number of rounds for bcrypt. Salt included.
    return bcrypt.hash(password, ROUNDS);
  }

  export function equal(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
