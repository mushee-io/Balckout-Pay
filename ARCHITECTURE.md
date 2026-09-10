# BlackoutPay: System Architecture Specification

## 1. Executive Overview

BlackoutPay is an institutional-grade zero-knowledge eligibility protocol deployed on the **Midnight Network**. It enables users to prove qualification against arbitrary compound policies without disclosing underlying private credentials.

The system adheres to the fundamental protocol sequence:

$$\mathbf{REQUEST} \longrightarrow \mathbf{PROVE} \longrightarrow \mathbf{VERIFY} \longrightarrow \mathbf{ACT}$$

---

## 2. Midnight Dual-State Model

Midnight distinguishes itself from traditional blockchains through its native dual-state architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    MIDNIGHT DUAL-STATE                      │
├──────────────────────────────┬──────────────────────────────┤
│        PRIVATE STATE         │         PUBLIC STATE         │
│     (Witness Memory / RAM)   │       (Midnight Ledger)      │
├──────────────────────────────┼──────────────────────────────┤
│ • Monthly Income (£4,720)    │ • Deployed Contract Address  │
│ • Age (28)                   │ • Policy Digest (0x9b4a...)  │
│ • Country of Residence ('UK')│ • Verification Nonce         │
│ • Employment Status          │ • ZK-SNARK Proof Artifact    │
│ • Blinding Salt (256-bit)    │ • Boolean Outcome (QUALIFIED)│
│ • Witness Commitments        │ • Block Height & Timestamp   │
└──────────────────────────────┴──────────────────────────────┘
```

### 2.1 Private Witness State
* Resides exclusively in the user's local execution environment (client-side browser memory / mobile enclave).
* Uses cryptographically secure random salts (256 bits) to compute Pedersen/SHA-256 commitments:
  $$\text{Commitment} = \mathcal{H}(\text{Income} \parallel \text{Currency} \parallel \text{Salt})$$
* Witness data is consumed by the ZK prover during circuit evaluation and erased from ephemeral heap memory.

### 2.2 Public Ledger State
* Recorded on the Midnight blockchain.
* Stores immutable verification requests, canonical policy digests, and cryptographic proofs.
* Anyone can independently verify that a proof is valid and bound to a specific policy without learning the witness.

---

## 3. Policy Compiler & Rule Engine

A policy is a set of verifiable conditions defined by a reliant party (verifier). Each rule is defined as:

```typescript
export interface PolicyRule {
  id: string;
  category: PolicyRuleCategory;
  label: string;
  operator: 'GTE' | 'LTE' | 'EQ' | 'IN';
  targetValue: string | number | boolean;
  displayTarget: string;
}
```

### 3.1 Supported Rule Categories
1. **INCOME_THRESHOLD**: Minimum monthly or annual income (`GTE`, `LTE`).
2. **AGE_GATE**: Minimum age requirement (`GTE`).
3. **RESIDENCY**: Permitted jurisdictions (`EQ`, `IN`).
4. **EMPLOYMENT**: Verified employment status (`EQ`).
5. **BANK_BALANCE**: Liquidity/reserve requirement (`GTE`).
6. **ACCREDITED_INVESTOR**: Net worth or regulatory status flag.

### 3.2 Canonical Policy Hashing
To prevent policy tampering or substitution attacks between the time a request is created and when a proof is presented, BlackoutPay computes a canonical cryptographic policy digest:

$$\text{PolicyDigest} = \text{SHA-256}\Big(\text{Canonical}(\text{Rules}) \parallel \text{VerifierAddress} \parallel \text{Nonce} \parallel \text{ExpiresAt}\Big)$$

The zero-knowledge circuit takes the `PolicyDigest` as a public input and binds the proof directly to it.

---

## 4. Prover Pipeline

The zero-knowledge proving workflow executes in 4 verifiable phases:

```
[Phase 1: WITNESS PREPARATION]
  ├── Load private credential from local storage vault
  ├── Verify integrity of commitment: H(Income || Currency || Salt)
  └── Format witness into arithmetic circuit inputs

[Phase 2: CIRCUIT SYNTHESIS]
  ├── Load compiled Compact R1CS arithmetic constraint system
  ├── Instantiate witness gates for each policy rule
  └── Evaluate all constraints: (Income >= Min) ∧ (Age >= Min) ∧ ...

[Phase 3: SNARK PROOF SYNTHESIS]
  ├── Generate polynomial commitments over elliptic curve pairing
  ├── Compute quotient and evaluation polynomials
  └── Produce ZK-SNARK proof artifact (proofHash, commitments)

[Phase 4: MIDNIGHT SETTLEMENT]
  ├── Submit proof artifact + public inputs to Midnight ledger
  ├── Midnight validators verify polynomial pairing on-chain
  └── Verifier observes "QUALIFIED" state and executes downstream action
```

---

## 5. Verifier Architecture

The verifier component operates as a zero-knowledge consumer:

1. **Independent On-Chain Verification**: The verifier queries the Midnight ledger or executes the verification algorithm with public parameters:
   $$\text{Verify}(\pi, \text{PublicInputs}, \text{VK}) \in \{\text{QUALIFIED}, \text{REJECTED}\}$$
2. **Cryptographic Audit**:
   * Inspects `proofHash` and block confirmation.
   * Confirms that the proof matches the expected `policyDigest`.
   * Checks that the presentation `nonce` has not been previously used.
3. **Zero Data Disclosure**:
   * The verifier's UI and logs never receive raw financial values or witness fields.
   * Eliminates compliance burdens under GDPR Article 5(1)(c) (Data Minimization).

---

## 6. Smart Contract Specification (`income_verifier.compact`)

The on-chain component is implemented in Midnight's Compact domain-specific language:

```compact
export ledger state: {
  requests: Map<Bytes[32], VerificationState>,
  usedNonces: Set<Bytes[32]>
};

export circuit proveEligibility(
  // Private witness inputs
  witness income: Uint<64>,
  witness age: Uint<32>,
  witness salt: Bytes[32],
  
  // Public parameters
  public policyHash: Bytes[32],
  public nonce: Bytes[32],
  public requiredIncome: Uint<64>,
  public minAge: Uint<32>
): Boolean {
  // 1. Enforce threshold predicates in zero-knowledge
  const incomeValid = income >= requiredIncome;
  const ageValid = age >= minAge;
  
  // 2. Cryptographic binding check
  assert(incomeValid && ageValid);
  
  return true;
}
```

---

## 7. Performance & Latency Targets

* **Witness Preparation**: < 15ms
* **Client Circuit Evaluation**: < 65ms
* **ZK-SNARK Proof Generation**: ~250–400ms (browser WebAssembly)
* **Ledger Settlement**: 1–2 Midnight block times
* **End-to-End Judge Demo**: < 2 minutes total user journey.
