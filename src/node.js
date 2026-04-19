import express from "express";
import { Blockchain } from "./blockchain.js";
import { Wallet } from "./wallet.js";
import { Miner } from "./miner.js";
import { Transaction, TxInput, TxOutput } from "./transaction.js";

export class Node {
  #app;
  #blockchain;
  #wallets = new Map();
  #miner;

  constructor({ port = 3000, difficulty = 2, reward = 50 } = {}) {
    this.port = port;
    this.#blockchain = new Blockchain();
    this.#blockchain.difficulty = difficulty;
    this.#miner = new Miner(this.#blockchain, reward);
    this.#app = express();
    this.#setupMiddleware();
    this.#setupRoutes();
  }

  #setupMiddleware() {
    this.#app.use(express.json());
  }

  #setupRoutes() {
    this.#app.get("/info", (req, res) => {
      res.json({
        name: "BitcoinQS",
        version: "1.0.0",
        quantumSecure: true,
        signatureScheme: "WOTS+ (Winternitz One-Time Signature Plus)",
        securityLevel: "256-bit post-quantum",
        height: this.#blockchain.height,
        difficulty: this.#blockchain.difficulty,
        pendingTransactions: this.#blockchain.pendingTransactions.length,
      });
    });

    this.#app.get("/chain", (req, res) => {
      res.json(this.#blockchain.toJSON());
    });

    this.#app.get("/chain/validate", (req, res) => {
      const valid = this.#blockchain.isValid();
      res.json({ valid });
    });

    this.#app.get("/block/:index", (req, res) => {
      const block = this.#blockchain.chain[Number(req.params.index)];
      if (!block) return res.status(404).json({ error: "Block not found" });
      res.json(block.toJSON());
    });

    this.#app.post("/wallet/create", (req, res) => {
      const { name = `wallet_${this.#wallets.size}` } = req.body ?? {};
      const wallet = new Wallet();
      this.#wallets.set(name, wallet);
      res.json({ name, address: wallet.address, info: "WOTS+ one-time-signature keypair generated (quantum-secure)" });
    });

    this.#app.get("/wallet/:name", (req, res) => {
      const wallet = this.#wallets.get(req.params.name);
      if (!wallet) return res.status(404).json({ error: "Wallet not found" });
      res.json(wallet.toJSON());
    });

    this.#app.get("/wallet/:name/balance", (req, res) => {
      const wallet = this.#wallets.get(req.params.name);
      if (!wallet) return res.status(404).json({ error: "Wallet not found" });
      res.json({ address: wallet.address, balance: this.#blockchain.getBalance(wallet.address) });
    });

    this.#app.post("/transfer", (req, res) => {
      const { from, to, amount } = req.body;
      const wallet = this.#wallets.get(from);
      if (!wallet) return res.status(404).json({ error: "Sender wallet not found" });

      try {
        const utxos = this.#blockchain.getUtxosForAddress(wallet.address);
        const tx = wallet.createTransaction(to, amount, utxos);
        this.#blockchain.addTransaction(tx);
        res.json({ success: true, txHash: tx.hash, quantumVerified: true, message: "Transaction signed with WOTS+ (post-quantum secure)" });
      } catch (e) {
        res.status(400).json({ error: e.message });
      }
    });

    this.#app.post("/mine", (req, res) => {
      const { miner } = req.body ?? {};
      const wallet = this.#wallets.get(miner ?? this.#wallets.keys().next().value);
      if (!wallet) return res.status(400).json({ error: "No miner wallet. Create one first." });
      const block = this.#miner.mine(wallet.address);
      wallet.rotateKey();
      res.json({ success: true, blockHash: block.hash, blockIndex: block.index });
    });
  }

  start() {
    return new Promise((resolve) => {
      this.#app.listen(this.port, () => {
        console.log(`\n⚛  BitcoinQS Node running on http://localhost:${this.port}`);
        console.log(`   Quantum-secure via WOTS+ post-quantum signatures\n`);
        resolve();
      });
    });
  }

  get blockchain() { return this.#blockchain; }
  get wallets() { return this.#wallets; }
}

const port = Number(process.env.PORT ?? 3000);
const node = new Node({ port });
node.start();
