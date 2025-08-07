import { Database } from "./database.js";
import { Transaction as TransactionModel } from "../models/index.js";

export namespace Transaction {
  export const Transaction = TransactionModel.Transaction;
  export type Transaction = TransactionModel.Transaction;

  export namespace find {
    export namespace by {
      export async function addressAndHash(
        db: Database,
        address: string,
        hash: string,
      ): Promise<Transaction | undefined> {
        const tx = await db
          .selectFrom("transactions")
          .selectAll()
          .where("hash", "=", hash)
          .executeTakeFirst();
        if (!tx) return undefined;
        return {
          ...tx,
          address,
        };
      }

      export async function userId(
        db: Database,
        userId: number,
      ): Promise<Transaction[]> {
        const txs = await db
          .selectFrom("transactions")
          .selectAll()
          .innerJoin("addresses", "transactions.address", "addresses.address")
          .where("addresses.user_id", "=", userId)
          .execute();
        return txs;
      }

      export async function userIdAndAddress(
        db: Database,
        userId: number,
        address: string,
      ): Promise<Transaction[]> {
        const txs = await db
          .selectFrom("transactions")
          .selectAll()
          .innerJoin("addresses", "transactions.address", "addresses.address")
          .where("addresses.user_id", "=", userId)
          .where("addresses.address", "=", address)
          .execute();
        return txs;
      }
    }
  }

  export namespace create {
    export async function one(
      db: Database,
      address: string,
      transactionData: Transaction,
    ): Promise<Transaction> {
      return db
        .insertInto("transactions")
        .values({ ...transactionData, address })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    export async function many(
      db: Database,
      transactions: Transaction[],
    ): Promise<Transaction[]> {
      return db
        .insertInto("transactions")
        .values(transactions)
        .onConflict((oc) => oc.column('hash').doNothing())
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
        .addColumn("address", "text", (col) => col.notNull())
        .addColumn("raw", "text", (col) => col.notNull())
        .execute();
    }
  }
}
