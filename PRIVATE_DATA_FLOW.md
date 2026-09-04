# BLACKOUT — PRIVATE DATA FLOW & DISCLOSURE BOUNDARY TRACE

This document traces the exact path of private income data through Blackout to prove that sensitive financial values are isolated in private witness memory and never leak to public interfaces.

---

## ARCHITECTURAL DIAGRAM

```
  [ USER LOCAL MACHINE ]                                  [ PUBLIC LEDGER / VERIFIER ]
  
  ┌───────────────────────────────────────────────┐
  │ 1. USER INPUT                                 │
  │    Private Monthly Income: £4,720 (or £2,499) │
  └───────────────────────┬───────────────────────┘
                          │
                          ▼
  ┌───────────────────────────────────────────────┐
  │ 2. PRIVATE LOCAL STORAGE                      │
  │    - Exclusively in Client Process RAM        │
  │    - 0 Bytes in localStorage/sessionStorage   │
  │    - 0 Bytes in remote server/cloud backend   │
  │    - Salt: 256-bit cryptographically secure  │
  └───────────────────────┬───────────────────────┘
                          │
                          ▼
  ┌───────────────────────────────────────────────┐
  │ 3. MIDNIGHT WITNESS FUNCTION                  │
  │    - get_private_monthly_income(): Uint<64>   │
  │    - get_private_income_salt(): Bytes<32>     │
  │    - Invoked off-chain by prover only         │
  └───────────────────────┬───────────────────────┘
                          │
                          ▼
════════════════════════════════════════════════════════════════════════════════════════
                  ZERO-KNOWLEDGE PRIVACY BOUNDARY (COMPACT ZK CIRCUIT)
════════════════════════════════════════════════════════════════════════════════════════
                          │
                          ▼
  ┌───────────────────────────────────────────────┐
  │ 4. REAL COMPACT CIRCUIT EVALUATION            │
  │    - Input: private_income (4720), req (2500) │
  │    - Constraint: private_income >= required   │
  │    - Output: disclose(is_satisfied) = TRUE    │
  │    - Output: disclose(commitment)             │
  │    * private_income is NOT disclosed          │
  └───────────────────────┬───────────────────────┘
                          │
                          ▼
  ┌───────────────────────────────────────────────┐
  │ 5. ZK PROOF SYNTHESIS                         │
  │    - Generates cryptographic SNARK proof      │
  │    - Public inputs: requestId, threshold      │
  │    - Private inputs: [HIDDEN]                 │
  └───────────────────────┬───────────────────────┘
                          │
                          ▼
                                                      ┌─────────────────────────────────┐
                                                      │ 6. PUBLIC MIDNIGHT LEDGER STATE │
                                                      │    - requestId: "req_9821"      │
                                                      │    - required_income: 2500      │
                                                      │    - is_verified: TRUE          │
                                                      │    - commitment: 0x89e2...      │
                                                      │    ---------------------------- │
                                                      │    * Private Salary: 0 BYTES    │
                                                      │    * Shortfall Delta: 0 BYTES   │
                                                      │    * Exact Income: 0 BYTES      │
                                                      └─────────────────────────────────┘
```

---

## STEP-BY-STEP TRACE: PASS CASE (£4,720 vs £2,500)

1. **Input**: User configures private income credential (£4,720 / GBP).
2. **Private Storage**: Instantiated into private `IncomeCredential` in ephemeral client RAM.
3. **Witness Execution**: The Midnight prover queries `get_private_monthly_income()` yielding `4720n`.
4. **Circuit Evaluation**: `is_satisfied = disclose(4720n >= 2500n)` evaluates to `true`.
5. **Proof Output**: Returns `{ is_satisfied: true, required_income: 2500, threshold_currency: "GBP" }`.
6. **Verifier Inspection**: Verifier sees only `is_verified: true`. The value `4720` never enters any public packet.

---

## STEP-BY-STEP TRACE: FAIL CASE (£2,499 vs £2,500)

1. **Input**: User configures private income credential (£2,499 / GBP).
2. **Private Storage**: Kept in client RAM with unique 256-bit salt.
3. **Witness Execution**: Prover queries `get_private_monthly_income()` yielding `2499n`.
4. **Circuit Evaluation**: `is_satisfied = disclose(2499n >= 2500n)` evaluates to `false`.
5. **Proof Output**: Returns `{ is_satisfied: false, required_income: 2500, threshold_currency: "GBP" }`.
6. **Verifier Inspection**: Verifier sees only `is_verified: false`.
   - The value `2499` is NOT disclosed.
   - The shortfall (`£1`) is NOT disclosed.
   - The percentage delta is NOT disclosed.
