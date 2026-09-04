# Blackout Pay

**Prove what you earn without revealing what you earn.**

Blackout Pay is a privacy-preserving income verification application built for the **Midnight Network Buildathon (Wave 1)**.

---

## 1. The Problem

Traditional income verification is fundamentally broken and invasive:
* **Oversharing**: Renting an apartment or applying for a loan requires applicants to disclose complete PDF bank statements, detailed payslips, employer details, and exact salary figures.
* **Surveillance Risk**: Financial documents contain line-by-line transaction histories, personal subscriptions, medical expenses, and family obligations that verifiers should never see.
* **Data Liability**: Landlords, letting agents, and lenders store unencrypted financial documents on insecure servers, creating massive data breach and identity theft vulnerabilities.

---

## 2. The Solution

Blackout Pay replaces sensitive document exchange with **Zero-Knowledge Threshold Verification**.

When a verifier asks:
> *"Does this applicant earn at least £2,500 per month?"*

Blackout Pay executes an off-chain zero-knowledge circuit on the user's device and proves:
> **✓ Monthly income requirement satisfied**

**The verifier learns only: PASS / FAIL.**

The verifier NEVER receives:
* Exact monthly or annual salary
* Bank account numbers or balances
* Payslips or tax forms
* Transaction records

---

## 3. Why Midnight Network

Midnight's **dual-state zero-knowledge architecture** makes this selective disclosure possible:

1. **Private State (Witness)**: Private financial figures (`monthlyIncome`, `salt`) exist solely in client-side witness memory and are never transmitted over the network or published to the ledger.
2. **Public State**: The public ledger only stores the verification predicate (`requiredIncome: £2,500`), the verification identifier, and the cryptographic proof artifact.
3. **Compact Smart Contracts**: Written in Midnight's domain-specific language **Compact** (`contract/income_verifier.compact`), ensuring mathematical soundness and tamper resistance.

---

## 4. How It Works

```
[ Private Witness Memory ]            [ Midnight Compact Circuit ]            [ Public Ledger & Verifier ]
Exact Income: £4,720          --->    assert(income >= threshold)    --->     Result: ✓ PASSED
Blinding Salt: 0x8f...                ZK-SNARK Proof Generation               Salary Disclosed: 0 bytes
```

### Complete User Journey:
1. **Connect Wallet**: Connect via Lace (Midnight) or Midnight DevNet sandbox keys.
2. **Create Private Income Credential**: Store monthly income in your local witness vault with a cryptographic commitment.
3. **Receive or Create Verification Request**: E.g., Landlord requires *Monthly income ≥ £2,500* for rental affordability.
4. **Generate Zero-Knowledge Proof**: The Compact circuit evaluates the constraint locally and produces a ZK proof.
5. **Verifier Confirmation**: Verifier inspects the verified certificate with guaranteed zero salary leakage.

---

## 5. Technical Architecture

```
├── contract/
│   └── income_verifier.compact       # Midnight Compact Smart Contract DSL
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Brand header, wallet status, quick demo
│   │   ├── HeroSection.tsx           # Premium fintech hero & live visual flow
│   │   ├── Dashboard.tsx             # Private credential summary & active requests
│   │   ├── CreateCredentialModal.tsx # Private credential vault configuration
│   │   ├── CreateRequestModal.tsx    # Verifier requirement creation
│   │   ├── ProofGenerationModal.tsx  # Honest step-by-step ZK proof pipeline
│   │   ├── VerifierView.tsx          # Public verifier verification card
│   │   ├── InteractiveDemoModal.tsx  # 30-second Judge Walkthrough
│   │   ├── PrivacyAuditor.tsx        # Real-time state inspector (0 bytes leakage)
│   │   └── DeveloperDrawer.tsx       # Compact DSL code & ABI viewer
│   ├── midnight/
│   │   ├── types.ts                  # Strictly typed Midnight interfaces
│   │   ├── zk-engine.ts              # ZK proof generator, commitment generator & verification
│   │   ├── wallet-connector.ts       # Lace Midnight DApp connector & devnet adapter
│   │   └── compact-verifier.ts       # Compact ledger state coordinator
│   ├── tests/
│   │   └── privacy.test.ts           # Automated test suite (soundness & leakage)
│   ├── App.tsx                       # Main application shell
│   ├── main.tsx                      # Vite React entry point
│   └── index.css                     # Tailwind CSS tokens
├── PRIVACY_ARCHITECTURE.md           # Formal privacy specification & flow diagram
├── IMPLEMENTATION_PLAN.md            # Wave 1 implementation architecture
└── README.md                         # Project documentation
```

