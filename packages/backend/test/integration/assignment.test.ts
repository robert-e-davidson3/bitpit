process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import Koa from "koa";

import { User } from "../../src/db/user.js";
import { type Database as DatabaseType } from "../../src/db/index.js";
import { JWT } from "../../src/util.js";
import { migrateToLatest } from "../../src/db/index.js";
import { buildApp } from "../../src/index.js";
import {
  DEFAULT_MOCK_DATA_PATH,
  MockBlockchainService,
} from "../helpers/mock-blockchain-service.js";

describe.only("Assignment", () => {
  let db: DatabaseType;
  let sqliteDb: Database.Database;
  let app: Koa;
  let mockBlockchainService: MockBlockchainService;
  let user1: User.User;
  let user2: User.User;
  let user3: User.User;

  const ADDRESS_1 = "3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd";
  const ADDRESS_2 = "bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5";
  const ADDRESS_3 = "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h";
  const ADDRESS_4 = "12xQ9k5ousS8MqNsMBqHKtjAtCuKezm2Ju";

  beforeEach(async () => {
    sqliteDb = new Database(":memory:");
    db = new Kysely({
      dialect: new SqliteDialect({
        database: sqliteDb,
      }),
    });

    await migrateToLatest(db);

    mockBlockchainService = new MockBlockchainService(DEFAULT_MOCK_DATA_PATH);
    mockBlockchainService.load();

    app = buildApp(db, mockBlockchainService);

    user1 = await User.create(db, {
      username: "testuser2",
      password_hash: await import("bcrypt").then((bcrypt) =>
        bcrypt.hash("password123", 10),
      ),
    });
    user2 = await User.create(db, {
      username: "testuse2r",
      password_hash: await import("bcrypt").then((bcrypt) =>
        bcrypt.hash("password123", 10),
      ),
    });
    user3 = await User.create(db, {
      username: "testuser3",
      password_hash: await import("bcrypt").then((bcrypt) =>
        bcrypt.hash("password123", 10),
      ),
    });
  });

  afterEach(() => {
    sqliteDb.close();
  });

  it.skip("first user", async () => {
    const authToken = JWT.sign({ userId: user1.id, username: user1.username });
    {
      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ address: ADDRESS_1 })
        .expect(201);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Address added successfully");
    }
    {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").with.lengthOf(1);
      expect(response.body.addresses[0].address).to.equal(ADDRESS_1);
    }

    {
      const response = await request(app.callback())
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("transactions");
      expect(response.body.transactions).to.be.an("array").lengthOf(2015);
    }
  });

  it("second user", async () => {
    const authToken = JWT.sign({ userId: user2.id, username: user2.username });
    // Add address
    {
      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ address: ADDRESS_2 })
        .expect(201);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Address added successfully");
    }

    // Get that address
    {
      const response = await request(app.callback())
        .get(`/api/v1/addresses/${ADDRESS_2}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("address");
      expect(response.body.address).to.equal(ADDRESS_2);
      expect(response.body.balance).to.equal(0);
    }

    // Get all addresses
    {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").with.lengthOf(1);
      expect(response.body.addresses[0].address).to.equal(ADDRESS_2);
      expect(response.body.addresses[0].balance).to.equal(0);
    }

    // Get transactions for the address
    {
      const response = await request(app.callback())
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("transactions");
      expect(response.body.transactions).to.be.an("array").lengthOf(2);
    }

    // Force sync
    {
      await request(app.callback())
        .post(`/api/v1/addresses/sync/${ADDRESS_2}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);
    }

    // Remove address
    {
      await request(app.callback())
        .delete(`/api/v1/addresses/${ADDRESS_2}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ address: ADDRESS_2 })
        .expect(204);
    }

    // Check addresses
    {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").with.lengthOf(0);
    }

    // Check address
    {
      await request(app.callback())
        .get(`/api/v1/addresses/${ADDRESS_2}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    }
  });

  it.skip("third user", async () => {
    const authToken = JWT.sign({ userId: user3.id, username: user3.username });
    {
      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ address: ADDRESS_3 })
        .expect(201);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Address added successfully");
    }

    {
      const response = await request(app.callback())
        .post("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ address: ADDRESS_4 })
        .expect(201);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Address added successfully");
    }

    {
      const response = await request(app.callback())
        .get("/api/v1/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("addresses");
      expect(response.body.addresses).to.be.an("array").with.lengthOf(2);
      expect(response.body.addresses[0].address).to.equal(ADDRESS_3);
      expect(response.body.addresses[1].address).to.equal(ADDRESS_4);
    }

    {
      const response = await request(app.callback())
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).to.have.property("transactions");
      expect(response.body.transactions)
        .to.be.an("array")
        .lengthOf(1866139 + 21193);
    }
  });
});
