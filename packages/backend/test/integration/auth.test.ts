process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import Koa from "koa";

import {
  migrateToLatest,
  User,
  type Database as DatabaseType,
} from "@bitpit/common/be.js";
import { buildApp } from "../../src/index.js";

describe("Auth Routes", () => {
  let db: DatabaseType;
  let sqliteDb: Database.Database;
  let app: Koa;

  beforeEach(async () => {
    sqliteDb = new Database(":memory:");
    db = new Kysely({
      dialect: new SqliteDialect({
        database: sqliteDb,
      }),
    });

    await migrateToLatest(db);

    app = buildApp(db, new MockBlockchainService());
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        username: "newuser",
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property("user_id");
      expect(response.body).to.have.property("token");
      expect(response.body.user_id).to.be.a("number");
      expect(response.body.token).to.be.a("string");
    });

    it("should fail with password too short", async () => {
      const userData = {
        username: "testuser",
        password: "short",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid registration data");
    });

    it("should fail with duplicate username", async () => {
      const userData = {
        username: "duplicate",
        password: "password123",
      };

      await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      const response = await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Username already taken");
    });

    it("should fail with missing required fields", async () => {
      const userData = {
        username: "testuser",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid registration data");
    });

    it("should fail with empty username", async () => {
      const userData = {
        username: "",
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid registration data");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await User.create(db, {
        username: "loginuser",
        password_hash: await import("bcrypt").then((bcrypt) =>
          bcrypt.hash("password123", 10),
        ),
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        username: "loginuser",
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).to.have.property("user_id");
      expect(response.body).to.have.property("token");
      expect(response.body.user_id).to.be.a("number");
      expect(response.body.token).to.be.a("string");
    });

    it("should fail with invalid username", async () => {
      const loginData = {
        username: "nonexistent",
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid username or password");
    });

    it("should fail with invalid password", async () => {
      const loginData = {
        username: "loginuser",
        password: "wrongpassword",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid email or password");
    });

    it("should fail with missing username", async () => {
      const loginData = {
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid login data");
    });

    it("should fail with missing password", async () => {
      const loginData = {
        username: "loginuser",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid login data");
    });

    it("should fail with empty username", async () => {
      const loginData = {
        username: "",
        password: "password123",
      };

      const response = await request(app.callback())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid login data");
    });
  });
});
