# MIDNIGHT ARCHITECTURE & CRYPTOGRAPHIC SPECIFICATION

**Protocol:** Blackout  
**Module:** Wave 1 — Private Income Verification  
**Network:** Midnight Network (TestNet / DevNet)  
**Smart Contract Language:** Compact (v0.20+)  
**DApp Connector:** `@midnight-ntwrk/dapp-connector-api` / Midnight Lace Wallet  
**Documentation References:**
- [Midnight Documentation](https://docs.midnight.network)
- [Compact Smart Contract Language Specification](https://docs.midnight.network/develop/tutorial/building/compact)
- [Compact Witness and Ledger Disclosure Rules](https://docs.midnight.network/develop/reference/compact/compact-language)
- [Midnight DApp Connector API](https://docs.midnight.network/develop/reference/dapp-connector-api)

---

## 1. Cryptographic Information Boundaries

| Dimension | Private (Off-Chain Client Witness) | Public (On-Chain Ledger & Verifier View) |
|---|---|---|
| **Monthly Income** | **Exact value (e.g., £4,720)** stored strictly in client memory | **NEVER DISCLOSED (0 bytes)** |
| **Blinding Salt** | 256-bit cryptographic nonce `r` | **NEVER DISCLOSED (0 bytes)** |
| **Requirement / Threshold** | Received into circuit as comparison operand | Publicly registered on-chain (e.g., `≥ £2,500`) |
| **Evaluation Result** | Computed inside ZK Circuit (`income >= requirement`) | Public boolean verification state (`is_verified: true/false`) |
| **Commitment** | `Hash(income \|\| currency \|\| salt)` | On-chain commitment hash binding the proof to credential |
| **Zero-Knowledge Proof** | Groth16 / PLONK proof artifact generated off-chain | Submitted on-chain and verified by Midnight consensus |

---

## 2. Detailed Technical Breakdown

### 1. Which data is private?
- The user's exact monthly income (e.g., `£4,720.00`).
- The currency identifier and blinding nonce/salt tied to the private credential.
- The raw identity records of the credential holder.

### 2. Which data is public?
- The verification request metadata (Request ID, purpose e.g., "Rental Affordability", verifier public key / name).
- The threshold constraint (e.g., `required_income = 2500`, `currency = GBP`).
- The verification outcome (`PASS` or `FAIL`).
- The public cryptographic commitment hash.
- The timestamp and block height of the on-chain verification transaction.

### 3. Where income exists?
- Income exists **exclusively** in the client's local secure witness memory (`get_private_monthly_income()`).
- It is never transmitted to the verifier, never transmitted across network requests, never stored in unencrypted cookies/local storage, and never posted in transaction calldata.

### 4. Where threshold exists?
- The threshold (e.g., `£2,500`) exists in the public verification request on the Midnight contract ledger (`records[request_id].required_income`).
- It is passed as a public input to the Compact circuit.

### 5. How comparison occurs?
- The comparison `private_income >= required_income` occurs strictly inside the **Zero-Knowledge Circuit** via Midnight Compact's arithmetic constraint engine.
- The Compact compiler generates a zero-knowledge circuit where the relation is evaluated over finite field elements without revealing the private witness input.

### 6. What is proven?
- The mathematical relation: *"The prover knows a private income `x` and salt `r` such that `Commitment = Poseidon(x, r)` AND `x >= threshold`"*.

### 7. What is revealed?
- **Only the boolean predicate result**: `is_satisfied: true` (or `false`).
- **Zero bits of the actual income value are revealed.**

### 8. What appears onchain?
In the Midnight Compact contract ledger (`income_verifier.compact`):
```compact
export struct VerificationRecord {
    request_id: Bytes<32>;
    required_income: Uint<64>;
    is_verified: Boolean;
    timestamp: Uint<64>;
    verifier_pk: Bytes<32>;
    commitment: Bytes<32>;
}
```
*Note:* The field `is_verified` is marked with explicit `disclose()` semantics when written to the ledger; `private_income` is not disclosed.

### 9. What the verifier receives?
The verifier interface queries the ledger and displays:
- **Request Title & Purpose:** "Rental Affordability — Flat 4B"
- **Condition:** "Income ≥ £2,500 / month"
- **Outcome:** "✓ PASS / VERIFIED" (or "✗ NOT SATISFIED")
- **Raw Data Shared:** "0 BYTES (Exact Income Not Disclosed)"

### 10. Which official Midnight packages/APIs are being used?
- `@midnight-ntwrk/dapp-connector-api` for `window.midnight.{walletId}` connector standard.
- Midnight Compact DSL (v0.20+) for smart contract constraints with `witness`, `export circuit`, and `ledger` primitives.
- Midnight TestNet-02 / DevNet RPC configuration.

---

## 3. Strict Invariant Verification Checklist

- [x] `monthlyIncome` is never passed to verifier components or props.
- [x] `monthlyIncome` is excluded from URL search parameters, hash fragments, and routing state.
- [x] No `console.log` or telemetry outputs contain raw credential amounts.
- [x] Verifier view only reads the public `VerificationRequest` record (`status`, `requiredIncome`, `proofResult.isVerified`).
- [x] In the event of eligibility failure (`income < threshold`), the verifier still learns **0 bytes** of the candidate's actual income.
