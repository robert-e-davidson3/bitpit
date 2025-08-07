import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { Database } from "../../src/db/index.js";
import { Transaction } from "../../src/db/transaction.js";
import {
  BlockchainService,
  BlockchainComAddressResponse,
  BlockchainComTransactionResponse,
} from "../../src/services/blockchain.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_MOCK_DATA_PATH = join(
  __dirname,
  "../mock-blockchain-data.json",
);

export class MockBlockchainService implements BlockchainService {
  private mockData: MockData;

  load() {
    try {
      const data = readFileSync(this.dataPath, "utf-8");
      this.mockData = JSON.parse(data);
    } catch (error: any) {
      console.warn(
        `Failed to load mock data from ${this.dataPath}: ${error?.message ?? error}`,
      );
      this.mockData = {};
    }
  }

  save() {
    try {
      const data = JSON.stringify(this.mockData, null, 2);
      writeFileSync(this.dataPath, data, "utf-8");
    } catch (error: any) {
      console.error(
        `Failed to save mock data to ${this.dataPath}: ${error?.message ?? error}`,
      );
    }
  }

  constructor(
    private dataPath: string,
    // If present, used when mock data is missing
    private backup?: BlockchainService,
  ) {
    this.mockData = {};
  }

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
    const url = `https://blockchain.info/rawaddr/${address}?offset=${offset}`;
    const mockResponse = this.mockData[url];
    if (mockResponse) return BlockchainComAddressResponse.parse(mockResponse);

    if (this.backup) {
      const response = await this.backup.getAddressOnce(address, offset);
      this.setMockData(url, response);
      return response;
    }

    throw new Error(
      `No mock data found for address: ${address} with offset: ${offset}`,
    );
  }

  async getTransaction(
    hash: string,
  ): Promise<BlockchainComTransactionResponse> {
    const url = `https://blockchain.info/rawtx/${hash}`;
    const mockResponse = this.mockData[url];

    if (mockResponse)
      return BlockchainComTransactionResponse.parse(mockResponse);

    if (this.backup) {
      const response = await this.backup.getTransaction(hash);
      this.setMockData(url, response);
      return response;
    }

    throw new Error(`No mock data found for transaction: ${hash}`);
  }

  async syncTransactions(
    db: Database,
    address: string,
    txs: BlockchainComTransactionResponse[],
  ): Promise<void> {
    await Transaction.create.many(
      db,
      txs.map((tx) => ({
        hash: tx.hash,
        address,
        raw: JSON.stringify(tx),
      })),
    );
  }

  setMockData(url: string, response: BlockchainComResponse): void {
    this.mockData[url] = response;
  }

  clearMockData(): void {
    this.mockData = {};
  }
}

export const BlockchainComResponse = z.union([
  BlockchainComAddressResponse,
  BlockchainComTransactionResponse,
]);
export type BlockchainComResponse = z.infer<typeof BlockchainComResponse>;

export const MockData = z.record(z.string(), BlockchainComResponse);
export type MockData = z.infer<typeof MockData>;
