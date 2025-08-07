import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import jwt from "jsonwebtoken";

import { createDatabase, closeDatabase, DB } from "../../src/db/index.js";
import { getEnvVariable } from "../../src/env.js";
import { Component, UserComponent, UserAuthComponent, EmailAddressComponent } from "../../src/models/component.js";

import { createRouter } from "../../src/routes/index.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { dbContext } from "../../src/middleware/db-context.js";
import { authMiddleware } from "../../src/middleware/auth.js";
import {
  initializeECSService,
  shutdownECSService,
  getECSService,
  ECSService,
} from "../../src/services/ecs-world.js";

const JWT_SECRET = getEnvVariable("JWT_SECRET");

export class TestSetup {
  public ecsDb: DB;
  public app: Koa;
  public _testEcsService?: ECSService;

  constructor() {
    this.ecsDb = createDatabase(":memory:");
    this.app = new Koa();
    this.setupApp();
  }

  get testEcsService(): ECSService {
    return this._testEcsService!;
  }

  private setupApp() {
    // Set up middleware
    this.app.use(errorHandler());
    this.app.use(cors({ origin: "*", credentials: true }));
    this.app.use(bodyParser());
    this.app.use(dbContext(this.ecsDb));
    this.app.use(authMiddleware());

    // Set up routes
    const router = createRouter();
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  async setupDatabase() {
    this._testEcsService = await initializeECSService(this.ecsDb);
  }

  async createTestUser(
    email: string = "test@example.com",
    password: string = "password123",
    isEmployee: boolean = false,
  ): Promise<{ id: string; email: string }> {
    const bcrypt = await import("bcrypt");
    const password_hash = await bcrypt.hash(password, 10);

    const world = getECSService().getWorld();

    const userComponentData: UserComponent = {
      notificationEmail: true,
      notificationPush: false,
      defaultProfileId: undefined,
    };

    const userAuthComponentData: UserAuthComponent = {
      passwordHash: password_hash,
    };

    const emailComponentData: EmailAddressComponent = email;

    const components = [
      new Component("User", userComponentData),
      new Component("UserAuth", userAuthComponentData),
      new Component("EmailAddress", emailComponentData),
    ];

    if (isEmployee) {
      components.push(new Component("Employee", true));
    }

    const userEntityId = await world.addEntity(components);

    return { id: userEntityId, email };
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  }

  async cleanup() {
    // Shutdown ECS service first
    await shutdownECSService();

    closeDatabase(this.ecsDb);
  }
}

export function createTestSetup(): TestSetup {
  return new TestSetup();
}
