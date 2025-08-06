import { z } from "zod";

export const Transaction = z.object({
  hash: z.string(),
  address: z.string(),
  raw: z.string(),
});
export type Transaction = z.infer<typeof Transaction>;
