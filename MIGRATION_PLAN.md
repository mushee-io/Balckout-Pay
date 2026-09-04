# BLACKOUT PROTOCOL — MIGRATION PLAN
## Pivoting from Token Wrappers to Midnight Private Income Eligibility Verification (Wave 1)

---

## 1. Executive Summary & Philosophy
The objective of this migration is to align **Blackout** strictly with the **Midnight Network Wave 1** product directive:
- **Protocol Brand:** BLACKOUT
- **Tagline:** *Prove you qualify. Reveal nothing else.*
- **Wave 1 Core Product:** **Private Income Verification**
- **Core Value Proposition:** A verifier asks a question (e.g. `Income ≥ £2,500/month`). Midnight privately evaluates the user's private income (e.g. `£4,720/month`). The verifier receives only `PASS` or `FAIL`. The verifier learns **0 bytes** of the exact underlying value.

---

## 2. Audit of Existing Codebase & Component Classification

### A. Components & Modules to Completely Remove or Purge
1. **ERC-20 / ERC-7984 Token Wrapping:**
   - `src/components/WrapView.tsx` (Remove)
   - `src/components/UnwrapView.tsx` (Remove)
   - `src/components/BatchShieldModal.tsx` (Remove)
   - `src/components/TransferView.tsx` (Remove)
   - `src/components/RegistryView.tsx` (Remove)
   - `src/midnight/token-store.ts` (Remove / purge token balances, TVL, and wrapper state)
2. **Confidential Token / FHE / Zama Specific Concepts:**
   - Purge references to `FHE`, `fhEVM`, `ERC-7984`, `TVL ($1.84M)`, `Batch Go Dark`, `wrapped tokens`, `USDC/WETH wrappers`.
3. **Dead Navigations & Unsolicited Features:**
   - Remove tabs: `assets`, `wrap`, `unwrap`, `transfer`, `registry`, `activity`.

### B. Visual Language & Architectural Components to Preserve
1. **Dark Editorial Neo-Brutalist / Swiss-Industrial Aesthetics:**
   - Deep Carbon canvas (`#090909`), bone display typography (`#E8E6DF`), Signal Red accents (`#FF5A5F`), 1px structural borders (`rgba(255, 255, 255, 0.08)`).
   - High-density monospace labels, vertical margin typography, micro-labels, and fluid entry animations.
2. **Core Zero-Knowledge Engine:**
   - `src/midnight/zk-engine.ts` (Enhanced for Poseidon commitments, witness blinding salt, and 5-stage ZK proof synthesis).
   - `src/midnight/compact-verifier.ts` (Contract ledger for public verification requests).
   - `contract/income_verifier.compact` (Compact smart contract written in Midnight Compact v0.20+ DSL).
3. **Modal & Developer Systems:**
   - `DeveloperDrawer.tsx` (Updated to display the official Midnight Compact smart contract and Midnight DApp connector integration).
   - `PrivacyAuditor.tsx` (Updated to audit zero-leakage invariant: `0 bytes disclosed`).
   - `TestSuiteModal.tsx` (Runs automated invariant tests proving private income is never leaked).

---

## 3. New Application Architecture & Navigation

### Minimal Navigation Bar:
```
[ ■ BLACKOUT · MIDNIGHT ]       [ PROVE ]  [ REQUEST ]  [ VERIFY ]  [ DEVELOPERS ]       [ CONNECT MIDNIGHT WALLET ]
```

