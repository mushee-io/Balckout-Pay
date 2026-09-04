# IMPLEMENTATION PLAN — BLACKOUT PAY (MIDNIGHT NETWORK WAVE 1)

## 1. Executive Summary
**Blackout Pay** is a privacy-first income verification protocol built on the **Midnight Network**.
The single core mission is:
> **"Prove what you earn without revealing what you earn."**

Traditional verification forces users to reveal bank statements, tax returns, employer names, and exact salaries. Blackout Pay uses Midnight's dual-state (private witness state + public ledger state) architecture to run zero-knowledge threshold proofs locally:
```
Private Input:   monthlyIncome (e.g. £4,720) [Private Witness - Never Leaves Client]
Public Input:    requiredIncome (e.g. £2,500) [Public Parameter]
Computation:     ZK Circuit (monthlyIncome >= requiredIncome)
Public Output:   is_verified: true / false [Only result disclosed]
Disclosed Data:  NONE (Exact salary remains completely private)
```

---

## 2. Midnight Compact Smart Contract Architecture

Midnight contracts are authored in **Compact**, Midnight’s domain-specific language for zero-knowledge smart contracts with private state.

### Contract Definition (`contract/income_verifier.compact`)
- **Private Witness**: `monthly_income` (`Uint<64>`) and secret salt/nonce.
- **Public State**: `verification_records` mapping `request_id` -> `{ required_income, is_verified, timestamp, verifier_pk }`.
- **Exported Circuit/Transition (`prove_income_threshold`)**:
  1. Reads `monthly_income` from private witness context `witness_get_income()`.
  2. Asserts `monthly_income >= required_income`.
  3. Updates public state with verification status `true` while the value of `monthly_income` never leaves the ZK prover circuit.

---

## 3. Cryptographic & Privacy Model

| Data Element | Location | Visibility | Midnight Mechanism |
| :--- | :--- | :--- | :--- |
| **Monthly Income (£4,720)** | Client Witness Memory | **STRICTLY PRIVATE** | Private state witness / ZK circuit input |
| **Credential Salt / Nonce** | Client Local Vault | **STRICTLY PRIVATE** | Blinding factor for commitment |
| **Income Commitment Hash** | Public / State | **PUBLIC (Opaque)** | Poseidon/Pedersen commitment |
| **Verification Threshold (£2,500)** | Contract State / Request | **PUBLIC** | Public input parameter |
| **Verification Outcome** | Verifier Screen & Ledger | **PUBLIC** | Binary boolean (`true` / `false`) |
| **Underlying Salary in Logs/URLs** | N/A | **PROHIBITED** | Zero-leakage audit guard |

---

## 4. System Components & File Structure

```
├── contract/
│   └── income_verifier.compact       # Official Midnight Compact ZK Contract
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Brand header, wallet status, network badge, quick demo toggle
│   │   ├── HeroSection.tsx           # High-impact fintech landing & live visual explainer
│   │   ├── Dashboard.tsx             # Private credential summary & active verification requests
│   │   ├── CreateCredentialModal.tsx # Private credential vault creation (GBP/EUR/USD)
│   │   ├── CreateRequestModal.tsx    # Verifier request creation (threshold + purpose)
│   │   ├── ProofGenerationModal.tsx  # Honest step-by-step ZK proof pipeline
│   │   ├── VerifierView.tsx          # Public verifier verification inspection card
│   │   ├── InteractiveDemoModal.tsx  # 30-second Judge Walkthrough (Alex £4,720 vs £2,500)
│   │   ├── PrivacyAuditor.tsx        # Real-time state inspector proving 0-byte salary leakage
│   │   └── DeveloperDrawer.tsx       # Technical drawer with Compact source, ZK circuit details, ABI
│   ├── midnight/
│   │   ├── types.ts                  # Strictly typed Midnight types & credentials
│   │   ├── zk-engine.ts              # ZK proof generator, commitment generator & verification
│   │   ├── wallet-connector.ts       # Lace Midnight DApp Connector & devnet adapter
│   │   └── compact-verifier.ts       # Compact contract abstraction & state coordinator
│   ├── tests/
│   │   └── privacy.test.ts           # Automated test suite (PASS, FAIL, boundary, leakage tests)
│   ├── App.tsx                       # Main application shell & router
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind CSS & design tokens
├── PRIVACY_ARCHITECTURE.md           # Formal privacy specification & diagram
├── IMPLEMENTATION_PLAN.md            # Architecture plan
└── README.md                         # Complete project documentation & Midnight buildathon guide
```

---

## 5. User Journey & Verification Flow

1. **Step 1: Wallet Connection**
   - Connects to Midnight DevNet/TestNet via Lace DApp connector or built-in testnet keypair.
2. **Step 2: Private Credential Creation**
   - User inputs salary (e.g. £4,720).
   - Generates local cryptographic commitment with random salt.
   - Private value stored *only* in the browser's volatile memory / client witness vault.
3. **Step 3: Verification Request Generation**
   - Landlord / Verifier specifies required threshold (e.g. £2,500/month) and purpose ("Rental Affordability").
   - Generates unique shareable verification URI (`req_id`).
4. **Step 4: Zero-Knowledge Proof Execution**
   - Prover passes private income to ZK witness.
   - Evaluates boolean constraint `monthly_income >= required_income`.
   - Produces a Midnight ZK proof certificate.
5. **Step 5: Verifier Attestation**
   - Verifier verifies proof certificate.
   - Result: `✓ PASSED` or `✕ FAILED`.
   - Salary disclosed: **`0 bytes (Private)`**.
