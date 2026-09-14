# BLACKOUT SAFE — Native Blackout Workspace

BLACKOUT SAFE now runs inside the main Blackout application rather than redirecting to a separate product origin.

## Real Preview path

The native SAFE workspace wires these operations to Midnight Preview:

1. connect the existing Blackout Midnight wallet session,
2. build a Safe membership/policy commitment locally,
3. deploy the real Compact Safe contract,
4. deposit a real shielded asset,
5. create a private transfer proposal,
6. submit anonymous member approvals,
7. prove quorum,
8. execute the shielded transfer with a real held-coin opening,
9. generate a proof-backed Blackout Receipt.

There is no demo success fallback in this flow. Signer kits, policy openings, proposal bundles and held-coin openings are treated as private inputs and are not persisted by the SAFE workspace. Only the public Safe deployment record is stored in local browser storage for convenience.

The deployed web build stages proving material only for the core user flow (`propose_private`, `approve_private`, `prove_quorum`, `deposit_shielded`, `execute_shielded_transfer`, and unified `receipt_statement`) to avoid reproducing the previous full-browser proving-key storage explosion.
