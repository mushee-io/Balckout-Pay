# BlackoutPay

**PROVE YOU QUALIFY. REVEAL NOTHING ELSE.**

BlackoutPay is privacy-first eligibility infrastructure built on the **Midnight Network**, with an optional hardened **Solidity/EVM receipt layer** for public interoperability.

Instead of sending raw payslips, bank statements and private financial documents to every verifier, the protocol is designed to prove a narrowly defined eligibility condition while keeping the underlying witness private.

The core product flow is:

$$\mathbf{REQUEST} \longrightarrow \mathbf{PROVE} \longrightarrow \mathbf{VERIFY} \longrightarrow \mathbf{ACT}$$

---

## What LIVE v2 proves today

The hardened Midnight Preview contract has one deliberately narrow on-chain guarantee:

> **Private monthly income >= the verifier's immutable registered threshold.**

The verifier registers a request id, required-income threshold and verifier public key. The prover cannot lower that threshold, substitute a different verifier, prove an unregistered request, or finalize the same request twice.

The exact income and 32-byte witness salt remain private witness inputs. The public result contains the qualification boolean and a persistent witness commitment, not the exact salary.

### Demo / roadmap policy engine

The UI and local DEMO mode also contain richer policy concepts such as age, residency, employment, bank balance, KYC and accredited-investor rules. These are useful for product exploration and tests, but they are **not described as Midnight-verified LIVE claims until equivalent Compact constraints are implemented**.

LIVE proving fails closed if a request attempts to submit a compound rule set unsupported by the current Compact circuit.

---

## Hardened protocol model

### Immutable registration

`register_verification_request` writes a request to the `records` map exactly once. Duplicate request ids are rejected.

### Proof binding

`prove_income_threshold` requires an existing registration and verifies that the submitted threshold and verifier key exactly match the immutable registration before evaluating the private witness.

### Protocol replay protection

Final outcomes are written to a separate append-only `results` map. A request with an existing final result cannot be proved again.

### Indexer-first evidence

Browser storage is never an authority for PASS/FAIL. Local registration and proof receipts remain **PENDING** until the Midnight indexer independently exposes the final contract result. Cached data cannot override an indexed threshold, verifier or outcome.

### Wallet/network fail closed

LIVE mode requires a Midnight DApp Connector v4 session, verifies the wallet-reported network, and is locked to **Midnight Preview**. Legacy wallet flows without equivalent network attestation are rejected.

### Fresh ZK artifacts

Dev, test, typecheck and production build paths bootstrap the pinned Compact compiler and regenerate the contract artifacts. Production packaging fails if required proving/verifying keys or ZKIR files are missing.

### Solidity / EVM receipt interoperability

`evm/src/BlackoutReceiptRegistry.sol` provides an optional public receipt anchor for EVM applications. It stores only public hashes/nullifiers and the public qualification result; it does **not** put raw salary, identity, bank data, private witnesses or credential documents on EVM.

The EVM registry deliberately does **not** claim to verify Midnight's zero-knowledge proof itself. An allowlisted attester anchors a finalized public Midnight digest. The Solidity layer adds:

- one receipt per Midnight request id;
- one receipt per Midnight transaction hash;
- domain-separated receipt ids across chain, registry and Midnight source environment;
- two-step admin rotation with no renounce path;
- attester allowlisting and immediate key revocation;
- emergency pause for new receipt anchors;
- receipt expiry, clock-skew bounds and explicit revocation;
- fail-closed handling for zero digests and removed attesters.

See [`evm/README.md`](./evm/README.md) for the complete trust and privacy boundary.

---

## Architecture

```text
┌───────────────────────────────────────────────────────┐
│                 VERIFIER / REQUESTER                  │
│                                                       │
│  Registers immutable request:                        │
│  • request_id                                        │
│  • required_income                                   │
│  • verifier_pk                                       │
└───────────────────────────┬───────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│              APPLICANT / PRIVATE CLIENT               │
│                                                       │
│  Private witness:                                    │
│  • monthly_income                                    │
│  • 32-byte salt                                      │
│                                                       │
│  Compact v2 circuit:                                 │
│  • require registered request                        │
│  • bind threshold + verifier to registration         │
│  • assert no previous final result                   │
│  • evaluate income >= registered threshold in ZK     │
└───────────────────────────┬───────────────────────────┘
                            │ real Midnight transaction
                            ▼
┌───────────────────────────────────────────────────────┐
│                MIDNIGHT PREVIEW LEDGER                │
│                                                       │
│  records: immutable registrations                    │
│  results: append-only final outcomes                 │
│                                                       │
│  Public: threshold, verifier, boolean, commitment    │
│  Private: exact income + salt                        │
└───────────────────────────┬───────────────────────────┘
                            │ indexed state
              ┌─────────────┴──────────────┐
              ▼                            ▼
┌───────────────────────────┐  ┌────────────────────────┐
│        BLACKOUT UI        │  │ OPTIONAL EVM RECEIPT   │
│                           │  │ REGISTRY               │
│ PASS / FAIL authoritative │  │                        │
│ after indexer confirmation│  │ Public digest anchor   │
└───────────────────────────┘  │ No private witness     │
                               └────────────────────────┘
```

