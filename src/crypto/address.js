import { sha256, sha3_256, base58Encode } from "./hash.js";

export const generateAddress = (publicKeyRoot) => {
  const h1 = sha256(publicKeyRoot);
  const h2 = sha3_256(publicKeyRoot);
  const combined = sha256(Buffer.concat([h1, h2]));
  return "bqs1" + base58Encode(combined);
};
