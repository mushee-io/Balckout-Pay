# Midnight Deployment & Verification Evidence Pack

## 1. Network Configuration
* **Network**: Midnight Preview (Active Testnet)
* **Node RPC Endpoint**: `https://rpc.preview.midnight.network`
  * **Connectivity Status**: `CONNECTED & VERIFIED`
  * **Diagnostic Output**: `{"jsonrpc":"2.0","id":1,"result":{"peers":13,"isSyncing":false,"shouldHavePeers":true}}`
* **Indexer GraphQL Endpoint**: `https://indexer.preview.midnight.network/api/v3/graphql`
  * **Connectivity Status**: `CONNECTED & VERIFIED`
  * **Diagnostic Output**: `{"data":{"block":{"height":718017,"hash":"6574b2c3a17f24525387b3c56bd543835255a29090ceb906be4c000f5b118b34"}}}`
* **Proof Server Endpoint**: `http://localhost:6300`
  * **Connectivity Status**: `CONNECTED & VERIFIED`
  * **Diagnostic Output**: `{"status":"ok","timestamp":"2026-09-04 12:38:33.632237422 +00:00:00"}`

## 2. Compiler Information
* **Compiler**: Compact Compiler (`compact` / `compactc`)
* **Version**: `0.34.0`
* **Contract Source**: `contract/income_verifier.compact`
* **Target Output**: ZKIR and TypeScript bindings located in `src/midnight/contract-artifacts/`
  * `contract/index.js`
  * `contract/index.d.ts`
  * `compiler/contract-manifest.json`
  * `compiler/contract-info.json`
  * `zkir/prove_income_threshold.bzkir`
  * `zkir/register_verification_request.bzkir`

## 3. Proof Server Verification
* **Binary**: `midnight-proof-server` (from official `midnightnetwork/proof-server:latest`, package `ledger-7.0.0-rc.1`)
* **Version**: `7.0.0-rc.1`
* **Startup Command**: `nohup midnight-proof-server --port 6300 > /tmp/proof-server.log 2>&1 &`
* **Health Check**:
  * Endpoint: `GET http://localhost:6300/`
  * Response Code: `HTTP/1.1 200 OK`
  * Response Body: `{"status":"ok","timestamp":"2026-09-04 12:38:33.632237422 +00:00:00"}`
  * Process Status: Actix web service listening on `0.0.0.0:6300` with 2 workers.

