import { Context, Next } from "koa";

import { User } from "../db/user.js";
import { JWT } from "../util.js";

export function authMiddleware() {
  return async (ctx: Context, next: Next) => {
    const authorization = ctx.request.header.authorization;

    // If missing auth info, skip auth
    if (!authorization || !authorization.startsWith("Bearer "))
      return void (await next());

    // If auth info is present, verify the JWT token
    const token = authorization.substring(7);
    const payload = JWT.verify(token);
    if (!payload) {
      ctx.status = 401;
      ctx.body = { error: "Invalid or expired token" };
      return;
    }
    const userId = payload.userId;

    ctx.state.user = await User.find.by.id(ctx.db, userId);

    await next();
  };
}
