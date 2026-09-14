# Blackout Pay — Security Architecture & Threat Model

## Security status

This document describes the **hardened v2 Midnight Preview contract**, the client controls that accompany it, and the optional Solidity EVM receipt layer. The v2 deployment is intentionally separated from the earlier contract by a new persisted contract-address key. The old deployment must not be reused for v2.

BLACKOUT's Wave 1 LIVE Midnight guarantee is deliberately narrow:

> Prove `private monthly income >= the verifier's registered threshold` without disclosing the exact income.

Compound age, residency, employment, bank-balance, KYC and accredited-investor policies are demo/roadmap capabilities until they are represented by corresponding Compact constraints. They must not be described as Midnight-verified LIVE claims.

The Solidity layer is also deliberately narrow: it anchors a public digest of a finalized Midnight result for EVM consumers. It does **not** independently verify Midnight's zero-knowledge proof on EVM.

---

## 1. Threat model

| Adversary / failure | Security objective |
| --- | --- |
| Malicious prover | Cannot lower a verifier's registered threshold or substitute a different verifier while proving. |
| Malicious verifier / UI | Cannot obtain the exact private income or salt from public contract state. |
| Replay attacker | Cannot finalize the same registered Midnight request more than once or anchor the same Midnight request/transaction twice on EVM. |
| Browser-storage attacker | Cannot turn localStorage data into authoritative PASS/FAIL evidence or overwrite indexer truth. |
| Wrong-network wallet | Cannot enter LIVE transaction flow while connected to a different Midnight network. |
| Stale build artifact | Cannot ship a contract source change while continuing to use older generated ZK artifacts. |
| Compromised EVM attester | Can be removed by governance; once removed it loses both anchoring and receipt-revocation mutation power. |
| EVM metadata misuse | Raw identity, salary, bank, witness, or credential data must never be placed in receipt fields or events. |

---

## 2. Protocol-level controls

### 2.1 Immutable request registration

`register_verification_request` stores a verifier request in the public `records` map exactly once. The circuit rejects a request id that already exists in either the registration or final-result map.

A registration binds:

- `request_id`
- `required_income`
- `verifier_pk`
- registration timestamp

The registration entry is never overwritten by a proof.

### 2.2 Proof-to-request binding

`prove_income_threshold` first requires an existing registration, then loads the registered record and asserts that the proof call's threshold and verifier public key exactly match that registration.

The qualification comparison is evaluated against **the registered threshold**, not an independently supplied easier threshold.

### 2.3 Protocol replay protection

Final proof results are written to a separate `results` map. Before proving, the circuit asserts that the request id has no existing final result. Therefore a registered request has at most one final result at the contract-state level.

The browser nullifier registry remains useful in DEMO/local verification flows, but LIVE replay protection does **not** rely on localStorage.

### 2.4 Private witness boundary

The exact monthly income and 32-byte salt are witness inputs. Public state receives only:

- the immutable request parameters,
- the qualification boolean,
- the persistent witness commitment,
- public timestamps / identifiers.

The exact income and salt are not inserted into public ledger state.

### 2.5 Contract-version separation

The hardened contract uses the v2 contract-address storage key:

`blackout_midnight_preview_contract_address_v2`

This intentionally prevents the frontend from silently reusing an older, pre-hardening deployment after upgrade. A fresh v2 Midnight Preview deployment is required.

---

## 3. Client and evidence controls

### Wallet/network fail-closed behavior

LIVE wallet connection requires the Midnight DApp Connector v4 `connect(networkId)` flow. Blackout Pay verifies the wallet-reported network and rejects a mismatch. Legacy connector fallback is not accepted for LIVE mode because it cannot provide the same network attestation.

The active wallet session is cleared before reconnect attempts and after failed connections so a stale successful session cannot survive a failed reconnect.

### LIVE input validation

Before submitting a Midnight transaction, the client validates:

- 32-byte contract addresses,
- 32-byte request ids,
- 32-byte verifier public keys,
- 32-byte witness salts,
- unsigned 64-bit threshold / timestamp / witness bounds,
- transaction receipts and transaction ids,
- Preview-network and DUST requirements.

### Browser cache is non-authoritative

`localStorage` is treated only as a UI convenience cache. It may retain an unfinalized **PENDING** registration while indexing catches up, but a browser-only PASS/FAIL is never accepted as on-chain evidence.

When an indexer record exists, network fields override security-critical cached fields. Exported evidence explicitly distinguishes `MIDNIGHT_INDEXER` from `LOCAL_PENDING_CACHE` and marks only indexer-backed entries authoritative.

### Indexer decoding

The v2 indexer path reads immutable registrations and append-only results separately. It rejects malformed state and checks that each result's request id, threshold, and verifier key match the corresponding registration before exposing it as evidence.

---

## 4. EVM receipt layer

`evm/src/BlackoutReceiptRegistry.sol` provides an optional Solidity interoperability layer for EVM applications that need a public, queryable reference to a BLACKOUT result.

### Trust boundary

The EVM contract does **not** run Midnight's Compact circuit or validate a Midnight SNARK. An allowlisted attester anchors the already-public digest of a finalized Midnight result. A compromised active attester can therefore submit a false source digest until governance removes that key.

Production administration and attestation should use hardened operational controls such as a multisig, threshold signer service, or independently monitored relayer rather than an unprotected hot key.

### Data minimization

The Solidity contract stores only public digest material:

- Midnight request id,
- Midnight transaction hash,
- public policy hash,
- witness commitment,
- request-scoped subject nullifier,
- issue/expiry timestamps,
- public qualification boolean,
- attester address.

