import Router from "koa-router";

import { routes as authRoutes } from "./auth.js";
import { routes as addressesRoutes } from "./addresses.js";
import { routes as transactionsRoutes } from "./transactions.js";

export function createRouter() {
  const router = new Router();

  router.get("/health", (ctx) => {
    ctx.body = { status: "ok" };
  });

  const apiV1Router = new Router({ prefix: "/api/v1" });
  apiV1Router.use("/auth", authRoutes.routes(), authRoutes.allowedMethods());
  apiV1Router.use(
    "/addresses",
    addressesRoutes.routes(),
    addressesRoutes.allowedMethods(),
  );
  apiV1Router.use(
    "/transactions",
    transactionsRoutes.routes(),
    transactionsRoutes.allowedMethods(),
  );

  router.use(apiV1Router.routes(), apiV1Router.allowedMethods());

  return router;
}
