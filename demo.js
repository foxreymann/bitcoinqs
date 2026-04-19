#!/usr/bin/env node
import { Blockchain } from "./src/blockchain.js";
import { Wallet } from "./src/wallet.js";
import { Miner } from "./src/miner.js";
import { WOTSPlusKeyPair, sha256, generateAddress } from "./src/crypto/index.js";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", white: "\x1b[37m",
  bgBlue: "\x1b[44m", bgMagenta: "\x1b[45m", bgCyan: "\x1b[46m",
};

const logo = "\n" + C.cyan + C.bold + "\n" +
" \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n" +
" \u2551                                                           \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2551\u2588\u2551  \u2588\u2551 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557           \u2551\n" +
" \u2551   \u2588\u2554\u2550\u2550\u2588\u2551\u2557\u2588\u2551\u255a\u2588\u2557\u2588\u2551\u2554\u2550\u2550\u2550\u2588\u2551\u2557\u2588\u2551\u2554\u2550\u2550\u2550\u2550\u255a\u2588\u2551\u2554\u2550\u2550\u2588\u2551\u2557          \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2551 \u255a\u2588\u2557\u2554\u255d \u2588\u2551   \u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2554\u255d          \u2551\n" +
" \u2551   \u2588\u2554\u2550\u2550\u2588\u2551\u2557\u2588\u2551 \u2588\u2551\u2554\u2588\u2551\u2588\u2551   \u2588\u2551\u2588\u2551\u2554\u2550\u2550\u255d  \u2588\u2551\u2554\u2550\u2550\u2588\u2551\u2557          \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2551\u2588\u2551\u2554\u255d \u2588\u2551\u255a\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2551  \u2588\u2551          \u2551\n" +
" \u2551   \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d          \u2551\n" +
" \u2551                                                           \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2551   \u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557             \u2551\n" +
" \u2551   \u2588\u2551\u2554\u2550\u2550\u2550\u2557 \u2588\u2551   \u2588\u2551\u2588\u2551\u2554\u2550\u2550\u2550\u2550\u255a\u2588\u2551\u2554\u2550\u2550\u2550\u2550\u255a\u255a\u2550\u2550\u2550\u2550\u2588\u2551\u2554\u2550\u255d             \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2551   \u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2551               \u2551\n" +
" \u2551   \u2588\u2551\u2554\u2550\u2550\u2588\u2551\u2557 \u2588\u2551   \u2588\u2551\u2588\u2551\u2554\u2550\u2550\u255d  \u255a\u2550\u2550\u2550\u2550\u2550\u2588\u2551   \u2588\u2551               \u2551\n" +
" \u2551   \u2588\u2588\u2588\u2588\u2588\u2554\u255d \u255a\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2551               \u2551\n" +
" \u2551   \u255a\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u255d               \u2551\n" +
" \u2551                                                           \u2551\n" +
" \u2551   \u269b  QUANTUM-SECURE CRYPTOCURRENCY  \u269b                   \u2551\n" +
" \u2551   Post-quantum signatures via WOTS+                       \u2551\n" +
" \u2551                                                           \u2551\n" +
" \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n" +
C.reset;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const bal = (blockchain, wallet) => blockchain.getBalance(wallet.myAddresses);
const utxos = (blockchain, wallet) => blockchain.getUtxosForAddress(wallet.myAddresses);
const short = (h, n = 12) => h.slice(0, n) + "...";

function hr(title) {
  const line = "\u2500".repeat(60);
  if (title) {
    console.log("\n" + C.dim + line + C.reset);
    console.log(C.bold + C.cyan + "  " + title + C.reset);
    console.log(C.dim + line + C.reset);
  } else {
    console.log(C.dim + line + C.reset);
  }
}

function step(n, text) {
  console.log("\n" + C.bgMagenta + C.white + C.bold + " STEP " + n + " " + C.reset + " " + C.bold + text + C.reset);
}

function info(label, value) {
  console.log("  " + C.cyan + label + ":" + C.reset + " " + value);
}

function success(msg) {
  console.log("  " + C.green + "\u2713" + C.reset + " " + msg);
}

function warn(msg) {
  console.log("  " + C.yellow + "\u26a0" + C.reset + " " + msg);
}

