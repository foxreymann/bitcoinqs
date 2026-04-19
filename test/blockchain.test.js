import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Transaction, TxInput, TxOutput } from "../src/transaction.js";
import { Blockchain } from "../src/blockchain.js";
import { Wallet } from "../src/wallet.js";
import { Miner } from "../src/miner.js";

describe("Transaction", () => {
  it("creates a coinbase transaction", () => {
    const tx = Transaction.coinbase("bqs1test", 50);
    assert.equal(tx.txType, "coinbase");
    assert.equal(tx.outputs[0].amount, 50);
    assert.equal(tx.outputs[0].recipient, "bqs1test");
  });

  it("coinbase verifies without signature", () => {
    const tx = Transaction.coinbase("bqs1test", 50);
    assert.equal(tx.verify(), true);
  });

  it("serializes and deserializes", () => {
    const tx = Transaction.coinbase("bqs1test", 50);
    const json = tx.toJSON();
    const restored = Transaction.fromJSON(json);
    assert.equal(restored.hash, tx.hash);
    assert.equal(restored.txType, "coinbase");
  });
});

describe("Blockchain", () => {
  it("creates genesis block", () => {
    const bc = new Blockchain();
    assert.equal(bc.height, 1);
    assert.equal(bc.chain[0].index, 0);
  });

  it("mines and adds blocks", () => {
    const bc = new Blockchain();
    bc.difficulty = 1;
    const wallet = new Wallet();
    const miner = new Miner(bc, 50);
    miner.mine(wallet.address);
    assert.equal(bc.height, 2);
  });

  it("tracks balances across wallet addresses", () => {
    const bc = new Blockchain();
    bc.difficulty = 1;
    const alice = new Wallet();
    const miner = new Miner(bc, 50);
    miner.mine(alice.address);
    alice.rotateKey();
    miner.mine(alice.address);
    alice.rotateKey();
    assert.equal(bc.getBalance(alice.myAddresses), 100);
  });

  it("validates chain integrity", () => {
    const bc = new Blockchain();
    bc.difficulty = 1;
    const wallet = new Wallet();
    const miner = new Miner(bc, 50);
    miner.mine(wallet.address);
    miner.mine(wallet.address);
    assert.equal(bc.isValid(), true);
  });

  it("supports transfers between wallets", () => {
    const bc = new Blockchain();
    bc.difficulty = 1;
    const alice = new Wallet();
    const bob = new Wallet();
    const miner = new Miner(bc, 50);

    miner.mine(alice.address);
    alice.rotateKey();
    miner.mine(alice.address);
    alice.rotateKey();

    const aliceUtxos = bc.getUtxosForAddress(alice.myAddresses);
    const tx = alice.createTransaction(bob.address, 30, aliceUtxos);
    bc.addTransaction(tx);
    miner.mine(alice.address);
    alice.rotateKey();

    assert.equal(bc.getBalance(bob.myAddresses), 30);
    assert.ok(bc.getBalance(alice.myAddresses) >= 70);
  });
});

describe("Wallet", () => {
  it("generates unique addresses on rotation", () => {
    const w = new Wallet();
    const addr1 = w.address;
    w.rotateKey();
    const addr2 = w.address;
    assert.notEqual(addr1, addr2);
  });

  it("tracks multiple addresses", () => {
    const w = new Wallet();
    w.rotateKey();
    w.rotateKey();
    assert.equal(w.myAddresses.length, 3);
  });
});
