import { createHash, randomBytes } from "node:crypto";

export const sha256 = (data) => createHash("sha256").update(data).digest();
export const sha512 = (data) => createHash("sha512").update(data).digest();
export const sha3_256 = (data) => createHash("sha3-256").update(data).digest();

export const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const base58Encode = (bytes) => {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let result = "";
  while (num > 0n) {
    const [q, r] = [num / 58n, num % 58n];
    result = BASE58_ALPHABET[Number(r)] + result;
    num = q;
  }
  for (const b of bytes) {
    if (b === 0) result = "1" + result;
    else break;
  }
  return result;
};

export const base58Decode = (str) => {
  let num = 0n;
  for (const ch of str) num = num * 58n + BigInt(BASE58_ALPHABET.indexOf(ch));
  const hex = num.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
};

export const randomBytesAsync = (n) =>
  new Promise((resolve) => randomBytes(n, (_, buf) => resolve(buf)));
