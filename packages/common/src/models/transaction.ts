import { z } from "zod";

export const Transaction = z.object({
  hash: z.string(),
  amount: z.number(),
  when: z.number().describe("timestamp of the transaction"),
});
export type Transaction = z.infer<typeof Transaction>;

export const TransactionAddressJunction = z.object({
  hash: z.string(),
  from_address: z.string(),
  to_address: z.string(),
});
export type TransactionAddressJunction = z.infer<
  typeof TransactionAddressJunction
>;
