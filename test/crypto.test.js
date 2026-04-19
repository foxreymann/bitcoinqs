import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WOTSPlusKeyPair } from "../src/crypto/wots.js";
import { sha256, sha3_256, base58Encode, base58Decode } from "../src/crypto/hash.js";
import { generateAddress } from "../src/crypto/address.js";

describe("Hash Utilities", () => {
  it("sha256 produces 32-byte digest", () => {
    const h = sha256(Buffer.from("hello"));
    assert.equal(h.length, 32);
  });

  it("sha256 is deterministic", () => {
    assert.deepEqual(sha256(Buffer.from("test")), sha256(Buffer.from("test")));
  });

  it("sha3_256 produces 32-byte digest", () => {
    assert.equal(sha3_256(Buffer.from("hello")).length, 32);
  });

  it("base58 encode/decode roundtrip", () => {
    const data = sha256(Buffer.from("roundtrip test"));
    const encoded = base58Encode(data);
    const decoded = base58Decode(encoded);
    assert.deepEqual(decoded, data);
  });
});

describe("WOTS+ Key Pair", () => {
  it("generates a valid keypair", () => {
    const kp = new WOTSPlusKeyPair();
    assert.equal(kp.publicKey.length, 67);
    assert.equal(kp.address.startsWith("bqs1"), true);
    assert.equal(kp.isUsed, false);
  });

  it("signs and verifies a message", () => {
    const kp = new WOTSPlusKeyPair();
    const msg = Buffer.from("test message");
    const sig = kp.sign(msg);
    assert.equal(kp.isUsed, true);
    assert.equal(WOTSPlusKeyPair.verify(msg, sig, kp.publicKey, kp.seed), true);
  });

  it("rejects tampered message", () => {
    const kp = new WOTSPlusKeyPair();
    const sig = kp.sign(Buffer.from("original"));
    assert.equal(WOTSPlusKeyPair.verify(Buffer.from("tampered"), sig, kp.publicKey, kp.seed), false);
  });

  it("rejects signature with wrong public key", () => {
    const kp1 = new WOTSPlusKeyPair();
    const kp2 = new WOTSPlusKeyPair();
    const sig = kp1.sign(Buffer.from("msg"));
    assert.equal(WOTSPlusKeyPair.verify(Buffer.from("msg"), sig, kp2.publicKey, kp2.seed), false);
  });

  it("throws on double-use of one-time key", () => {
    const kp = new WOTSPlusKeyPair();
    kp.sign(Buffer.from("first"));
    assert.throws(() => kp.sign(Buffer.from("second")), /already used/);
  });

  it("serializes and deserializes via JSON", () => {
    const kp = new WOTSPlusKeyPair();
    const json = kp.toJSON();
    const restored = WOTSPlusKeyPair.fromJSON(json);
    assert.equal(restored.address, kp.address);
    assert.equal(restored.isUsed, false);
  });

  it("restored keypair can verify signatures from original", () => {
    const kp = new WOTSPlusKeyPair();
    const sig = kp.sign(Buffer.from("verify me"));
    const json = kp.toJSON();
    const restored = WOTSPlusKeyPair.fromJSON(json);
    assert.equal(WOTSPlusKeyPair.verify(Buffer.from("verify me"), sig, restored.publicKey, restored.seed), true);
  });
});

describe("Address Generation", () => {
  it("generates bqs1-prefixed address", () => {
    const kp = new WOTSPlusKeyPair();
    assert.equal(kp.address.startsWith("bqs1"), true);
  });

  it("same public key root produces same address", () => {
    const kp = new WOTSPlusKeyPair();
    const addr1 = generateAddress(kp.publicKeyRoot);
    const addr2 = generateAddress(kp.publicKeyRoot);
    assert.equal(addr1, addr2);
  });
});
