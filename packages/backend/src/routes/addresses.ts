import Router from "koa-router";
import { Context } from "koa";
import { z } from "zod";

import { Address, Database, Transaction } from "@bitpit/common/be.js";

import { APIError } from "../middleware/error-handler.js";

export const routes = new Router();

// Get all addresses for the authenticated user
routes.get("/", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const addresses = await Address.find.by.userId(ctx.db, userId);

  ctx.body = {
    addresses: addresses.map((addr) => ({
      address: addr.address,
      balance: addr.balance,
    })),
  };
});

// Add an address
routes.post("/", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const { success, data, error } = Address.CreateAddress.safeParse(
    ctx.request.body,
  );
  if (!success) throw new APIError("Invalid address data", 400, error.message);
  const { address } = data;

  const { txs, final_balance: balance } = await getAddress(address);

  await Address.create(ctx.db, { address, balance, user_id: userId });
  await syncTransactions(ctx.db, address, txs);

  ctx.status = 201;
  ctx.body = {
    message: "Address added successfully",
  };
});

// Sync balance transactions for an address
routes.post("/sync/:address", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const address = await Address.find.by.userIdAndAddress(
    ctx.db,
    userId,
    ctx.params.address,
  );
  if (!address) throw new APIError("Address not found", 404);

  const { txs, final_balance: balance } = await getAddress(ctx.params.address);
  await Address.update(ctx.db, address.id, { balance });
  await syncTransactions(ctx.db, ctx.params.address, txs);

  throw new APIError("Sync not implemented", 501);
});

// Delete an address
routes.delete("/:address", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const address = await Address.find.by.userIdAndAddress(
    ctx.db,
    userId,
    ctx.params.address,
  );
  if (!address) throw new APIError("Address not found", 404);
  await Address.remove(ctx.db, address.id);

  ctx.status = 204;
});

// TODO make this a service

// Gets all transactions for an address
export async function getAddress(
  address: string,
): Promise<BlockchainComAddressResponse> {
  const addr = await getAddressOnce(address);
  const total = addr.n_tx;
  if (total <= 50) return addr;

  let offset = 50;
  while (offset < total) {
    const more = await getAddressOnce(address, offset);
    addr.txs.push(...more.txs);
    offset += 50;
  }

  return addr;
}

export async function getAddressOnce(
  address: string,
  offset: number = 0,
): Promise<BlockchainComAddressResponse> {
  const response = await fetch(
    `https://blockchain.info/rawaddr/${address}?offset=${offset}`,
  );
  if (!response.ok)
    throw new Error(`Failed to fetch address: ${response.statusText}`);
  const data = await response.json();
  return BlockchainComAddressResponse.parse(data);
}

export async function getTransaction(
  hash: string,
): Promise<BlockchainComTransactionResponse> {
  const response = await fetch(`https://blockchain.info/rawtx/${hash}`);
  if (!response.ok)
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  const data = await response.json();
  return BlockchainComTransactionResponse.parse(data);
}

const BlockchainComTransactionResponse = z.object({
  hash: z.string().describe("transaction hash"),
  time: z.number().describe("timestamp of the transaction"),
  inputs: z
    .object({
      prev_out: z.object({
        addr: z.string().describe("previous output address"),
        value: z.number().describe("input value in satoshis"),
      }),
    })
    .array()
    .describe("input transactions"),
  out: z
    .object({
      addr: z.string().describe("output address"),
      value: z.number().describe("output value in satoshis"),
    })
    .array()
    .describe("output transactions"),
});
type BlockchainComTransactionResponse = z.infer<
  typeof BlockchainComTransactionResponse
>;

const BlockchainComAddressResponse = z.object({
  n_tx: z.number().describe("number of transactions"),
  final_balance: z.number().describe("balance in satoshis"),
  txs: BlockchainComTransactionResponse.array().describe("transactions"),
});
type BlockchainComAddressResponse = z.infer<
  typeof BlockchainComAddressResponse
>;

async function syncTransactions(
  db: Database,
  address: string,
  txs: BlockchainComTransactionResponse[],
) {
  await Transaction.create.many(
    db,
    txs.map((tx) => ({
      hash: tx.hash,
      address,
      raw: JSON.stringify(tx),
    })),
  );
}
