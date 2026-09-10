# BlackoutPay: 2-Minute Judge Walkthrough Script

**Target Time: < 120 seconds**  
**Core Mantra: PROVE YOU QUALIFY. REVEAL NOTHING ELSE.**

---

## Scenario Overview

* **Applicant (Alex)**:
  * Private Monthly Salary: **£4,720** (stored in private witness RAM)
  * Private Age: **28**
  * Residency: **United Kingdom**
  * Employment: **Employed**
* **Verifier (Kensington Property Management)**:
  * Requirement: Tenancy Affordability Policy
  * Rules: Income $\ge$ £2,500/mo, Age $\ge$ 18, UK Resident, Employed.
* **Expected Outcome**:
  * Applicant Proves: **QUALIFIED**
  * Salary Disclosed: **0 BYTES**
  * Verifier Receives: Cryptographic attestation only.

---

## Step-by-Step Walkthrough

### Step 1: Open the Application (0:00 - 0:15)
1. Launch `http://localhost:3000`.
2. Notice the institutional **Swiss-industrial / editorial fintech** design aesthetic:
   * High-contrast monochrome canvas (`#090909`, `#0E0E0E`, `#E8E6DF`)
   * Clean typography pairing (Space Grotesk + JetBrains Mono)
   * Real-time network and wallet status indicators.

### Step 2: Policy Builder (0:15 - 0:40)
1. Click **"+ NEW VERIFICATION POLICY"** in the top action bar.
2. Select the **"Residential Tenancy"** institutional preset:
   * Income $\ge$ £2,500/mo
   * Age $\ge$ 18
   * Residency = UK
   * Employment Status = Employed
3. Observe the live **Canonical Policy Hash** and **Single-Use Presentation Nonce** generated in real time.
4. Click **"PUBLISH VERIFICATION POLICY"**. The request appears in the active verification queue.

### Step 3: Zero-Knowledge Proving (0:40 - 1:10)
1. Click **"PROVE PRIVATELY →"** on the tenancy request.
2. The ZK Prover modal opens:
   * Displays all 4 policy conditions being checked.
   * Explains the Cryptographic Execution Boundary: Witness memory remains sealed in client RAM.
3. Click **"PROVE IN ZERO-KNOWLEDGE →"**.
4. Watch the 4 honest proving stages execute:
   * `01 / PREPARING WITNESS` (Loading from local RAM)
   * `02 / SYNTHESIZING CIRCUIT` (Compact R1CS constraint evaluation)
   * `03 / GENERATING SNARK PROOF` (Polynomial commitments)
   * `04 / MIDNIGHT SETTLEMENT` (Public proof recorded)
5. Proof completes in < 500ms!
6. Review the verification outcome:
   * **ALL CRITERIA SATISFIED — QUALIFIED**
   * Itemized breakdown: All 4 conditions checked and satisfied.
   * Unrevealed Private Attributes Audit: Salary, DOB, Home Address, Bank Balance = **0 BYTES DISCLOSED**.

### Step 4: Verifier Audit Certificate (1:10 - 1:35)
1. Click **"VERIFIER AUDIT CERTIFICATE"** (or view the verifier portal).
2. Inspect what the reliant party receives:
   * Status: **QUALIFIED**
   * Data Minimization Audit:
     * Received: Boolean attestation, Policy Hash, Midnight Block, Proof SNARK.
     * Withheld: Exact salary, date of birth, employer bank details.
3. Click **"CRYPTOGRAPHIC AUDIT CHECK"**:
   * The verifier independently validates the ZK-SNARK proof and policy digest on Midnight.
   * Displays: `CRYPTOGRAPHIC AUDIT: MATHEMATICALLY SOUND`.

### Step 5: Automated Test Suite (1:35 - 1:55)
1. In the top navigation, click **"Tests"** (or run `npm test` in the terminal).
2. Review the 10 automated test cases:
   * Boundary checks (£2,500 vs £2,500, £2,499 vs £2,500).
   * 0 bytes salary exposure audit.
   * Multi-rule compound evaluation.
   * Underage partial disqualification rejection.
   * Tampered policy rejection.
   * Single-use replay protection.
3. All **10/10 tests PASS**.

---

## Conclusion

BlackoutPay solves the fundamental privacy failure of modern financial eligibility checks. Built with native Midnight Compact contracts, it delivers institutional compliance with zero data leakage.