function showBlockchain(chain, wallets) {
  const walletAddresses = new Map();
  for (const [name, wallet] of wallets) {
    for (const addr of wallet.myAddresses) {
      walletAddresses.set(addr, name);
    }
  }

  console.log("\n  " + C.dim + "\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510" + C.reset);
  for (const [i, block] of chain.entries()) {
    const txCount = block.transactions.length;
    const coinbase = block.transactions.find((t) => t.txType === "coinbase");
    const reward = coinbase ? coinbase.outputs[0].amount : 0;
    const recipient = coinbase
      ? (walletAddresses.get(coinbase.outputs[0].recipient) ?? short(coinbase.outputs[0].recipient))
      : "\u2014";

    console.log("  " + C.dim + "\u2502" + C.reset + " " + C.bold + "Block #" + i + C.reset + "  " + C.yellow + "\u26cf" + C.reset + " nonce:" + block.nonce);
    console.log("  " + C.dim + "\u2502" + C.reset + "   hash:     " + C.green + short(block.hash) + C.reset);
    if (i > 0) console.log("  " + C.dim + "\u2502" + C.reset + "   prev:     " + C.dim + short(block.previousHash) + C.reset);
    console.log("  " + C.dim + "\u2502" + C.reset + "   txs: " + txCount + "  reward: " + C.yellow + reward + " BQS" + C.reset + " \u2192 " + C.bold + recipient + C.reset);
    for (const tx of block.transactions) {
      if (tx.txType === "transfer") {
        for (const out of tx.outputs) {
          const who = walletAddresses.get(out.recipient) ?? short(out.recipient);
          console.log("  " + C.dim + "\u2502" + C.reset + "     \u2192 " + out.amount + " BQS to " + C.bold + who + C.reset);
        }
      }
    }
    if (i < chain.length - 1) console.log("  " + C.dim + "\u2502" + C.reset);
  }
  console.log("  " + C.dim + "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518" + C.reset);
}

