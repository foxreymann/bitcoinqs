import { sha256 } from "./crypto/index.js";
import { Transaction } from "./transaction.js";

export class Block {
  index;
  transactions;
  previousHash;
  nonce;
  timestamp;
  difficulty;
  merkleRoot;
  hash;

  constructor({ index, transactions, previousHash, nonce = 0, timestamp, difficulty = 4, hash: existingHash }) {
    this.index = index;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.timestamp = timestamp ?? Date.now();
    this.difficulty = difficulty;
    this.merkleRoot = this.#computeMerkleRoot();
    this.hash = existingHash ?? this.#computeHash();
  }

  #computeMerkleRoot() {
    let hashes = this.transactions.map((tx) => tx.hash);
    if (hashes.length === 0) return sha256(Buffer.alloc(0)).toString("hex");
    if (hashes.length === 1) return sha256(Buffer.from(hashes[0])).toString("hex");
    while (hashes.length > 1) {
      const next = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const pair = hashes[i] + (hashes[i + 1] ?? hashes[i]);
        next.push(sha256(Buffer.from(pair)).toString("hex"));
      }
      hashes = next;
    }
    return hashes[0];
  }

  #computeHash() {
    const data = JSON.stringify({
      index: this.index,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      merkleRoot: this.merkleRoot,
      nonce: this.nonce,
      difficulty: this.difficulty,
    });
    return sha256(Buffer.from(data)).toString("hex");
  }

  get isValidProof() {
    return this.hash.startsWith("0".repeat(this.difficulty));
  }

  recalculateHash() {
    this.hash = this.#computeHash();
    return this;
  }

  toJSON() {
    return {
      index: this.index,
      hash: this.hash,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      nonce: this.nonce,
      difficulty: this.difficulty,
      merkleRoot: this.merkleRoot,
      transactions: this.transactions.map((tx) => tx.toJSON()),
    };
  }

  static fromJSON(data) {
    return new Block({
      index: data.index,
      transactions: data.transactions.map(Transaction.fromJSON),
      previousHash: data.previousHash,
      nonce: data.nonce,
      timestamp: data.timestamp,
      difficulty: data.difficulty,
      hash: data.hash,
    });
  }
}
