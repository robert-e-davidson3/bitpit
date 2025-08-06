import { z } from "zod";

export const Transaction = z.object({
  id: z.number(),
  user_id: z.number(),
  from_address: z.string(),
  to_address: z.string(),
  amount: z.number(),
  when: z.date(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Transaction = z.infer<typeof Transaction>;