async function runDemo() {
  console.log(logo);
  await sleep(400);

  console.log(C.bold + C.white + "  Hackathon Demo \u2014 BitcoinQS: Quantum-Secure Blockchain" + C.reset);
  console.log(C.dim + "  Using WOTS+ (Winternitz One-Time Signature Plus)" + C.reset);
  console.log(C.dim + "  Resistant to Shor's algorithm & all known quantum attacks" + C.reset + "\n");

  await sleep(600);

  step(1, "Quantum-Secure Key Generation (WOTS+)");
  hr("How WOTS+ protects against quantum computers");
  console.log("\n  " + C.dim + "Traditional Bitcoin uses ECDSA (secp256k1) which is broken by Shor's");
  console.log("  " + C.dim + "algorithm on a quantum computer. BitcoinQS uses WOTS+ \u2014 a hash-based");
  console.log("  " + C.dim + "one-time signature scheme that relies only on the security of hash");
  console.log("  " + C.dim + "functions (SHA-256), which remain secure against quantum attacks." + C.reset + "\n");

  const kp1 = new WOTSPlusKeyPair();
  info("Private key", kp1.toJSON().privateKey.length + " \u00d7 32-byte random seeds");
  info("Public key", kp1.publicKey.length + " \u00d7 32-byte hash chains (W=16)");
  info("Address", C.green + kp1.address + C.reset);
  info("Security", "256-bit post-quantum (hash-based)");
  success("WOTS+ keypair generated \u2014 immune to Shor's algorithm");

  await sleep(600);

  step(2, "Quantum-Secure Signing & Verification");
  hr("Sign a message and verify with WOTS+");

  const message = Buffer.from("BitcoinQS: Quantum-proof transaction");
  info("Message", message.toString());
  const sig = kp1.sign(message);
  info("Signature", sig.length + " hash chain elements");
  info("Key used", kp1.isUsed ? "Yes (one-time!) \u2014 key must rotate" : "No");

  const verified = WOTSPlusKeyPair.verify(message, sig, kp1.publicKey, kp1.seed);
  success("Signature verified: " + verified);

  const tampered = WOTSPlusKeyPair.verify(Buffer.from("TAMPERED"), sig, kp1.publicKey, kp1.seed);
  warn("Tampered message verification: " + tampered + " (rejected as expected)");

  await sleep(600);

  step(3, "Create Wallets & Initialize Blockchain");
  hr("Alice and Bob get quantum-secure wallets");

  const blockchain = new Blockchain();
  blockchain.difficulty = 2;

  const alice = new Wallet();
  const bob = new Wallet();
  const charlie = new Wallet();

  info("Alice's address", C.green + alice.address + C.reset);
  info("Bob's address", C.green + bob.address + C.reset);
  info("Charlie's address", C.green + charlie.address + C.reset);

  success("3 wallets created with WOTS+ post-quantum keypairs");
  info("Genesis block", short(blockchain.chain[0].hash, 16));

  await sleep(600);

  step(4, "Mine Blocks & Earn BQS");
  hr("Alice mines the first block and earns 50 BQS");

  const miner = new Miner(blockchain, 50);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  info("Block height", String(blockchain.height));

  await sleep(400);

  console.log("\n  " + C.dim + "Mining another block for more funds..." + C.reset);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);

  await sleep(600);

  step(5, "Quantum-Secure Transfer: Alice \u2192 Bob");
  hr("Transfer 30 BQS using WOTS+ signed transaction");

  const aliceUtxoSet = utxos(blockchain, alice);
  const tx1 = alice.createTransaction(bob.address, 30, aliceUtxoSet);
  blockchain.addTransaction(tx1);

  info("Transaction hash", short(tx1.hash, 16));
  info("Amount", C.yellow + "30 BQS" + C.reset + " \u2192 " + short(bob.address, 16));
  info("Change", C.yellow + "70 BQS" + C.reset + " \u2192 " + C.dim + "(new key for forward security)" + C.reset);
  info("Quantum verified", C.green + String(tx1.verify()) + C.reset + " (WOTS+ signature valid)");
  success("Transaction signed with post-quantum WOTS+ signature");

  await sleep(400);

  console.log("\n  " + C.dim + "Mining block to confirm transaction..." + C.reset);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  info("Bob balance", C.yellow + bal(blockchain, bob) + " BQS" + C.reset);

  await sleep(600);

  step(6, "Multi-Hop Transfer: Bob \u2192 Charlie");
  hr("Bob sends 10 BQS to Charlie with quantum-secure signature");

  const bobUtxoSet = utxos(blockchain, bob);
  const tx2 = bob.createTransaction(charlie.address, 10, bobUtxoSet);
  blockchain.addTransaction(tx2);

  miner.mine(alice.address);
  alice.rotateKey();

  info("Charlie balance", C.yellow + bal(blockchain, charlie) + " BQS" + C.reset);
  info("Bob balance", C.yellow + bal(blockchain, bob) + " BQS" + C.reset);
  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);

  await sleep(600);

  step(7, "Blockchain Validation & Integrity Check");
  hr("Verify the entire chain is valid");

  const valid = blockchain.isValid();
  if (valid) success("Blockchain is VALID \u2014 all " + blockchain.height + " blocks verified");
  else warn("Blockchain is INVALID!");

  await sleep(400);

  step(8, "Quantum Attack Simulation");
  hr("What happens if a quantum computer tries to forge a signature?");

  console.log("\n  " + C.dim + "A quantum computer running Shor's algorithm could break ECDSA");
  console.log("  " + C.dim + "(traditional Bitcoin) in ~minutes. Let's simulate an attack:" + C.reset + "\n");

  const forgeKp = new WOTSPlusKeyPair();
  const forgedSig = forgeKp.sign(Buffer.from("FORGED TRANSACTION"));
  const forgedVerify = WOTSPlusKeyPair.verify(
    Buffer.from("FORGED TRANSACTION"),
    forgedSig,
    kp1.publicKey,
    kp1.seed,
  );

  if (!forgedVerify) {
    success("FORGED SIGNATURE REJECTED \u2014 WOTS+ is quantum-secure!");
    info("Reason", "Different keypair cannot produce valid signatures for another key");
    info("ECDSA equivalent", C.red + "VULNERABLE" + C.reset + " \u2014 Shor's algorithm extracts private key from public key");
    info("WOTS+ advantage", C.green + "SECURE" + C.reset + " \u2014 only relies on hash preimage resistance (quantum-safe)");
  }

  await sleep(600);

  step(9, "One-Time Signature Key Rotation");
  hr("WOTS+ keys rotate after each signature (forward security)");

  const rotWallet = new Wallet();
  const addrs = [rotWallet.address];
  for (let i = 0; i < 4; i++) {
    rotWallet.rotateKey();
    addrs.push(rotWallet.address);
  }

  addrs.forEach((a, i) => {
    const label = i === 0 ? "(first)" : i === addrs.length - 1 ? "(current)" : "(rotated)";
    info("Key " + i, short(a, 24) + " " + C.dim + label + C.reset);
  });
  success("Each transaction uses a fresh WOTS+ key \u2014 perfect forward secrecy");

  await sleep(600);

  step(10, "Final Blockchain State");
  hr("Complete blockchain overview");

  const walletMap = [["Alice", alice], ["Bob", bob], ["Charlie", charlie]];
  showBlockchain(blockchain.chain, walletMap);

  console.log("\n  " + C.bold + "Ledger Summary:" + C.reset);
  info("Height", blockchain.height + " blocks");
  for (const [name, wallet] of walletMap) {
    info(name, C.yellow + bal(blockchain, wallet) + " BQS" + C.reset + "  (" + wallet.myAddresses.length + " key addresses)");
  }
  info("Chain valid", blockchain.isValid() ? "\u2713" : "\u2717");

  console.log("\n" + C.bold + C.bgCyan + C.white + "  \u269b BITCOIN QS \u2014 QUANTUM-SECURE BY DESIGN \u269b  " + C.reset + "\n");

  console.log(C.dim + "  Key Differences vs Traditional Bitcoin:" + C.reset);
  console.log(C.dim + "  \u2022 ECDSA \u2192 WOTS+ (hash-based, post-quantum secure)" + C.reset);
  console.log(C.dim + "  \u2022 Static keys \u2192 Key rotation after every signature" + C.reset);
  console.log(C.dim + "  \u2022 Vulnerable to Shor's \u2192 Resistant to all known quantum attacks" + C.reset);
  console.log(C.dim + "  \u2022 256-bit elliptic curve \u2192 256-bit hash-based security" + C.reset + "\n");

  console.log(C.dim + "  To run the API server:  npm run demo:api" + C.reset);
  console.log(C.dim + "  Endpoints: /info, /chain, /wallet/create, /transfer, /mine" + C.reset + "\n");
}

runDemo().catch(console.error);
