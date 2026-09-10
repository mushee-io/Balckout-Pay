# BlackoutPay: Security Architecture & Threat Model

## 1. Threat Model & Adversarial Assumptions

BlackoutPay is engineered against the following adversarial classes:

```
┌─────────────────────────────────────────────────────────────┐
│                      THREAT LANDSCAPE                       │
├───────────────────────┬─────────────────────────────────────┤
│ Adversary             │ Motivation & Attack Vector          │
├───────────────────────┼─────────────────────────────────────┤
│ Malicious Applicant   │ Forge proofs without meeting policy │
│ Dishonest Verifier    │ Extract private financial numbers   │
│ Network Eavesdropper  │ Intercept & replay proofs elsewhere │
│ Man-in-the-Middle     │ Alter policy rules mid-flight       │
└───────────────────────┴─────────────────────────────────────┘
```

---

## 2. Defensive Mechanisms

### 2.1 Cryptographic Policy Binding
* **Vulnerability**: A verifier creates a policy for $\ge$ £5,000/mo. An attacker substitutes a proof generated for an easier requirement ($\ge$ £1,000/mo).
* **Mitigation**: Every verification request generates a canonical `policyHash`:
  $$\text{PolicyHash} = \text{SHA-256}(\text{Rules} \parallel \text{VerifierAddress} \parallel \text{Nonce})$$
  The verification circuit strictly enforces that the proof's public inputs match this exact policy hash. Any tampering or substitution causes immediate cryptographic rejection (verified in **TEST-09**).

### 2.2 Replay Attack Prevention
* **Vulnerability**: An attacker intercepts Alice's valid ZK proof presented to Landlord A, and replays it to Landlord B.
* **Mitigation**: Every request includes an ephemeral, single-use `nonce` (`blk_nonce_...`). Upon verification, the Midnight smart contract records the nonce in its public nullifier set. Any attempt to present a proof with an already-consumed nonce is immediately rejected (verified in **TEST-10**).

### 2.3 Blinding Salt Entropy
* **Vulnerability**: Verifier attempts rainbow table or brute-force search over small integer ranges of income (e.g. testing values from £1,000 to £10,000).
* **Mitigation**: Each private credential is blinded with a 256-bit cryptographically secure pseudorandom salt (`crypto.getRandomValues(new Uint8Array(32))`), yielding $2^{256}$ search space, rendering dictionary attacks computationally impossible.

### 2.4 Time-to-Live (TTL) Expiration
* Each request specifies an `expiresAt` UNIX timestamp. Prover and verifier nodes reject any proof presented after request expiration.

---

## 3. Security Audit Checklist

- [x] **Client-Side RAM Isolation**: Witnesses never leave local memory.
- [x] **Cryptographic Binding**: Public inputs include canonical policy digest.
- [x] **Replay Protection**: Nonce nullification prevents double-presentation.
- [x] **Zero-Knowledge Soundness**: Underage or low-income credentials mathematically cannot generate valid proofs.
- [x] **Tamper Resistance**: Modifying the commitment or witness results in circuit failure.
- [x] **No Central Backend Honeypots**: Pure peer-to-peer / on-chain protocol architecture.
