import { sha256, WOTSPlusKeyPair } from "./crypto/index.js";

export class TxInput {
  txHash;
  outputIndex;
  signature;
  publicKey;
  seed;

  constructor(txHash, outputIndex, { signature, publicKey, seed } = {}) {
    this.txHash = txHash;
    this.outputIndex = outputIndex;
    this.signature = signature ?? null;
    this.publicKey = publicKey ?? null;
    this.seed = seed ?? null;
  }

  toJSON() {
    const o = { txHash: this.txHash, outputIndex: this.outputIndex };
    if (this.signature) o.signature = this.signature.map((s) => s.toString("base64"));
    if (this.publicKey) o.publicKey = this.publicKey.map((k) => k.toString("base64"));
    if (this.seed) o.seed = this.seed.toString("base64");
    return o;
  }

  static fromJSON(data) {
    return new TxInput(data.txHash, data.outputIndex, {
      signature: data.signature?.map((s) => Buffer.from(s, "base64")),
      publicKey: data.publicKey?.map((k) => Buffer.from(k, "base64")),
      seed: data.seed ? Buffer.from(data.seed, "base64") : null,
    });
  }
}

export class TxOutput {
  amount;
  recipient;

  constructor(amount, recipient) {
    this.amount = amount;
    this.recipient = recipient;
  }

  toJSON() {
    return { amount: this.amount, recipient: this.recipient };
  }

  static fromJSON(data) {
    return new TxOutput(data.amount, data.recipient);
  }
}

export class Transaction {
  inputs;
  outputs;
  timestamp;
  txType;
  hash;

  constructor(inputs, outputs, { timestamp, txType } = {}) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.timestamp = timestamp ?? Date.now();
    this.txType = txType ?? "transfer";
    this.hash = this.#computeHash();
  }

  #computeHash() {
    const data = JSON.stringify({
      inputs: this.inputs.map((i) => i.toJSON()),
      outputs: this.outputs.map((o) => o.toJSON()),
      timestamp: this.timestamp,
      txType: this.txType,
    });
    return sha256(Buffer.from(data)).toString("hex");
  }

  sign(keyPair, inputIndex) {
    const sig = keyPair.sign(Buffer.from(this.hash));
    this.inputs[inputIndex].signature = sig;
    this.inputs[inputIndex].publicKey = keyPair.publicKey;
    this.inputs[inputIndex].seed = keyPair.seed ?? Buffer.alloc(0);
  }

  verify() {
    for (const inp of this.inputs) {
      if (this.txType === "coinbase" && inp.txHash === "0".repeat(64)) continue;
      if (!inp.signature || !inp.publicKey) return false;
      if (!WOTSPlusKeyPair.verify(Buffer.from(this.hash), inp.signature, inp.publicKey, inp.seed ?? Buffer.alloc(0)))
        return false;
    }
    return true;
  }

  toJSON() {
    return {
      hash: this.hash,
      inputs: this.inputs.map((i) => i.toJSON()),
      outputs: this.outputs.map((o) => o.toJSON()),
      timestamp: this.timestamp,
      txType: this.txType,
    };
  }

  static fromJSON(data) {
    const tx = new Transaction(
      data.inputs.map(TxInput.fromJSON),
      data.outputs.map(TxOutput.fromJSON),
      { timestamp: data.timestamp, txType: data.txType },
    );
    return tx;
  }

  static coinbase(recipient, amount) {
    return new Transaction(
      [new TxInput("0".repeat(64), -1)],
      [new TxOutput(amount, recipient)],
      { txType: "coinbase" },
    );
  }
}
