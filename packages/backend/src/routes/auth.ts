import Router from "koa-router";
import { Context } from "koa";

import { Auth } from "../models/auth.js";
import { User } from "../db/user.js";

import { APIError } from "../middleware/error-handler.js";
import { Password, JWT } from "../util.js";

export const routes = new Router();

routes.post("/register", async (ctx: Context) => {
  const { success, data, error } = Auth.Request.safeParse(ctx.request.body);
  if (!success)
    throw new APIError("Invalid registration data", 400, error.message);
  const { username, password } = data;

  {
    const user = await User.find.by.username(ctx.db, username);
    if (user) throw new APIError("Username already taken", 409);
  }

  const passwordHash = await Password.hash(password);

  const user = await User.create(ctx.db, {
    username,
    password_hash: passwordHash,
  });

  const token = JWT.sign({ userId: user.id, username: user.username });

  ctx.status = 201;
  ctx.body = {
    user_id: user.id,
    token,
  };
});

routes.post("/login", async (ctx: Context) => {
  const { success, data, error } = Auth.Request.safeParse(ctx.request.body);
  if (!success) throw new APIError("Invalid login data", 400, error.message);
  const { username, password } = data;

  const user = await User.find.by.username(ctx.db, username);
  if (!user) throw new APIError("Invalid username or password", 401);

  const isPasswordValid = await Password.equal(password, user.password_hash);
  if (!isPasswordValid) throw new APIError("Invalid email or password", 401);

  const token = JWT.sign({ userId: user.id, username: user.username });

  ctx.body = {
    user_id: user.id,
    token,
  };
});
