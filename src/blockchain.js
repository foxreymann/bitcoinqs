import { sha256 } from "./crypto/index.js";
import { Block } from "./block.js";
import { Transaction, TxInput, TxOutput } from "./transaction.js";

const GENESIS_PREV = "0".repeat(64);

export class Blockchain {
  chain = [];
  pendingTransactions = [];
  utxoSet = new Map();
  difficulty = 2;

  constructor() {
    this.#createGenesis();
  }

  #createGenesis() {
    const coinbase = Transaction.coinbase("bqs1genesis", 50);
    const genesis = new Block({
      index: 0,
      transactions: [coinbase],
      previousHash: GENESIS_PREV,
      nonce: 0,
      difficulty: this.difficulty,
      timestamp: 0,
    });
    genesis.hash = genesis.recalculateHash().hash;
    this.chain.push(genesis);
    this.#addUtxo(coinbase.hash, 0, coinbase.outputs[0]);
  }

  #addUtxo(txHash, outputIndex, output) {
    const key = `${txHash}:${outputIndex}`;
    this.utxoSet.set(key, output);
  }

  #removeUtxo(txHash, outputIndex) {
    this.utxoSet.delete(`${txHash}:${outputIndex}`);
  }

  get lastBlock() {
    return this.chain.at(-1);
  }

  get height() {
    return this.chain.length;
  }

  addTransaction(tx) {
    if (tx.txType === "coinbase") {
      this.pendingTransactions.push(tx);
      return true;
    }

    if (!tx.verify()) throw new Error("Invalid transaction signature (quantum verification failed)");

    let inputSum = 0;
    for (const inp of tx.inputs) {
      const key = `${inp.txHash}:${inp.outputIndex}`;
      const utxo = this.utxoSet.get(key);
      if (!utxo) throw new Error(`UTXO not found: ${key}`);
      inputSum += utxo.amount;
      this.#removeUtxo(inp.txHash, inp.outputIndex);
    }

    const outputSum = tx.outputs.reduce((s, o) => s + o.amount, 0);
    if (inputSum < outputSum) throw new Error("Insufficient funds");

    for (const [i, out] of tx.outputs.entries()) {
      this.#addUtxo(tx.hash, i, out);
    }

    this.pendingTransactions.push(tx);
    return true;
  }

  addBlock(block) {
    if (block.previousHash !== this.lastBlock.hash) return false;
    if (!block.isValidProof) return false;
    if (!this.#validateBlockTransactions(block)) return false;

    for (const tx of block.transactions) {
      if (tx.txType === "coinbase") {
        this.#addUtxo(tx.hash, 0, tx.outputs[0]);
      }
    }

    this.chain.push(block);
    this.pendingTransactions = this.pendingTransactions.filter(
      (ptx) => !block.transactions.some((btx) => btx.hash === ptx.hash),
    );
    return true;
  }

  #validateBlockTransactions(block) {
    for (const tx of block.transactions) {
      if (tx.txType === "coinbase") continue;
      if (!tx.verify()) return false;
    }
    return true;
  }

  getBalance(addressOrAddresses) {
    const addresses = new Set(Array.isArray(addressOrAddresses) ? addressOrAddresses : [addressOrAddresses]);
    let balance = 0;
    for (const utxo of this.utxoSet.values()) {
      if (addresses.has(utxo.recipient)) balance += utxo.amount;
    }
    return balance;
  }

  getUtxosForAddress(addressOrAddresses) {
    const addresses = new Set(Array.isArray(addressOrAddresses) ? addressOrAddresses : [addressOrAddresses]);
    const results = [];
    for (const [key, utxo] of this.utxoSet.entries()) {
      if (addresses.has(utxo.recipient)) results.push({ key, ...utxo });
    }
    return results;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.previousHash !== previous.hash) return false;
      if (!current.isValidProof) return false;
    }
    return true;
  }

  toJSON() {
    return {
      chain: this.chain.map((b) => b.toJSON()),
      pendingTransactions: this.pendingTransactions.map((tx) => tx.toJSON()),
      difficulty: this.difficulty,
    };
  }
}
