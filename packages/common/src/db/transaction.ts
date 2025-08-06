import { Database } from "./database.js";
import { Transaction as TransactionModel } from "../models/index.js";

export namespace Transaction {
  export const Transaction = TransactionModel.Transaction;
  export type Transaction = TransactionModel.Transaction;

  export namespace find {
    export namespace by {
      export async function id(
        db: Database,
        id: number,
      ): Promise<Transaction | undefined> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirst();
      }

      export async function userId(
        db: Database,
        userId: number,
      ): Promise<Transaction[]> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where("user_id", "=", userId)
          .execute();
      }

      export async function fromAddress(
        db: Database,
        address: string,
      ): Promise<Transaction[]> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where("from_address", "=", address)
          .execute();
      }

      export async function toAddress(
        db: Database,
        address: string,
      ): Promise<Transaction[]> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where("to_address", "=", address)
          .execute();
      }

      export async function address(
        db: Database,
        address: string,
      ): Promise<Transaction[]> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where((eb) =>
            eb.or([
              eb("from_address", "=", address),
              eb("to_address", "=", address),
            ]),
          )
          .execute();
      }
    }
  }

  export async function create(
    db: Database,
    transactionData: Omit<Transaction, "id" | "created_at" | "updated_at">,
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    return await db
      .insertInto("transactions")
      .values({
        ...transactionData,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  export namespace migrate {
    export async function v1(db: Database): Promise<void> {
      await db.schema
        .createTable("addresses")
        .ifNotExists()
        .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
        .addColumn("user_id", "integer", (col) =>
          col.notNull().references("users.id").onDelete("cascade"),
        )
        .addColumn("from_address", "text", (col) => col.notNull())
        .addColumn("to_address", "text", (col) => col.notNull())
        .addColumn("amount", "decimal", (col) => col.notNull())
        .addColumn("when", "datetime", (col) => col.notNull())
        .addColumn("created_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .addColumn("updated_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .execute();

      await db.schema
        .createIndex("idx_transactions_from_address")
        .on("transactions")
        .columns(["from_address"])
        .execute();
      await db.schema
        .createIndex("idx_transactions_to_address")
        .on("transactions")
        .columns(["to_address"])
        .execute();
      await db.schema
        .createIndex("idx_transactions_user_id")
        .on("transactions")
        .columns(["user_id"])
        .execute();
    }
  }
}
