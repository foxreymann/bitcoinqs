import { randomBytes } from "node:crypto";
import { sha256 } from "./hash.js";
import { generateAddress } from "./address.js";

const N = 32;
const W = 16;
const L1 = 64;
const L2 = 3;
const L = L1 + L2;

const chain = (val, steps, seed = Buffer.alloc(0)) => {
  let v = val;
  for (let i = 0; i < steps; i++) v = sha256(Buffer.concat([v, seed]));
  return v;
};

const baseW = (msg, outLen) => {
  const result = [];
  for (let i = 0; i < outLen; i++) {
    const start = i * 4;
    const byteIdx = start >>> 3;
    const bitOffset = start & 7;
    if (byteIdx >= msg.length) { result.push(0); continue; }
    if (bitOffset + 4 <= 8) {
      result.push((msg[byteIdx] >>> (8 - bitOffset - 4)) & 0xf);
    } else {
      const bitsFromFirst = 8 - bitOffset;
      let val = (msg[byteIdx] & ((1 << bitsFromFirst) - 1)) << (4 - bitsFromFirst);
      if (byteIdx + 1 < msg.length)
        val |= (msg[byteIdx + 1] >>> (8 - (4 - bitsFromFirst))) & ((1 << (4 - bitsFromFirst)) - 1);
      result.push(val & 0xf);
    }
  }
  return result;
};

const checksum = (basew) => {
  let csum = 0;
  for (const v of basew) csum += W - 1 - v;
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(csum);
  return baseW(buf, L2);
};

export class WOTSPlusKeyPair {
  #privateKey;
  #seed;
  #used;

  constructor(privateKey, seed) {
    this.#seed = seed ?? randomBytes(N);
    this.#privateKey = privateKey ?? Array.from({ length: L }, () => randomBytes(N));
    this.#used = false;
    this.publicKey = this.#privateKey.map((sk) => chain(sk, W - 1, this.#seed));
  }

  get publicKeyRoot() {
    return sha256(Buffer.concat(this.publicKey));
  }

  get address() {
    return generateAddress(this.publicKeyRoot);
  }

  get isUsed() {
    return this.#used;
  }

  get seed() {
    return this.#seed;
  }

  sign(message) {
    if (this.#used) throw new Error("WOTS+ key already used — one-time signature!");
    const msgHash = sha256(message);
    const msgBaseW = [...baseW(msgHash, L1), ...checksum(baseW(msgHash, L1))];
    const sig = this.#privateKey.map((sk, i) => chain(sk, msgBaseW[i], this.#seed));
    this.#used = true;
    return sig;
  }

  static verify(message, signature, publicKey, seed = Buffer.alloc(0)) {
    const msgHash = sha256(message);
    const msgBaseW = [...baseW(msgHash, L1), ...checksum(baseW(msgHash, L1))];
    return signature.every((sigEl, i) => {
      const computed = chain(sigEl, W - 1 - msgBaseW[i], seed);
      return computed.equals(publicKey[i]);
    });
  }

  toJSON() {
    return {
      privateKey: this.#privateKey.map((k) => k.toString("base64")),
      publicKey: this.publicKey.map((k) => k.toString("base64")),
      seed: this.#seed.toString("base64"),
      used: this.#used,
    };
  }

  static fromJSON(data) {
    const pk = data.privateKey.map((k) => Buffer.from(k, "base64"));
    const seed = Buffer.from(data.seed, "base64");
    const kp = new WOTSPlusKeyPair(pk, seed);
    kp.#used = data.used;
    return kp;
  }
}
