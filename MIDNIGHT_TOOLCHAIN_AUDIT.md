# BLACKOUT — MIDNIGHT NETWORK TOOLCHAIN & COMPILER AUDIT

**Audit Date**: September 2026 / Release Verification  
**Standard**: Official Midnight Network Developer Documentation (`docs.midnight.network`)

---

## 1. OFFICIAL COMPACT COMPILER TOOLCHAIN

| Component | Identifier / Version | Installation Source / Distribution Method |
| :--- | :--- | :--- |
| **Compact CLI** | `0.5.2` | Official Midnight installer (`https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh`) |
| **Compact Compiler (`compactc`)** | `0.34.0` | Midnight Compact Toolchain (`compact update`) |
| **Compact Language Version** | `0.26.0` | `pragma language_version >= 0.20.0;` |
| **Compact Runtime API** | `0.19.0` | `@midnight-ntwrk/compact-runtime@0.19.0` (NPM) |
| **ZK Intermediate Representation** | ZKIR v2 / v3 (`.zkir`, `.bzkir`) | Generated directly by `compactc` |
| **Prover / Verifier Keys** | `.prover` and `.verifier` binaries | Generated via integrated `zkir` prover synthesis |

---

## 2. COMPACT CONTRACT COMPILATION REPORT

**Source Contract**: `/contract/income_verifier.compact`  
**Target Output**: `/contract/dist/` and `/src/midnight/contract-artifacts/`  
**Command Executed**:
```bash
./bin/compact compile contract/income_verifier.compact contract/dist
```
**Compilation Output**:
```
Compiling 2 circuits:
- prove_income_threshold
- register_verification_request
```
**Exit Code**: `0 (SUCCESS)`

### Generated Artifacts Breakdown:
1. **TypeScript Definitions & Bindings**:
   - `contract/dist/contract/index.d.ts` (Typed Contract class, witnesses, circuits, and ledger accessors)
   - `contract/dist/contract/index.js` (Compiled runtime contract implementation)
   - `contract/dist/contract/index.js.map` (Source map)
2. **ZKIR Circuits**:
   - `contract/dist/zkir/prove_income_threshold.zkir` & `prove_income_threshold.bzkir`
   - `contract/dist/zkir/register_verification_request.zkir` & `register_verification_request.bzkir`
3. **Proving & Verification Keys**:
   - `contract/dist/keys/prove_income_threshold.prover` (Binary proving key)
   - `contract/dist/keys/prove_income_threshold.verifier` (Binary verification key)
   - `contract/dist/keys/register_verification_request.prover`
   - `contract/dist/keys/register_verification_request.verifier`
4. **Contract Manifest & Introspection Metadata**:
   - `contract/dist/compiler/contract-info.json`
   - `contract/dist/compiler/contract-manifest.json`

---

## 3. FORMAL PRIVACY & DISCLOSURE BOUNDARY ANALYSIS

In Midnight's Compact DSL, witness information flow is verified at compile time. 
The contract enforces that the private income witness value `private_income` is **NEVER** exposed:

```compact
// Private witness state read only in circuit execution
const private_income: Uint<64> = get_private_monthly_income();
const private_salt: Bytes<32> = get_private_income_salt();

// Poseidon/persistent hash binding commitment
const computed_commitment: Bytes<32> = persistentHash<[Uint<64>, Bytes<32>]>([private_income, private_salt]);

// ONLY the single boolean evaluation result crosses the disclosure boundary:
const is_satisfied: Boolean = disclose(private_income >= required_income);
const disclosed_commitment: Bytes<32> = disclose(computed_commitment);
```

---

## 4. WALLET & NETWORK ARCHITECTURE

1. **Wallet Integration**:
   - Primary: Lace (Midnight) browser extension (`window.midnight.lace.enable()`).
   - Mode Isolation:
     - **REAL WALLET MODE**: Requires connected Lace Midnight wallet. If unavailable, displays `"Midnight wallet required for live verification."`
     - **DEMO MODE**: Explicitly labeled `DEMO — NO ON-CHAIN TRANSACTION` for local UI inspection and testing.
2. **Network Endpoints**:
   - Midnight TestNet-02 Node RPC
   - Midnight Indexer / GraphQL Service
   - Midnight Proof Server (local / remote prover instance)
