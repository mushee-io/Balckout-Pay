# BLACKOUT — Midnight Toolchain & Compiler Audit

**Audit date:** 14 September 2026  
**Target:** Midnight Preview  
**Status:** Hardened v2 build pipeline

## 1. Pinned compatibility set

| Component | Pinned version / requirement |
| --- | --- |
| Compact devtool launcher | Repository `bin/compact` |
| Compact toolchain / `compactc` | **0.31.1** |
| Compact language | **0.23.0** |
| `@midnight-ntwrk/compact-runtime` | **0.16.0** |
| MidnightJS contracts/providers | **4.1.1** |
| DApp Connector API | **4.0.1** |
| Target network | **Midnight Preview** |

The previous audit text referenced Compact 0.34.0, but the generated contract metadata in this repository was built with **0.31.1 / language 0.23.0 / runtime 0.16.0**. The hardening pipeline now pins 0.31.1 explicitly so the compiler matches the runtime dependency actually installed by the application.

Do not upgrade the Compact compiler independently of the runtime and MidnightJS compatibility set.

---

## 2. Reproducible contract compilation

Source:

`contract/income_verifier.compact`

Generated output:

`contract/build/`

The build is executed through:

```bash
npm run midnight:compile
```

`scripts/compile-compact.mjs` performs the following fail-closed sequence:

1. verifies the repository Compact devtool and contract source exist,
2. makes the Linux launcher executable,
3. runs `compact update 0.31.1` to install/select the pinned compiler on clean machines and CI,
4. removes the previous `contract/build` directory,
5. recompiles from source,
6. verifies the generated contract bindings, proving/verifying keys and ZKIR artifacts exist.

The build therefore cannot silently fall back to stale generated contract files after the Compact source changes.

---

## 3. Hardened v2 contract model

The contract exposes two public maps:

- `records` — immutable verifier registrations,
- `results` — append-only final proof outcomes.

`register_verification_request` rejects duplicate request ids.

`prove_income_threshold`:

- requires the request to have been registered,
- rejects a second proof result for the same request,
- loads the registered request,
- asserts the supplied threshold equals the registered threshold,
- asserts the supplied verifier key equals the registered verifier key,
- evaluates the private income witness against the **registered** threshold,
- stores only the public boolean result and persistent witness commitment.

This removes the pre-hardening ability to overwrite a request or prove against a caller-supplied easier threshold.

---

## 4. Privacy boundary

Private Compact witnesses:

- `get_private_monthly_income(): Uint<64>`
- `get_private_income_salt(): Bytes<32>`

The exact income and salt are not inserted into public ledger state. The circuit exposes the qualification boolean and the persistent witness commitment needed by the protocol.

Wave 1 LIVE scope is intentionally limited to:

`private monthly income >= registered required income`

Richer age/residency/employment/KYC/bank-balance policies remain demo/roadmap until equivalent Compact constraints exist.

---

## 5. Production artifact staging

Before Vite builds the application, `scripts/copy-zk-artifacts.mjs` verifies and copies the newly compiled artifacts from `contract/build` into the public deployment tree:

- `/keys/prove_income_threshold.prover`
- `/keys/prove_income_threshold.verifier`
- `/keys/register_verification_request.prover`
- `/keys/register_verification_request.verifier`
- `/zkir/prove_income_threshold.bzkir`
- `/zkir/register_verification_request.bzkir`

If any required artifact is missing, the production build fails.

---

## 6. CI gate

`.github/workflows/security-ci.yml` runs on `main`, hardening branches and pull requests. The gate performs:

- `npm ci`
- fresh Compact 0.31.1 compilation
- TypeScript typecheck
- privacy/security tests
- fresh production build
- high-severity dependency audit

A green Security CI run means source, generated Compact artifacts, TypeScript and production packaging were validated together.

---

## 7. Deployment migration

The hardened state layout is a contract upgrade, not an in-place frontend patch. Blackout Pay uses the new browser key:

`blackout_midnight_preview_contract_address_v2`

The earlier address is intentionally ignored. A new real Midnight Preview deployment must succeed before v2 LIVE transactions are enabled.
