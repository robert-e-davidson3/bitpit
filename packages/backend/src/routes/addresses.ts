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

  const { txs, final_balance: balance } = await ctx.blockchain.getAddress(address);

  await Address.create(ctx.db, { address, balance, user_id: userId });
  await ctx.blockchain.syncTransactions(ctx.db, address, txs);

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

  const { txs, final_balance: balance } = await ctx.blockchain.getAddress(ctx.params.address);
  await Address.update(ctx.db, address.id, { balance });
  await ctx.blockchain.syncTransactions(ctx.db, ctx.params.address, txs);

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