### Main Product Routes / Views:
1. **Editorial Landing Page (`/` / `home`):**
   - **Hero:** "PROVE YOU QUALIFY. REVEAL NOTHING ELSE."
   - **Hero Transformation Visualizer:** 
     - *Left:* Private Data (Monthly Income: `£4,720` sealed off-chain).
     - *Center:* Blackout + Midnight Private Computation (`income >= requirement`).
     - *Right:* Verifier Receives (`Income ≥ £2,500` -> `✓ VERIFIED`, Exact Income: `NOT DISCLOSED`).
   - **Editorial Properties (No Fake TVL):**
     - `01 PRIVATE VALUE`: SEALED (0 BYTES LEAKED)
     - `02 VERIFIER OUTPUT`: PASS / FAIL
     - `03 RAW DATA SHARED`: NONE (0 BYTES)
     - `04 NETWORK`: MIDNIGHT NETWORK
   - **"One Protocol. Many Questions."** Showcase of future roadmap capabilities (Savings, Age, Employment, Portfolio, Membership).
   - **Wave Roadmap:**
     - `WAVE 01 - INCOME` (Active)
     - `WAVE 02 - CREDENTIALS` (Planned)
     - `WAVE 03 - PROTOCOL SDK` (Planned)
2. **PROVE View (`/prove`):**
   - Credential Holder dashboard:
     - **Private Credential Status:** Shows sealed income credential (`£4,720` or customizable), with blinding salt and cryptographic commitment hash.
     - **Pending Verification Requests:** Real-world verifier requests (e.g. "Rental Affordability — Flat 4B: Income ≥ £2,500").
     - **Action:** Click "PROVE PRIVATELY" to launch the Midnight 5-stage proof generation flow.
     - **Failure Toggle / Demo:** Ability to test with an income lower than threshold (e.g. `£2,000` vs `£2,500`) to demonstrate that when eligibility fails, the verifier still learns **0 bytes** of the candidate's actual income.
3. **REQUEST View (`/request`):**
   - Verifier Request Generator:
     - Question: Monthly Income
     - Condition: AT LEAST (`≥`)
     - Threshold: `£2,500` (configurable)
     - Purpose: "Rental Affordability" / "Mortgage Pre-Qualification" / etc.
     - Generates standard Blackout Verification Request on the Midnight ledger.
4. **VERIFY View (`/verify`):**
   - Verifier Portal:
     - Verifier looks up Request (e.g. `REQ-7F21A`).
     - Inspects on-chain result: `✓ PASS` / `✗ FAIL`.
     - Displays explicit audit proof: Exact income: `NOT DISCLOSED`, Credential data: `NOT DISCLOSED`, Verification: `MIDNIGHT NETWORK`.
5. **DEVELOPERS View (`/developers`):**
   - Compact Smart Contract inspection (`income_verifier.compact`).
   - Developer SDK Wave 3 Architectural Preview (`requestProof({ credential: "income", condition: "gte", threshold: 2500 })`).
   - Integration instructions with `@midnight-ntwrk/dapp-connector-api`.

---

## 4. Execution Step Sequence

1. **Step 1: Clean Up & Type System Refactoring**
   - Update `src/midnight/types.ts` to remove all token/wrapper interfaces and establish strict types for `PrivateIncomeCredential`, `VerificationRequest`, `ZkProofResult`, `WalletState`, and `MidnightNetwork`.
2. **Step 2: Update Homepage & Hero Visualizer**
   - Rebuild `src/components/Homepage.tsx` with the new 3-stage interactive privacy transformation visualizer (Private Data -> Midnight Private Computation -> Verifier Receives), Editorial Properties, "One Protocol. Many Questions.", and Wave Roadmap.
3. **Step 3: Build Streamlined Core Views**
   - Refactor `src/components/Dashboard.tsx` into the unified **PROVE** workspace.
   - Refactor `src/components/CreateRequestModal.tsx` and `src/components/VerifierView.tsx`.
   - Update `src/components/ProofGenerationModal.tsx` to execute the authentic 5-step Midnight ZK proof sequence.
4. **Step 4: Update Navigation & Developer Integrations**
   - Refactor `src/components/Navbar.tsx` to match the exact 4-tab minimalist navigation (`PROVE`, `REQUEST`, `VERIFY`, `DEVELOPERS`).
   - Update `src/components/DeveloperDrawer.tsx` with the Wave 3 Preview SDK and Compact contract explorer.
5. **Step 5: Enforce Privacy Invariant & Run Automated Tests**
   - Ensure tests in `src/tests/privacy.test.ts` verify zero-leakage across all states and failure modes.
   - Run linter and compiler to guarantee green build.
