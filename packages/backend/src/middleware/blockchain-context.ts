import { Context, Next } from "koa";
import { BlockchainService } from "../services/blockchain.js";

declare module "koa" {
  interface ExtendibleContext {
    blockchain: BlockchainService;
  }
}

export function blockchainContext(blockchain: BlockchainService) {
  return async (ctx: Context, next: Next) => {
    ctx.blockchain = blockchain;
    await next();
  };
}