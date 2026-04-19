import { WOTSPlusKeyPair, generateAddress } from "./crypto/index.js";
import { Transaction, TxInput, TxOutput } from "./transaction.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_KEY_PAIRS = 20;

export class Wallet {
  #keyPairs = [];
  #keyIndex = 0;
  #dataDir;

  constructor(dataDir = "./wallet-data") {
    this.#dataDir = dataDir;
    this.#keyPairs.push(new WOTSPlusKeyPair());
  }

  get address() {
    return this.#keyPairs[this.#keyIndex].address;
  }

  get currentKeyPair() {
    return this.#keyPairs[this.#keyIndex];
  }

  get allAddresses() {
    return this.#keyPairs.map((kp, i) => ({
      index: i,
      address: kp.address,
      used: kp.isUsed,
    }));
  }

  get myAddresses() {
    return this.#keyPairs.map((kp) => kp.address);
  }

  #advanceKey() {
    if (this.#keyIndex < this.#keyPairs.length - 1) {
      this.#keyIndex++;
    } else if (this.#keyPairs.length < MAX_KEY_PAIRS) {
      this.#keyPairs.push(new WOTSPlusKeyPair());
      this.#keyIndex = this.#keyPairs.length - 1;
    } else {
      throw new Error("All key pairs exhausted. Create a new wallet.");
    }
  }

  #ensureFreshKey() {
    if (this.#keyPairs[this.#keyIndex].isUsed) {
      this.#advanceKey();
    }
  }

  rotateKey() {
    this.#advanceKey();
    return this.#keyIndex;
  }

  #getNextKeyPair() {
    const nextIdx = this.#keyIndex + 1;
    if (nextIdx < this.#keyPairs.length) return this.#keyPairs[nextIdx];
    this.#keyPairs.push(new WOTSPlusKeyPair());
    return this.#keyPairs.at(-1);
  }

  createTransaction(recipient, amount, utxos) {
    this.#ensureFreshKey();

    const myAddresses = new Set(this.myAddresses);
    const myUtxos = utxos.filter((u) => myAddresses.has(u.recipient));
    const totalAvailable = myUtxos.reduce((s, u) => s + u.amount, 0);
    if (totalAvailable < amount) throw new Error(`Insufficient funds: have ${totalAvailable}, need ${amount}`);

    const usedKeyIndices = new Set();
    const inputs = [];
    let collected = 0;

    for (const utxo of myUtxos) {
      const kpIdx = this.#keyPairs.findIndex((kp) => kp.address === utxo.recipient);
      if (kpIdx === -1 || this.#keyPairs[kpIdx].isUsed) continue;
      usedKeyIndices.add(kpIdx);
      const [txHash, outputIndex] = utxo.key.split(":");
      inputs.push({ input: new TxInput(txHash, Number(outputIndex)), kpIdx });
      collected += utxo.amount;
      if (collected >= amount) break;
    }

    if (collected < amount) throw new Error(`Insufficient unused keys: have ${collected}, need ${amount}`);

    const outputs = [new TxOutput(amount, recipient)];
    const change = collected - amount;
    if (change > 0) {
      const nextKp = this.#getNextKeyPair();
      outputs.push(new TxOutput(change, nextKp.address));
    }

    const tx = new Transaction(inputs.map((i) => i.input), outputs);

    for (const [i, { kpIdx }] of inputs.entries()) {
      tx.sign(this.#keyPairs[kpIdx], i);
    }

    this.#ensureFreshKey();
    return tx;
  }

  async save(name = "wallet") {
    await mkdir(this.#dataDir, { recursive: true });
    const data = {
      keyPairs: this.#keyPairs.map((kp) => kp.toJSON()),
      keyIndex: this.#keyIndex,
    };
    await writeFile(join(this.#dataDir, `${name}.json`), JSON.stringify(data, null, 2));
  }

  async load(name = "wallet") {
    const raw = await readFile(join(this.#dataDir, `${name}.json`), "utf-8");
    const data = JSON.parse(raw);
    this.#keyPairs = data.keyPairs.map(WOTSPlusKeyPair.fromJSON);
    this.#keyIndex = data.keyIndex;
    return this;
  }

  toJSON() {
    return {
      keyPairs: this.#keyPairs.map((kp) => kp.toJSON()),
      keyIndex: this.#keyIndex,
      currentAddress: this.address,
    };
  }
}
