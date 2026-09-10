# Blackout Pay — Midnight Preview deployment status

No contract has been deployed and no PASS or FAIL transaction has been submitted as of this revision.

The canonical build is `contract/build`, produced by Compact 0.31.1 for ledger 8.1. Its generated binding requires compact runtime 0.16.0. The app uses the matching MidnightJS 4.1.1 package family and creates the contract through `CompiledContract.make('BlackoutIncomeVerifier', Contract)` with the compiler-generated `Contract` class.

The browser flow uses the connected Lace wallet's `getConfiguration()` endpoints, a `FetchZkConfigProvider` serving the copied `keys/` and `zkir/` assets, the MidnightJS HTTP proof provider, and the public indexer provider. Lace balances and submits the finalized transaction. The browser-only private-state provider keeps the income witness and salt in memory and disables export.

Before deployment, start the ledger-8.1 Preview-compatible proof server:

```bash
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

Then open the app in a top-level browser tab, connect a funded Lace wallet on Midnight Preview, and use **Deploy Contract to Midnight Preview**. The contract address and transaction ID are returned only from the finalized MidnightJS deployment result; they are not written by the development server.

For a LIVE request or proof, the generated circuit requires a real verifier public key represented as exactly 32 bytes in `0x`-prefixed hexadecimal. The application refuses to hash or substitute a wallet address. Registering the request, running the PASS proof, and running the FAIL proof must use the same 32-byte request identifier and the deployed contract address. Indexer evidence is collected only after the corresponding finalized transaction is returned.
