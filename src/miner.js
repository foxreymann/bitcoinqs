import { Block } from "./block.js";
import { Transaction } from "./transaction.js";

export class Miner {
  #blockchain;
  #reward;

  constructor(blockchain, reward = 50) {
    this.#blockchain = blockchain;
    this.#reward = reward;
  }

  mine(minerAddress) {
    const coinbase = Transaction.coinbase(minerAddress, this.#reward);
    const pending = [...this.#blockchain.pendingTransactions, coinbase];
    const lastBlock = this.#blockchain.lastBlock;

    const block = new Block({
      index: lastBlock.index + 1,
      transactions: pending,
      previousHash: lastBlock.hash,
      difficulty: this.#blockchain.difficulty,
    });

    console.log(`⛏  Mining block ${block.index} (difficulty ${block.difficulty})...`);

    const start = performance.now();
    while (!block.isValidProof) {
      block.nonce++;
      block.recalculateHash();
    }
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);

    console.log(`✓ Block ${block.index} mined in ${elapsed}s — hash: ${block.hash.slice(0, 16)}...`);

    this.#blockchain.addBlock(block);
    return block;
  }
}