---

## 6. Privacy Model & Zero-Leakage Guarantee

| Data Field | Location | Visibility | Midnight Security |
| :--- | :--- | :--- | :--- |
| **`monthly_income`** | Local Prover RAM | 🔒 **PRIVATE** | Never leaves witness memory |
| **`salt`** | Local Prover RAM | 🔒 **PRIVATE** | 256-bit blinding factor |
| **`required_income`** | Public Request | 🌐 **PUBLIC** | Public constraint parameter (£2,500) |
| **`is_verified`** | Public State | 🌐 **PUBLIC** | Boolean output (`true` / `false`) |
| **`proof_hash`** | Public Ledger | 🌐 **PUBLIC** | Cryptographic proof artifact |
| **Salary in Verifier UI** | N/A | **REDACTED** | 0 bytes exposed |

---

## 7. Running Locally

### Prerequisites
* Node.js v18+
* npm or yarn

### Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 8. Testing

Run the automated test suite verifying threshold logic, boundary conditions, and zero data leakage:

```bash
# Run TypeScript compilation check
npm run lint

# Build production bundle
npm run build
```

Inside the UI, click **"Tests"** in the navigation bar to run the live interactive test runner, which validates:
* **TEST-01**: £4,720 vs £2,500 Threshold -> **PASS**
* **TEST-02**: £2,500 vs £2,500 Boundary Match -> **PASS**
* **TEST-03**: £2,499 vs £2,500 Below Threshold -> **FAIL**
* **TEST-04**: £0 vs £2,500 Baseline -> **FAIL**
* **TEST-05**: Zero-Knowledge Privacy Leakage Audit -> **0 Bytes salary exposure verified**
* **TEST-06**: Tamper Resistance -> **Invalid witness commitments rejected**

---

## 9. 30-Second Hackathon Judge Demo

1. Click **"Try Demo (30s)"** in the top navigation or hero section.
2. Review the scenario: **Alex** has a private monthly income of **£4,720**.
3. Landlord requests proof for **Monthly income ≥ £2,500**.
4. Click **"Generate ZK Proof"** to run the Midnight Compact zero-knowledge prover.
5. Inspect the final **Verifier Screen**:
   * Requirement: `Monthly income ≥ £2,500`
   * Result: `✓ PASSED`
   * Exact Salary: `Private (Redacted — 0 bytes revealed)`

---

## 10. Buildathon Roadmap

### Wave 1 — Private Income Proof (Current MVP)
* Working threshold verification: **Prove income ≥ X without revealing income**.
* Local witness state isolation and zero-knowledge commitment generation.
* Midnight Compact smart contract definition (`income_verifier.compact`).
* Public verifier portal and shareable verification requests.
* Automated privacy leakage and boundary test suites.

### Wave 2 — Private Financial Credentials (Future)
* Multi-attribute proofs (e.g., employment duration + savings balance + recurring salary).
* Direct Open Banking / payroll provider cryptographic attestation issuing.
* Reusable zero-knowledge compliance passports.

### Wave 3 — Blackout Pay Developer Network (Future)
* Embeddable SDK and API for fintechs, landlords, and lenders:
  ```typescript
  const { isVerified } = await blackoutPay.requestIncomeProof({
    minimumIncome: 2500,
    currency: "GBP"
  });
  ```
