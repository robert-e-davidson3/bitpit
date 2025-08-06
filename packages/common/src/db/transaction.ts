import { Database } from "./database.js";
import { Transaction as TransactionModel } from "../models/index.js";

export namespace Transaction {
  export const Transaction = TransactionModel.Transaction;
  export type Transaction = TransactionModel.Transaction;

  export namespace find {
    export namespace by {
      export async function hash(
        db: Database,
        hash: string,
      ): Promise<Transaction | undefined> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .where("hash", "=", hash)
          .executeTakeFirst();
      }

      export async function userId(
        db: Database,
        userId: number,
      ): Promise<Transaction[]> {
        const fromAddresses = await db
          .selectFrom("transactions")
          .selectAll()
          .innerJoin(
            "transaction_address_junction",
            "transactions.hash",
            "transaction_address_junction.hash",
          )
          .innerJoin(
            "addresses",
            "transaction_address_junction.from_address",
            "addresses.address",
          )
          .where("addresses.user_id", "=", userId)
          .execute();
        const toAddresses = await db
          .selectFrom("transactions")
          .selectAll()
          .innerJoin(
            "transaction_address_junction",
            "transactions.hash",
            "transaction_address_junction.hash",
          )
          .innerJoin(
            "addresses",
            "transaction_address_junction.to_address",
            "addresses.address",
          )
          .where("addresses.user_id", "=", userId)
          .execute();
        return [...fromAddresses, ...toAddresses];
      }

      export async function address(
        db: Database,
        address: string,
      ): Promise<Transaction[]> {
        return db
          .selectFrom("transactions")
          .selectAll()
          .innerJoin(
            "transaction_address_junction",
            "transactions.hash",
            "transaction_address_junction.hash",
          )
          .where((eb) =>
            eb.or([
              eb("transaction_address_junction.from_address", "=", address),
              eb("transaction_address_junction.to_address", "=", address),
            ]),
          )
          .execute();
      }
    }
  }

  export namespace create {
    export async function one(
      db: Database,
      transactionData: Transaction,
    ): Promise<Transaction> {
      return await db
        .insertInto("transactions")
        .values(transactionData)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    export async function many(
      db: Database,
      transactions: Transaction[],
    ): Promise<Transaction[]> {
      return await db
        .insertInto("transactions")
        .values(transactions)
        .returningAll()
        .execute();
    }
  }

  export namespace migrate {
    export async function v1(db: Database): Promise<void> {
      await db.schema
        .createTable("transactions")
        .ifNotExists()
        .addColumn("hash", "text", (col) => col.primaryKey().notNull())
        .addColumn("amount", "decimal", (col) => col.notNull())
        .addColumn("when", "datetime", (col) => col.notNull())
        .execute();
      await db.schema
        .createTable("transaction_address_junction")
        .ifNotExists()
        .addColumn("hash", "text", (col) =>
          col.notNull().references("transactions.hash").onDelete("cascade"),
        )
        .addColumn("from_address", "text", (col) => col.notNull())
        .addColumn("to_address", "text", (col) => col.notNull())
        .addPrimaryKeyConstraint("pk_transaction_address_junction", [
          "hash",
          "from_address",
          "to_address",
        ])
        .execute();
    }
  }
}
