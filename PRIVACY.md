# BlackoutPay: Zero-Knowledge Privacy Specification

## 1. Core Principle: Zero Leakage Invariant

The foundational law of BlackoutPay is:

$$\text{Leakage}(\text{Applicant Witness} \longrightarrow \text{Verifier}) = 0\text{ bytes}$$

When an applicant proves eligibility, the verifier learns **exclusively** whether the applicant meets the specified criteria. 

* The verifier does **NOT** learn the applicant's exact salary.
* The verifier does **NOT** learn how much the applicant exceeded or fell short of the threshold.
* The verifier does **NOT** learn the applicant's date of birth, home address, bank account number, employer name, or transaction history.

---

## 2. Information Disclosure Matrix

| Field | Storage Location | Accessible to Prover | Accessible to Verifier | Accessible to Validators |
| :--- | :--- | :---: | :---: | :---: |
| **Exact Monthly Salary** | Client RAM only | Yes | **NO (0 bytes)** | **NO (0 bytes)** |
| **Exact Applicant Age** | Client RAM only | Yes | **NO (0 bytes)** | **NO (0 bytes)** |
| **Bank Account Balance** | Client RAM only | Yes | **NO (0 bytes)** | **NO (0 bytes)** |
| **Blinding Salt** | Client RAM only | Yes | **NO (0 bytes)** | **NO (0 bytes)** |
| **Full Legal Identity/SSN**| Unused / Excluded | Yes | **NO (0 bytes)** | **NO (0 bytes)** |
| **Policy Criteria** | Ledger / Public State | Yes | Yes | Yes |
| **Eligibility Verdict** | Ledger / Public State | Yes | **Yes (QUALIFIED / FAIL)**| **Yes** |
| **ZK Proof SNARK** | Ledger / Public State | Yes | Yes | Yes |
| **Presentation Nonce** | Ledger / Public State | Yes | Yes | Yes |

---

## 3. Zero-Knowledge Mathematical Soundness

### 3.1 Completeness
An honest applicant possessing valid credentials satisfying the policy constraints can always generate a valid proof that convinces any verifier:
$$\Pr[\text{Verify}(\pi, \text{PublicInputs}) = \text{true} \mid \text{Credentials Satisfy Policy}] = 1$$

### 3.2 Soundness
A dishonest applicant whose credentials do not satisfy the policy conditions cannot forge a valid proof, except with negligible cryptographic probability:
$$\Pr[\text{Verify}(\pi^*, \text{PublicInputs}) = \text{true} \mid \text{Credentials Fail Policy}] \le \text{negl}(\lambda)$$

### 3.3 Zero-Knowledge
The proof $\pi$ reveals no information beyond the truth of the statement. There exists an efficient simulator $\mathcal{S}$ capable of producing indistinguishable transcripts without access to the private witness:
$$\text{View}_{\text{Verifier}}(\text{Prover}(w, x)) \approx_c \mathcal{S}(x)$$

---

## 4. Regulatory & Legal Alignment

### 4.1 GDPR Article 5(1)(c): Data Minimization
Under the General Data Protection Regulation (GDPR), personal data must be:
> *"adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed."*

Current practices (collecting 3 months of unredacted bank statements to verify income) represent a severe violation of data minimization. BlackoutPay achieves **mathematical data minimization**: the verifier processes zero bytes of unnecessary personal financial data.

### 4.2 Reduction of Toxic Data Liabilities
By eliminating the retention of raw PDF statements and identity documents, verifiers eliminate:
* Breach liability under national data privacy statutes.
* Inadvertent exposure of sensitive personal transactions (medical expenses, family support, political memberships).
* Identity theft risks stemming from compromised verifier email accounts.
