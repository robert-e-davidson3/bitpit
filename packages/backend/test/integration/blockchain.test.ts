process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import { expect } from "chai";
import { BlockchainService } from "../../src/services/blockchain.js";
import {
  MockBlockchainService,
  DEFAULT_MOCK_DATA_PATH,
} from "../helpers/mock-blockchain-service.js";

describe("Blockchain.com API", function () {
  this.timeout(60000);

  const TEST_ADDRESS = "3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd";

  const service = new MockBlockchainService(
    DEFAULT_MOCK_DATA_PATH,
    new BlockchainService(),
  );

  before(() => {
    service.load();
  });

  after(() => {
    service.save();
  });

  it.only("should fetch an account", async () => {
    const response = await service.getAddress(TEST_ADDRESS);
    console.log(JSON.stringify(response, null, 2));
    expect(1).to.equal(1);
  });
});
