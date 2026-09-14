// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BlackoutReceiptRegistry} from "../src/BlackoutReceiptRegistry.sol";
import {RegistryCaller} from "./helpers/RegistryCaller.sol";

contract BlackoutReceiptRegistryTest {
    bytes32 internal constant SOURCE_DOMAIN = bytes32(uint256(0xB10C));
    BlackoutReceiptRegistry internal registry;

    constructor() {
        registry = new BlackoutReceiptRegistry(address(this), SOURCE_DOMAIN);
    }

    function testAdminStartsAsAttester() public view {
        assert(registry.admin() == address(this));
        assert(registry.isAttester(address(this)));
        assert(registry.SOURCE_DOMAIN() == SOURCE_DOMAIN);
    }

    function testAuthorizedAttesterCanAnchorQualifiedReceipt() public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        bytes32 receiptId = registry.registerReceipt(input);

        assert(receiptId != bytes32(0));
        assert(registry.exists(receiptId));
        assert(registry.isValid(receiptId));
        assert(registry.receiptByRequestId(input.requestId) == receiptId);
        assert(registry.receiptByMidnightTxHash(input.midnightTxHash) == receiptId);

        BlackoutReceiptRegistry.Receipt memory receipt = registry.getReceipt(receiptId);
        assert(receipt.requestId == input.requestId);
        assert(receipt.midnightTxHash == input.midnightTxHash);
        assert(receipt.policyHash == input.policyHash);
        assert(receipt.commitment == input.commitment);
        assert(receipt.subjectNullifier == input.subjectNullifier);
        assert(receipt.attester == address(this));
        assert(receipt.qualified);
        assert(!receipt.revoked);
    }

    function testUnauthorizedCallerCannotAnchor() public {
        RegistryCaller attacker = new RegistryCaller();
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        bool reverted;

        try attacker.register(registry, input) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testDuplicateRequestIdIsRejected() public {
        BlackoutReceiptRegistry.ReceiptInput memory first = _validInput();
        bytes32 firstId = registry.registerReceipt(first);
        assert(firstId != bytes32(0));

        BlackoutReceiptRegistry.ReceiptInput memory second = _validInput();
        second.midnightTxHash = bytes32(uint256(0x9999));
        bool reverted;

        try registry.registerReceipt(second) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testDuplicateMidnightTransactionIsRejected() public {
        BlackoutReceiptRegistry.ReceiptInput memory first = _validInput();
        bytes32 firstId = registry.registerReceipt(first);
        assert(firstId != bytes32(0));

        BlackoutReceiptRegistry.ReceiptInput memory second = _validInput();
        second.requestId = bytes32(uint256(0x7777));
        bool reverted;

        try registry.registerReceipt(second) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testPauseFailsClosedForNewAnchors() public {
        registry.setPaused(true);
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        bool reverted;

        try registry.registerReceipt(input) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testRevocationInvalidatesReceipt() public {
        bytes32 receiptId = registry.registerReceipt(_validInput());
        assert(registry.isValid(receiptId));

        bytes32 reasonHash = keccak256("MIDNIGHT_SOURCE_REORG_OR_ATTESTATION_REVOKED");
        registry.revokeReceipt(receiptId, reasonHash);

        assert(!registry.isValid(receiptId));
        assert(registry.revocationReason(receiptId) == reasonHash);
        assert(registry.getReceipt(receiptId).revoked);
    }

    function testActiveOriginalAttesterMayRevoke() public {
        RegistryCaller attester = new RegistryCaller();
        registry.setAttester(address(attester), true);

        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        bytes32 receiptId = attester.register(registry, input);
        attester.revoke(registry, receiptId, keccak256("SOURCE_REVOKED"));

        assert(!registry.isValid(receiptId));
    }

    function testRemovedAttesterLosesRevocationPower() public {
        RegistryCaller attester = new RegistryCaller();
        registry.setAttester(address(attester), true);

        bytes32 receiptId = attester.register(registry, _validInput());
        registry.setAttester(address(attester), false);

        bool reverted;
        try attester.revoke(registry, receiptId, keccak256("COMPROMISED_KEY_ATTEMPT")) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
        assert(registry.isValid(receiptId));

        registry.revokeReceipt(receiptId, keccak256("ADMIN_REVOKED_AFTER_KEY_REMOVAL"));
        assert(!registry.isValid(receiptId));
    }

    function testRejectedReceiptExistsButIsNotValid() public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        input.qualified = false;

        bytes32 receiptId = registry.registerReceipt(input);
        assert(registry.exists(receiptId));
        assert(!registry.isValid(receiptId));
    }

    function testFutureTimestampBeyondClockSkewIsRejected() public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        input.issuedAt = _now64() + registry.MAX_CLOCK_SKEW() + 1;
        input.expiresAt = input.issuedAt + 1 days;
        bool reverted;

        try registry.registerReceipt(input) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testReceiptLifetimeIsBounded() public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        input.expiresAt = input.issuedAt + registry.MAX_RECEIPT_TTL() + 1;
        bool reverted;

        try registry.registerReceipt(input) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testZeroDigestFailsClosed() public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        input.commitment = bytes32(0);
        bool reverted;

        try registry.registerReceipt(input) returns (bytes32) {
            reverted = false;
        } catch {
            reverted = true;
        }

        assert(reverted);
    }

    function testAdminTransferIsTwoStepAndRotatesImplicitAttester() public {
        RegistryCaller nextAdmin = new RegistryCaller();
        registry.transferAdmin(address(nextAdmin));

        assert(registry.pendingAdmin() == address(nextAdmin));
        nextAdmin.acceptAdmin(registry);

        assert(registry.admin() == address(nextAdmin));
        assert(registry.pendingAdmin() == address(0));
        assert(!registry.isAttester(address(this)));
        assert(registry.isAttester(address(nextAdmin)));

        bool reverted;
        try registry.setPaused(true) {
            reverted = false;
        } catch {
            reverted = true;
        }
        assert(reverted);
    }

    function testRotatedAdminCannotRevokeAfterLosingAttesterRole() public {
        bytes32 receiptId = registry.registerReceipt(_validInput());
        RegistryCaller nextAdmin = new RegistryCaller();
        registry.transferAdmin(address(nextAdmin));
        nextAdmin.acceptAdmin(registry);

        bool reverted;
        try registry.revokeReceipt(receiptId, keccak256("OLD_ADMIN_ATTEMPT")) {
            reverted = false;
        } catch {
            reverted = true;
        }
        assert(reverted);
        assert(registry.isValid(receiptId));

        nextAdmin.revoke(registry, receiptId, keccak256("NEW_ADMIN_REVOCATION"));
        assert(!registry.isValid(receiptId));
    }

    function testReceiptIdIsDomainSeparatedByRegistryAddress() public {
        BlackoutReceiptRegistry second = new BlackoutReceiptRegistry(address(this), SOURCE_DOMAIN);
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();

        bytes32 firstId = registry.registerReceipt(input);
        bytes32 secondId = second.registerReceipt(input);

        assert(firstId != secondId);
    }

    function testFuzzReceiptAnchoring(
        bytes32 requestId,
        bytes32 midnightTxHash,
        bytes32 policyHash,
        bytes32 commitment,
        bytes32 subjectNullifier,
        uint64 ttl,
        bool qualified
    ) public {
        BlackoutReceiptRegistry.ReceiptInput memory input = _validInput();
        input.requestId = _nonZero(requestId, 11);
        input.midnightTxHash = _nonZero(midnightTxHash, 12);
        input.policyHash = _nonZero(policyHash, 13);
        input.commitment = _nonZero(commitment, 14);
        input.subjectNullifier = _nonZero(subjectNullifier, 15);
        input.qualified = qualified;

        uint64 maxTtl = registry.MAX_RECEIPT_TTL();
        ttl = (ttl % maxTtl) + 1;
        input.expiresAt = input.issuedAt + ttl;

        bytes32 receiptId = registry.registerReceipt(input);
        assert(registry.exists(receiptId));
        assert(registry.isValid(receiptId) == qualified);
    }

    function _validInput() internal view returns (BlackoutReceiptRegistry.ReceiptInput memory input) {
        uint64 nowTs = _now64();
        input = BlackoutReceiptRegistry.ReceiptInput({
            requestId: bytes32(uint256(0x1001)),
            midnightTxHash: bytes32(uint256(0x2002)),
            policyHash: bytes32(uint256(0x3003)),
            commitment: bytes32(uint256(0x4004)),
            subjectNullifier: bytes32(uint256(0x5005)),
            issuedAt: nowTs,
            expiresAt: nowTs + 30 days,
            qualified: true
        });
    }

    function _now64() internal view returns (uint64) {
        // Foundry test-chain timestamps are bounded far below uint64 max.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }

    function _nonZero(bytes32 value, uint256 fallbackValue) internal pure returns (bytes32) {
        return value == bytes32(0) ? bytes32(fallbackValue) : value;
    }
}
