# PRIVACY ARCHITECTURE SPECIFICATION — BLACKOUT PAY

## 1. Overview
Blackout Pay is engineered with a strict **Zero-Knowledge Principle**: Verifiers must only learn whether an applicant meets a threshold criteria, with mathematical certainty, without learning any underlying private financial data.

---

## 2. Privacy Architecture Flow Diagram

```
+-----------------------------------------------------------------------------------------+
|                                      CLIENT BROWSER                                     |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                        PRIVATE WITNESS STATE (ISOLATED)                         |   |
|   |                                                                                 |   |
|   |   Exact Monthly Income:  £4,720  [Uint64]                                       |   |
|   |   Blinding Nonce (Salt): 0x8f3c... [Bytes32]                                    |   |
|   |   Identity Secret Key:   sk_user...                                             |   |
|   |                                                                                 |   |
|   |   * NEVER leaves client-side RAM                                                |   |
|   |   * NEVER written to localStorage/cookies/analytics                             |   |
|   |   * NEVER transmitted over network                                              |   |
|   +---------------------------------------+-----------------------------------------+   |
|                                           |                                             |
|                                           v                                             |
|   +---------------------------------------------------------------------------------+   |
|   |                       MIDNIGHT COMPACT ZK-PROVER CIRCUIT                        |   |
|   |                                                                                 |   |
|   |   Witness:  income = £4,720, salt = 0x8f3c...                                   |   |
|   |   Public:   required_income = £2,500, commitment = Hash(income, salt)           |   |
|   |                                                                                 |   |
|   |   ZK Assertion:                                                                 |   |
|   |     assert( Hash(income, salt) == commitment )                                  |   |
|   |     result = (income >= required_income)                                        |   |
|   +---------------------------------------+-----------------------------------------+   |
|                                           |                                             |
|                                           v                                             |
|   +---------------------------------------------------------------------------------+   |
|   |                            ZK PROOF ARTIFACT (PUBLIC)                           |   |
|   |                                                                                 |   |
|   |   Proof Bytes:         0x7a29f... (Zero-knowledge proof)                        |   |
|   |   Public Output:       is_verified = true                                       |   |
|   |   Request ID:          req_affordability_9821                                   |   |
|   +---------------------------------------+-----------------------------------------+   |
|                                           |                                             |
+-------------------------------------------|---------------------------------------------+
                                            |
                                            v  (Broadcast / Verified)
+-----------------------------------------------------------------------------------------+
|                               MIDNIGHT NETWORK & VERIFIER                               |
|                                                                                         |
|   Public Ledger State:                                                                  |
|   - Verification ID:       req_affordability_9821                                       |
|   - Required Threshold:    £2,500                                                       |
|   - Status:                ✓ PASSED (Cryptographically Verified)                        |
|   - Disclosed Salary:      [REDACTED / 0 BYTES]                                         |
|                                                                                         |
|   Verifier Learns:         Binary Answer: TRUE (Requirement Satisfied)                  |
|   Verifier CANNOT Learn:   Exact Income (£4,720), Bank Name, Payslip, Tax ID            |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Data Separation Matrix

| Field | Classification | Resident Location | Network Transmission | Verifier Visibility |
| :--- | :--- | :--- | :--- | :--- |
| **`monthly_income`** | 🔒 **PRIVATE** | Local Prover Memory (Witness) | **NEVER SENT** | **NONE (Redacted)** |
| **`income_salt`** | 🔒 **PRIVATE** | Local Prover Memory (Witness) | **NEVER SENT** | **NONE (Hidden)** |
| **`employer_source`** | 🔒 **PRIVATE** | Local Credential Vault | **NEVER SENT** | **NONE (Hidden)** |
| **`required_income`** | 🌐 **PUBLIC** | Verification Request / Contract | Sent as public input | **VISIBLE (£2,500)** |
| **`purpose`** | 🌐 **PUBLIC** | Verification Request ("Rental") | Sent in request metadata | **VISIBLE** |
| **`request_id`** | 🌐 **PUBLIC** | Contract Ledger State | Public transaction identifier | **VISIBLE** |
| **`proof_signature`**| 🌐 **PUBLIC** | Midnight Transaction Payload | Compact ZK SNARK Proof | **VERIFIABLE** |
| **`is_verified`** | 🌐 **PUBLIC** | Public Contract State Output | Boolean flag (`true`/`false`) | **VISIBLE (PASS)** |

---

## 4. Midnight Compact Contract Execution Semantics

In Midnight's Compact language:
1. Functions denoted with `witness` are executed entirely off-chain on the user's device inside the ZK proving system.
2. The witness provides private inputs that satisfy the circuit constraints.
3. The circuit computes the commitment `Commitment = Poseidon(monthly_income, salt)` and validates the predicate `monthly_income >= required_income`.
4. Only the proof and the public parameters (`required_income`, `is_verified`) are recorded on the Midnight public ledger.
5. Even if an attacker inspects every byte in the Midnight ledger or network packets, it is mathematically impossible to derive the value `£4,720`.

---

## 5. Security & Anti-Leakage Audit Guarantees

1. **No URL Parameter Leakage**: Salary figures are prohibited from ever being encoded in `?salary=` query parameters. Shareable links only contain the `request_id`.
2. **No Console / Telemetry Leakage**: Structured logging masks all numerical salary credentials prior to debug hooks.
3. **No Database Leakage**: Private credentials remain in local cryptographic client context.
4. **Zero-Knowledge Soundness**: A prover with income £2,499 cannot produce a valid proof for a £2,500 threshold requirement.
