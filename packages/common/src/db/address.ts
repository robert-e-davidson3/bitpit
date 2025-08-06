import { Database } from "./database.js";
import { Address as AddressModel } from "../models/index.js";

export namespace Address {
  export const Address = AddressModel.Address;
  export type Address = AddressModel.Address;

  export const CreateAddress = AddressModel.CreateAddress;
  export type CreateAddress = AddressModel.CreateAddress;

  export namespace find {
    export namespace by {
      export async function id(
        db: Database,
        id: number,
      ): Promise<Address | undefined> {
        return db
          .selectFrom("addresses")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirst();
      }

      export async function userId(
        db: Database,
        userId: number,
      ): Promise<Address[]> {
        return db
          .selectFrom("addresses")
          .selectAll()
          .where("user_id", "=", userId)
          .execute();
      }

      export async function userIdAndAddress(
        db: Database,
        userId: number,
        address: string,
      ): Promise<Address | undefined> {
        return db
          .selectFrom("addresses")
          .selectAll()
          .where("user_id", "=", userId)
          .where("address", "=", address)
          .executeTakeFirst();
      }
    }
  }

  export async function create(
    db: Database,
    addressData: Omit<Address, "id" | "created_at" | "updated_at">,
  ): Promise<Address> {
    const now = new Date().toISOString();
    const address = await db
      .insertInto("addresses")
      .values({
        ...addressData,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await db
      .insertInto("user_address_junction")
      .values({
        user_id: address.user_id,
        address: address.address,
      })
      .execute();

    return address;
  }

  export async function update(
    db: Database,
    id: number,
    addressData: Partial<Omit<Address, "id" | "created_at" | "updated_at">>,
  ): Promise<Address> {
    const now = new Date().toISOString();
    return await db
      .updateTable("addresses")
      .set({
        ...addressData,
        updated_at: now,
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  export async function remove(db: Database, id: number): Promise<void> {
    await db.deleteFrom("addresses").where("id", "=", id).execute();
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
        .addColumn("address", "text", (col) => col.notNull())
        .addColumn("balance", "integer", (col) => col.notNull())
        .addColumn("created_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .addColumn("updated_at", "text", (col) =>
          col.defaultTo(new Date().toISOString()).notNull(),
        )
        .execute();

      await db.schema
        .createIndex("idx_addresses_user_id")
        .on("addresses")
        .columns(["user_id"])
        .execute();
      await db.schema
        .createIndex("idx_addresses_address")
        .on("addresses")
        .columns(["address"])
        .execute();
    }
  }
}
