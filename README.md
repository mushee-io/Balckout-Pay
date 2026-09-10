# BlackoutPay

**PROVE YOU QUALIFY. REVEAL NOTHING ELSE.**

BlackoutPay is a privacy-first eligibility infrastructure protocol built on the **Midnight Network**.

Instead of forcing consumers and businesses to upload bank statements, payslips, tax filings, and sensitive identity documents to third-party databases, BlackoutPay transforms eligibility verification into a zero-knowledge proof.

The core protocol flow is:

$$\mathbf{REQUEST} \longrightarrow \mathbf{PROVE} \longrightarrow \mathbf{VERIFY} \longrightarrow \mathbf{ACT}$$

A verifier creates institutional requirements such as:
* Income $\ge$ £2,500/month
* Age $\ge$ 18
* Country = UK
* Employment status = Employed

The applicant proves compliance mathematically without revealing the underlying private numbers or personal details. The verifier receives only what is strictly necessary: **QUALIFIED**.

---

## The Problem: Data Overexposure in Eligibility Checks

Traditional eligibility checks (tenant screening, private lending, accredited investor gating, institutional compliance) are structurally broken:

1. **Massive Over-Disclosure**: Applying to rent an apartment requires handing over unredacted PDF bank statements containing every coffee, pharmacy visit, salary payment, and personal transaction.
2. **Surveillance & Data Honeypots**: Landlords, letting agents, and loan brokers store sensitive personal identity files in insecure mailboxes, spreadsheets, and cloud buckets.
3. **Data Breach Liability**: Verifiers do not want to be custodians of personal identity records—they merely need to know if the applicant meets the qualification threshold.

---

## The BlackoutPay Solution

BlackoutPay introduces a **reusable zero-knowledge eligibility layer**:

* **Private Witness Memory**: Sensitive financial attributes (`monthlyIncome`, `age`, `country`, `bankBalance`, `employmentStatus`, `salt`) exist solely in client RAM. They are never transmitted across the network or committed to the public chain.
* **Compact ZK Circuit**: Written in Midnight's **Compact** DSL (`contract/income_verifier.compact`), enforcing verifiable arithmetic constraints.
* **Cryptographic Policy Binding**: Every request generates a unique `policyHash` binding the exact rules, verifier address, and single-use presentation nonce.
* **Single-Use Replay Protection**: Nonces prevent proof interception or reuse across unauthorized parties.
* **Zero Leakage Invariant**: The verifier and network validators learn 0 bytes of the applicant's exact salary, net worth, birth date, or employer identity.

---

## High-Level Protocol Architecture

```
┌────────────────────────────────────────────────────────┐
│               APPLICANT (PRIVATE CLIENT)               │
│                                                        │
│  [ Private Witness Vault (RAM) ]                       │
│    • monthlyIncome = £4,720                            │
│    • age = 28                                          │
│    • country = 'UK'                                    │
│    • employmentStatus = 'EMPLOYED'                     │
│    • blindingSalt = 0x8f4d...                          │
│                                                        │
│  [ Midnight Compact Circuit ]                          │
│    • assert(monthlyIncome >= 2500)                     │
│    • assert(age >= 18)                                 │
│    • assert(country == 'UK')                           │
│    • assert(employmentStatus == 'EMPLOYED')            │
│    • bind(policyHash, nonce)                           │
│                 │                                      │
│                 ▼                                      │
│    [ ZK-SNARK Proof Artifact ]                         │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼ (Public Network Submission)
┌────────────────────────────────────────────────────────┐
│               MIDNIGHT NETWORK LEDGER                  │
│                                                        │
│  • Public Contract State: income_verifier.compact      │
│  • Policy Hash: 0x9b4a... (Canonical Policy Rules)     │
│  • Single-Use Nonce: blk_nonce_82f1 (Consumed)         │
│  • Verified Boolean Outcome: QUALIFIED (true)          │
│  • Salary Disclosed: 0 BYTES                           │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼ (Real-time Verifier Verification)
┌────────────────────────────────────────────────────────┐
│               RELIANT PARTY / VERIFIER                 │
│                                                        │
│  • Status: QUALIFIED                                   │
│  • Attestation: All 4 Policy Criteria Satisfied        │
│  • Private Data Exposed: 0 Bytes                       │
│  • Action: Approve Tenancy Lease / Disburse Loan       │
└────────────────────────────────────────────────────────┘
```

---

## Core Institutional Presets

BlackoutPay supports multi-rule compound policies across major institutional sectors:

| Preset Name | Target Verifiers | Compound Conditions Evaluated |
| :--- | :--- | :--- |
| **Residential Tenancy** | Letting agencies & landlords | Income $\ge$ £2,500/mo, Age $\ge$ 18, Residency = UK, Employed |
| **Prime Mortgage Screening** | Banks & mortgage brokers | Income $\ge$ £5,000/mo, Bank Balance $\ge$ £25,000, Employed |
| **Private Credit / SME Loan** | Fintech lenders & credit desks | Income $\ge$ £3,500/mo, Bank Balance $\ge$ £10,000, Employed |
| **Accredited Investor Gate** | VC syndicates & token offerings | Annualized Income $\ge$ £15,000/mo OR Balance $\ge$ £100,000 |

---

## Quickstart & Local Setup

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/blackoutpay.git
cd blackoutpay

# Install dependencies
npm install
```

### 2. Launch Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to interact with the application.

### 3. Run Automated Privacy & Security Tests

Run the complete 10-point Zero-Knowledge and data leakage test suite:

```bash
npm test
```

### 4. Build Production Bundle

```bash
npm run build
```

---

## Test Suite Coverage

The automated test suite (`src/tests/privacy.test.ts`) verifies the mathematical soundness and data minimization invariants:

* **TEST-01**: Standard Above Threshold (£4,720 vs £2,500) $\to$ **PASS**
* **TEST-02**: Exact Boundary Match (£2,500 vs £2,500) $\to$ **PASS**
* **TEST-03**: Strict 1-Unit Below Threshold (£2,499 vs £2,500) $\to$ **FAIL**
* **TEST-04**: Zero Baseline (£0 vs £2,500) $\to$ **FAIL**
* **TEST-05**: Privacy Leakage Audit $\to$ **0 Bytes salary exposure verified**
* **TEST-06**: Tamper Resistance $\to$ **Invalid witness commitments rejected**
* **TEST-07**: Compound Multi-Rule Evaluation (Income + Age + Residency + Employment) $\to$ **PASS**
* **TEST-08**: Partial Disqualification (Underage applicant age 16 vs 18) $\to$ **REJECTED**
* **TEST-09**: Tampered Policy Rejection $\to$ **Policy digest mismatch rejected**
* **TEST-10**: Replay Protection $\to$ **Single-use presentation nonce reuse blocked**

---

## Documentation Index

* [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Deep dive into Midnight dual-state, Compact circuit design, and execution boundaries.
* [`PRIVACY.md`](./PRIVACY.md) - Zero-knowledge mathematical foundations, data minimization audit, and GDPR Article 5(1)(c) compliance.
* [`SECURITY.md`](./SECURITY.md) - Threat model, cryptographic policy binding, and replay attack mitigations.
* [`DEMO.md`](./DEMO.md) - Rapid 2-minute judge walkthrough scenario.

---

## License

MIT License. Built for the Midnight Network Buildathon.
