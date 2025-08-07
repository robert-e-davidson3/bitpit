import { z } from "zod";

export namespace Auth {
  export const Request = z.object({
    username: z.string().min(1),
    password: z.string().min(8),
  });
  export type Request = z.infer<typeof Request>;

  export const Response = z.object({
    token: z.string(),
  });
  export type Response = z.infer<typeof Response>;
}