## 4. Wallet Connectivity Status
* **Wallet Name**: Lace (Midnight Network) browser extension (`window.midnight.lace`)
* **Target Network**: Midnight Preview
* **Wallet Address**: `None / Not Connected` (No wallet extension injected into automated container environment)
* **Balance**: `0.00 DUST` / `0.00 tNIGHT` (No fabricated balance information)
* **Connection Status**: `DISCONNECTED`
* **Funding Instructions**:
  1. Install the official **Lace (Midnight)** extension from Chrome Web Store or [Midnight Prereqs Guide](https://docs.midnight.network/develop/tutorial/building/prereqs#midnight-lace-wallet).
  2. Open Lace settings and switch active network to **Midnight Preview**.
  3. Copy your Bech32m address (starts with `mn_addr_test...`).
  4. Visit the Midnight Faucet: `https://faucet.preview.midnight.network`.
  5. Request test tNIGHT and DUST tokens.

## 5. Contract Address
* **Contract Address**: `[UNSET — PENDING ON-CHAIN DEPLOYMENT]`
* **Environment Variables**:
  * `MIDNIGHT_CONTRACT_ADDRESS=`
  * `VITE_MIDNIGHT_CONTRACT_ADDRESS=`
* **Status**: Compilation completed with real artifacts. On-chain deployment requires an authorized transaction submission signed by a funded Lace wallet.

## 6. Deployment Transaction ID
* **Deployment TX ID**: `PENDING_BROADCAST` (Requires external transaction authorization via Lace wallet).

## 7. PASS Execution (Scenario 1) — LOCAL / DEMO (OFF-CHAIN CIRCUIT EVALUATION)
* **Execution Environment**: Local ZK Engine / Off-chain Compact Circuit Simulation
* **Midnight On-Chain Transaction ID**: `NOT EXECUTED` (Contract not deployed on-chain; cannot broadcast to ledger)
* **Private Value (Witness)**: `4720` (Monthly net income, blinded with random 256-bit salt)
* **Public Threshold**: `2500`
* **Circuit Executed**: `prove_income_threshold`
* **Expected Verifier Output**: `PASS`
* **Actual Verifier Output**: `PASS` (`isValid: true, isRequirementSatisfied: true`)
* **Local Simulation Proof Hash**: `0x2685d87873b3d23fbb67f66d67fed169`
* **Public Inputs**:
  * `requiredThreshold`: `2500`
  * `currency`: `GBP`
  * `commitment`: `0x2574311e1df9607b89a4f43f0a8c12ddcac1c1c00e78d06d3a1adc66f9b3db24`
* **Public Outputs**:
  * `is_satisfied`: `true`
  * `required_income`: `2500`
  * `threshold_currency`: `GBP`
* **Privacy Leakage Test**: String search for `4720` across public payload and local ledger records returned `NOT FOUND` (0 bytes leaked).

## 8. FAIL Execution (Scenario 2) — LOCAL / DEMO (OFF-CHAIN CIRCUIT EVALUATION)
* **Execution Environment**: Local ZK Engine / Off-chain Compact Circuit Simulation
* **Midnight On-Chain Transaction ID**: `NOT EXECUTED` (Contract not deployed on-chain; cannot broadcast to ledger)
* **Private Value (Witness)**: `2499` (Monthly net income, 1 unit below threshold)
* **Public Threshold**: `2500`
* **Circuit Executed**: `prove_income_threshold`
* **Expected Verifier Output**: `FAIL`
* **Actual Verifier Output**: `FAIL` (`isValid: true, isRequirementSatisfied: false`)
* **Local Simulation Proof Hash**: `0x9cc4ffff7f590a6490ec966b861d3470`
* **Public Inputs**:
  * `requiredThreshold`: `2500`
  * `currency`: `GBP`
  * `commitment`: `0x8ba5edc89d06e84e291a3f3696b59ca843d1f835e66b0d2383d39212702f444f`
* **Public Outputs**:
  * `is_satisfied`: `false`
  * `required_income`: `2500`
  * `threshold_currency`: `GBP`
* **Privacy Leakage Test**: String search for `2499` returned `NOT FOUND` (0 bytes leaked).
* **Shortfall Leakage Check**: Shortfall (`1`) and derived income details are completely absent from public state.

## 9. PASS Public Output
```json
{
  "requestId": "req_tenancy_8921",
  "isVerified": true,
  "threshold": 2500,
  "currency": "GBP",
  "proofHash": "0x2685d87873b3d23fbb67f66d67fed169",
  "commitmentHash": "0x2574311e1df9607b89a4f43f0a8c12ddcac1c1c00e78d06d3a1adc66f9b3db24",
  "txHash": "NOT_BROADCAST_PENDING_DEPLOYMENT",
  "contractAddress": "",
  "midnightNetwork": "Midnight Preview",
  "publicOutputs": {
    "is_satisfied": true,
    "required_income": 2500,
    "threshold_currency": "GBP"
  },
  "privateIncomeDisclosed": "0 BYTES"
}
```

## 10. FAIL Public Output
```json
{
  "requestId": "req_tenancy_8922",
  "isVerified": false,
  "threshold": 2500,
  "currency": "GBP",
  "proofHash": "0x9cc4ffff7f590a6490ec966b861d3470",
  "commitmentHash": "0x8ba5edc89d06e84e291a3f3696b59ca843d1f835e66b0d2383d39212702f444f",
  "txHash": "NOT_BROADCAST_PENDING_DEPLOYMENT",
  "contractAddress": "",
  "midnightNetwork": "Midnight Preview",
  "publicOutputs": {
    "is_satisfied": false,
    "required_income": 2500,
    "threshold_currency": "GBP"
  },
  "privateIncomeDisclosed": "0 BYTES"
}
```

## 11. Privacy Leakage Test
* **Audit Test Suite**: `src/tests/privacy.test.ts`
* **Test Status**: All 6 tests PASSED (`TEST-01` through `TEST-06`).
* **Audit Results**:
  * `TEST-01`: Standard Above Threshold (£4,720 vs £2,500) -> `PASSED`
  * `TEST-02`: Exact Boundary Match (£2,500 vs £2,500) -> `PASSED`
  * `TEST-03`: Strict 1-Unit Below Threshold (£2,499 vs £2,500) -> `PASSED`
  * `TEST-04`: Zero Baseline (£0 vs £2,500) -> `PASSED`
  * `TEST-05`: Zero-Knowledge Privacy Leakage Audit (Tested with £98,452) -> `PASSED`
  * `TEST-06`: Tamper Resistance (Commitment mismatch rejection) -> `PASSED`
* **Verification**: In all executions, raw salary integers, salts, and shortfall derivations remain exclusively inside private witness state.

## 12. Remaining Mocks
* **DEMO Mode**: Isolated in-memory ledger (`CompactContractLedger`) used exclusively when user explicitly switches to "DEMO SANDBOX".
* **LIVE Mode**: Strictly separated from demo ledger. Calls Midnight Preview GraphQL indexer and requires on-chain wallet broadcast. Silent fallbacks to demo mode are disabled.

## 13. Remaining Blockers
1. **User Wallet Authorization**: Broadcast of the live deployment transaction requires the user to connect their Lace (Midnight) wallet in a top-level browser tab (outside the sandboxed iframe).
2. **Faucet Funding**: The connected Lace wallet must hold test tNIGHT and DUST tokens from `https://faucet.preview.midnight.network` to pay for deployment gas.
