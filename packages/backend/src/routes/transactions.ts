import Router from "koa-router";
import { Context } from "koa";

import { Transaction } from "@bitpit/common/be.js";

import { APIError } from "../middleware/error-handler.js";

export const routes = new Router();

// Get all transactions for the authenticated user
routes.get("/", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const transactions = await Transaction.find.by.userId(ctx.db, userId);

  ctx.body = {
    transactions: transactions.map((tx) => ({
      address: tx.address,
      hash: tx.hash,
      tx: JSON.parse(tx.raw),
    })),
  };
});

routes.get("/:address", async (ctx: Context) => {
  const userId = ctx.state.user?.id;
  if (!userId) throw new APIError("Unauthorized", 401);

  const { address } = ctx.params;
  if (!address) throw new APIError("Address is required", 400);

  const transactions = await Transaction.find.by.userIdAndAddress(
    ctx.db,
    userId,
    address,
  );

  ctx.body = {
    transactions: transactions.map((tx) => ({
      address: tx.address,
      hash: tx.hash,
      tx: JSON.parse(tx.raw),
    })),
  };
});
