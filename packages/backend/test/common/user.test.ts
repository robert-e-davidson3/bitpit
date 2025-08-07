/* Note to review: this file mostly made by AI.
 */

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

use(chaiAsPromised);

import { User } from "../../src/db/user.js";
import type { Database as DatabaseType } from "../../src/db/database.js";

describe("User", () => {
  let db: DatabaseType;
  let sqliteDb: Database.Database;

  beforeEach(async () => {
    sqliteDb = new Database(":memory:");

    db = new Kysely({
      dialect: new SqliteDialect({
        database: sqliteDb,
      }),
    });

    await User.migrate.v1(db);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe("User model validation", () => {
    it("should validate a valid user object", () => {
      const userData: User.User = {
        id: 1,
        username: "testuser",
        password_hash: "hashed_password",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = User.User.safeParse(userData);
      expect(result.success).to.be.true;
    });

    it("should reject user with missing required fields", () => {
      const userData = {
        id: 1,
        username: "testuser",
      };

      const result = User.User.safeParse(userData);
      expect(result.success).to.be.false;
    });

    it("should reject user with invalid types", () => {
      const userData = {
        id: "not_a_number",
        username: "testuser",
        password_hash: "hashed_password",
      };

      const result = User.User.safeParse(userData);
      expect(result.success).to.be.false;
    });
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        username: "testuser",
        password_hash: "hashed_password",
      };

      const user = await User.create(db, userData);

      expect(user.id).to.be.a("number");
      expect(user.username).to.equal("testuser");
      expect(user.password_hash).to.equal("hashed_password");
      expect(user.created_at).to.be.a("string");
      expect(user.updated_at).to.be.a("string");
    });

    it("should auto-increment user IDs", async () => {
      const userData1 = {
        username: "testuser1",
        password_hash: "hashed_password1",
      };

      const userData2 = {
        username: "testuser2",
        password_hash: "hashed_password2",
      };

      const user1 = await User.create(db, userData1);
      const user2 = await User.create(db, userData2);

      expect(user2.id).to.be.greaterThan(user1.id);
    });

    it("should set created_at and updated_at to current time", async () => {
      const beforeCreation = new Date();

      const userData = {
        username: "testuser",
        password_hash: "hashed_password",
      };

      const user = await User.create(db, userData);
      const afterCreation = new Date();

      const createdAt = new Date(user.created_at);
      const updatedAt = new Date(user.updated_at);

      expect(createdAt).to.be.at.least(beforeCreation);
      expect(createdAt).to.be.at.most(afterCreation);
      expect(updatedAt).to.be.at.least(beforeCreation);
      expect(updatedAt).to.be.at.most(afterCreation);
    });
  });

  describe("find.by.id", () => {
    let createdUser: User.User;

    beforeEach(async () => {
      createdUser = await User.create(db, {
        username: "testuser",
        password_hash: "hashed_password",
      });
    });

    it("should find existing user by ID", async () => {
      const foundUser = await User.find.by.id(db, createdUser.id);

      expect(foundUser).to.not.be.undefined;
      expect(foundUser!.id).to.equal(createdUser.id);
      expect(foundUser!.username).to.equal(createdUser.username);
      expect(foundUser!.password_hash).to.equal(createdUser.password_hash);
    });

    it("should return undefined for non-existent ID", async () => {
      const foundUser = await User.find.by.id(db, 99999);

      expect(foundUser).to.be.undefined;
    });
  });

  describe("find.by.username", () => {
    let createdUser: User.User;

    beforeEach(async () => {
      createdUser = await User.create(db, {
        username: "testuser",
        password_hash: "hashed_password",
      });
    });

    it("should find existing user by username", async () => {
      const foundUser = await User.find.by.username(db, "testuser");

      expect(foundUser).to.not.be.undefined;
      expect(foundUser!.id).to.equal(createdUser.id);
      expect(foundUser!.username).to.equal("testuser");
      expect(foundUser!.password_hash).to.equal(createdUser.password_hash);
    });

    it("should return undefined for non-existent username", async () => {
      const foundUser = await User.find.by.username(db, "nonexistent");

      expect(foundUser).to.be.undefined;
    });

    it("should be case sensitive", async () => {
      const foundUser = await User.find.by.username(db, "TESTUSER");

      expect(foundUser).to.be.undefined;
    });
  });

  describe("remove", () => {
    let createdUser: User.User;

    beforeEach(async () => {
      createdUser = await User.create(db, {
        username: "testuser",
        password_hash: "hashed_password",
      });
    });

    it("should remove existing user", async () => {
      await User.remove(db, createdUser.id);

      const foundUser = await User.find.by.id(db, createdUser.id);
      expect(foundUser).to.be.undefined;
    });

    it("should not throw error when removing non-existent user", async () => {
      await expect(User.remove(db, 99999)).to.not.be.rejected;
    });
  });

  describe("integration tests", () => {
    it("should handle multiple users correctly", async () => {
      const users = await Promise.all([
        User.create(db, { username: "user1", password_hash: "hash1" }),
        User.create(db, { username: "user2", password_hash: "hash2" }),
        User.create(db, { username: "user3", password_hash: "hash3" }),
      ]);

      for (const user of users) {
        const foundById = await User.find.by.id(db, user.id);
        const foundByUsername = await User.find.by.username(db, user.username);

        expect(foundById).to.deep.equal(user);
        expect(foundByUsername).to.deep.equal(user);
      }
    });

    it("should maintain data integrity after removal", async () => {
      const user1 = await User.create(db, {
        username: "user1",
        password_hash: "hash1",
      });
      const user2 = await User.create(db, {
        username: "user2",
        password_hash: "hash2",
      });

      await User.remove(db, user1.id);

      const foundUser1 = await User.find.by.id(db, user1.id);
      const foundUser2 = await User.find.by.id(db, user2.id);

      expect(foundUser1).to.be.undefined;
      expect(foundUser2).to.deep.equal(user2);
    });
  });
});
