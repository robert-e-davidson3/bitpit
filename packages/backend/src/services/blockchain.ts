import { z } from "zod";

import { Database, Transaction } from "@bitpit/common/be.js";

export interface BlockchainService {
  getAddress(address: string): Promise<BlockchainComAddressResponse>;
  getTransaction(hash: string): Promise<BlockchainComTransactionResponse>;
  syncTransactions(
    db: Database,
    address: string,
    txs: BlockchainComTransactionResponse[],
  ): Promise<void>;
}

export class BlockchainService implements BlockchainService {
  async getAddress(address: string): Promise<BlockchainComAddressResponse> {
    const addr = await this.getAddressOnce(address);
    const total = addr.n_tx;
    if (total <= 50) return addr;

    let offset = 50;
    while (offset < total) {
      const more = await this.getAddressOnce(address, offset);
      addr.txs.push(...more.txs);
      offset += 50;
    }

    return addr;
  }

  async getAddressOnce(
    address: string,
    offset: number = 0,
  ): Promise<BlockchainComAddressResponse> {
    const response = await fetch(
      `https://blockchain.info/rawaddr/${address}?offset=${offset}`,
    );
    if (!response.ok)
      throw new Error(`Failed to fetch address: ${response.statusText}`);
    const data = await response.json();
    return BlockchainComAddressResponse.parse(data);
  }

  async getTransaction(
    hash: string,
  ): Promise<BlockchainComTransactionResponse> {
    const response = await fetch(`https://blockchain.info/rawtx/${hash}`);
    if (!response.ok)
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    const data = await response.json();
    return BlockchainComTransactionResponse.parse(data);
  }

  async syncTransactions(
    db: Database,
    address: string,
    txs: BlockchainComTransactionResponse[],
  ) {
    await Transaction.create.many(
      db,
      txs.map((tx) => ({
        hash: tx.hash,
        address,
        raw: JSON.stringify(tx),
      })),
    );
  }
}

export const BlockchainComTransactionResponse = z
  .object({
    hash: z.string().describe("transaction hash"),
    time: z.number().describe("timestamp of the transaction"),
    inputs: z
      .object({
        prev_out: z.object({
          addr: z.string().describe("previous output address"),
          value: z.number().describe("input value in satoshis"),
        }),
      })
      .array()
      .describe("input transactions"),
    out: z
      .object({
        addr: z.string().describe("output address"),
        value: z.number().describe("output value in satoshis"),
      })
      .array()
      .describe("output transactions"),
  })
  .passthrough();
export type BlockchainComTransactionResponse = z.infer<
  typeof BlockchainComTransactionResponse
>;

export const BlockchainComAddressResponse = z
  .object({
    n_tx: z.number().describe("number of transactions"),
    final_balance: z.number().describe("balance in satoshis"),
    txs: BlockchainComTransactionResponse.array().describe("transactions"),
  })
  .passthrough();
export type BlockchainComAddressResponse = z.infer<
  typeof BlockchainComAddressResponse
>;
