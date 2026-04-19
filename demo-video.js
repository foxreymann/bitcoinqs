#!/usr/bin/env node
import { Blockchain } from "./src/blockchain.js";
import { Wallet } from "./src/wallet.js";
import { Miner } from "./src/miner.js";
import { WOTSPlusKeyPair, sha256, generateAddress } from "./src/crypto/index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", white: "\x1b[37m",
  bgBlue: "\x1b[44m", bgMagenta: "\x1b[45m", bgCyan: "\x1b[46m",
  bgGreen: "\x1b[42m", bgRed: "\x1b[41m",
};

const castEvents = [];
const startTime = performance.now();

function emit(text) {
  const elapsed = (performance.now() - startTime) / 1000;
  castEvents.push([parseFloat(elapsed.toFixed(6)), "o", text + "\n"]);
}

function emitNoNewline(text) {
  const elapsed = (performance.now() - startTime) / 1000;
  castEvents.push([parseFloat(elapsed.toFixed(6)), "o", text]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const bal = (blockchain, wallet) => blockchain.getBalance(wallet.myAddresses);
const utxos = (blockchain, wallet) => blockchain.getUtxosForAddress(wallet.myAddresses);
const short = (h, n = 12) => h.slice(0, n) + "...";

function hr(title) {
  const line = "\u2500".repeat(60);
  if (title) {
    emit("");
    emit(C.dim + line + C.reset);
    emit(C.bold + C.cyan + "  " + title + C.reset);
    emit(C.dim + line + C.reset);
  } else {
    emit(C.dim + line + C.reset);
  }
}

function step(n, text) {
  emit("");
  emit(C.bgMagenta + C.white + C.bold + " STEP " + n + " " + C.reset + " " + C.bold + text + C.reset);
}

function info(label, value) {
  emit("  " + C.cyan + label + ":" + C.reset + " " + value);
}

function success(msg) {
  emit("  " + C.green + "\u2713" + C.reset + " " + msg);
}

function warn(msg) {
  emit("  " + C.yellow + "\u26a0" + C.reset + " " + msg);
}

function showBlockchain(chain, wallets) {
  const walletAddresses = new Map();
  for (const [name, wallet] of wallets) {
    for (const addr of wallet.myAddresses) {
      walletAddresses.set(addr, name);
    }
  }

  emit("");
  emit("  " + C.dim + "\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510" + C.reset);
  for (const [i, block] of chain.entries()) {
    const txCount = block.transactions.length;
    const coinbase = block.transactions.find((t) => t.txType === "coinbase");
    const reward = coinbase ? coinbase.outputs[0].amount : 0;
    const recipient = coinbase
      ? (walletAddresses.get(coinbase.outputs[0].recipient) ?? short(coinbase.outputs[0].recipient))
      : "\u2014";

    emit("  " + C.dim + "\u2502" + C.reset + " " + C.bold + "Block #" + i + C.reset + "  " + C.yellow + "\u26cf" + C.reset + " nonce:" + block.nonce);
    emit("  " + C.dim + "\u2502" + C.reset + "   hash:     " + C.green + short(block.hash) + C.reset);
    if (i > 0) emit("  " + C.dim + "\u2502" + C.reset + "   prev:     " + C.dim + short(block.previousHash) + C.reset);
    emit("  " + C.dim + "\u2502" + C.reset + "   txs: " + txCount + "  reward: " + C.yellow + reward + " BQS" + C.reset + " \u2192 " + C.bold + recipient + C.reset);
    for (const tx of block.transactions) {
      if (tx.txType === "transfer") {
        for (const out of tx.outputs) {
          const who = walletAddresses.get(out.recipient) ?? short(out.recipient);
          emit("  " + C.dim + "\u2502" + C.reset + "     \u2192 " + out.amount + " BQS to " + C.bold + who + C.reset);
        }
      }
    }
    if (i < chain.length - 1) emit("  " + C.dim + "\u2502" + C.reset);
  }
  emit("  " + C.dim + "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518" + C.reset);
}

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

async function typeText(text, delay = 15) {
  for (const char of text) {
    emitNoNewline(char);
    await sleep(delay);
  }
}

async function runDemoVideo() {
  emit("\x1b[2J\x1b[H" + C.reset);
  await sleep(300);

  emit(logo);
  await sleep(500);

  emit(C.bold + C.white + "  Hackathon Demo \u2014 BitcoinQS: Quantum-Secure Blockchain" + C.reset);
  emit(C.dim + "  Using WOTS+ (Winternitz One-Time Signature Plus)" + C.reset);
  emit(C.dim + "  Resistant to Shor's algorithm & all known quantum attacks" + C.reset + "\n");
  await sleep(800);

  step(1, "Quantum-Secure Key Generation (WOTS+)");
  hr("How WOTS+ protects against quantum computers");
  emit("");
  emit("  " + C.dim + "Traditional Bitcoin uses ECDSA (secp256k1) which is broken by Shor's" + C.reset);
  emit("  " + C.dim + "algorithm on a quantum computer. BitcoinQS uses WOTS+ \u2014 a hash-based" + C.reset);
  emit("  " + C.dim + "one-time signature scheme that relies only on the security of hash" + C.reset);
  emit("  " + C.dim + "functions (SHA-256), which remain secure against quantum attacks." + C.reset + "\n");
  await sleep(600);

  emit(C.bold + C.yellow + "  Generating WOTS+ keypair..." + C.reset);
  await sleep(400);

  const kp1 = new WOTSPlusKeyPair();
  info("Private key", kp1.toJSON().privateKey.length + " \u00d7 32-byte random seeds");
  await sleep(200);
  info("Public key", kp1.publicKey.length + " \u00d7 32-byte hash chains (W=16)");
  await sleep(200);
  info("Address", C.green + kp1.address + C.reset);
  await sleep(200);
  info("Security", "256-bit post-quantum (hash-based)");
  success("WOTS+ keypair generated \u2014 immune to Shor's algorithm");
  await sleep(800);

  step(2, "Quantum-Secure Signing & Verification");
  hr("Sign a message and verify with WOTS+");

  const message = Buffer.from("BitcoinQS: Quantum-proof transaction");
  info("Message", message.toString());
  await sleep(300);

  emit(C.bold + C.yellow + "  Signing with WOTS+..." + C.reset);
  await sleep(300);

  const sig = kp1.sign(message);
  info("Signature", sig.length + " hash chain elements");
  info("Key used", kp1.isUsed ? "Yes (one-time!) \u2014 key must rotate" : "No");
  await sleep(300);

  emit(C.bold + C.yellow + "  Verifying signature..." + C.reset);
  await sleep(300);

  const verified = WOTSPlusKeyPair.verify(message, sig, kp1.publicKey, kp1.seed);
  success("Signature verified: " + verified);
  await sleep(300);

  const tampered = WOTSPlusKeyPair.verify(Buffer.from("TAMPERED"), sig, kp1.publicKey, kp1.seed);
  warn("Tampered message verification: " + tampered + " (rejected as expected)");
  await sleep(800);

  step(3, "Create Wallets & Initialize Blockchain");
  hr("Alice and Bob get quantum-secure wallets");

  const blockchain = new Blockchain();
  blockchain.difficulty = 2;

  emit(C.bold + C.yellow + "  Creating quantum-secure wallets..." + C.reset);
  await sleep(400);

  const alice = new Wallet();
  const bob = new Wallet();
  const charlie = new Wallet();

  info("Alice's address", C.green + alice.address + C.reset);
  await sleep(150);
  info("Bob's address", C.green + bob.address + C.reset);
  await sleep(150);
  info("Charlie's address", C.green + charlie.address + C.reset);
  await sleep(150);

  success("3 wallets created with WOTS+ post-quantum keypairs");
  info("Genesis block", short(blockchain.chain[0].hash, 16));
  await sleep(800);

  step(4, "Mine Blocks & Earn BQS");
  hr("Alice mines blocks and earns 50 BQS per block");

  const miner = new Miner(blockchain, 50);

  emit(C.bold + C.yellow + "  Mining block 1..." + C.reset);
  await sleep(200);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  info("Block height", String(blockchain.height));
  await sleep(400);

  emit(C.bold + C.yellow + "  Mining block 2 for more funds..." + C.reset);
  await sleep(200);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  await sleep(800);

  step(5, "Quantum-Secure Transfer: Alice \u2192 Bob");
  hr("Transfer 30 BQS using WOTS+ signed transaction");

  emit(C.bold + C.yellow + "  Creating quantum-signed transaction..." + C.reset);
  await sleep(300);

  const aliceUtxoSet = utxos(blockchain, alice);
  const tx1 = alice.createTransaction(bob.address, 30, aliceUtxoSet);
  blockchain.addTransaction(tx1);

  info("Transaction hash", short(tx1.hash, 16));
  await sleep(150);
  info("Amount", C.yellow + "30 BQS" + C.reset + " \u2192 " + short(bob.address, 16));
  await sleep(150);
  info("Change", C.yellow + "70 BQS" + C.reset + " \u2192 " + C.dim + "(new key for forward security)" + C.reset);
  await sleep(150);
  info("Quantum verified", C.green + String(tx1.verify()) + C.reset + " (WOTS+ signature valid)");
  success("Transaction signed with post-quantum WOTS+ signature");
  await sleep(400);

  emit(C.bold + C.yellow + "  Mining block to confirm transaction..." + C.reset);
  await sleep(200);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  info("Bob balance", C.yellow + bal(blockchain, bob) + " BQS" + C.reset);
  await sleep(800);

  step(6, "Multi-Hop Transfer: Bob \u2192 Charlie");
  hr("Bob sends 10 BQS to Charlie with quantum-secure signature");

  emit(C.bold + C.yellow + "  Bob signing transaction to Charlie..." + C.reset);
  await sleep(300);

  const bobUtxoSet = utxos(blockchain, bob);
  const tx2 = bob.createTransaction(charlie.address, 10, bobUtxoSet);
  blockchain.addTransaction(tx2);
  await sleep(200);
  miner.mine(alice.address);
  alice.rotateKey();

  info("Charlie balance", C.yellow + bal(blockchain, charlie) + " BQS" + C.reset);
  info("Bob balance", C.yellow + bal(blockchain, bob) + " BQS" + C.reset);
  info("Alice balance", C.yellow + bal(blockchain, alice) + " BQS" + C.reset);
  await sleep(800);

  step(7, "Blockchain Validation & Integrity Check");
  hr("Verify the entire chain is valid");

  emit(C.bold + C.yellow + "  Validating blockchain integrity..." + C.reset);
  await sleep(500);

  const valid = blockchain.isValid();
  if (valid) success("Blockchain is VALID \u2014 all " + blockchain.height + " blocks verified");
  else warn("Blockchain is INVALID!");
  await sleep(800);

  step(8, "Quantum Attack Simulation");
  hr("What happens if a quantum computer tries to forge a signature?");

  emit("");
  emit("  " + C.red + C.bold + "\u26a0 SIMULATING QUANTUM ATTACK..." + C.reset);
  emit("  " + C.dim + "A quantum computer running Shor's algorithm could break ECDSA" + C.reset);
  emit("  " + C.dim + "(traditional Bitcoin) in ~minutes. Let's simulate an attack:" + C.reset + "\n");
  await sleep(600);

  emit(C.bold + C.red + "  Attacker generates new keypair to forge signature..." + C.reset);
  await sleep(400);

  const forgeKp = new WOTSPlusKeyPair();
  const forgedSig = forgeKp.sign(Buffer.from("FORGED TRANSACTION"));
  await sleep(300);

  emit(C.bold + C.red + "  Attacker tries to verify forged signature against victim's public key..." + C.reset);
  await sleep(500);

  const forgedVerify = WOTSPlusKeyPair.verify(
    Buffer.from("FORGED TRANSACTION"),
    forgedSig,
    kp1.publicKey,
    kp1.seed,
  );

  if (!forgedVerify) {
    emit("");
    emit("  " + C.bgGreen + C.white + C.bold + " ATTACK BLOCKED! " + C.reset);
    emit("");
    success("FORGED SIGNATURE REJECTED \u2014 WOTS+ is quantum-secure!");
    await sleep(200);
    info("Reason", "Different keypair cannot produce valid signatures for another key");
    await sleep(200);
    info("ECDSA equivalent", C.red + "VULNERABLE" + C.reset + " \u2014 Shor's algorithm extracts private key from public key");
    await sleep(200);
    info("WOTS+ advantage", C.green + "SECURE" + C.reset + " \u2014 only relies on hash preimage resistance (quantum-safe)");
  }
  await sleep(800);

  step(9, "One-Time Signature Key Rotation");
  hr("WOTS+ keys rotate after each signature (forward security)");

  emit(C.bold + C.yellow + "  Demonstrating key rotation..." + C.reset);
  await sleep(300);

  const rotWallet = new Wallet();
  const addrs = [rotWallet.address];
  for (let i = 0; i < 4; i++) {
    rotWallet.rotateKey();
    addrs.push(rotWallet.address);
    await sleep(100);
  }

  addrs.forEach((a, i) => {
    const label = i === 0 ? "(first)" : i === addrs.length - 1 ? "(current)" : "(rotated)";
    info("Key " + i, short(a, 24) + " " + C.dim + label + C.reset);
  });
  success("Each transaction uses a fresh WOTS+ key \u2014 perfect forward secrecy");
  await sleep(800);

  step(10, "Final Blockchain State");
  hr("Complete blockchain overview");

  const walletMap = [["Alice", alice], ["Bob", bob], ["Charlie", charlie]];
  showBlockchain(blockchain.chain, walletMap);

  emit("");
  emit("  " + C.bold + "Ledger Summary:" + C.reset);
  info("Height", blockchain.height + " blocks");
  for (const [name, wallet] of walletMap) {
    info(name, C.yellow + bal(blockchain, wallet) + " BQS" + C.reset + "  (" + wallet.myAddresses.length + " key addresses)");
  }
  info("Chain valid", blockchain.isValid() ? C.green + "\u2713 YES" + C.reset : C.red + "\u2717 NO" + C.reset);
  await sleep(600);

  emit("");
  emit(C.bold + C.bgCyan + C.white + "  \u269b BITCOIN QS \u2014 QUANTUM-SECURE BY DESIGN \u269b  " + C.reset);
  emit("");

  emit(C.dim + "  Key Differences vs Traditional Bitcoin:" + C.reset);
  emit(C.dim + "  \u2022 ECDSA \u2192 WOTS+ (hash-based, post-quantum secure)" + C.reset);
  emit(C.dim + "  \u2022 Static keys \u2192 Key rotation after every signature" + C.reset);
  emit(C.dim + "  \u2022 Vulnerable to Shor's \u2192 Resistant to all known quantum attacks" + C.reset);
  emit(C.dim + "  \u2022 256-bit elliptic curve \u2192 256-bit hash-based security" + C.reset + "\n");

  emit(C.dim + "  To run the API server:  npm run demo:api" + C.reset);
  emit(C.dim + "  Endpoints: /info, /chain, /wallet/create, /transfer, /mine" + C.reset + "\n");

  await sleep(500);
}

async function main() {
  console.log(C.cyan + "\n\u269b BitcoinQS Demo Video Generator" + C.reset);
  console.log(C.dim + "  Recording terminal session...\n" + C.reset);

  await runDemoVideo();

  const outDir = "./demo-output";
  mkdirSync(outDir, { recursive: true });

  const castFile = outDir + "/bitcoinqs-demo.cast";
  const svgFile = outDir + "/bitcoinqs-demo.svg";

  const header = {
    version: 2,
    width: 80,
    height: 60,
    timestamp: Math.floor(Date.now() / 1000),
    env: { TERM: "xterm-256color", SHELL: "/bin/bash" },
  };

  const castLines = [JSON.stringify(header)];
  for (const [time, type, data] of castEvents) {
    castLines.push(JSON.stringify([time, type, data]));
  }

  writeFileSync(castFile, castLines.join("\n") + "\n");
  console.log(C.green + "\n\u2713 Cast file written: " + castFile + C.reset);

  try {
    console.log(C.yellow + "  Converting to animated SVG..." + C.reset);
    execSync(
      `npx svg-term-cli --in "${castFile}" --out "${svgFile}" --window --no-cursor --padding 10`,
      { stdio: "inherit", cwd: process.cwd() }
    );
    console.log(C.green + "\n\u2713 Animated SVG written: " + svgFile + C.reset);
  } catch (e) {
    console.log(C.yellow + "\n\u26a0 SVG conversion failed. Cast file is still available: " + castFile + C.reset);
    console.log(C.dim + "  You can convert manually: npx svg-term-cli --in " + castFile + " --out " + svgFile + C.reset);
  }

  console.log(C.bold + C.cyan + "\n\u269b Demo video generation complete!" + C.reset);
  console.log(C.dim + "  Files:" + C.reset);
  console.log(C.dim + "    " + castFile + " (asciinema recording)" + C.reset);
  console.log(C.dim + "    " + svgFile + " (animated SVG for web/docs)" + C.reset);
  console.log(C.dim + "  View SVG in any browser or embed in README\n" + C.reset);
}

main().catch(console.error);
