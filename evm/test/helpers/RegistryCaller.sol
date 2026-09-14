// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BlackoutReceiptRegistry} from "../../src/BlackoutReceiptRegistry.sol";

contract RegistryCaller {
    function register(BlackoutReceiptRegistry registry, BlackoutReceiptRegistry.ReceiptInput calldata input)
        external
        returns (bytes32)
    {
        return registry.registerReceipt(input);
    }

    function acceptAdmin(BlackoutReceiptRegistry registry) external {
        registry.acceptAdmin();
    }

    function revoke(BlackoutReceiptRegistry registry, bytes32 receiptId, bytes32 reasonHash) external {
        registry.revokeReceipt(receiptId, reasonHash);
    }
}
