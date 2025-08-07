process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import { expect } from "chai";
import { getAddress, getTransaction } from "../../src/routes/addresses.js";

describe.only("Blockchain.com API", () => {
  const TEST_ADDRESS = "3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd";

  it("should fetch address transactions using getAddress function", async function () {
    this.timeout(10000);

    const addressData = await getAddress(TEST_ADDRESS);

    console.log("\n=== Blockchain.com Address Response ===");
    console.log("Number of transactions:", addressData.n_tx);
    console.log("Transactions array length:", addressData.txs.length);

    if (addressData.txs.length > 0) {
      const firstTx = addressData.txs[0];
      console.log("\n=== First Transaction Structure ===");
      console.log("Transaction hash:", firstTx.hash);
      console.log("Inputs count:", firstTx.inputs.length);
      console.log("Outputs count:", firstTx.out.length);

      if (firstTx.inputs.length > 0) {
        console.log("\n=== First Input Structure ===");
        console.log("Input keys:", Object.keys(firstTx.inputs[0]));
        console.log("Previous output hash:", firstTx.inputs[0].prev_out.hash);
        console.log(
          "Previous output value (sats):",
          firstTx.inputs[0].prev_out.value,
        );
      }

      if (firstTx.out.length > 0) {
        console.log("\n=== First Output Structure ===");
        console.log("Output keys:", Object.keys(firstTx.out[0]));
        console.log("Output hash:", firstTx.out[0].hash);
        console.log("Output value (sats):", firstTx.out[0].value);
      }
    }

    expect(addressData).to.have.property("n_tx");
    expect(addressData).to.have.property("txs");
    expect(addressData.n_tx).to.be.a("number");
    expect(addressData.txs).to.be.an("array");
  });

  it("should handle direct blockchain.com API call", async function () {
    this.timeout(10000);

    const response = await fetch(
      `https://blockchain.info/rawaddr/${TEST_ADDRESS}`,
    );

    console.log("\n=== Direct API Response Info ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);

    expect(response.ok).to.be.true;

    const rawData = await response.json();

    console.log("\n=== Raw Response Structure ===");
    console.log("Response keys:", Object.keys(rawData));
    console.log(
      "Sample:",
      JSON.stringify(rawData, null, 2).substring(0, 4000) + "...",
    );

    expect(rawData).to.have.property("n_tx");
    expect(rawData).to.have.property("txs");
  });

  it("should fetch transaction details using getTransaction function", async function () {
    this.timeout(10000);

    // Use a known transaction hash from the address
    const TEST_TX_HASH =
      "b0ff0c44d52d040b847080f90ef5d13097ead6eb2d0cf902d71243a1bfaa76b7";

    const txData = await getTransaction(TEST_TX_HASH);

    console.log("\n=== getTransaction Response ===");
    console.log("Transaction hash:", txData.hash);
    console.log("Inputs count:", txData.inputs.length);
    console.log("Outputs count:", txData.out.length);

    if (txData.inputs.length > 0) {
      console.log("\n=== First Input from getTransaction ===");
      const firstInput = txData.inputs[0];
      console.log("Input keys:", Object.keys(firstInput));
      if (firstInput.prev_out) {
        console.log("Previous output address:", firstInput.prev_out.addr);
        console.log("Previous output value (sats):", firstInput.prev_out.value);
      }
    }

    if (txData.out.length > 0) {
      console.log("\n=== First Output from getTransaction ===");
      const firstOutput = txData.out[0];
      console.log("Output keys:", Object.keys(firstOutput));
      console.log("Output address:", firstOutput.addr);
      console.log("Output value (sats):", firstOutput.value);
    }

    expect(txData).to.have.property("hash");
    expect(txData).to.have.property("inputs");
    expect(txData).to.have.property("out");
    expect(txData.hash).to.equal(TEST_TX_HASH);
    expect(txData.inputs).to.be.an("array");
    expect(txData.out).to.be.an("array");
  });

  it("should handle direct transaction API call", async function () {
    this.timeout(10000);

    const TEST_TX_HASH =
      "b0ff0c44d52d040b847080f90ef5d13097ead6eb2d0cf902d71243a1bfaa76b7";

    const response = await fetch(
      `https://blockchain.info/rawtx/${TEST_TX_HASH}`,
    );

    console.log("\n=== Direct Transaction API Response Info ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);

    expect(response.ok).to.be.true;

    const rawTxData = await response.json();

    console.log("\n=== Raw Transaction Response Structure ===");
    console.log("Response keys:", Object.keys(rawTxData));
    console.log(
      "Sample:",
      JSON.stringify(rawTxData, null, 2).substring(0, 1000) + "...",
    );

    expect(rawTxData).to.have.property("hash");
    expect(rawTxData).to.have.property("inputs");
    expect(rawTxData).to.have.property("out");
  });
});