---

## Security checklist

The implementation-backed checklist lives in [`SECURITY.md`](./SECURITY.md). Current hardened controls include:

- [x] Private witness isolation
- [x] Immutable request registration
- [x] Registered threshold binding
- [x] Registered verifier binding
- [x] Unregistered-proof rejection
- [x] Protocol-level single-result replay protection
- [x] Strict Bytes<32> and Uint<64> validation
- [x] Midnight Preview wallet/network verification
- [x] Indexer integrity checks
- [x] Non-authoritative browser cache
- [x] Fresh Compact compilation before build/test/typecheck
- [x] v2 deployment separation from pre-hardening contract state
- [x] LIVE claim scope restricted to constraints actually enforced by Compact
- [x] Solidity EVM receipt registry with request/transaction replay guards
- [x] EVM attester allowlist, two-step governance, pause and revocation
- [x] Removed EVM attesters immediately lose mutation rights
- [x] EVM receipt freshness bounds and data-minimization boundary
- [x] Independent Midnight/TypeScript and Solidity Foundry CI jobs
- [x] Commit-pinned GitHub Actions in the security workflow

---

## Local setup

The pinned Compact devtool in this repository is a Linux binary. On Windows, use **WSL/Linux** for compilation.

```bash
git clone https://github.com/mushee-io/Balckout-Pay.git
cd Balckout-Pay
npm ci
```

The build system pins **Compact toolchain 0.31.1**, matching `@midnight-ntwrk/compact-runtime` **0.16.0** used by the current app.

### Development

```bash
npm run dev
```

The pre-dev hook installs/selects the pinned Compact toolchain, recompiles the contract, verifies/stages the ZK artifacts, then launches Vite on port 3000.

### Midnight security / privacy tests

```bash
npm test
```

The test suite covers threshold boundaries, witness leakage checks, commitment tampering, demo compound-policy behavior, policy-digest tampering and local replay checks. LIVE replay safety is enforced by the v2 contract's one-final-result rule rather than browser storage.

### Typecheck

```bash
npm run lint
```

### Production build

```bash
npm run build
```

### Solidity / Foundry security gate

```bash
cd evm
forge fmt --check
forge build --sizes
forge test -vvv
```

The Solidity suite covers authorization, duplicate request/transaction replay, pause behavior, governance rotation, revoked-attester behavior, receipt revocation, timestamp/lifetime validation, domain separation and fuzzed receipt inputs.

### Full CI-equivalent gate

```bash
npm run ci
npm audit --audit-level=high

cd evm
forge fmt --check
forge build --sizes
forge test -vvv
```

---

## Deployment notes

### Midnight

The hardened v2 contract changes ledger semantics and therefore requires a **fresh real Midnight Preview deployment**. The application intentionally uses a new v2 contract-address storage key and does not silently reuse the old pre-hardening deployment.

Until that v2 deployment succeeds, LIVE v2 should remain undeployed/fail-closed rather than falling back to fake or stale state.

### EVM

The Solidity receipt registry is implemented and tested but is **not represented as deployed** merely because it exists in this repository. A production deployment requires choosing the target EVM chain, production admin/multisig, attester model and immutable Midnight source-domain digest.

---

## Documentation

- [`SECURITY.md`](./SECURITY.md) — implementation-backed threat model and completed hardening checklist.
- [`MIDNIGHT_TOOLCHAIN_AUDIT.md`](./MIDNIGHT_TOOLCHAIN_AUDIT.md) — compiler/runtime compatibility and build-chain audit.
- [`evm/README.md`](./evm/README.md) — Solidity receipt-registry trust model, privacy boundary and deployment inputs.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — application and protocol architecture.
- [`PRIVACY.md`](./PRIVACY.md) — privacy design and data-minimization notes.
- [`DEMO.md`](./DEMO.md) — demonstration flow.

---

## License

MIT License. Built for the Midnight Network Buildathon.
