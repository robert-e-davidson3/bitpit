import { Database } from "./database.js";
import { User as UserModel } from "../models/index.js";

export namespace User {
  export const User = UserModel.User;
  export type User = UserModel.User;

  export namespace find {
    export namespace by {
      export async function id(
        db: Database,
        id: number,
      ): Promise<User | undefined> {
        return db
          .selectFrom("users")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirst();
      }

      export async function username(
        db: Database,
        username: string,
      ): Promise<User | undefined> {
        return db
          .selectFrom("users")
          .selectAll()
          .where("username", "=", username)
          .executeTakeFirst();
      }
    }
  }

  export async function create(
    db: Database,
    userData: Omit<User, "id" | "created_at" | "updated_at">,
  ): Promise<User> {
    const now = new Date().toISOString();
    return await db
      .insertInto("users")
      .values({
        ...userData,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  export async function remove(db: Database, id: number): Promise<void> {
    await db.deleteFrom("users").where("id", "=", id).execute();
  }

  export namespace migrate {
    export async function v1(db: Database): Promise<void> {
      await db.schema
        .createTable("users")
        .ifNotExists()
        .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
        .addColumn("username", "text", (col) => col.unique())
        .addColumn("password_hash", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .addColumn("updated_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .execute();
    }
  }
}
