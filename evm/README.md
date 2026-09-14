# BLACKOUT EVM Receipt Registry

`BlackoutReceiptRegistry.sol` is the EVM interoperability layer for BLACKOUT verification receipts.

It is intentionally **not** a Midnight proof verifier. The Midnight Compact contract remains the source of the zero-knowledge income-threshold result. An authorized EVM attester may anchor only the public digest of a result after it has been finalized by the configured Midnight source domain.

## Security boundary

The Solidity contract stores no raw income, salary, bank data, identity document, private witness, or witness salt.

Each receipt contains only:

- `requestId` — the source verification request identifier;
- `midnightTxHash` — the finalized source transaction digest;
- `policyHash` — the public policy digest;
- `commitment` — the public witness commitment emitted by the source protocol;
- `subjectNullifier` — a request-scoped pseudonymous nullifier, which should not be reused across unrelated requests;
- `issuedAt` / `expiresAt`;
- the public qualified boolean;
- the EVM attester address.

Do not put personally identifying data into any `bytes32` field by simply padding or encoding plaintext. Hashes/nullifiers should be domain-separated and generated upstream.

## Hardened controls

- allowlisted attesters only;
- two-step admin transfer with no renounce path;
- old admin loses implicit attester rights after rotation;
- removing an attester removes both anchor and revocation mutation power;
- emergency pause for new anchors while governance/revocation stays available;
- one EVM receipt per Midnight request id;
- one EVM receipt per Midnight transaction hash;
- deterministic receipt ids domain-separated by EVM chain id, registry address and Midnight source domain;
- zero-value sentinel rejection;
- 5-minute future clock-skew ceiling;
- maximum 90-day receipt lifetime;
- explicit revocation reason hashes;
- PASS and FAIL receipts are both recordable, while `isValid()` returns true only for a non-expired, non-revoked PASS receipt.

## Trust model

The contract proves that an **authorized attester anchored a specific public source digest**. It does not independently execute or verify Midnight's ZK circuit on EVM.

Production deployments should therefore use a hardened attester operational model such as a multisig, threshold signer service, or independently monitored relayer. A compromised authorized attester can submit a false source digest until that address is removed. Once removed, that address can no longer register or revoke receipts.

## Build and test

The EVM package is dependency-free Solidity and uses Foundry.

```bash
cd evm
forge fmt --check
forge build --sizes
forge test -vvv
```

The repository security workflow runs those gates alongside the existing Midnight/TypeScript checks. CI action revisions are pinned by commit SHA.

## Deployment inputs

Constructor:

```solidity
constructor(address initialAdmin, bytes32 midnightSourceDomain)
```

`initialAdmin` should be a hardened governance address, preferably a multisig for production.

`midnightSourceDomain` should be a non-zero domain-separated digest identifying the exact source environment and protocol generation. For example, derive it off-chain from a canonical string such as:

```text
BLACKOUT:MIDNIGHT:PREVIEW:V2
```

Do not reuse the same source domain across materially different Midnight networks or protocol generations.

## Non-goals

This contract does not:

- bridge funds;
- verify Midnight proving keys or ZK proofs on EVM;
- store private credentials;
- convert demo-only compound policy checks into LIVE guarantees;
- make an attester trustless.

Those boundaries are deliberate. The EVM layer is an auditable public receipt anchor, while the private eligibility proof remains a Midnight responsibility.
