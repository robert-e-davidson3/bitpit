/* Notes to reviewer
- The types have to be defined twice:
  1. For the database schema. The FE code breaks if it imports these.
  2. For the models the FE and BE uses.
- TransactionTable.user_id is trading off memory to gain performance.
*/

import SqliteDatabase from "better-sqlite3";
import { Kysely, Generated, SqliteDialect } from "kysely";

import { createLogger } from "../logger.js";

const logger = createLogger("database");

export type Database = Kysely<Tables>;

export interface Tables {
  users: UserTable;
  addresses: AddressTable;
  transactions: TransactionTable;
}

export interface UserTable {
  id: Generated<number>;
  username: string;
  password_hash: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface AddressTable {
  id: Generated<number>;
  user_id: number; // Foreign key to users table
  address: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface TransactionTable {
  id: Generated<number>;
  user_id: number; // Foreign key to users table
  from_address: string; // indexed
  to_address: string; // indexed
  amount: number;
  when: Date; // Timestamp of the transaction
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export function createDatabase(path: string): Database {
  logger.info(`Creating database connection to: ${path}`);
  const db = new SqliteDatabase(path);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  return new Kysely({
    dialect: new SqliteDialect({ database: db }),
  });
}

export function closeDatabase(db: Database): Promise<void> {
  logger.info("Closing database connection");
  return db.destroy();
}
