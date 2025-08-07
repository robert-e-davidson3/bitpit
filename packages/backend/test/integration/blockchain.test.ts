process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import { expect } from "chai";
import { getAddress, getTransaction } from "../../src/routes/addresses.js";

describe("Blockchain.com API", function () {
  this.timeout(20000);

  const TEST_ADDRESS = "bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5";

  it.only("should fetch an account", async () => {
    const response = await getAddress(TEST_ADDRESS);
    console.log(JSON.stringify(response, null, 2));
    expect(1).to.equal(2);
  });
});
