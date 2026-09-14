// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title BlackoutReceiptRegistry
/// @notice Privacy-preserving EVM anchor for finalized BLACKOUT verification receipts.
/// @dev This contract does NOT verify Midnight zero-knowledge proofs on EVM. Authorized
///      attesters may anchor the public, non-secret digest of a verification that was
///      finalized on the configured Midnight source domain. No raw income, identity,
///      credential, or witness data belongs in this contract or its events.
contract BlackoutReceiptRegistry {
    uint64 public constant MAX_CLOCK_SKEW = 5 minutes;
    uint64 public constant MAX_RECEIPT_TTL = 90 days;

    error Unauthorized();
    error ZeroAddress();
    error ZeroValue();
    error RegistryPaused();
    error ReceiptNotFound(bytes32 receiptId);
    error RequestAlreadyAnchored(bytes32 requestId);
    error MidnightTxAlreadyAnchored(bytes32 midnightTxHash);
    error ReceiptAlreadyRevoked(bytes32 receiptId);
    error InvalidIssuedAt(uint64 issuedAt);
    error InvalidExpiry(uint64 issuedAt, uint64 expiresAt);
    error NotPendingAdmin();

    struct ReceiptInput {
        bytes32 requestId;
        bytes32 midnightTxHash;
        bytes32 policyHash;
        bytes32 commitment;
        bytes32 subjectNullifier;
        uint64 issuedAt;
        uint64 expiresAt;
        bool qualified;
    }

    struct Receipt {
        bytes32 requestId;
        bytes32 midnightTxHash;
        bytes32 policyHash;
        bytes32 commitment;
        bytes32 subjectNullifier;
        uint64 issuedAt;
        uint64 expiresAt;
        address attester;
        bool qualified;
        bool revoked;
    }

    address public admin;
    address public pendingAdmin;
    bytes32 public immutable sourceDomain;
    bool public paused;

    mapping(address => bool) public isAttester;
    mapping(bytes32 => Receipt) private _receipts;
    mapping(bytes32 => bytes32) public receiptByRequestId;
    mapping(bytes32 => bytes32) public receiptByMidnightTxHash;
    mapping(bytes32 => bytes32) public revocationReason;

    event AttesterSet(address indexed attester, bool allowed);
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event PauseSet(bool paused);
    event ReceiptAnchored(
        bytes32 indexed receiptId,
        bytes32 indexed requestId,
        bytes32 indexed midnightTxHash,
        bytes32 policyHash,
        bytes32 commitment,
        bytes32 subjectNullifier,
        uint64 issuedAt,
        uint64 expiresAt,
        address attester,
        bool qualified
    );
    event ReceiptRevoked(bytes32 indexed receiptId, address indexed revokedBy, bytes32 indexed reasonHash);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyAttester() {
        if (!isAttester[msg.sender]) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert RegistryPaused();
        _;
    }

    constructor(address initialAdmin, bytes32 midnightSourceDomain) {
        if (initialAdmin == address(0)) revert ZeroAddress();
        if (midnightSourceDomain == bytes32(0)) revert ZeroValue();

        admin = initialAdmin;
        sourceDomain = midnightSourceDomain;
        isAttester[initialAdmin] = true;

        emit AttesterSet(initialAdmin, true);
        emit AdminTransferred(address(0), initialAdmin);
    }

    /// @notice Enables or disables an authorized Midnight receipt attester.
    function setAttester(address attester, bool allowed) external onlyAdmin {
        if (attester == address(0)) revert ZeroAddress();
        isAttester[attester] = allowed;
        emit AttesterSet(attester, allowed);
    }

    /// @notice Begins a two-step admin transfer. There is deliberately no renounce path.
    function transferAdmin(address nextAdmin) external onlyAdmin {
        if (nextAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = nextAdmin;
        emit AdminTransferStarted(admin, nextAdmin);
    }

    /// @notice Accepts admin control and rotates the implicit admin-attester privilege.
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();

        address previousAdmin = admin;
        admin = msg.sender;
        pendingAdmin = address(0);

        if (isAttester[previousAdmin]) {
            isAttester[previousAdmin] = false;
            emit AttesterSet(previousAdmin, false);
        }
        if (!isAttester[msg.sender]) {
            isAttester[msg.sender] = true;
            emit AttesterSet(msg.sender, true);
        }

        emit AdminTransferred(previousAdmin, msg.sender);
    }

    /// @notice Pauses new anchors. Revocation and governance remain available while paused.
    function setPaused(bool value) external onlyAdmin {
        paused = value;
        emit PauseSet(value);
    }

    /// @notice Anchors one finalized Midnight receipt digest on EVM.
    /// @return receiptId Domain-separated deterministic identifier for this receipt.
    function registerReceipt(ReceiptInput calldata input)
        external
        onlyAttester
        whenNotPaused
        returns (bytes32 receiptId)
    {
        _validateInput(input);

        if (receiptByRequestId[input.requestId] != bytes32(0)) {
            revert RequestAlreadyAnchored(input.requestId);
        }
        if (receiptByMidnightTxHash[input.midnightTxHash] != bytes32(0)) {
            revert MidnightTxAlreadyAnchored(input.midnightTxHash);
        }

        receiptId = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                sourceDomain,
                input.requestId,
                input.midnightTxHash,
                input.policyHash,
                input.commitment,
                input.subjectNullifier,
                input.issuedAt,
                input.expiresAt,
                input.qualified
            )
        );

        // bytes32(0) is used as the mapping sentinel; even an astronomically
        // unlikely zero digest must fail closed rather than weaken replay guards.
        if (receiptId == bytes32(0)) revert ZeroValue();

        // Defensive: cryptographic collision or storage corruption must fail closed.
        if (_receipts[receiptId].attester != address(0)) {
            revert RequestAlreadyAnchored(input.requestId);
        }

        _receipts[receiptId] = Receipt({
            requestId: input.requestId,
            midnightTxHash: input.midnightTxHash,
            policyHash: input.policyHash,
            commitment: input.commitment,
            subjectNullifier: input.subjectNullifier,
            issuedAt: input.issuedAt,
            expiresAt: input.expiresAt,
            attester: msg.sender,
            qualified: input.qualified,
            revoked: false
        });

        receiptByRequestId[input.requestId] = receiptId;
        receiptByMidnightTxHash[input.midnightTxHash] = receiptId;

        emit ReceiptAnchored(
            receiptId,
            input.requestId,
            input.midnightTxHash,
            input.policyHash,
            input.commitment,
            input.subjectNullifier,
            input.issuedAt,
            input.expiresAt,
            msg.sender,
            input.qualified
        );
    }

    /// @notice Revokes a receipt. The current admin or an active original attester may revoke.
    /// @dev Removing an attester immediately removes its ability to mutate prior receipts.
    function revokeReceipt(bytes32 receiptId, bytes32 reasonHash) external {
        Receipt storage receipt = _receipts[receiptId];
        if (receipt.attester == address(0)) revert ReceiptNotFound(receiptId);

        bool activeOriginalAttester = msg.sender == receipt.attester && isAttester[msg.sender];
        if (msg.sender != admin && !activeOriginalAttester) revert Unauthorized();
        if (receipt.revoked) revert ReceiptAlreadyRevoked(receiptId);
        if (reasonHash == bytes32(0)) revert ZeroValue();

        receipt.revoked = true;
        revocationReason[receiptId] = reasonHash;
        emit ReceiptRevoked(receiptId, msg.sender, reasonHash);
    }

    /// @notice Returns the stored public receipt digest.
    function getReceipt(bytes32 receiptId) external view returns (Receipt memory receipt) {
        receipt = _receipts[receiptId];
        if (receipt.attester == address(0)) revert ReceiptNotFound(receiptId);
    }

    /// @notice True only for a qualified, non-revoked, non-expired receipt.
    function isValid(bytes32 receiptId) external view returns (bool) {
        Receipt storage receipt = _receipts[receiptId];
        return
            receipt.attester != address(0) && receipt.qualified && !receipt.revoked
                && block.timestamp <= receipt.expiresAt;
    }

    /// @notice Distinguishes an absent receipt from a present FAIL receipt.
    function exists(bytes32 receiptId) external view returns (bool) {
        return _receipts[receiptId].attester != address(0);
    }

    function _validateInput(ReceiptInput calldata input) private view {
        if (
            input.requestId == bytes32(0) || input.midnightTxHash == bytes32(0) || input.policyHash == bytes32(0)
                || input.commitment == bytes32(0) || input.subjectNullifier == bytes32(0)
        ) revert ZeroValue();

        if (input.issuedAt > block.timestamp + MAX_CLOCK_SKEW) {
            revert InvalidIssuedAt(input.issuedAt);
        }

        if (
            input.expiresAt <= input.issuedAt || input.expiresAt <= block.timestamp
                || input.expiresAt - input.issuedAt > MAX_RECEIPT_TTL
        ) {
            revert InvalidExpiry(input.issuedAt, input.expiresAt);
        }
    }
}
