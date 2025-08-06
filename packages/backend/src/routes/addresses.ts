import Router from "koa-router";
import { Context } from "koa";
import { z } from "zod";

import { Address } from "@bitpit/common/be.js";

import { APIError } from "../middleware/error-handler.js";

export const routes = new Router();

// Get all addresses for the authenticated user
routes.get("/", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const addresses = await Address.find.by.userId(ctx.db, userId);

  ctx.body = {
    addresses: addresses.map((addr) => addr.address),
  };
});

// Add an address
routes.post("/", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const { success, data, error } = Address.CreateAddress.safeParse(ctx.request.body);
  if (!success) throw new APIError("Invalid address data", 400, error.message);
  const { address } = data;

  await Address.create(ctx.db, { address, user_id: userId });

  ctx.status = 201;
  ctx.body = {
    message: "Address added successfully",
  };
});

// Sync transactions for an address
routes.post("/sync/:address", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const address = await Address.find.by.userIdAndAddress(
    ctx.db,
    userId,
    ctx.params.address,
  );
  if (!address) throw new APIError("Address not found", 404);

  // TODO hit an API
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

// https://api.blockchair.com/{:btc_chain}/raw/transaction/{:hash}

const CHAIN = "bitcoin";

async function getAllTransactions(address: string): Promise<RawTransaction[]> {}

async function getTransactions(
  address: string,
  offset: Offset = 0,
): Promise<BlockchairTransactionsResponse[]> {
  Offset.parse(offset); // throws if invalid
  fetch(
    `https://api.blockchair.com/${CHAIN}/dashboards/address/${address}?offset=${offset}`,
  );
  return Promise.resolve([]);
}

async function getTransaction(hash: string): RawTransaction {
  const response = await fetch(
    `https://api.blockchair.com/${CHAIN}/raw/transaction/${hash}`,
  );
  if (!response.ok)
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  const data = await response.json();
  return data.data[hash];
}

const Offset = z.number().int().min(0).max(10000);
type Offset = z.infer<typeof Offset>;

const BlockchairTransactionsResponse = z.object({
  data: z.object({
    transactions: z.string().array().describe("transaction hashes"),
  }),
});
type BlockchairTransactionsResponse = z.infer<
  typeof BlockchairTransactionsResponse
>;

export const BlockchairTransactionResponse = z.object({
  data: z.object({
    balance: z.number().describe("address balance in satoshis"),
    // TODO also need the time and the addresses involved
  }),
});
