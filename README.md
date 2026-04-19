# BitcoinQS — Quantum-Secure Bitcoin

## Project Idea

Bitcoin's cryptography is dead the moment a sufficiently powerful quantum computer arrives. ECDSA (secp256k1), the signature scheme securing every Bitcoin transaction, is vulnerable to Shor's algorithm — a quantum computer could extract private keys from public keys in minutes. Every exposed public key (which is every spent address) becomes a target. This isn't theoretical — it's an inevitability.

**BitcoinQS is what Bitcoin would look like if it were designed today, with quantum threat in mind.**

We replace ECDSA with **WOTS+** (Winternitz One-Time Signature Plus) — a hash-based post-quantum signature scheme that derives its security solely from the collision and preimage resistance of SHA-256. No number-theoretic assumptions. No elliptic curves. No structured lattices. Just hash functions — the one primitive that Grover's algorithm barely dents (SHA-256 with Grover's is still ~2^128 security — more than enough).

## The Problem

| | Bitcoin (ECDSA) | Quantum Threat |
|---|---|---|
| Key security | Relies on discrete log hardness on elliptic curves | Shor's algorithm solves this in polynomial time |
| Exposed keys | ~4M BTC on addresses with revealed public keys | All funds stealable by a quantum adversary |
| Key reuse | Encouraged (same address forever) | Every reuse expands the attack surface |
| Post-quantum migration | No roadmap | Hard fork required, backward-incompatible |

The quantum threat to Bitcoin is existential and unsolved. NIST has standardized post-quantum algorithms (ML-DSA, SLH-DSA), but nobody has shipped a cryptocurrency that natively uses them.

## Our Approach

BitcoinQS makes three fundamental design changes:

### 1. WOTS+ Signatures Instead of ECDSA

WOTS+ is a hash-based one-time signature scheme:
- **Security basis**: SHA-256 preimage resistance (quantum-safe — Grover's only halves bit security)
- **No algebraic structure**: Unlike lattice/ring-based schemes, there's no mathematical structure for quantum algorithms to exploit
- **Minimal assumptions**: If SHA-256 is a good hash function, WOTS+ is secure. Period.
- **NIST-aligned**: Hash-based signatures (LMS, XMSS) are already NIST-approved; WOTS+ is the building block for XMSS

### 2. Mandatory One-Time Key Rotation

WOTS+ is a one-time signature — each keypair signs exactly one transaction. This isn't a limitation; it's a feature:

- **Forward security**: Compromising one key doesn't compromise past or future transactions
- **No key reuse attack surface**: Unlike Bitcoin where address reuse is endemic
- **Automatic key rotation**: The wallet manages a chain of keypairs, advancing after each signature
- **Change addresses by default**: Every transaction output goes to a fresh key

### 3. Hybrid Address Scheme (SHA-256 + SHA3-256)

Addresses are derived from both SHA-256 and SHA3-256 of the public key root, then combined. Even if one hash function is weakened, the address remains secure.

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                  Wallet Layer                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │WOTS+ │ │WOTS+ │ │WOTS+ │ │WOTS+ │  ← Key    │
│  │Key 0 │ │Key 1 │ │Key 2 │ │Key N │    chain  │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘           │
│     └─────────┴─────┬───┴────────┘              │
│               Auto-rotation                      │
├─────────────────────────────────────────────────┤
│              Transaction Layer                    │
│  UTXO model · WOTS+ signed inputs               │
│  Per-input signatures · Change to fresh keys     │
├─────────────────────────────────────────────────┤
│               Block Layer                         │
│  Merkle root · PoW (SHA-256) · Difficulty adj.   │
├─────────────────────────────────────────────────┤
│             Blockchain Layer                      │
│  Chain validation · UTXO set · Mempool           │
├─────────────────────────────────────────────────┤
│               P2P / API Layer                     │
│  REST API · Wallet management · Mining RPC       │
└─────────────────────────────────────────────────┘
```

## Direction & Roadmap

### What's Built (Hackathon MVP)

- Full WOTS+ implementation (67 hash chains, W=16, 256-bit security)
- Blockchain with UTXO model, PoW mining, Merkle trees
- Wallet with automatic key rotation and multi-address balance tracking
- REST API for wallet creation, transfers, mining
- 10-step interactive demo showing quantum attack resistance

### Next Steps

| Phase | Goal | Details |
|-------|------|---------|
| **1. XMSS** | Scale key management | Wrap WOTS+ keys in a Merkle tree (XMSS) for O(log n) key storage instead of O(n). Supports ~2^20 signatures per Merkle tree |
| **2. Multi-signature** | Vault security | Combine multiple WOTS+ keys for M-of-N multisig wallets |
| **3. P2P gossip** | Real network | WebSocket-based peer discovery and block propagation |
| **4. Difficulty adjustment | Stable block times | Retarget every 2016 blocks like Bitcoin |
| **5. Mempool priority** | Fee market | Transaction fees, priority queue, block size limits |
| **6. SPV proofs** | Light clients | Merkle proof verification for lightweight wallets |
| **7. Hybrid signatures** | Migration path | Support both WOTS+ and ECDSA during a transition period, allowing gradual migration from legacy Bitcoin |

### Why This Matters

The quantum computing threat to cryptocurrency is real and growing:

- IBM's quantum roadmap targets 100,000+ qubit systems by 2033
- Breaking ECDSA requires ~4,000 logical qubits (millions of physical qubits today, but error rates are dropping fast)
- ~4M BTC are on addresses with exposed public keys right now
- NIST's post-quantum standardization is done (2024) — the industry is moving

BitcoinQS demonstrates that a quantum-secure cryptocurrency is not only possible but practical today. Hash-based signatures are the most conservative, well-understood post-quantum primitive available. No new math required — just good engineering.

## Comparison

| Feature | Bitcoin | BitcoinQS |
|---------|--------|-----------|
| Signature scheme | ECDSA (secp256k1) | WOTS+ (hash-based) |
| Quantum security | None | 256-bit post-quantum |
| Key reuse | Common | Forbidden by design |
| Forward secrecy | No | Yes (one-time keys) |
| Security assumption | Discrete log | Hash preimage resistance |
| Address format | bc1q... / 1... | bqs1... |
| Block structure | Same | Same (Merkle, PoW) |
| UTXO model | Yes | Yes |
| Quantum migration | Unplanned | Native |

## Run It

```bash
cd bitcoinqs
npm install

# Interactive 10-step demo
npm run demo

# REST API server
npm run demo:api

# Tests (23 passing)
npm test
```

## License

MIT
