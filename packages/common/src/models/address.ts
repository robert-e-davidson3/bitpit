import { z } from "zod";

export const CreateAddress = z.object({
  address: z.string().min(1),
});
export type CreateAddress = z.infer<typeof CreateAddress>;

export const Address = z.object({
  id: z.number(),
  user_id: z.number(),
  address: z.string(),
  balance: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Address = z.infer<typeof Address>;
