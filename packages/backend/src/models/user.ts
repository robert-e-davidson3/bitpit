import { z } from "zod";

export const User = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type User = z.infer<typeof User>;
