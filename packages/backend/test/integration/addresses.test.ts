process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import Koa from "koa";

import {
  User,
  Address,
  type Database as DatabaseType,
} from "@bitpit/common/be.js";
import { JWT } from "../../src/util.js";
import { migrateToLatest } from "../../../common/src/be.js";
import { buildApp } from "../../src/index.js";
import {
  DEFAULT_MOCK_DATA_PATH,
  MockBlockchainService,
} from "../helpers/mock-blockchain-service.js";

describe("Address Routes", () => {
  let db: DatabaseType;
  let sqliteDb: Database.Database;
  let app: Koa;
  let testUser: User.User;
  let authToken: string;

  beforeEach(async () => {
    sqliteDb = new Database(":memory:");
    db = new Kysely({
      dialect: new SqliteDialect({
        database: sqliteDb,
      }),
    });

    await migrateToLatest(db);

    app = buildApp(db, new MockBlockchainService(DEFAULT_MOCK_DATA_PATH));

    testUser = await User.create(db, {
      username: "testuser",
      password_hash: await import("bcrypt").then((bcrypt) =>
        bcrypt.hash("password123", 10),
      ),
    });

    authToken = JWT.sign({ userId: testUser.id, username: testUser.username });
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe("GET /addresses", () => {
    it("should return empty array when user has no addresses", async () => {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").that.is.empty;
    });

    it("should return user's addresses", async () => {
      const testAddress1 = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const testAddress2 = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";

      await Address.create(db, {
        user_id: testUser.id,
        address: testAddress1,
        balance: 0,
      });
      await Address.create(db, {
        user_id: testUser.id,
        address: testAddress2,
        balance: 0,
      });

      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").with.lengthOf(2);
      expect(
        response.body.addresses.map((x: any) => x.address),
      ).to.include.members([testAddress1, testAddress2]);
    });

    it("should not return other users' addresses", async () => {
      const otherUser = await User.create(db, {
        username: "otheruser",
        password_hash: "hashedpassword",
      });

      const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const otherAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";

      await Address.create(db, {
        user_id: testUser.id,
        address: testAddress,
        balance: 0,
      });
      await Address.create(db, {
        user_id: otherUser.id,
        address: otherAddress,
        balance: 0,
      });

      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.addresses).to.have.lengthOf(1);
      expect(response.body.addresses.map((x: any) => x.address)).to.include(
        testAddress,
      );
      expect(response.body.addresses.map((x: any) => x.address)).to.not.include(
        otherAddress,
      );
    });

    it("should fail without authentication", async () => {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Unauthorized");
    });
  });

  describe("POST /addresses", () => {
    it("should add a valid address", async () => {
      const addressData: Address.CreateAddress = {
        address: "3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd",
      };

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Address added successfully");

      const addresses = await Address.find.by.userId(db, testUser.id);
      expect(addresses).to.have.lengthOf(1);
      expect(addresses[0].address).to.equal(addressData.address);
    });

    it("should fail with invalid address format", async () => {
      const addressData = {
        address: "invalid-address",
      };

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid address data");
    });

    it("should fail with missing address field", async () => {
      const addressData = {};

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid address data");
    });

    it("should fail with address too short", async () => {
      const addressData = {
        address: "1A1zP1eP5QGefi2DMPTfTL5S",
      };

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid address data");
    });

    it("should fail with address too long", async () => {
      const addressData = {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa1234567890",
      };

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Invalid address data");
    });

    it("should fail without authentication", async () => {
      const addressData = {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      };

      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .send(addressData)
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Unauthorized");
    });
  });

  describe("POST /addresses/sync/:address", () => {
    let testAddress: string;

    beforeEach(async () => {
      testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      await Address.create(db, {
        user_id: testUser.id,
        address: testAddress,
        balance: 0,
      });
    });

    it("should find the address for sync", async () => {
      await request(app.callback())
        .post(`/api/v1/addresses/sync/${testAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
    });

    it("should fail with non-existent address", async () => {
      const nonExistentAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";

      const response = await request(app.callback())
        .post(`/api/v1/addresses/sync/${nonExistentAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Address not found");
    });

    it("should fail with other user's address", async () => {
      const otherUser = await User.create(db, {
        username: "otheruser",
        password_hash: "hashedpassword",
      });

      const otherAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
      await Address.create(db, {
        user_id: otherUser.id,
        address: otherAddress,
        balance: 0,
      });

      const response = await request(app.callback())
        .post(`/api/v1/addresses/sync/${otherAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Address not found");
    });

    it("should fail without authentication", async () => {
      const response = await request(app.callback())
        .post(`/api/v1/addresses/sync/${testAddress}`)
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Unauthorized");
    });
  });

  describe("DELETE /addresses/:address", () => {
    let testAddress: string;

    beforeEach(async () => {
      testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      await Address.create(db, {
        user_id: testUser.id,
        address: testAddress,
        balance: 0,
      });
    });

    it("should delete an existing address", async () => {
      const response = await request(app.callback())
        .delete(`/api/v1/addresses/${testAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).to.be.empty;

      const addresses = await Address.find.by.userId(db, testUser.id);
      expect(addresses).to.be.empty;
    });

    it("should fail with non-existent address", async () => {
      const nonExistentAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";

      const response = await request(app.callback())
        .delete(`/api/v1/addresses/${nonExistentAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Address not found");
    });

    it("should fail with other user's address", async () => {
      const otherUser = await User.create(db, {
        username: "otheruser",
        password_hash: "hashedpassword",
      });

      const otherAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
      await Address.create(db, {
        user_id: otherUser.id,
        address: otherAddress,
        balance: 0,
      });

      const response = await request(app.callback())
        .delete(`/api/v1/addresses/${otherAddress}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Address not found");

      const otherAddresses = await Address.find.by.userId(db, otherUser.id);
      expect(otherAddresses).to.have.lengthOf(1);
    });

    it("should fail without authentication", async () => {
      const response = await request(app.callback())
        .delete(`/api/v1/addresses/${testAddress}`)
        .expect(401);

      expect(response.body).to.have.property("error");
      expect(response.body.message).to.equal("Unauthorized");

      const addresses = await Address.find.by.userId(db, testUser.id);
      expect(addresses).to.have.lengthOf(1);
    });
  });
});