No raw income, identity, bank information, private witness, witness salt, payslip, credential document, or other sensitive plaintext belongs in these fields or events.

### Solidity hardening controls

- only allowlisted attesters can create anchors;
- admin transfer is two-step and has no renounce path;
- rotating admin removes the previous admin's implicit attester role;
- removing an attester immediately removes both registration and revocation mutation power;
- an emergency pause blocks new anchors while governance and revocation remain available;
- each Midnight request id may be anchored only once;
- each Midnight transaction hash may be anchored only once;
- receipt ids are domain-separated by EVM chain id, registry address and immutable Midnight source domain;
- zero-value digests/sentinels are rejected;
- future timestamps are bounded by a five-minute clock-skew allowance;
- receipt lifetime is capped at 90 days;
- revocation requires a non-zero reason hash;
- `isValid()` returns true only for an existing, qualified, non-revoked and non-expired receipt.

The EVM source domain must be unique to the exact Midnight environment/protocol generation. It must not be reused across materially different source networks or generations.

---

## 5. Build and supply-chain controls

The repository pins the Compact toolchain to **0.31.1**, matching the current `@midnight-ntwrk/compact-runtime` **0.16.0** dependency. Build/test/typecheck tasks bootstrap and recompile the Compact source before consuming generated artifacts.

GitHub Security CI runs the Midnight/application job:

1. locked dependency installation (`npm ci`),
2. pinned Compact compilation,
3. TypeScript typecheck,
4. privacy/security tests,
5. production build with required proving artifacts,
6. dependency audit at high-severity threshold.

It also runs an independent Solidity job:

1. commit-pinned Foundry toolchain action,
2. `forge fmt --check`,
3. `forge build --sizes` with Solc 0.8.24,
4. `forge test -vvv`, including fuzzed receipt inputs and authorization/replay/governance cases.

GitHub Actions used by the security workflow are pinned to commit SHAs rather than floating tags.

---

## 6. Expiration and policy-hash scope

Two Midnight boundaries are important:

- `expiresAt` is currently a client/verifier policy field. It is checked by application verification logic, but it is **not yet an on-chain deadline constraint** in the Wave 1 Compact circuit.
- `policyHash` is useful client metadata for binding richer policy descriptions in DEMO/application logic. The LIVE v2 Compact authorization boundary is the immutable on-chain tuple of request id, registered income threshold, and verifier public key. We do not claim that arbitrary compound-policy hashes are enforced by the current income circuit.

The EVM receipt registry has its own explicit receipt expiry check. That EVM expiry controls receipt-cache validity only; it does not retroactively change whether the underlying Midnight proof was valid when finalized.

---

## 7. Hardened security checklist

- [x] **Private Witness Isolation** — monthly income and salt remain witness inputs and are not persisted as public ledger fields.
- [x] **Immutable LIVE Registration** — request ids cannot be registered twice and proof execution does not overwrite request policy.
- [x] **Threshold Binding** — LIVE proof must use the threshold registered for that request.
- [x] **Verifier Binding** — LIVE proof must use the verifier public key registered for that request.
- [x] **Protocol Replay Protection** — one append-only final result is permitted per registered request.
- [x] **Unregistered-Proof Rejection** — LIVE proof fails if the request was never registered.
- [x] **Wrong-Network Rejection** — LIVE wallet sessions must attest the requested Midnight Preview network.
- [x] **Legacy-Wallet Fail Closed** — LIVE mode does not fall back to an unverifiable legacy connector flow.
- [x] **Strict Transaction Input Bounds** — addresses, keys, salts, request ids and Uint<64> values are validated before submission.
- [x] **Indexer Integrity Checks** — decoded results must match immutable registration id, threshold and verifier.
- [x] **Untrusted Browser Cache** — localStorage cannot override indexer PASS/FAIL evidence.
- [x] **Contract Upgrade Separation** — hardened v2 requires a fresh contract address rather than reusing pre-hardening state.
- [x] **Fresh Compact Compilation** — generated contract bindings and proving artifacts are rebuilt from source before lint/test/build.
- [x] **No Fake LIVE Transactions** — LIVE submission paths require a real connected Midnight wallet and real transaction receipts.
- [x] **Security Claims Scoped to Implemented Circuit** — LIVE Wave 1 is documented as income-threshold proof only; compound demo claims are not presented as on-chain guarantees.
- [x] **EVM Attester Allowlist** — only explicitly authorized attesters may anchor receipts.
- [x] **EVM Replay Guards** — request ids and Midnight transaction hashes cannot be anchored twice.
- [x] **EVM Governance Rotation** — two-step admin transfer removes old implicit mutation rights.
- [x] **EVM Revoked-Key Fail Closed** — a removed attester cannot mutate or revoke its prior receipts.
- [x] **EVM Data-Minimization Boundary** — Solidity stores public digests/nullifiers only and documents sensitive plaintext as forbidden.
- [x] **EVM Receipt Freshness** — future skew and maximum lifetime are bounded and expired receipts fail validity checks.
- [x] **Dual CI Quality Gate** — Midnight/TypeScript and Solidity format/build/test jobs run independently on hardening/main changes.

---

## 8. Remaining deployment requirements

Because the Midnight contract storage model changed, the hardened Compact source must be compiled and deployed as a **new Midnight Preview v2 contract**. The UI is designed to show the v2 contract as unset until that real deployment succeeds. That is a security feature, not a fallback condition.

The Solidity receipt registry in `evm/` is source/test infrastructure until it is intentionally deployed to a chosen EVM network with a production governance/attester configuration. No EVM deployment is implied by the presence of the contract in this repository.
